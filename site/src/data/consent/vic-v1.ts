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
  serverCountry?: string;
  emailProviderAndCountry?: string;
}

export const CONSENT_VERSIONS = {
  rcac: 'vic-rcac-v2',
  hotwater: 'vic-hotwater-v2',
} as const;

export const PRIVACY_POLICY_VERSION = '2026-11-15-v2';

export const CONSENT_TEMPLATE_V2 = {
  versionPrefix: 'vic',
  expiryMonths: 3,
  whoGetsDetailsTemplate:
    "Who gets your details. If you tick the box and send this form, Household Rebates (run by Agenor Services Pty Ltd, ABN {{ABN}}, privacy@householdrebates.com.au) will send your name, phone, email, postcode and answers to {{INSTALLER_LIST}} so they can contact you about a quote, and the installer may share your details with its accredited provider, {{AP_LIST}}, only to create the VEU certificates for your installation. The installer pays us a fee for each enquiry. If you don't send the form, we can't pass on your enquiry, but you can still use the site. Your details are stored on our server in {{SERVER_COUNTRY}} and sent by email through {{EMAIL_PROVIDER_AND_COUNTRY}}. Our privacy policy explains how to access or correct your details and how to complain. We are not a government website and we are not affiliated with, endorsed by, or representing the Victorian Government, Energy Victoria, Solar Victoria, the Department of Energy, Environment and Climate Action (DEECA), the Essential Services Commission (ESC), the Australian Government, the Clean Energy Regulator or any council.",
  checkboxTemplate:
    'I agree to Household Rebates sending my details to {{INSTALLER_NAMES}}, and to {{INSTALLER_NAMES}} contacting me about a quote for {{ACTIVITY_LABEL}} under the Victorian Energy Upgrades program by: {{CHANNEL_LIST}}. This consent lasts 3 months unless I withdraw it sooner by replying to any email from Household Rebates or emailing privacy@householdrebates.com.au.',
  readNoticeText:
    'Before you send, please read our collection notice above and our privacy policy.',
  disclaimerText:
    'A quote does not guarantee a discount. The accredited provider checks eligibility and confirms any discount in your quote. Read your rights under the VEU code of conduct and the VEET scheme consumer factsheet.',
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

export function formatChannelList(channels: ConsentChannel[]): string {
  if (channels.length === 0) {
    return 'the channel(s) ticked above';
  }
  return [...channels]
    .sort()
    .map((c) => formatChannelLabel(c))
    .join(', ');
}

export function formatInstallerList(recipients: ConsentRecipient[]): string {
  return recipients
    .map(
      (r) =>
        `${r.tradingName}, which works with Victorian Energy Upgrades accredited provider ${r.accreditedProvider}`,
    )
    .join('; ');
}

export function formatInstallerNames(recipients: ConsentRecipient[]): string {
  return recipients.map((r) => r.tradingName).join(' and ');
}

export function formatApList(recipients: ConsentRecipient[]): string {
  return [...new Set(recipients.map((r) => r.accreditedProvider))].join(' and ');
}

function readEnv(key: string): string | undefined {
  if (typeof process !== 'undefined' && process?.env) {
    const val = process.env[key];
    return typeof val === 'string' && val.trim().length > 0 ? val.trim() : undefined;
  }
  return undefined;
}

export function resolveLeadConsentEnv(overrides?: {
  serverCountry?: string;
  emailProviderAndCountry?: string;
}): {
  serverCountry: string;
  emailProviderAndCountry: string;
} {
  const serverCountry =
    overrides?.serverCountry?.trim() ||
    readEnv('PUBLIC_SERVER_COUNTRY') ||
    readEnv('SERVER_COUNTRY') ||
    '<<SERVER_COUNTRY>>';
  const emailProviderAndCountry =
    overrides?.emailProviderAndCountry?.trim() ||
    readEnv('PUBLIC_LEADS_EMAIL_PROVIDER_NOTE') ||
    readEnv('LEADS_EMAIL_PROVIDER_NOTE') ||
    '<<EMAIL_PROVIDER_AND_COUNTRY>>';
  return { serverCountry, emailProviderAndCountry };
}

export function renderConsentSnapshot(input: ConsentRenderInput): {
  version: string;
  textSnapshot: string;
} {
  const abn = input.abn ?? '29 644 447 263';
  const { serverCountry, emailProviderAndCountry } = resolveLeadConsentEnv({
    serverCountry: input.serverCountry,
    emailProviderAndCountry: input.emailProviderAndCountry,
  });
  const version = CONSENT_VERSIONS[input.activity];
  const installerList = formatInstallerList(input.recipients);
  const installerNames = formatInstallerNames(input.recipients);
  const apList = formatApList(input.recipients);
  const activityLabel = formatActivityLabel(input.activity);
  const channelList = formatChannelList(input.channels);

  const p1 = CONSENT_TEMPLATE_V2.whoGetsDetailsTemplate
    .replace('{{ABN}}', abn)
    .replace('{{INSTALLER_LIST}}', installerList)
    .replace('{{AP_LIST}}', apList)
    .replace('{{SERVER_COUNTRY}}', serverCountry)
    .replace('{{EMAIL_PROVIDER_AND_COUNTRY}}', emailProviderAndCountry);

  const p2 = CONSENT_TEMPLATE_V2.checkboxTemplate
    .replaceAll('{{INSTALLER_NAMES}}', installerNames)
    .replace('{{ACTIVITY_LABEL}}', activityLabel)
    .replace('{{CHANNEL_LIST}}', channelList);

  const p3 = CONSENT_TEMPLATE_V2.disclaimerText;

  return {
    version,
    textSnapshot: `${p1}\n\n${p2}\n\n${p3}`,
  };
}
