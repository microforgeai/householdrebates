import type { ApiConfig } from '../config.js';
import type { MailDriver, MailMessage } from './index.js';

export function createGraphDriver(cfg: ApiConfig): MailDriver {
  if (
    !cfg.graph ||
    !cfg.graph.tenantId ||
    !cfg.graph.clientId ||
    !cfg.graph.clientSecret ||
    !cfg.graph.sender
  ) {
    throw new Error(
      'Microsoft Graph configuration is incomplete (GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET, GRAPH_SENDER required).',
    );
  }

  const g = cfg.graph;

  async function fetchAccessToken(): Promise<string> {
    const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(g.tenantId)}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      client_id: g.clientId,
      client_secret: g.clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    });

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      throw new Error(`Graph OAuth token acquisition failed with HTTP ${res.status}`);
    }
    const data = (await res.json()) as { access_token?: string };
    if (!data.access_token) {
      throw new Error('Graph OAuth response missing access_token');
    }
    return data.access_token;
  }

  return {
    async send(msg: MailMessage): Promise<{ messageId: string }> {
      const token = await fetchAccessToken();
      const sendUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(g.sender)}/sendMail`;

      const payload = {
        message: {
          subject: msg.subject,
          body: {
            contentType: 'HTML',
            content: msg.html,
          },
          toRecipients: [{ emailAddress: { address: msg.to } }],
          ...(msg.replyTo
            ? { replyTo: [{ emailAddress: { address: msg.replyTo } }] }
            : {}),
        },
        saveToSentItems: true,
      };

      const res = await fetch(sendUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Graph sendMail failed with HTTP ${res.status}`);
      }

      return { messageId: `graph-${Date.now()}` };
    },
    async verify(): Promise<void> {
      await fetchAccessToken();
    },
  };
}
