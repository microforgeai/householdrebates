import { countUrlsInText } from './antispam.js';
import type { ConsentChannel } from './consent.js';

export interface ValidatedLeadInput {
  activity: 'rcac' | 'hotwater';
  currentSystem: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phoneE164: string;
  postcode: string;
  ownership: 'own' | 'rent' | 'landlord';
  buildingOver2Years: 'yes' | 'no' | 'not_sure';
  workStarted: 'no' | 'bought_not_installed';
  productBought: number;
  contactPrefs: ConsentChannel[];
  message: string | null;
  howHeard: string | null;
  consent: boolean;
  consentVersion: string;
  recipientIds: string[];
  formToken: string | null;
  website: string;
  pageUrl: string;
  utmJson: string | null;
}

const VALID_SYSTEMS = new Set([
  'ducted-gas',
  'room-gas',
  'central-electric',
  'hardwired-electric',
  'ducted-rcac',
  'split-rcac',
  'mains-gas',
  'electric',
  'lpg',
  'broken-solar',
  'none',
]);

const VALID_CHANNELS = new Set<ConsentChannel>(['phone', 'email', 'site_visit']);

export function normalizeAuPhoneToE164(raw: string): string | null {
  const digits = raw.replace(/\s+/g, '');
  if (/^04\d{8}$/.test(digits)) {
    return `+61${digits.slice(1)}`;
  }
  if (/^0[2378]\d{8}$/.test(digits)) {
    return `+61${digits.slice(1)}`;
  }
  if (/^\+61[23478]\d{8}$/.test(digits)) {
    return digits;
  }
  return null;
}

export function validateLeadPayload(body: Record<string, unknown>): {
  ok: boolean;
  data?: ValidatedLeadInput;
  errors?: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  const website = typeof body.website === 'string' ? body.website : '';

  const activity = body.activity === 'rcac' || body.activity === 'hotwater' ? body.activity : null;
  if (!activity) errors.activity = 'Must be rcac or hotwater';

  const currentSystem = typeof body.currentSystem === 'string' ? body.currentSystem.trim() : '';
  if (!VALID_SYSTEMS.has(currentSystem)) {
    errors.currentSystem = 'Invalid current system';
  }

  const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
  if (!firstName || firstName.length > 60 || !/^[A-Za-z\s'-.]+$/.test(firstName)) {
    errors.firstName = 'First name is required (1–60 letters)';
  }

  const lastNameRaw = typeof body.lastName === 'string' ? body.lastName.trim() : '';
  if (lastNameRaw && (lastNameRaw.length > 60 || !/^[A-Za-z\s'-.]+$/.test(lastNameRaw))) {
    errors.lastName = 'Invalid last name';
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Valid email address is required';
  }

  const phoneRaw = typeof body.phone === 'string' ? body.phone : '';
  const phoneE164 = normalizeAuPhoneToE164(phoneRaw);
  if (!phoneE164) {
    errors.phone = 'Valid Australian mobile or landline is required';
  }

  const postcode = typeof body.postcode === 'string' ? body.postcode.trim() : '';
  if (!/^3\d{3}$/.test(postcode)) {
    errors.postcode = 'Must be a 4-digit Victorian postcode starting with 3';
  }

  const ownership =
    body.ownership === 'own' || body.ownership === 'rent' || body.ownership === 'landlord'
      ? body.ownership
      : null;
  if (!ownership) {
    errors.ownership = 'Invalid ownership status';
  } else if (ownership === 'rent') {
    const landlordOk = body.landlordOk === 'yes' || body.landlordOk === true;
    if (!landlordOk) {
      errors.landlordOk = 'Renters must confirm they have or will obtain landlord approval';
    }
  }

  const buildingOver2Years =
    body.buildingOver2Years === 'yes' ||
    body.buildingOver2Years === 'no' ||
    body.buildingOver2Years === 'not_sure'
      ? body.buildingOver2Years
      : null;
  if (!buildingOver2Years) {
    errors.buildingOver2Years = 'Invalid building age answer';
  }

  const workStarted =
    body.workStarted === 'no' || body.workStarted === 'bought_not_installed'
      ? body.workStarted
      : null;
  if (!workStarted) {
    errors.workStarted = 'Work must not have started';
  }

  let rawChannels: unknown[] = [];
  if (Array.isArray(body.contactPrefs)) {
    rawChannels = body.contactPrefs;
  } else if (typeof body.contactPrefs === 'string' && body.contactPrefs.trim()) {
    rawChannels = body.contactPrefs.split(',').map((s) => s.trim());
  }
  const contactPrefs = rawChannels.filter(
    (c): c is ConsentChannel => typeof c === 'string' && VALID_CHANNELS.has(c as ConsentChannel),
  );
  if (contactPrefs.length === 0) {
    errors.contactPrefs = 'At least one contact preference must be selected';
  }

  const messageRaw = typeof body.message === 'string' ? body.message.trim() : '';
  if (messageRaw.length > 1000) {
    errors.message = 'Message must be 1,000 characters or fewer';
  } else if (countUrlsInText(messageRaw) > 2) {
    errors.message = 'Message contains too many links';
  }

  const howHeardRaw = typeof body.howHeard === 'string' ? body.howHeard.trim() : '';
  const consent = body.consent === true || body.consent === 'true' || body.consent === 'on';
  if (!consent) {
    errors.consent = 'Express consent is required';
  }

  const consentVersion =
    typeof body.consentVersion === 'string' ? body.consentVersion.trim() : '';
  if (!consentVersion) {
    errors.consentVersion = 'Consent version is required';
  }

  let recipientIds: string[] = [];
  if (Array.isArray(body.recipientIds)) {
    recipientIds = body.recipientIds.map(String).filter(Boolean);
  } else if (typeof body.recipientIds === 'string' && body.recipientIds.trim()) {
    recipientIds = body.recipientIds
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (recipientIds.length === 0) {
    errors.recipientIds = 'Named recipient installer IDs are required';
  }

  const formToken =
    typeof body.formToken === 'string' && body.formToken.trim() ? body.formToken.trim() : null;
  const pageUrl = typeof body.pageUrl === 'string' && body.pageUrl.trim() ? body.pageUrl.trim() : '/';
  const productBought =
    workStarted === 'bought_not_installed' || body.productBought === '1' || body.productBought === 1
      ? 1
      : 0;

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      activity: activity!,
      currentSystem,
      firstName,
      lastName: lastNameRaw || null,
      email,
      phoneE164: phoneE164!,
      postcode,
      ownership: ownership!,
      buildingOver2Years: buildingOver2Years!,
      workStarted: workStarted!,
      productBought,
      contactPrefs,
      message: messageRaw || null,
      howHeard: howHeardRaw || null,
      consent,
      consentVersion,
      recipientIds,
      formToken,
      website,
      pageUrl,
      utmJson: typeof body.utmJson === 'string' ? body.utmJson : null,
    },
  };
}
