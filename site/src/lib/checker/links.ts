import type { LinkKey, PostcodeAreaRecord, ResolvedLink } from './types';

/**
 * Spec §7 corridor postcodes (Melton, Sunbury/Bulla in Hume, and Calder corridor into Macedon Ranges):
 * 3427, 3428, 3429, 3335–3338, 3430–3438 -> /victoria/north-west-corridor/
 */
export const NORTH_WEST_CORRIDOR_POSTCODES: ReadonlySet<string> = new Set([
  '3427',
  '3428',
  '3429',
  '3335',
  '3336',
  '3337',
  '3338',
  '3430',
  '3431',
  '3432',
  '3433',
  '3434',
  '3435',
  '3436',
  '3437',
  '3438',
]);

/**
 * Specific council / regional area pages mapped by CSV primary_lga.
 */
export const SPECIFIC_LGA_AREA_URLS: Readonly<Record<string, { url: string; label: string }>> = {
  Ballarat: { url: '/victoria/ballarat/', label: 'More about Ballarat rebates' },
  'Greater Bendigo': { url: '/victoria/bendigo/', label: 'More about Greater Bendigo rebates' },
  'Greater Shepparton': { url: '/victoria/shepparton/', label: 'More about Greater Shepparton rebates' },
  'Greater Geelong': { url: '/victoria/geelong/', label: 'More about Greater Geelong rebates' },
  Frankston: { url: '/victoria/frankston/', label: 'More about Frankston rebates' },
  'Mornington Peninsula': {
    url: '/victoria/mornington-peninsula/',
    label: 'More about Mornington Peninsula rebates',
  },
  Wyndham: { url: '/victoria/wyndham/', label: 'More about Wyndham rebates' },
  Casey: { url: '/victoria/casey/', label: 'More about Casey rebates' },
  Whittlesea: { url: '/victoria/whittlesea/', label: 'More about Whittlesea rebates' },
  'Yarra Ranges': { url: '/victoria/yarra-ranges/', label: 'More about Yarra Ranges rebates' },
  'Macedon Ranges': { url: '/victoria/macedon-ranges/', label: 'More about Macedon Ranges rebates' },
  Mitchell: { url: '/victoria/mitchell/', label: 'More about Mitchell rebates' },
  Latrobe: { url: '/victoria/latrobe-valley/', label: 'More about Latrobe Valley rebates' },
  Mildura: { url: '/victoria/mildura/', label: 'More about Mildura rebates' },
};

/**
 * Plan Melbourne metropolitan hubs mapped by CSV primary_lga (Prompt 39).
 */
export const METRO_HUB_BY_LGA: Readonly<Record<string, { url: string; label: string }>> = {
  // Inner Melbourne (Inner Metro + Inner South East)
  Melbourne: { url: '/victoria/melbourne/', label: 'More about inner Melbourne rebates' },
  'Port Phillip': { url: '/victoria/melbourne/', label: 'More about inner Melbourne rebates' },
  Yarra: { url: '/victoria/melbourne/', label: 'More about inner Melbourne rebates' },
  Stonnington: { url: '/victoria/melbourne/', label: 'More about inner Melbourne rebates' },
  'Glen Eira': { url: '/victoria/melbourne/', label: 'More about inner Melbourne rebates' },
  Boroondara: { url: '/victoria/melbourne/', label: 'More about inner Melbourne rebates' },
  Bayside: { url: '/victoria/melbourne/', label: 'More about inner Melbourne rebates' },

  // Northern metro hub
  Hume: { url: '/victoria/melbourne-north/', label: 'More about northern Melbourne rebates' },
  Whittlesea: { url: '/victoria/melbourne-north/', label: 'More about northern Melbourne rebates' },
  Darebin: { url: '/victoria/melbourne-north/', label: 'More about northern Melbourne rebates' },
  Banyule: { url: '/victoria/melbourne-north/', label: 'More about northern Melbourne rebates' },
  'Merri-bek': { url: '/victoria/melbourne-north/', label: 'More about northern Melbourne rebates' },
  Nillumbik: { url: '/victoria/melbourne-north/', label: 'More about northern Melbourne rebates' },
  Mitchell: { url: '/victoria/melbourne-north/', label: 'More about northern Melbourne rebates' },

  // Western metro hub
  Wyndham: { url: '/victoria/melbourne-west/', label: 'More about western Melbourne rebates' },
  Melton: { url: '/victoria/melbourne-west/', label: 'More about western Melbourne rebates' },
  Brimbank: { url: '/victoria/melbourne-west/', label: 'More about western Melbourne rebates' },
  'Hobsons Bay': { url: '/victoria/melbourne-west/', label: 'More about western Melbourne rebates' },
  Maribyrnong: { url: '/victoria/melbourne-west/', label: 'More about western Melbourne rebates' },
  'Moonee Valley': { url: '/victoria/melbourne-west/', label: 'More about western Melbourne rebates' },

  // Eastern metro hub
  Manningham: { url: '/victoria/melbourne-east/', label: 'More about eastern Melbourne rebates' },
  Whitehorse: { url: '/victoria/melbourne-east/', label: 'More about eastern Melbourne rebates' },
  Knox: { url: '/victoria/melbourne-east/', label: 'More about eastern Melbourne rebates' },
  Maroondah: { url: '/victoria/melbourne-east/', label: 'More about eastern Melbourne rebates' },
  Monash: { url: '/victoria/melbourne-east/', label: 'More about eastern Melbourne rebates' },
  'Yarra Ranges': { url: '/victoria/melbourne-east/', label: 'More about eastern Melbourne rebates' },

  // Southern / South-East metro hub
  Casey: { url: '/victoria/melbourne-south-east/', label: 'More about south-east Melbourne rebates' },
  Cardinia: { url: '/victoria/melbourne-south-east/', label: 'More about south-east Melbourne rebates' },
  'Greater Dandenong': {
    url: '/victoria/melbourne-south-east/',
    label: 'More about south-east Melbourne rebates',
  },
  Kingston: { url: '/victoria/melbourne-south-east/', label: 'More about south-east Melbourne rebates' },
  Frankston: { url: '/victoria/melbourne-south-east/', label: 'More about south-east Melbourne rebates' },
  'Mornington Peninsula': {
    url: '/victoria/melbourne-south-east/',
    label: 'More about south-east Melbourne rebates',
  },
};

/**
 * Prompt 28 slot: topic-page "Read more" links per business spec rule ID.
 * Falls back cleanly when rows 55 / 65–68 are not yet enabled in rollout.json.
 */
export const BUSINESS_RESULT_LINKS: Record<string, { label: string; url: string }> = {
  'BH-1..7': {
    label: 'Read the business heating and cooling guide',
    url: '/victoria/business-heating-cooling/',
  },
  'BL-1': {
    label: 'Read the business LED lighting guide',
    url: '/victoria/business-led-lighting/',
  },
  'BL-2': {
    label: 'Read the business LED lighting guide',
    url: '/victoria/business-led-lighting/',
  },
  'BL-3': {
    label: 'Read the business LED lighting guide',
    url: '/victoria/business-led-lighting/',
  },
  'BL-4': {
    label: 'Read the business LED lighting guide',
    url: '/victoria/business-led-lighting/',
  },
  'BR-1': {
    label: 'Read the cold rooms and commercial refrigeration guide',
    url: '/victoria/business-cold-rooms-refrigeration/',
  },
  'BR-2': {
    label: 'Read the cold rooms and commercial refrigeration guide',
    url: '/victoria/business-cold-rooms-refrigeration/',
  },
  'BR-3': {
    label: 'Read the cold rooms and commercial refrigeration guide',
    url: '/victoria/business-cold-rooms-refrigeration/',
  },
  'BR-4': {
    label: 'Read the cold rooms and commercial refrigeration guide',
    url: '/victoria/business-cold-rooms-refrigeration/',
  },
  'BW-1': {
    label: 'Read the business hot water, motors and spray valves guide',
    url: '/victoria/business-hot-water-motors/',
  },
  'BW-2': {
    label: 'Read the business hot water, motors and spray valves guide',
    url: '/victoria/business-hot-water-motors/',
  },
  'BW-3': {
    label: 'Read the business hot water, motors and spray valves guide',
    url: '/victoria/business-hot-water-motors/',
  },
  'BM-1': {
    label: 'Read the business hot water, motors and spray valves guide',
    url: '/victoria/business-hot-water-motors/',
  },
  'BM-2': {
    label: 'Read the business hot water, motors and spray valves guide',
    url: '/victoria/business-hot-water-motors/',
  },
  'BK-1': {
    label: 'Read the business hot water, motors and spray valves guide',
    url: '/victoria/business-hot-water-motors/',
  },
  'BK-2': {
    label: 'Read the business hot water, motors and spray valves guide',
    url: '/victoria/business-hot-water-motors/',
  },
  'BP-1': {
    label: 'Business solar PV (30 to 200 kW) on the business hub',
    url: '/victoria/business-energy-upgrades/#business-solar-30-200-kw',
  },
  'BP-2': {
    label: 'Business solar PV (30 to 200 kW) on the business hub',
    url: '/victoria/business-energy-upgrades/#business-solar-30-200-kw',
  },
  'BP-3': {
    label: 'Custom business upgrades on the business hub',
    url: '/victoria/business-energy-upgrades/#custom-upgrades',
  },
  'BX-1': {
    label: 'Custom business upgrades on the business hub',
    url: '/victoria/business-energy-upgrades/#custom-upgrades',
  },
  'BG-1': {
    label: 'Business window glazing on the business hub',
    url: '/victoria/business-energy-upgrades/',
  },
  'BB-1': {
    label: 'Business battery discounts on the business hub',
    url: '/victoria/business-energy-upgrades/',
  },
  'B-OC': {
    label: 'Multi-residential common areas on the business hub',
    url: '/victoria/business-energy-upgrades/',
  },
  'B-RES-ONLY': {
    label: 'Household-only products on the business hub',
    url: '/victoria/business-energy-upgrades/#household-only-products',
  },
};

interface LinkCatalogEntry {
  label: string;
  specHref: string;
  fallbackKeys?: LinkKey[];
  external: boolean;
  rel?: string;
}

export const LINK_CATALOG: Readonly<Record<LinkKey, LinkCatalogEntry>> = {
  'find-provider': {
    label: 'Get 2–3 quotes from VEU accredited providers before you buy',
    specHref: '/victoria/find-an-accredited-provider/',
    external: false,
  },
  'guide-ac-rebate': {
    label: 'Read the reverse-cycle air conditioner guide',
    specHref: '/victoria/air-conditioner-rebate/',
    external: false,
  },
  'guide-gas-room-to-split': {
    label: 'Read the gas room heater to split system guide',
    specHref: '/victoria/gas-room-heater-to-split-system/',
    external: false,
  },
  'guide-ducted-gas-to-ducted': {
    label: 'Read the ducted gas to ducted reverse-cycle guide',
    specHref: '/victoria/ducted-gas-to-ducted-reverse-cycle/',
    external: false,
  },
  'guide-ducted-gas-to-splits': {
    label: 'Read the ducted gas to split systems guide',
    specHref: '/victoria/ducted-gas-to-split-systems/',
    external: false,
  },
  'guide-electric-to-rcac': {
    label: 'Read the electric heater to reverse-cycle guide',
    specHref: '/victoria/electric-heater-to-reverse-cycle/',
    external: false,
  },
  'guide-heat-pump': {
    label: 'Read the heat pump hot water rebate guide',
    specHref: '/victoria/heat-pump-rebate/',
    external: false,
  },
  'guide-gas-hw-to-hp': {
    label: 'Read the gas hot water to heat pump guide',
    specHref: '/victoria/gas-hot-water-to-heat-pump/',
    external: false,
  },
  'guide-electric-hw-to-hp': {
    label: 'Read the electric hot water to heat pump guide',
    specHref: '/victoria/electric-hot-water-to-heat-pump/',
    external: false,
  },
  'guide-solar-hw': {
    label: 'Read the solar hot water rebate guide',
    specHref: '/victoria/solar-hot-water-rebate/',
    external: false,
  },
  'guide-cooktop-induction': {
    label: 'Read the gas cooktop to induction guide',
    specHref: '/victoria/gas-cooktop-to-induction/',
    external: false,
  },
  'guide-ceiling-insulation': {
    label: 'Read the ceiling insulation rebate guide',
    specHref: '/victoria/ceiling-insulation-rebate/',
    external: false,
  },
  'guide-draught-proofing': {
    label: 'Read the draught-proofing and window glazing guide',
    specHref: '/victoria/draught-proofing-rebate/',
    external: false,
  },
  'veu-copayment': {
    label: 'What the minimum co-payment means',
    specHref: '/victoria/veu-minimum-co-payment/',
    external: false,
  },
  'veu-vs-solar-homes': {
    label: 'Compare VEU discounts and Solar Homes rebates',
    specHref: '/victoria/veu-vs-solar-homes/',
    external: false,
  },
  'can-claim-twice': {
    label: 'Can you claim VEU or Solar Homes rebates more than once?',
    specHref: '/victoria/can-you-claim-veu-twice/',
    external: false,
  },
  'veu-scams': {
    label: 'Spot VEU cold-call scams and check your consumer rights',
    specHref: '/victoria/veu-scams-cold-calls/',
    external: false,
  },
  'retrospective-discount': {
    label: 'Rules for already-installed upgrades (retrospective discounts)',
    specHref: '/victoria/already-installed-retrospective-discount/',
    external: false,
  },
  renters: {
    label: 'Read the guide for Victorian renters',
    specHref: '/victoria/renters/',
    external: false,
  },
  'landlords-2027': {
    label: 'Read the guide for landlords and 2027 rental standards',
    specHref: '/victoria/landlords-rental-standards-2027/',
    external: false,
  },
  'new-homes-2027': {
    label: 'Read the guide for new homes and all-electric rules',
    specHref: '/victoria/new-homes-all-electric-2027/',
    external: false,
  },
  'apartments-and-units': {
    label: 'Read the apartments and owners corporations guide',
    specHref: '/victoria/apartments-and-units/',
    external: false,
  },
  'gas-hw-broken-2027': {
    label: 'Gas hot water broken before or after 1 March 2027',
    specHref: '/victoria/gas-hot-water-broken-before-or-after-march-2027/',
    external: false,
  },
  'gas-hw-ban-exemptions': {
    label: 'Check exemptions to the gas hot water replacement rule',
    specHref: '/victoria/gas-hot-water-ban-exemptions/',
    external: false,
  },
  'solstice-towns': {
    label: 'Support for Solstice gas shutdown towns',
    specHref: '/victoria/solstice-gas-shutdown-towns/',
    external: false,
  },
  'get-off-gas-planner': {
    label: 'Open the Get-Off-Gas Planner',
    specHref: '/victoria/get-off-gas-planner/',
    external: false,
  },
  'gas-no-lpg': {
    label: 'Going electric on bottled LPG',
    specHref: '/victoria/lpg-homes/',
    fallbackKeys: ['get-off-gas-planner'],
    external: false,
  },
  'hw-size-guide': {
    label: 'Check the heat pump hot water sizing guide',
    specHref: '/victoria/heat-pump-hot-water-size-guide/',
    external: false,
  },
  'postcode-lookup': {
    label: 'Check Victorian VEU postcode classifications',
    specHref: '/victoria/postcode/',
    fallbackKeys: ['victoria-hub'],
    external: false,
  },
  'victoria-hub': {
    label: 'Browse all Victorian rebate guides',
    specHref: '/victoria/',
    external: false,
  },
  'business-hub': {
    label: 'Read the Victorian business energy upgrades guide',
    specHref: '/victoria/business-energy-upgrades/',
    fallbackKeys: ['veu-copayment', 'victoria-hub'],
    external: false,
  },
  'business-heating-cooling': {
    label: 'Read the business heating and cooling guide',
    specHref: '/victoria/business-heating-cooling/',
    fallbackKeys: ['business-hub'],
    external: false,
  },
  'business-led-lighting': {
    label: 'Read the business LED lighting guide',
    specHref: '/victoria/business-led-lighting/',
    fallbackKeys: ['business-hub'],
    external: false,
  },
  'business-cold-rooms': {
    label: 'Read the cold rooms and commercial refrigeration guide',
    specHref: '/victoria/business-cold-rooms-refrigeration/',
    fallbackKeys: ['business-hub'],
    external: false,
  },
  'business-hot-water-motors': {
    label: 'Read the business hot water, motors and spray valves guide',
    specHref: '/victoria/business-hot-water-motors/',
    fallbackKeys: ['business-hub'],
    external: false,
  },
  'solarvic-hw-external': {
    label: 'Check eligibility and get approval on Solar Victoria before installing',
    specHref: 'https://www.solar.vic.gov.au/hot-water-rebate',
    external: true,
    rel: 'nofollow noopener',
  },
  'solarvic-pv-external': {
    label: 'Check eligibility and get approval on Solar Victoria before installing',
    specHref: 'https://www.solar.vic.gov.au/solar-panel-rebate',
    external: true,
    rel: 'nofollow noopener',
  },
  'dcceew-battery-external': {
    label: 'How the federal battery discount works (DCCEEW)',
    specHref: 'https://www.dcceew.gov.au/energy/programs/cheaper-home-batteries',
    external: true,
    rel: 'nofollow noopener',
  },
  'energyvic-business-external': {
    label: 'Energy Victoria VEU for businesses and accredited providers',
    specHref: 'https://www.energy.vic.gov.au/victorian-energy-upgrades/businesses',
    external: true,
    rel: 'nofollow noopener',
  },
  'energyvic-custom-external': {
    label: 'Energy Victoria custom (M&V) upgrades for businesses',
    specHref: 'https://www.energy.vic.gov.au/victorian-energy-upgrades/businesses/custom-upgrades',
    external: true,
    rel: 'nofollow noopener',
  },
};

function stripHash(url: string): string {
  const idx = url.indexOf('#');
  return idx === -1 ? url : url.slice(0, idx);
}

export function resolveInternalUrl(
  specHref: string,
  enabledUrls: Set<string>,
  fallbackChain: string[] = ['/victoria/'],
): string {
  const base = stripHash(specHref);
  if (enabledUrls.has(base)) {
    return specHref;
  }
  for (const fb of fallbackChain) {
    const fbBase = stripHash(fb);
    if (enabledUrls.has(fbBase)) {
      return fb;
    }
  }
  return '/victoria/';
}

export function resolveLinkKey(key: LinkKey, enabledUrls: Set<string>): ResolvedLink {
  const entry = LINK_CATALOG[key];
  if (entry.external) {
    return {
      key,
      label: entry.label,
      specHref: entry.specHref,
      href: entry.specHref,
      external: true,
      rel: entry.rel,
    };
  }

  const fallbacks: string[] = [];
  for (const fbKey of entry.fallbackKeys ?? []) {
    const fbEntry = LINK_CATALOG[fbKey];
    fallbacks.push(fbEntry.specHref);
    for (const nestedKey of fbEntry.fallbackKeys ?? []) {
      fallbacks.push(LINK_CATALOG[nestedKey].specHref);
    }
  }
  fallbacks.push('/victoria/');

  return {
    key,
    label: entry.label,
    specHref: entry.specHref,
    href: resolveInternalUrl(entry.specHref, enabledUrls, fallbacks),
    external: false,
  };
}

/**
 * Resolves a postcode record to its best area or hub page:
 * 1. Spec §7 corridor postcodes -> /victoria/north-west-corridor/ (if enabled)
 * 2. Specific council / regional area page by primary_lga (if enabled)
 * 3. Plan Melbourne metro hub by primary_lga (if enabled)
 * 4. Fallback: /victoria/postcode/ (when row 54 is enabled), else /victoria/
 */
export function resolveAreaLink(
  record: PostcodeAreaRecord,
  enabledUrls: Set<string>,
): ResolvedLink {
  const candidates: { url: string; label: string }[] = [];

  if (NORTH_WEST_CORRIDOR_POSTCODES.has(record.postcode)) {
    candidates.push({
      url: '/victoria/north-west-corridor/',
      label: 'More about the North-West Corridor',
    });
  }

  const specific = SPECIFIC_LGA_AREA_URLS[record.primary_lga];
  if (specific) {
    candidates.push(specific);
  }

  const hub = METRO_HUB_BY_LGA[record.primary_lga];
  if (hub && (!specific || specific.url !== hub.url)) {
    candidates.push(hub);
  }

  const specCandidate =
    candidates[0] ??
    ({
      url: '/victoria/postcode/',
      label: 'Check Victorian VEU postcodes',
    } as const);

  for (const cand of candidates) {
    if (enabledUrls.has(cand.url)) {
      return {
        label: cand.label,
        specHref: specCandidate.url,
        href: cand.url,
        external: false,
      };
    }
  }

  if (enabledUrls.has('/victoria/postcode/')) {
    return {
      label: 'Check Victorian VEU postcodes',
      specHref: specCandidate.url,
      href: '/victoria/postcode/',
      external: false,
    };
  }

  return {
    label: 'Browse Victorian rebate guides',
    specHref: specCandidate.url,
    href: '/victoria/',
    external: false,
  };
}
