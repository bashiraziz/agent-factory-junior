import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to, subject, html,
}: { to: string; subject: string; html: string }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping send");
    return;
  }
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "reports@rowshni.xyz",
    to,
    subject,
    html,
  });
  if (error) {
    console.error(`[email] Resend rejected send to ${to}: ${error.name} — ${error.message}`);
  }
}
