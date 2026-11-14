import rulesMetaJson from './rules-meta.json' with { type: 'json' };
import {
  getCheckerReferencedFigureIdsFromRules,
  hasAnyGatingNotSure,
  hydrateRules,
  RULE_HOOKS,
  type RuleDefinition,
  type RuleHooks,
  type RuleMeta,
} from './rules-hooks';

export type { RuleDefinition, RuleHooks, RuleMeta };
export { hasAnyGatingNotSure, hydrateRules, RULE_HOOKS };

/**
 * Spec §9 UNVERIFIED rule IDs that must never carry published consumer figures.
 */
export const SPEC_SECTION_9_UNVERIFIED_RULE_IDS: ReadonlySet<string> = new Set([
  'RW-6', // LPG hot water discount amount
  'SH-PV-L', // Solar Homes rental PV detailed criteria
  'FED-STC', // Federal STC amounts for household heat pumps
  'BW-3', // Larger C&I heat pump water heater consumer figure
  'BR-4', // Refrigerated display cabinets and fan motors consumer figures
  'BM-2', // Over 185 kW custom M&V motor figure
  'BP-3', // Over 200 kW custom M&V solar figure
  'BX-1', // Process heat, steam, boilers and custom M&V upgrades
  'GAS-NO', // Non-reticulated gas / LPG prompt
  'HPZ-5', // Heat pump zone 5 calculation note
]);

export const RULES_META: readonly RuleMeta[] = rulesMetaJson as unknown as RuleMeta[];

export const RULES: readonly RuleDefinition[] = hydrateRules(RULES_META, RULE_HOOKS);

export const RULES_BY_ID: ReadonlyMap<string, RuleDefinition> = new Map(
  RULES.map((r) => [r.id, r]),
);

export function getCheckerReferencedFigureIds(): string[] {
  return getCheckerReferencedFigureIdsFromRules(RULES_META);
}
