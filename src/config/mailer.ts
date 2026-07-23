import nodemailer, { type Transporter } from "nodemailer";
import { env } from "./env.js";
import { logger } from "./logger.js";

let transporter: Transporter | null = null;

/** Build the SMTP transport lazily; returns null when SMTP isn't configured. */
function getTransporter(): Transporter | null {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465, // 465 = implicit TLS; 587 = STARTTLS
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
}

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Send an email. If SMTP isn't configured, gracefully degrade: log the message
 * (including any link) so flows are testable in dev without an email provider.
 */
export async function sendMail(opts: MailOptions): Promise<void> {
  const t = getTransporter();
  if (!t) {
    logger.warn(
      { to: opts.to, subject: opts.subject },
      "SMTP not configured — logging email instead of sending",
    );
    logger.info(`\n--- EMAIL (not sent) ---\nTo: ${opts.to}\n${opts.text}\n------------------------`);
    return;
  }
  await t.sendMail({ from: env.MAIL_FROM, ...opts });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const subject = "Reset your SkillBridge password";
  const text = `You requested a password reset for SkillBridge.

Reset your password using this link (valid for 1 hour):
${resetUrl}

If you didn't request this, you can safely ignore this email.`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px">
      <h2 style="margin:0 0 12px">Reset your SkillBridge password</h2>
      <p>You requested a password reset. This link is valid for <strong>1 hour</strong>:</p>
      <p><a href="${resetUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Reset password</a></p>
      <p style="color:#888;font-size:12px;margin-top:16px">If you didn't request this, you can safely ignore this email.</p>
    </div>`;
  await sendMail({ to, subject, html, text });
}