import nodemailer from "nodemailer";

function getMailConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "false") === "true";
  const user = process.env.APPLICATION_MAIL;
  const pass = process.env.APPLICATION_MAIL_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_PORT, APPLICATION_MAIL, and APPLICATION_MAIL_PASSWORD.");
  }

  return {
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    from: process.env.MAIL_FROM || user,
  };
}

export async function sendPasswordResetEmail(options: {
  to: string;
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
}) {
  const config = getMailConfig();

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  await transporter.sendMail({
    from: config.from,
    to: options.to,
    subject: "Reset your Kalyan Pawn Brokers password",
    text: `Hi ${options.name},\n\nWe received a request to reset your Kalyan Pawn Brokers password.\n\nReset password: ${options.resetUrl}\n\nThis link is valid for ${options.expiresInMinutes} minutes and can be used only once.\n\nIf you did not request this, you can safely ignore this email.`,
    html: `
      <div style="margin:0;padding:24px;background:#f6f7fb;font-family:Arial,sans-serif;color:#111;line-height:1.5;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e8e8e8;border-radius:12px;overflow:hidden;">
          <div style="padding:20px 24px;background:#faf5ff;border-bottom:1px solid #efefef;">
            <p style="margin:0;font-size:18px;font-weight:700;color:#b100ff;">Kalyan Pawn Brokers</p>
            <p style="margin:6px 0 0 0;font-size:13px;color:#555;">Password Reset Request</p>
          </div>

          <div style="padding:24px;">
            <p style="margin:0 0 12px 0;">Hi ${options.name},</p>
            <p style="margin:0 0 16px 0;">We received a request to reset your password.</p>

            <p style="margin:0 0 18px 0;">
              <a href="${options.resetUrl}" style="display:inline-block;padding:12px 18px;background:#b100ff;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">
                Reset Password
              </a>
            </p>

            <p style="margin:0 0 12px 0;font-size:14px;color:#333;">
              This link is valid for <strong>${options.expiresInMinutes} minutes</strong> and can be used only once.
            </p>

            <div style="margin:16px 0;padding:12px;background:#f9fafb;border:1px solid #eceff3;border-radius:8px;">
              <p style="margin:0 0 6px 0;font-size:12px;color:#666;">Button not working? Copy and paste this URL into your browser:</p>
              <p style="margin:0;word-break:break-all;font-size:12px;color:#444;">${options.resetUrl}</p>
            </div>

            <p style="margin:0;font-size:13px;color:#555;">If you did not request this, you can safely ignore this email.</p>
          </div>
        </div>

        <p style="max-width:560px;margin:12px auto 0 auto;font-size:12px;color:#777;text-align:center;">
          For security reasons, please do not share this link with anyone.
        </p>
      </div>
    `,
  });
}
