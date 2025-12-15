import sgMail from "@sendgrid/mail";

// Configure SendGrid once on module load
const apiKey = process.env.SENDGRID_API_KEY || "";
if (!apiKey) {
  console.warn("SENDGRID_API_KEY is not set. Emails will fail to send.");
} else {
  sgMail.setApiKey(apiKey);
}

const defaultFrom = process.env.EMAIL_FROM || process.env.SMTP_USER || "no-reply@example.com";

export default async function sendEmail(to, subject, html, attachments = []) {
  try {
    if (!apiKey) {
      throw new Error("Missing SENDGRID_API_KEY env var");
    }

    const msg = {
      to,
      from: defaultFrom,
      subject,
      html,
      attachments,
    };

    await sgMail.send(msg);
  } catch (e) {
    console.warn("Email send failed", e?.message || e);
  }
}
