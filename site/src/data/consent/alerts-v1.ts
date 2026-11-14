export const ALERTS_CONSENT_VERSION_V1 = 'alerts-v1';
export const ALERTS_CONSENT_VERSION_V2 = 'alerts-v2';
export const CURRENT_ALERTS_CONSENT_VERSION = ALERTS_CONSENT_VERSION_V2;

export const ALERTS_CONSENT_TEMPLATES: Record<string, string> = {
  [ALERTS_CONSENT_VERSION_V1]:
    'Email me when the rules for Victorian energy rebates change (for example the election result, the battery discount change on 1 January 2027, the gas hot water rule on 1 March 2027 and solar moving into VEU on 1 July 2027). I can unsubscribe at any time from any email.',
  [ALERTS_CONSENT_VERSION_V2]:
    'Email me when the rules for Victorian and federal home energy rebates change, including after the 28 November 2026 state election and around the changes currently scheduled for 1 January, 1 March and 1 July 2027. Household Rebates will email me only about rule changes, and I can unsubscribe at any time from any email.',
};
