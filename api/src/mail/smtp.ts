import nodemailer from 'nodemailer';
import type { ApiConfig } from '../config.js';
import type { MailDriver, MailMessage } from './index.js';

export function createSmtpDriver(cfg: ApiConfig): MailDriver {
  if (!cfg.smtp || !cfg.smtp.host || !cfg.smtp.user || !cfg.smtp.pass) {
    throw new Error('SMTP configuration is incomplete (SMTP_HOST, SMTP_USER, SMTP_PASS required).');
  }

  const transporter = nodemailer.createTransport({
    host: cfg.smtp.host,
    port: cfg.smtp.port,
    secure: cfg.smtp.port === 465,
    auth: {
      user: cfg.smtp.user,
      pass: cfg.smtp.pass,
    },
  });

  return {
    async send(msg: MailMessage): Promise<{ messageId: string }> {
      const info = await transporter.sendMail({
        from: msg.from || cfg.mailFrom,
        to: msg.to,
        replyTo: msg.replyTo,
        subject: msg.subject,
        text: msg.text,
        html: msg.html,
        headers: msg.headers,
      });
      return { messageId: info.messageId || `smtp-${Date.now()}` };
    },
    async verify(): Promise<void> {
      await transporter.verify();
    },
  };
}
