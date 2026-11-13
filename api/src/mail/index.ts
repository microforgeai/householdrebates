import type { ApiConfig } from '../config.js';
import { createSmtpDriver } from './smtp.js';
import { createGraphDriver } from './graph.js';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

export interface MailDriver {
  send(msg: MailMessage): Promise<{ messageId: string }>;
  verify(): Promise<void>;
  sentMessages?: MailMessage[];
}

export function createMailDriver(cfg: ApiConfig): MailDriver {
  if (cfg.mailTransport === 'smtp') {
    return createSmtpDriver(cfg);
  }
  if (cfg.mailTransport === 'graph') {
    return createGraphDriver(cfg);
  }

  // In-memory driver for local development and tests
  const sentMessages: MailMessage[] = [];
  return {
    sentMessages,
    async send(msg: MailMessage) {
      sentMessages.push(msg);
      return { messageId: `mem-${sentMessages.length}` };
    },
    async verify() {
      // No-op in memory
    },
  };
}
