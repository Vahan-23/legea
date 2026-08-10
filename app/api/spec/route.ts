import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  clientEmailHtml,
  clientEmailSubject,
  managerEmailHtml,
  managerEmailSubject,
} from "@/lib/emailTemplates";
import { checkRateLimit } from "@/lib/rateLimit";
import { specApiSchema } from "@/lib/specSchema";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 6 * 1024 * 1024;

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

function parseDataUrl(dataUrl: string): { content: string } {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (match?.[2]) {
    return { content: match[2] };
  }
  return { content: dataUrl };
}

async function sendWithRetry(
  resend: Resend,
  payload: Parameters<Resend["emails"]["send"]>[0],
): Promise<{ id?: string; error: string | null }> {
  const attempt = async () => {
    const result = await resend.emails.send(payload);
    if (result.error) {
      return { id: undefined, error: result.error.message };
    }
    return { id: result.data?.id, error: null };
  };

  const first = await attempt();
  if (!first.error) return first;

  await new Promise((r) => setTimeout(r, 2000));
  return attempt();
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limit" },
      { status: 429 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: "payload_too_large" },
      { status: 413 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  const parsed = specApiSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const body = parsed.data;

  if (body.website || body.contact.website) {
    return NextResponse.json({ ok: true, specNumber: body.specNumber });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const managerEmail = process.env.MANAGER_EMAIL;
  const managerCc = process.env.MANAGER_EMAIL_CC;

  if (!apiKey || !from || !managerEmail) {
    return NextResponse.json(
      { ok: false, error: "misconfigured" },
      { status: 500 },
    );
  }

  const resend = new Resend(apiKey);

  if (body.type === "quick") {
    const managerResult = await sendWithRetry(resend, {
      from,
      to: [managerEmail],
      cc: managerCc ? [managerCc] : undefined,
      subject: `Быстрая заявка ${body.specNumber} от ${body.contact.organization}`,
      html: `
        <p>Быстрая заявка <strong>${body.specNumber}</strong></p>
        <ul>
          <li>Организация: ${body.contact.organization}</li>
          <li>Контакт: ${body.contact.contactPerson}</li>
          <li>Телефон: ${body.contact.phone}</li>
          <li>Комментарий: ${body.contact.comment || "—"}</li>
        </ul>
      `,
    });

    if (managerResult.error) {
      return NextResponse.json(
        { ok: false, error: "send_failed", message: managerResult.error },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, specNumber: body.specNumber });
  }

  const attachments: Array<{ filename: string; content: string }> = [
    {
      filename: `${body.specNumber}.pdf`,
      content: body.pdfBase64,
    },
  ];

  for (const logo of body.logos) {
    const { content } = parseDataUrl(logo.dataUrl);
    attachments.push({
      filename: logo.fileName.replace(/[^\w.\-]+/g, "_"),
      content,
    });
  }

  const managerResult = await sendWithRetry(resend, {
    from,
    to: [managerEmail],
    cc: managerCc ? [managerCc] : undefined,
    subject: managerEmailSubject(
      body.specNumber,
      body.contact.organization,
    ),
    html: managerEmailHtml({
      specNumber: body.specNumber,
      organization: body.contact.organization,
      contactPerson: body.contact.contactPerson,
      email: body.contact.email,
      phone: body.contact.phone,
      city: body.contact.city,
    }),
    attachments,
  });

  if (managerResult.error) {
    return NextResponse.json(
      { ok: false, error: "send_failed", message: managerResult.error },
      { status: 502 },
    );
  }

  const clientResult = await sendWithRetry(resend, {
    from,
    to: [body.contact.email],
    subject: clientEmailSubject(body.specNumber),
    html: clientEmailHtml({
      specNumber: body.specNumber,
      contactPerson: body.contact.contactPerson,
    }),
  });

  if (clientResult.error) {
    return NextResponse.json({
      ok: true,
      specNumber: body.specNumber,
      warning: "client_email_failed",
    });
  }

  return NextResponse.json({
    ok: true,
    specNumber: body.specNumber,
  });
}
