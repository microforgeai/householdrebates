import { z } from 'zod';
import rawRuleStatus from '../data/rule-status.json';
import { assertFigureNotStale, daysBetween, formatAuDate, formatAuLongDate } from './dates';

const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const VIC_ELECTION_FIGURE_PROGRAMS = new Set([
  'VEU',
  'Solar Homes',
  'VEU + Solar Homes',
  'Residential Electrification Grants',
  'Energy Victoria',
]);

export function hasVicElectionFigure(figurePrograms: Iterable<string>): boolean {
  for (const program of figurePrograms) {
    if (VIC_ELECTION_FIGURE_PROGRAMS.has(program)) {
      return true;
    }
  }
  return false;
}

export const RuleStatusSchema = z.object({
  electionWatch: z.object({
    status: z.enum(['pending', 'rechecked-unchanged', 'rechecked-changed']),
    electionDate: ISO_DATE,
    caretakerFrom: ISO_DATE,
    recheckFrom: ISO_DATE,
    recheckBy: ISO_DATE,
    sourceId: z.string().min(1),
    checkedOn: ISO_DATE,
    recheckedOn: ISO_DATE.optional(),
    text: z.string().min(1),
  }),
});

export type RuleStatusConfig = z.infer<typeof RuleStatusSchema>;
export type ElectionWatchData = RuleStatusConfig['electionWatch'];

export interface ResolvedElectionNotice {
  visible: boolean;
  message: string;
  sourceId: string;
  checkedOnFormatted: string;
}

export function isElectionBannerPending(input: unknown = rawRuleStatus): boolean {
  return RuleStatusSchema.parse(input).electionWatch.status === 'pending';
}

export function buildPendingNoticeText(
  ew: Pick<ElectionWatchData, 'electionDate' | 'checkedOn'>,
  pageCheckedOn?: Date | string,
): string {
  const checkedStr = formatAuDate(pageCheckedOn ?? ew.checkedOn);
  return `The Victorian election on ${formatAuLongDate(ew.electionDate)} may change these rules. Figures are as checked on ${checkedStr}; we'll update this page once the new government confirms its policy.`;
}

export function resolveElectionWatchNotice(
  input: unknown = rawRuleStatus,
  referenceDate: Date = new Date(),
  maxAgeDays = Number(process.env.MAX_FIGURE_AGE_DAYS || 45),
  pageCheckedOn?: Date | string,
): ResolvedElectionNotice {
  const parsed = RuleStatusSchema.parse(input);
  const ew = parsed.electionWatch;

  assertFigureNotStale('rule-status.electionWatch', ew.checkedOn, maxAgeDays, referenceDate);

  if (ew.status === 'rechecked-changed') {
    throw new Error(
      'Build blocked: rule-status.json has status="rechecked-changed" while an election-watch page still carries ruleStatus="election-watch". Update the page copy per the Prompt 23 STOP list and clear ruleStatus.',
    );
  }

  if (ew.status === 'rechecked-unchanged') {
    const recheckRef = ew.recheckedOn ?? ew.checkedOn;
    const daysSinceRecheck = daysBetween(recheckRef, referenceDate);
    if (daysSinceRecheck > 30) {
      return {
        visible: false,
        message: '',
        sourceId: ew.sourceId,
        checkedOnFormatted: formatAuDate(recheckRef),
      };
    }
    return {
      visible: true,
      message: `Re-checked after the ${formatAuDate(ew.electionDate)} election on ${formatAuDate(recheckRef)}: no change to these rules yet.`,
      sourceId: ew.sourceId,
      checkedOnFormatted: formatAuDate(recheckRef),
    };
  }

  const dateRenderedText = buildPendingNoticeText(ew, pageCheckedOn);
  return {
    visible: true,
    message: dateRenderedText,
    sourceId: ew.sourceId,
    checkedOnFormatted: formatAuDate(ew.checkedOn),
  };
}
