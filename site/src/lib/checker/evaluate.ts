import type { FigureData } from '../figures';
import {
  computeOldestCheckerCheckedOnFromRules,
  evaluateWithCatalog,
  type CheckerCatalogRuntime,
} from './evaluate-runtime';
import { LINKS_DATA } from './links';
import { MESSAGES_BY_ID } from './messages';
import { RULES, RULES_BY_ID } from './rules';
import type {
  CheckerAnswers,
  CheckerEvaluationContext,
  CheckerResult,
} from './types';

export { computeOldestCheckerCheckedOnFromRules, evaluateWithCatalog, type CheckerCatalogRuntime };

const DEFAULT_CATALOG_RUNTIME: CheckerCatalogRuntime = {
  rules: RULES,
  rulesById: RULES_BY_ID,
  messagesById: MESSAGES_BY_ID,
  links: LINKS_DATA,
};

export function computeOldestCheckerCheckedOn(figures: Map<string, FigureData>): string {
  return computeOldestCheckerCheckedOnFromRules(RULES, figures);
}

export function evaluateWithData(
  rawAnswers: CheckerAnswers,
  context: CheckerEvaluationContext,
): CheckerResult {
  return evaluateWithCatalog(rawAnswers, context, DEFAULT_CATALOG_RUNTIME);
}
