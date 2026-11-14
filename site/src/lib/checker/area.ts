import { resolveAreaLink } from './links';
import type {
  AreaCard,
  PostcodeAreaRecord,
  PostcodesDataset,
} from './types';

export const SPEC_SOLSTICE_POSTCODES = [
  '3515',
  '3523',
  '3585',
  '3549',
  '3463',
  '3579',
  '3638',
  '3264',
  '3909',
  '3888',
] as const;

export const SOLSTICE_POSTCODE_SET: ReadonlySet<string> = new Set(SPEC_SOLSTICE_POSTCODES);

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
  if (!record) {
    return { ok: false, messageId: 'X1' };
  }
  return { ok: true, record };
}

export function isSolsticePostcode(
  postcode: string | undefined,
  solsticeSet: ReadonlySet<string> = SOLSTICE_POSTCODE_SET,
): boolean {
  if (!postcode) return false;
  return solsticeSet.has(postcode.trim());
}

/**
 * Spec §5.4 ceiling insulation figure by postcode (veu_area + veu_climatic_region).
 * - Metropolitan + Mild -> vic-veu-insulation-metro (official 1,500)
 * - Regional + Cold -> vic-veu-insulation-regional (official 2,100)
 * - Regional + Mild -> vic-veu-insulation-est-regional-mild (estimate 1,590)
 * - Metropolitan + Cold -> vic-veu-insulation-est-metro-cold (estimate 2,010)
 * - Regional + Hot -> vic-veu-insulation-est-regional-hot (estimate 1,510)
 * - Any other pairing -> null ("provider calculates for your postcode")
 */
export function resolveInsulationFigureId(area: PostcodeAreaRecord | null): string | null {
  if (!area) return null;
  const key = `${area.veu_area}:${area.veu_climatic_region}`;
  switch (key) {
    case 'Metropolitan:Mild':
      return 'vic-veu-insulation-metro';
    case 'Regional:Cold':
      return 'vic-veu-insulation-regional';
    case 'Regional:Mild':
      return 'vic-veu-insulation-est-regional-mild';
    case 'Metropolitan:Cold':
      return 'vic-veu-insulation-est-metro-cold';
    case 'Regional:Hot':
      return 'vic-veu-insulation-est-regional-hot';
    default:
      return null;
  }
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

/**
 * Formats the Spec §8 Example 1 summary text:
 * "Diggers Rest · Melton (93%) / Hume (7%) · Metropolitan · mains gas · Mild · zone 4"
 */
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

export function buildAreaCard(
  record: PostcodeAreaRecord,
  datasetCheckedOn: string,
  enabledUrls: Set<string>,
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
    areaLink: resolveAreaLink(record, enabledUrls),
    specCheckedOn: datasetCheckedOn,
  };
}
