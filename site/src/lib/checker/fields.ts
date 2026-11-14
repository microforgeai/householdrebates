import { SOLSTICE_POSTCODE_SET } from './area';
import fieldsMetaJson from './fields-meta.json' with { type: 'json' };
import {
  FIELD_HOOKS,
  getVisibleFieldsFromList,
  hydrateFields,
  pruneHiddenAnswersFromList,
  shouldShowSh1,
  type FieldDefinition,
  type FieldHooks,
  type FieldMeta,
  type FieldOption,
  type FieldOptionMeta,
} from './fields-hooks';
import type { CheckerAnswers, PostcodeAreaRecord } from './types';

export type { FieldDefinition, FieldHooks, FieldMeta, FieldOption, FieldOptionMeta };
export {
  FIELD_HOOKS,
  getVisibleFieldsFromList,
  hydrateFields,
  pruneHiddenAnswersFromList,
  shouldShowSh1,
};

export const FIELDS_META: readonly FieldMeta[] = fieldsMetaJson as unknown as FieldMeta[];

export const FIELDS: readonly FieldDefinition[] = hydrateFields(FIELDS_META, FIELD_HOOKS);

export function getVisibleFields(
  answers: CheckerAnswers,
  area: PostcodeAreaRecord | null,
  solsticePostcodes: ReadonlySet<string> = SOLSTICE_POSTCODE_SET,
): FieldDefinition[] {
  return getVisibleFieldsFromList(FIELDS, answers, area, solsticePostcodes);
}

export function pruneHiddenAnswers(
  answers: CheckerAnswers,
  area: PostcodeAreaRecord | null,
  solsticePostcodes: ReadonlySet<string> = SOLSTICE_POSTCODE_SET,
): CheckerAnswers {
  return pruneHiddenAnswersFromList(FIELDS, answers, area, solsticePostcodes);
}
