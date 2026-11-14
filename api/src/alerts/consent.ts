import crypto from 'node:crypto';

export const ALERTS_CONSENT_VERSION_V1 = 'alerts-v1';

export const ALERTS_CONSENT_TEMPLATES: Record<string, string> = {
  [ALERTS_CONSENT_VERSION_V1]:
    'Email me when the rules for Victorian energy rebates change (for example the election result, the battery discount change on 1 January 2027, the gas hot water rule on 1 March 2027 and solar moving into VEU on 1 July 2027). I can unsubscribe at any time from any email.',
};

export function isKnownAlertsConsentVersion(version: string): boolean {
  return Object.prototype.hasOwnProperty.call(ALERTS_CONSENT_TEMPLATES, version);
}

export function renderAlertConsentSnapshot(version: string): {
  version: string;
  textSnapshot: string;
  textSha256: string;
} {
  const textSnapshot = ALERTS_CONSENT_TEMPLATES[version];
  if (!textSnapshot) {
    throw new Error(`Unknown alerts consent version: "${version}"`);
  }
  const textSha256 = crypto.createHash('sha256').update(textSnapshot, 'utf8').digest('hex');
  return {
    version,
    textSnapshot,
    textSha256,
  };
}
