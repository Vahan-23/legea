import { Resend } from "resend";

export type MailConfig = {
  apiKey: string;
  from: string;
  managerEmail: string;
  managerCc?: string;
};

export type SendEmailInput = Parameters<Resend["emails"]["send"]>[0];

export function getMailConfig(): MailConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  const managerEmail = process.env.MANAGER_EMAIL?.trim();
  const managerCc = process.env.MANAGER_EMAIL_CC?.trim();

  if (!apiKey || !from || !managerEmail) {
    return null;
  }

  return {
    apiKey,
    from,
    managerEmail,
    managerCc: managerCc || undefined,
  };
}

export async function sendEmail(
  config: MailConfig,
  payload: SendEmailInput,
): Promise<{ id?: string; error: string | null }> {
  const resend = new Resend(config.apiKey);

  const attempt = async () => {
    const result = await resend.emails.send(payload);
    if (result.error) {
      return { id: undefined, error: result.error.message };
    }
    return { id: result.data?.id, error: null };
  };

  const first = await attempt();
  if (!first.error) return first;

  await new Promise((resolve) => setTimeout(resolve, 2000));
  return attempt();
}

export function managerRecipients(config: MailConfig): {
  to: string[];
  cc?: string[];
} {
  return {
    to: [config.managerEmail],
    cc: config.managerCc ? [config.managerCc] : undefined,
  };
}
