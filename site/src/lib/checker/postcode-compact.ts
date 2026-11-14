import crypto from 'node:crypto';
import zlib from 'node:zlib';
import rawPostcodesJson from '../../data/postcodes.json';
import type { CompactPostcodePayload } from './postcode-client';
import type { OtherLgaShare, PostcodeAreaRecord } from './types';

export interface CompactPostcodeArtifact {
  hash: string;
  url: string;
  json: string;
  rawBytes: number;
  gzipBytes: number;
}

let cachedArtifact: CompactPostcodeArtifact | null = null;

export function buildCompactPostcodeArtifact(): CompactPostcodeArtifact {
  if (cachedArtifact) {
    return cachedArtifact;
  }

  const rowsInput = rawPostcodesJson.rows as Record<string, PostcodeAreaRecord>;
  const compactRows: CompactPostcodePayload['rows'] = {};

  for (const [code, r] of Object.entries(rowsInput)) {
    const entry: CompactPostcodePayload['rows'][string] = {
      veu_area: r.veu_area,
      reticulated_gas: r.reticulated_gas,
      veu_climatic_region: r.veu_climatic_region,
      heat_pump_zone: r.heat_pump_zone,
      localitiesList: r.localitiesList,
      primary_lga: r.primary_lga,
      primary_lga_share_pct: r.primary_lga_share_pct,
    };
    if (Array.isArray(r.other_lgas) && r.other_lgas.length > 0) {
      entry.other_lgas = r.other_lgas as OtherLgaShare[];
    }
    compactRows[code] = entry;
  }

  const payload: CompactPostcodePayload = {
    source: rawPostcodesJson.source,
    specVersion: rawPostcodesJson.specVersion,
    checkedOn: rawPostcodesJson.checkedOn,
    rows: compactRows,
  };

  const json = JSON.stringify(payload);
  const hash = crypto.createHash('sha256').update(json).digest('hex').slice(0, 8);
  const rawBytes = Buffer.byteLength(json, 'utf8');
  const gzipBytes = zlib.gzipSync(Buffer.from(json, 'utf8')).length;
  const url = `/data/postcodes.v${hash}.json`;

  cachedArtifact = {
    hash,
    url,
    json,
    rawBytes,
    gzipBytes,
  };

  return cachedArtifact;
}
