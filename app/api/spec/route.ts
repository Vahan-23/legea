import { NextResponse } from "next/server";
import {
  clientEmailHtml,
  clientEmailSubject,
  managerEmailHtml,
  managerEmailSubject,
  quickLeadEmailHtml,
  quickLeadEmailSubject,
} from "@/lib/emailTemplates";
import { getMailConfig, managerRecipients, sendEmail } from "@/lib/mail";
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

  const mailConfig = getMailConfig();
  if (!mailConfig) {
    return NextResponse.json(
      { ok: false, error: "misconfigured" },
      { status: 500 },
    );
  }

  if (body.type === "quick") {
    const recipients = managerRecipients(mailConfig);
    const managerResult = await sendEmail(mailConfig, {
      from: mailConfig.from,
      ...recipients,
      subject: quickLeadEmailSubject(
        body.specNumber,
        body.contact.organization,
      ),
      html: quickLeadEmailHtml({
        specNumber: body.specNumber,
        organization: body.contact.organization,
        contactPerson: body.contact.contactPerson,
        phone: body.contact.phone,
        comment: body.contact.comment,
        locale: body.locale,
        source: body.source ?? "Сайт",
      }),
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

  const recipients = managerRecipients(mailConfig);
  const managerResult = await sendEmail(mailConfig, {
    from: mailConfig.from,
    ...recipients,
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

  const clientResult = await sendEmail(mailConfig, {
    from: mailConfig.from,
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
