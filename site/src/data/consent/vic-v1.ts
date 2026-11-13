export interface ConsentRecipient {
  id: string;
  tradingName: string;
  accreditedProvider: string;
}

export type ConsentChannel = 'phone' | 'email' | 'site_visit';

export interface ConsentRenderInput {
  activity: 'rcac' | 'hotwater';
  recipients: ConsentRecipient[];
  channels: ConsentChannel[];
  abn?: string;
}

export const CONSENT_VERSIONS = {
  rcac: 'vic-rcac-v1',
  hotwater: 'vic-hotwater-v1',
} as const;

export const PRIVACY_POLICY_VERSION = '2026-11-13-v1';

export const CONSENT_TEMPLATE_V1 = {
  versionPrefix: 'vic',
  expiryMonths: 3,
  whoGetsDetailsTemplate:
    'Who gets your details. If you tick the box and send this form, Household Rebates (run by Agenor Services Pty Ltd, ABN {{ABN}}) will send your name, phone, email, postcode and answers to {{INSTALLER_LIST}}. The installer pays us a fee for each enquiry. We are not a government website and we do not work for the Victorian Energy Upgrades program, the Essential Services Commission or the Victorian Government.',
  checkboxTemplate:
    'I agree to Household Rebates sending my details to {{INSTALLER_NAMES}}, and to {{INSTALLER_NAMES}} contacting me about a quote for {{ACTIVITY_LABEL}} under the Victorian Energy Upgrades program by: {{CHANNEL_LIST}}. This consent lasts 3 months unless I withdraw it sooner by replying to any email from Household Rebates or emailing privacy@householdrebates.com.au. I have read the collection notice and privacy policy (/privacy/).',
  disclaimerText:
    'A quote does not guarantee a discount. The accredited provider checks eligibility and confirms any discount in your quote. Read your rights under the VEU code of conduct and the VEET scheme consumer factsheet at /how-quotes-work/#your-rights.',
} as const;

export function formatActivityLabel(activity: 'rcac' | 'hotwater'): string {
  return activity === 'rcac' ? 'heating and cooling' : 'hot water';
}

export function formatChannelLabel(channel: ConsentChannel): string {
  switch (channel) {
    case 'phone':
      return 'phone';
    case 'email':
      return 'email';
    case 'site_visit':
      return 'a visit to my home to measure and quote';
  }
}

export function renderConsentSnapshot(input: ConsentRenderInput): {
  version: string;
  textSnapshot: string;
} {
  const abn = input.abn ?? '29 644 447 263';
  const version = CONSENT_VERSIONS[input.activity];
  const installerList = input.recipients
    .map(
      (r) =>
        `${r.tradingName}, which works with Victorian Energy Upgrades accredited provider ${r.accreditedProvider}`,
    )
    .join('; ');
  const installerNames = input.recipients.map((r) => r.tradingName).join(' and ');
  const activityLabel = formatActivityLabel(input.activity);
  const channelList = [...input.channels]
    .sort()
    .map((c) => formatChannelLabel(c))
    .join(', ');

  const p1 = CONSENT_TEMPLATE_V1.whoGetsDetailsTemplate
    .replace('{{ABN}}', abn)
    .replace('{{INSTALLER_LIST}}', installerList);

  const p2 = CONSENT_TEMPLATE_V1.checkboxTemplate
    .replaceAll('{{INSTALLER_NAMES}}', installerNames)
    .replace('{{ACTIVITY_LABEL}}', activityLabel)
    .replace('{{CHANNEL_LIST}}', channelList);

  const p3 = CONSENT_TEMPLATE_V1.disclaimerText;

  return {
    version,
    textSnapshot: `${p1}\n\n${p2}\n\n${p3}`,
  };
}
