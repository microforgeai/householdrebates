import {
  buildAreaCardFromData,
  formatAreaCardSummary,
  formatLgaDisplay,
  formatLocalitiesDisplay,
  isSolsticePostcode as isSolsticePostcodeRuntime,
  lookupPostcode,
  resolveInsulationFigureId,
  type PostcodeLookupResult,
} from './area-runtime';
import { LINKS_DATA } from './links';
import type { AreaCard, PostcodeAreaRecord } from './types';

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

export function isSolsticePostcode(
  postcode: string | undefined,
  solsticeSet: ReadonlySet<string> = SOLSTICE_POSTCODE_SET,
): boolean {
  return isSolsticePostcodeRuntime(postcode, solsticeSet);
}

export {
  buildAreaCardFromData,
  formatAreaCardSummary,
  formatLgaDisplay,
  formatLocalitiesDisplay,
  lookupPostcode,
  resolveInsulationFigureId,
  type PostcodeLookupResult,
};

export function buildAreaCard(
  record: PostcodeAreaRecord,
  datasetCheckedOn: string,
  enabledUrls: Set<string>,
): AreaCard {
  return buildAreaCardFromData(record, datasetCheckedOn, enabledUrls, LINKS_DATA);
}
