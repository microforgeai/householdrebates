import {
  buildAreaCardFromData,
  formatAreaCardSummary,
  formatLgaDisplay,
  formatLocalitiesDisplay,
  isSolsticePostcode,
  lookupPostcode,
  resolveInsulationFigureId,
  SOLSTICE_POSTCODE_SET,
  SPEC_SOLSTICE_POSTCODES,
  type PostcodeLookupResult,
} from './area-runtime';
import { LINKS_DATA } from './links';
import type { AreaCard, PostcodeAreaRecord } from './types';

export {
  buildAreaCardFromData,
  formatAreaCardSummary,
  formatLgaDisplay,
  formatLocalitiesDisplay,
  isSolsticePostcode,
  lookupPostcode,
  resolveInsulationFigureId,
  SOLSTICE_POSTCODE_SET,
  SPEC_SOLSTICE_POSTCODES,
  type PostcodeLookupResult,
};

export function buildAreaCard(
  record: PostcodeAreaRecord,
  datasetCheckedOn: string,
  enabledUrls: Set<string>,
): AreaCard {
  return buildAreaCardFromData(record, datasetCheckedOn, enabledUrls, LINKS_DATA);
}
