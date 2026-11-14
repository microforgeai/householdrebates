import {
  ALERTS_INDEPENDENCE_LINE,
  assertNoDollarCharacter,
  assertNoUnresolvedPlaceholders,
  escapeHtml,
  renderAlertsSenderBlock,
  type AlertsSenderInfo,
} from './alerts-sender.js';

export interface AlertsConfirmationEmailInput {
  confirmUrl: string;
  confirmTtlHours: number;
  siteOrigin: string;
  sender: AlertsSenderInfo;
}

export function buildAlertsConfirmationEmail(input: AlertsConfirmationEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const senderBlock = renderAlertsSenderBlock(input.sender);
  const privacyUrl = [input.siteOrigin.replace(/\/+$/, ''), '/privacy/'].join('');
  const subject = 'Confirm your Household Rebates rule-change alerts';

  const text = [
    'Confirm your rule-change email alerts',
    '',
    'You asked Household Rebates to email you when Victorian or federal energy rebate rules change (such as the Victorian election outcome, the federal battery certificate change, the Victorian gas hot water rule, and solar PV moving into VEU).',
    '',
    'Single purpose: we use your email address only for rule-change alerts. We do not use this list for quotes or commercial offers, and we never share your email address with installers.',
    '',
    ['Confirm your email address within ', String(input.confirmTtlHours), ' hours:'].join(''),
    input.confirmUrl,
    '',
    "If you didn't ask for this, ignore it; we won't email you again.",
    '',
    ALERTS_INDEPENDENCE_LINE,
    ['Privacy policy: ', privacyUrl].join(''),
    '',
    '---',
    senderBlock,
  ].join('\n');

  const safeConfirmUrl = escapeHtml(input.confirmUrl);
  const safePrivacyUrl = escapeHtml(privacyUrl);
  const safeSenderBlock = escapeHtml(senderBlock);

  const html = [
    '<p><strong>Confirm your rule-change email alerts</strong></p>',
    '<p>You asked Household Rebates to email you when Victorian or federal energy rebate rules change (such as the Victorian election outcome, the federal battery certificate change, the Victorian gas hot water rule, and solar PV moving into VEU).</p>',
    '<p><strong>Single purpose:</strong> we use your email address only for rule-change alerts. We do not use this list for quotes or commercial offers, and we never share your email address with installers.</p>',
    [
      '<p><a href="',
      safeConfirmUrl,
      '">Confirm my rule-change alerts</a> (link valid for ',
      String(input.confirmTtlHours),
      ' hours)</p>',
    ].join(''),
    "<p>If you didn't ask for this, ignore it; we won't email you again.</p>",
    ['<p>', escapeHtml(ALERTS_INDEPENDENCE_LINE), '</p>'].join(''),
    ['<p><a href="', safePrivacyUrl, '">Privacy policy</a></p>'].join(''),
    '<hr/>',
    ['<p><small>', safeSenderBlock, '</small></p>'].join(''),
  ].join('\n');

  assertNoUnresolvedPlaceholders(subject, 'confirmation subject');
  assertNoUnresolvedPlaceholders(text, 'confirmation text');
  assertNoUnresolvedPlaceholders(html, 'confirmation html');
  assertNoDollarCharacter(subject, 'confirmation subject');
  assertNoDollarCharacter(text, 'confirmation text');
  assertNoDollarCharacter(html, 'confirmation html');

  return { subject, text, html };
}
