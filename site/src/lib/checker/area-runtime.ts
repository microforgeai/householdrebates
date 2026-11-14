import type {
  AreaCard,
  PostcodeAreaRecord,
  PostcodesDataset,
  ResolvedLink,
} from './types';

export interface AreaLinksData {
  northWestCorridorPostcodes: string[];
  specificLgaAreaUrls: Record<string, { url: string; label: string }>;
  metroHubByLga: Record<string, { url: string; label: string }>;
}

export function resolveAreaLinkFromData(
  record: PostcodeAreaRecord,
  enabledUrls: Set<string>,
  data: AreaLinksData,
): ResolvedLink {
  const candidates: { url: string; label: string }[] = [];

  if (data.northWestCorridorPostcodes.includes(record.postcode)) {
    candidates.push({
      url: '/victoria/north-west-corridor/',
      label: 'More about the North-West Corridor',
    });
  }

  const specific = data.specificLgaAreaUrls[record.primary_lga];
  if (specific) candidates.push(specific);

  const hub = data.metroHubByLga[record.primary_lga];
  if (hub && (!specific || specific.url !== hub.url)) candidates.push(hub);

  const specHref = candidates[0]?.url ?? '/victoria/postcode/';
  for (const cand of candidates) {
    if (enabledUrls.has(cand.url)) {
      return { label: cand.label, specHref, href: cand.url, external: false };
    }
  }

  return enabledUrls.has('/victoria/postcode/')
    ? { label: 'Check Victorian VEU postcodes', specHref, href: '/victoria/postcode/', external: false }
    : { label: 'Browse Victorian rebate guides', specHref, href: '/victoria/', external: false };
}

const INSULATION_SUFFIX: Readonly<Record<string, string>> = {
  'Metropolitan:Mild': 'metro',
  'Regional:Cold': 'regional',
  'Regional:Mild': 'est-regional-mild',
  'Metropolitan:Cold': 'est-metro-cold',
  'Regional:Hot': 'est-regional-hot',
};

export type PostcodeLookupResult =
  | { ok: true; record: PostcodeAreaRecord }
  | { ok: false; messageId: 'X1' };

export function lookupPostcode(
  rawPostcode: string | undefined,
  dataset: PostcodesDataset,
): PostcodeLookupResult {
  const trimmed = (rawPostcode ?? '').trim();
  if (!/^3\d{3}$/.test(trimmed)) {
    return { ok: false, messageId: 'X1' };
  }
  const record = dataset.rows[trimmed];
  return record ? { ok: true, record } : { ok: false, messageId: 'X1' };
}

export function isSolsticePostcode(
  postcode: string | undefined,
  solsticeSet?: ReadonlySet<string>,
): boolean {
  return Boolean(postcode && solsticeSet?.has(postcode.trim()));
}

export function resolveInsulationFigureId(area: PostcodeAreaRecord | null): string | null {
  if (!area) return null;
  const s = INSULATION_SUFFIX[`${area.veu_area}:${area.veu_climatic_region}`];
  return s ? `vic-veu-insulation-${s}` : null;
}

export function formatLocalitiesDisplay(record: PostcodeAreaRecord): string {
  const list =
    record.localitiesList && record.localitiesList.length > 0
      ? record.localitiesList
      : record.localities
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean);
  if (list.length <= 3) {
    return list.join(', ');
  }
  const shown = list.slice(0, 3).join(', ');
  const extra = list.length - 3;
  return `${shown}, +${extra} more`;
}

export function formatLgaDisplay(record: PostcodeAreaRecord): string {
  if (record.other_lgas && record.other_lgas.length > 0) {
    const primaryPart =
      record.primary_lga_share_pct !== null
        ? `${record.primary_lga} (${record.primary_lga_share_pct}%)`
        : record.primary_lga;
    const otherParts = record.other_lgas.map((o) => `${o.lga} (${o.pct}%)`);
    return [primaryPart, ...otherParts].join(' / ');
  }
  return record.primary_lga;
}

export function formatAreaCardSummary(record: PostcodeAreaRecord): string {
  const localitiesDisplay = formatLocalitiesDisplay(record);
  const lgaDisplay = formatLgaDisplay(record);
  const gasLabel = record.reticulated_gas ? 'mains gas' : 'no mains gas';
  return [
    localitiesDisplay,
    lgaDisplay,
    record.veu_area,
    gasLabel,
    record.veu_climatic_region,
    `zone ${record.heat_pump_zone}`,
  ].join(' · ');
}

export function buildAreaCardFromData(
  record: PostcodeAreaRecord,
  datasetCheckedOn: string,
  enabledUrls: Set<string>,
  linksData: AreaLinksData,
): AreaCard {
  const localitiesDisplay = formatLocalitiesDisplay(record);
  const lgaDisplay = formatLgaDisplay(record);
  return {
    postcode: record.postcode,
    summaryText: formatAreaCardSummary(record),
    localitiesDisplay,
    lgaDisplay,
    veuArea: record.veu_area,
    reticulatedGas: record.reticulated_gas,
    climaticRegion: record.veu_climatic_region,
    heatPumpZone: record.heat_pump_zone,
    insulationFigureId: resolveInsulationFigureId(record),
    areaLink: resolveAreaLinkFromData(record, enabledUrls, linksData),
    specCheckedOn: datasetCheckedOn,
  };
}
