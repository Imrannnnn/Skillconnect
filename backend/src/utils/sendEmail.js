import nodemailer from "nodemailer";

export default async function sendEmail(to, subject, html) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  try {
    await transporter.sendMail({ from: process.env.SMTP_USER, to, subject, html });
  } catch (e) {
    console.warn("Email send failed", e?.message);
  }
}
