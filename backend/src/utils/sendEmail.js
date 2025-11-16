import nodemailer from "nodemailer";

export default async function sendEmail(to, subject, html) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    // Use TLS on 465, STARTTLS on 587; rely on env to choose
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    // Allow self-signed certificates (fixes "self-signed certificate in certificate chain")
    tls: { rejectUnauthorized: false },
  });
  try {
    await transporter.sendMail({ from: process.env.SMTP_USER, to, subject, html });
  } catch (e) {
    console.warn("Email send failed", e?.message);
  }
}
