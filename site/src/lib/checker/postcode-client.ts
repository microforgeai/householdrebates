import type {
  OtherLgaShare,
  PostcodeAreaRecord,
  PostcodesDataset,
} from './types';

export interface CompactPostcodeRow {
  veu_area: 'Metropolitan' | 'Regional';
  reticulated_gas: boolean;
  veu_climatic_region: 'Mild' | 'Cold' | 'Hot';
  heat_pump_zone: 4 | 5;
  localitiesList: string[];
  primary_lga: string;
  primary_lga_share_pct: number | null;
  other_lgas?: OtherLgaShare[];
}

export interface CompactPostcodePayload {
  source: string;
  specVersion: string;
  checkedOn: string;
  rows: Record<string, CompactPostcodeRow>;
}

export function hydrateCompactPostcodes(payload: CompactPostcodePayload): PostcodesDataset {
  const rows: Record<string, PostcodeAreaRecord> = {};
  for (const [postcode, r] of Object.entries(payload.rows)) {
    rows[postcode] = {
      postcode,
      veu_area: r.veu_area,
      reticulated_gas: r.reticulated_gas,
      veu_climatic_region: r.veu_climatic_region,
      heat_pump_zone: r.heat_pump_zone,
      localities: r.localitiesList.join('; '),
      localitiesList: r.localitiesList,
      primary_lga: r.primary_lga,
      primary_lga_share_pct: r.primary_lga_share_pct,
      other_lgas: r.other_lgas ?? [],
    };
  }
  return {
    source: payload.source,
    specVersion: payload.specVersion,
    checkedOn: payload.checkedOn,
    rows,
  };
}
