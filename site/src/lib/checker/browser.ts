export * from './types';
export {
  SPEC_SOLSTICE_POSTCODES,
  SOLSTICE_POSTCODE_SET,
  lookupPostcode,
  isSolsticePostcode,
  resolveInsulationFigureId,
  formatLocalitiesDisplay,
  formatLgaDisplay,
  formatAreaCardSummary,
  buildAreaCard,
} from './area';
export {
  NORTH_WEST_CORRIDOR_POSTCODES,
  SPECIFIC_LGA_AREA_URLS,
  METRO_HUB_BY_LGA,
  BUSINESS_RESULT_LINKS,
  LINK_CATALOG,
  LINKS_DATA,
  resolveInternalUrl,
  resolveLinkKey,
  resolveAreaLink,
  type LinksCatalogData,
} from './links';
export {
  FIELDS,
  FIELDS_META,
  getVisibleFields,
  pruneHiddenAnswers,
  shouldShowSh1,
  type FieldDefinition,
  type FieldMeta,
  type FieldOption,
} from './fields';
export {
  MESSAGES,
  MESSAGES_BY_ID,
  renderMessage,
  type MessageDefinition,
} from './messages';
export {
  RULES,
  RULES_META,
  RULES_BY_ID,
  SPEC_SECTION_9_UNVERIFIED_RULE_IDS,
  hasAnyGatingNotSure,
  getCheckerReferencedFigureIds,
  type RuleDefinition,
  type RuleMeta,
} from './rules';
export {
  computeOldestCheckerCheckedOn,
  evaluateWithData,
} from './evaluate';
