import {
  ALERTS_INDEPENDENCE_LINE,
  assertNoDollarCharacter,
  assertNoUnresolvedPlaceholders,
  escapeHtml,
  renderAlertsSenderBlock,
  type AlertsSenderInfo,
} from './alerts-sender.js';

export interface AlertsRuleChangeEmailInput {
  subject: string;
  paragraphs: string[];
  pageUrl: string;
  unsubscribeUrl: string;
  oneClickUnsubscribeUrl: string;
  unsubscribeMailto: string;
  siteOrigin: string;
  sender: AlertsSenderInfo;
}

export function buildAlertsRuleChangeEmail(input: AlertsRuleChangeEmailInput): {
  subject: string;
  text: string;
  html: string;
  headers: Record<string, string>;
} {
  const cleanSubject = input.subject.trim();
  if (!cleanSubject) {
    throw new Error('Alert email subject must not be empty.');
  }
  const paragraphs = input.paragraphs.map((p) => p.trim()).filter((p) => p.length > 0);
  if (paragraphs.length === 0) {
    throw new Error('Alert email body must contain at least one paragraph.');
  }
  const mailto = input.unsubscribeMailto.trim();
  if (!mailto) {
    throw new Error('Alert email requires a non-empty unsubscribe mailto address.');
  }

  const senderBlock = renderAlertsSenderBlock(input.sender);
  const privacyUrl = [input.siteOrigin.replace(/\/+$/, ''), '/privacy/'].join('');

  const text = [
    ...paragraphs.flatMap((p) => [p, '']),
    'Read the updated guide and current checked figures on Household Rebates:',
    input.pageUrl,
    '',
    ALERTS_INDEPENDENCE_LINE,
    '',
    'Unsubscribe at any time:',
    input.unsubscribeUrl,
    ['Privacy policy: ', privacyUrl].join(''),
    '',
    '---',
    senderBlock,
  ].join('\n');

  const safePageUrl = escapeHtml(input.pageUrl);
  const safeUnsubUrl = escapeHtml(input.unsubscribeUrl);
  const safePrivacyUrl = escapeHtml(privacyUrl);
  const safeSenderBlock = escapeHtml(senderBlock);

  const html = [
    ...paragraphs.map((p) => ['<p>', escapeHtml(p), '</p>'].join('')),
    [
      '<p>Read the updated guide and current checked figures on Household Rebates: <a href="',
      safePageUrl,
      '">',
      safePageUrl,
      '</a></p>',
    ].join(''),
    ['<p>', escapeHtml(ALERTS_INDEPENDENCE_LINE), '</p>'].join(''),
    '<hr/>',
    [
      '<p><small><a href="',
      safeUnsubUrl,
      '">Unsubscribe from rule-change alerts</a> &middot; <a href="',
      safePrivacyUrl,
      '">Privacy policy</a></small></p>',
    ].join(''),
    ['<p><small>', safeSenderBlock, '</small></p>'].join(''),
  ].join('\n');

  const headers: Record<string, string> = {
    'List-Unsubscribe': [
      '<mailto:',
      mailto,
      '?subject=unsubscribe>, <',
      input.oneClickUnsubscribeUrl,
      '>',
    ].join(''),
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };

  assertNoUnresolvedPlaceholders(cleanSubject, 'alert subject');
  assertNoUnresolvedPlaceholders(text, 'alert text');
  assertNoUnresolvedPlaceholders(html, 'alert html');
  assertNoUnresolvedPlaceholders(headers['List-Unsubscribe'], 'List-Unsubscribe header');
  assertNoDollarCharacter(cleanSubject, 'subject');
  assertNoDollarCharacter(text, 'text');
  assertNoDollarCharacter(html, 'html');

  return {
    subject: cleanSubject,
    text,
    html,
    headers,
  };
}
