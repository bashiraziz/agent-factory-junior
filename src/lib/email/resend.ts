import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to, subject, html,
}: { to: string; subject: string; html: string }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping send");
    return;
  }
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "reports@agentfactoryfoundations.com",
    to,
    subject,
    html,
  });
}
