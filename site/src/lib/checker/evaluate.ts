import { formatAuDate } from '../dates';
import {
  formatFigureAmount,
  getFigureSourceId,
  type FigureData,
} from '../figures';
import { buildAreaCard, lookupPostcode } from './area';
import {
  BUSINESS_RESULT_LINKS,
  resolveInternalUrl,
  resolveLinkKey,
} from './links';
import { renderMessage } from './messages';
import {
  getCheckerReferencedFigureIds,
  RULES,
  RULES_BY_ID,
  type RuleDefinition,
} from './rules';
import type {
  BranchChoice,
  CheckerAnswers,
  CheckerEvaluationContext,
  CheckerResult,
  EvaluatedFigure,
  EvaluatedLine,
  GlobalModifierResult,
  LinkKey,
  PostcodeAreaRecord,
  ProgramGroup,
  ResolvedLink,
  RuleStatus,
  SourceMeta,
} from './types';

const PROGRAM_LABELS: Readonly<Record<ProgramGroup, EvaluatedLine['programLabel']>> = {
  veu: 'VEU (Victoria)',
  'solar-homes': 'Solar Homes (Victoria)',
  federal: 'FEDERAL',
};

const PROGRAM_ORDER: Readonly<Record<ProgramGroup, number>> = {
  veu: 0,
  'solar-homes': 1,
  federal: 2,
};

const LARGE_COPAY_IDS: ReadonlySet<string> = new Set([
  'vic-veu-copay-ducted',
  'vic-veu-copay-multisplit-under-10kw',
  'vic-veu-copay-multisplit-10kw-plus',
  'vic-veu-copay-business-large',
]);

const RESIDENTIAL_GUIDE_BY_RULE: Readonly<Record<string, LinkKey>> = {
  'RH-1': 'guide-gas-room-to-split',
  'RH-2': 'guide-ducted-gas-to-ducted',
  'RH-3': 'guide-ducted-gas-to-splits',
  'RH-4': 'guide-electric-to-rcac',
  'RH-5': 'guide-electric-to-rcac',
  'RH-6': 'guide-ac-rebate',
  'RH-7': 'guide-ac-rebate',
  'RH-8': 'guide-ac-rebate',
  'RW-1': 'guide-gas-hw-to-hp',
  'RW-2': 'guide-gas-hw-to-hp',
  'RW-3': 'guide-electric-hw-to-hp',
  'RW-4': 'guide-electric-hw-to-hp',
  'RW-5': 'guide-solar-hw',
  'RW-6': 'guide-gas-hw-to-hp',
  'RC-1': 'guide-cooktop-induction',
  'RI-1': 'guide-ceiling-insulation',
  'RI-4': 'guide-ceiling-insulation',
  'I-APT': 'guide-ceiling-insulation',
  'RD-1': 'guide-draught-proofing',
  'RG-1': 'guide-draught-proofing',
};

function toIsoDateString(value: Date | string): string {
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }
  return value.toISOString().slice(0, 10);
}

export function computeOldestCheckerCheckedOn(figures: Map<string, FigureData>): string {
  const referenced = getCheckerReferencedFigureIds();
  let oldest = '';
  for (const id of referenced) {
    const fig = figures.get(id);
    if (!fig) continue;
    const iso = toIsoDateString(fig.checkedOn);
    if (!oldest || iso < oldest) {
      oldest = iso;
    }
  }
  return oldest || '2026-11-14';
}

function mapEvaluatedFigure(id: string, figures: Map<string, FigureData>): EvaluatedFigure {
  const fig = figures.get(id);
  if (!fig) {
    throw new Error(`Checker figure "${id}" is missing from figures dataset.`);
  }
  return {
    id,
    formatted: formatFigureAmount(fig),
    scenario: fig.scenario,
    kind: fig.kind,
    basis: fig.basis ?? 'official',
    method: fig.method,
    sourceId: getFigureSourceId(fig),
    checkedOn: toIsoDateString(fig.checkedOn),
    jurisdiction: fig.jurisdiction,
  };
}

function mapSources(sourceIds: string[], sources: Map<string, SourceMeta>): SourceMeta[] {
  const out: SourceMeta[] = [];
  for (const id of sourceIds) {
    const meta = sources.get(id);
    if (meta) {
      out.push(meta);
    }
  }
  return out;
}

function dedupeLinks(links: ResolvedLink[]): ResolvedLink[] {
  const seen = new Set<string>();
  const out: ResolvedLink[] = [];
  for (const link of links) {
    const sig = `${link.specHref}|${link.href}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(link);
  }
  return out;
}

function resolveBusinessRuleExtraLink(
  ruleId: string,
  enabledUrls: Set<string>,
): ResolvedLink | null {
  const entry = BUSINESS_RESULT_LINKS[ruleId];
  if (!entry) return null;
  const href = resolveInternalUrl(entry.url, enabledUrls, [
    '/victoria/business-energy-upgrades/',
    '/victoria/veu-minimum-co-payment/',
    '/victoria/',
  ]);
  return {
    label: entry.label,
    specHref: entry.url,
    href,
    external: false,
  };
}

function isRuleAffectedByNotSure(rule: RuleDefinition, a: CheckerAnswers): boolean {
  if (a.S1 === 'residential') {
    if (rule.isReplacement && (a.R5 === 'not-sure' || a.R2a === 'not-sure')) {
      return true;
    }
    if (rule.id.startsWith('RH-') && (a.H1 === 'not-sure' || a.H3 === 'not-sure')) {
      return true;
    }
    if (rule.id.startsWith('RW-') && (a.W1 === 'not-sure' || a.W3 === 'not-sure')) {
      return true;
    }
    if ((rule.id === 'RI-1' || rule.id === 'RI-4') && (a.I1 === 'not-sure' || a.I2 === 'not-sure')) {
      return true;
    }
    if (rule.id === 'RG-1' && a.G1 === 'not-sure') {
      return true;
    }
    if (
      rule.id === 'SH-HW' &&
      (a.R2a === 'not-sure' ||
        a.W4 === 'not-sure' ||
        a.SH1 === 'not-sure' ||
        a.SH2 === 'not-sure' ||
        a.SH3 === 'not-sure')
    ) {
      return true;
    }
    if (
      rule.id === 'SH-PV' &&
      (a.P1 === 'not-sure' ||
        a.SH1 === 'not-sure' ||
        a.SH2 === 'not-sure' ||
        a.SH3 === 'not-sure')
    ) {
      return true;
    }
  }

  if (a.S1 === 'business') {
    if (rule.programGroup === 'veu' && a.B4 === 'not-sure') {
      return true;
    }
    if (rule.isReplacement && a.B5 === 'not-sure') {
      return true;
    }
    if (rule.id === 'BH-1..7' && a.BH2 === 'not-sure') {
      return true;
    }
  }

  return false;
}

function evaluateGlobalModifiers(
  answers: CheckerAnswers,
  branch: BranchChoice,
  area: PostcodeAreaRecord,
  context: CheckerEvaluationContext,
  checkedDateFormatted: string,
): { modifiers: GlobalModifierResult[]; firedIds: string[] } {
  const modifiers: GlobalModifierResult[] = [];
  const firedIds: string[] = [];

  for (const rule of RULES) {
    if (rule.section !== 'global') continue;
    if (rule.branch !== 'shared' && rule.branch !== branch) continue;
    if (!rule.when(answers, area)) continue;

    firedIds.push(rule.id);
    const links = dedupeLinks(rule.links.map((k) => resolveLinkKey(k, context.enabledUrls)));
    const message = rule.messageId
      ? renderMessage(rule.messageId, context.figures, context.enabledUrls, checkedDateFormatted)
      : undefined;

    let placement: GlobalModifierResult['placement'] = 'inline';
    let text = rule.why;

    if (rule.id === 'G-AREA') {
      placement = 'top';
      text = `Your postcode is ${area.veu_area}, ${area.veu_climatic_region} climate. VEU discounts are calculated for your area, so the provider's figure may differ from Energy Vic's average.`;
    } else if (rule.id === 'G-NOTSURE' || rule.id === 'G-SCHED') {
      placement = 'top';
    } else if (rule.id === 'G-RETRO' || rule.id === 'G-SCAM') {
      placement = 'footer';
    } else if (rule.id === 'G-RENT') {
      placement = 'inline';
      text = "You may need your landlord's permission.";
    } else if (rule.id === 'G-OC') {
      placement = 'inline';
      text =
        'Eligible as residential or commercial premises depending on building class. Provider confirms.';
    }

    modifiers.push({
      ruleId: rule.id,
      placement,
      status: rule.status,
      text,
      message,
      sourceIds: [...rule.sourceIds],
      links,
    });
  }

  return { modifiers, firedIds };
}

function buildEvaluatedLine(
  rule: RuleDefinition,
  answers: CheckerAnswers,
  area: PostcodeAreaRecord,
  context: CheckerEvaluationContext,
  checkedDateFormatted: string,
  overrides?: {
    status?: RuleStatus;
    title?: string;
    figureIds?: string[];
    coPayFigureIds?: string[];
    messageId?: RuleDefinition['messageId'] | null;
    extraNotes?: string[];
  },
): EvaluatedLine {
  let status =
    overrides?.status ??
    (rule.resolveStatus ? rule.resolveStatus(answers, area) : rule.status);

  if (status === 'likely' && isRuleAffectedByNotSure(rule, answers)) {
    status = 'possibly';
  }
  if (
    status === 'likely' &&
    answers.S1 === 'residential' &&
    answers.R3 === 'owners-corporation' &&
    rule.programGroup === 'veu'
  ) {
    status = 'possibly';
  }

  const rawFigureIds =
    overrides?.figureIds ??
    (rule.resolveFigureIds ? rule.resolveFigureIds(answers, area) : rule.figureIds);
  const rawCoPayIds =
    overrides?.coPayFigureIds ??
    (rule.resolveCoPayFigureIds
      ? rule.resolveCoPayFigureIds(answers, area)
      : (rule.coPayFigureIds ?? []));

  const figureIds = status === 'not-eligible' ? [] : [...rawFigureIds];
  const coPayFigureIds = status === 'not-eligible' ? [] : [...rawCoPayIds];

  const resolvedMsgId =
    overrides?.messageId === null
      ? undefined
      : (overrides?.messageId ??
        (rule.resolveMessageId ? rule.resolveMessageId(answers, area) : rule.messageId));

  const message = resolvedMsgId
    ? renderMessage(resolvedMsgId, context.figures, context.enabledUrls, checkedDateFormatted)
    : undefined;

  const baseLinks = rule.links.map((k) => resolveLinkKey(k, context.enabledUrls));
  const bizExtra =
    rule.section === 'business'
      ? resolveBusinessRuleExtraLink(rule.id, context.enabledUrls)
      : null;
  const msgLinks = message ? message.links : [];
  const links = dedupeLinks([
    ...baseLinks,
    ...(bizExtra ? [bizExtra] : []),
    ...msgLinks,
  ]);

  const notes: string[] = [...(overrides?.extraNotes ?? [])];

  if (
    (rule.id === 'RI-1' || rule.id === 'RI-4') &&
    figureIds.length === 0 &&
    status !== 'not-eligible'
  ) {
    notes.push('Your accredited provider calculates the ceiling insulation discount for your postcode.');
  }

  if (rule.id === 'BP-1') {
    const upTo100 =
      answers.BP1 === '30-to-50-kw' ||
      answers.BP1 === '50-to-100-kw' ||
      answers.BP1ExactKw === 50 ||
      answers.BP1ExactKw === 75 ||
      answers.BP1ExactKw === 100;
    if (upTo100) {
      notes.push(
        'Federal small-scale technology certificates (STCs) may also apply for systems up to 100 kW.',
      );
    } else {
      notes.push(
        'Federal large-scale generation certificates (LGCs) may also apply for systems above 100 kW.',
      );
    }
  }

  if (
    answers.S1 === 'residential' &&
    answers.R3 === 'tenant' &&
    rule.isInstalledProduct &&
    status !== 'not-eligible'
  ) {
    notes.push("You may need your landlord's permission.");
  }

  if (
    answers.S1 === 'residential' &&
    answers.R3 === 'owners-corporation' &&
    rule.programGroup === 'veu' &&
    status !== 'not-eligible'
  ) {
    notes.push(
      'Eligible as residential or commercial premises depending on building class. Provider confirms.',
    );
  }

  return {
    ruleId: rule.id,
    programGroup: rule.programGroup,
    programLabel: PROGRAM_LABELS[rule.programGroup],
    status,
    title: overrides?.title ?? rule.title,
    why: rule.why,
    notes,
    figureIds,
    figures: figureIds.map((id) => mapEvaluatedFigure(id, context.figures)),
    coPayFigureIds,
    coPayFigures: coPayFigureIds.map((id) => mapEvaluatedFigure(id, context.figures)),
    message,
    sourceIds: [...rule.sourceIds],
    sources: mapSources(rule.sourceIds, context.sources),
    links,
  };
}

function buildCtas(
  branch: BranchChoice,
  answers: CheckerAnswers,
  lines: EvaluatedLine[],
  banners: EvaluatedLine[],
  allIneligibleMessage: EvaluatedLine['message'],
  areaLink: ResolvedLink,
  enabledUrls: Set<string>,
): CheckerResult['ctas'] {
  const primary: ResolvedLink[] = [];
  const secondary: ResolvedLink[] = [];

  const eligibleLines = lines.filter(
    (l) => l.status === 'likely' || l.status === 'possibly',
  );
  const firedBannerIds = new Set(banners.map((b) => b.ruleId));
  const eligibleIds = new Set(eligibleLines.map((l) => l.ruleId));

  if (allIneligibleMessage && eligibleLines.length === 0) {
    const msgLinks = lines.flatMap((l) => l.message?.links ?? []);
    if (msgLinks.length > 0) {
      primary.push(...msgLinks);
    } else {
      primary.push(...allIneligibleMessage.links);
    }
    secondary.push(resolveLinkKey('postcode-lookup', enabledUrls));
    return {
      primary: dedupeLinks(primary),
      secondary: dedupeLinks(secondary),
      area: areaLink,
    };
  }

  if (branch === 'residential') {
    const hasVeuEligible = eligibleLines.some((l) => l.programGroup === 'veu');
    if (hasVeuEligible) {
      primary.push(resolveLinkKey('find-provider', enabledUrls));
      for (const line of eligibleLines) {
        const guideKey = RESIDENTIAL_GUIDE_BY_RULE[line.ruleId];
        if (guideKey) {
          secondary.push(resolveLinkKey(guideKey, enabledUrls));
        }
      }
    }

    const hasLargeCoPay = eligibleLines.some((l) =>
      l.coPayFigureIds.some((cid) => LARGE_COPAY_IDS.has(cid)),
    );
    if (hasLargeCoPay) {
      primary.push(resolveLinkKey('veu-copayment', enabledUrls));
    }

    if (eligibleIds.has('SH-HW')) {
      primary.push(resolveLinkKey('solarvic-hw-external', enabledUrls));
      secondary.push(resolveLinkKey('veu-vs-solar-homes', enabledUrls));
    }
    if (eligibleIds.has('SH-PV') || eligibleIds.has('SH-PV-L')) {
      primary.push(resolveLinkKey('solarvic-pv-external', enabledUrls));
      secondary.push(resolveLinkKey('veu-vs-solar-homes', enabledUrls));
    }
    if (eligibleIds.has('FED-BAT')) {
      primary.push(resolveLinkKey('dcceew-battery-external', enabledUrls));
      secondary.push(resolveLinkKey('veu-vs-solar-homes', enabledUrls));
    }

    if (answers.R3 === 'landlord') {
      primary.push(resolveLinkKey('landlords-2027', enabledUrls));
      secondary.push(resolveLinkKey('find-provider', enabledUrls));
    }
    if (answers.R3 === 'tenant') {
      primary.push(resolveLinkKey('renters', enabledUrls));
    }
    if (answers.R2a === 'yes') {
      primary.push(resolveLinkKey('solstice-towns', enabledUrls));
      secondary.push(resolveLinkKey('get-off-gas-planner', enabledUrls));
    }
    if (firedBannerIds.has('RW-8')) {
      primary.push(resolveLinkKey('gas-hw-broken-2027', enabledUrls));
      secondary.push(resolveLinkKey('gas-hw-ban-exemptions', enabledUrls));
    }
  } else {
    const hasCustom =
      eligibleIds.has('BX-1') || eligibleIds.has('BM-2') || eligibleIds.has('BP-3');
    const hasBizVeuEligible = eligibleLines.some((l) => l.programGroup === 'veu');

    if (hasCustom) {
      primary.push(resolveLinkKey('energyvic-custom-external', enabledUrls));
      secondary.push(resolveLinkKey('business-hub', enabledUrls));
    }
    if (hasBizVeuEligible) {
      primary.push(resolveLinkKey('business-hub', enabledUrls));
      secondary.push(resolveLinkKey('energyvic-business-external', enabledUrls));
      for (const line of eligibleLines) {
        const extra = resolveBusinessRuleExtraLink(line.ruleId, enabledUrls);
        if (extra) {
          secondary.push(extra);
        }
      }
    }
    if (eligibleIds.has('BB-1')) {
      primary.push(resolveLinkKey('dcceew-battery-external', enabledUrls));
      secondary.push(resolveLinkKey('business-hub', enabledUrls));
    }
  }

  return {
    primary: dedupeLinks(primary),
    secondary: dedupeLinks(secondary),
    area: areaLink,
  };
}

export function evaluateWithData(
  rawAnswers: CheckerAnswers,
  context: CheckerEvaluationContext,
): CheckerResult {
  const branch: BranchChoice = rawAnswers.S1 ?? 'residential';
  const answers: CheckerAnswers = { ...rawAnswers, S1: branch };
  const oldestCheckedOn = computeOldestCheckerCheckedOn(context.figures);
  const checkedDateFormatted = formatAuDate(oldestCheckedOn);

  const rawPostcode = branch === 'business' ? answers.B2 : answers.R2;
  const lookup = lookupPostcode(rawPostcode, context.postcodes);

  if (!lookup.ok) {
    const postcodeError = renderMessage(
      'X1',
      context.figures,
      context.enabledUrls,
      checkedDateFormatted,
    );
    return {
      validPostcode: false,
      branch,
      postcodeError,
      areaCard: null,
      lines: [],
      veuLines: [],
      solarHomesLines: [],
      federalLines: [],
      ineligibleLines: [],
      modifiers: [],
      banners: [],
      ctas: {
        primary: [resolveLinkKey('postcode-lookup', context.enabledUrls)],
        secondary: [resolveLinkKey('victoria-hub', context.enabledUrls)],
      },
      firedRuleIds: [],
      oldestCheckedOn,
    };
  }

  const area = lookup.record;
  const areaCard = buildAreaCard(area, context.postcodes.checkedOn, context.enabledUrls);

  const { modifiers, firedIds: globalFiredIds } = evaluateGlobalModifiers(
    answers,
    branch,
    area,
    context,
    checkedDateFormatted,
  );

  const firedRuleIds: string[] = [...globalFiredIds];
  const banners: EvaluatedLine[] = [];
  const rawOutcomeLines: EvaluatedLine[] = [];

  const gAgeActive = globalFiredIds.includes('G-AGE');
  const gSchedActive = globalFiredIds.includes('G-SCHED');
  const solsticeUnder2Years =
    branch === 'residential' && answers.R2a === 'yes' && answers.R5 === 'no';

  for (const rule of RULES) {
    if (rule.section === 'global') continue;
    if (rule.branch !== branch) continue;

    // When scheduled premises is not opted in, only federal rules (BB-1) can proceed;
    // VEU activities are blocked by G-SCHED with message N-SCHED.
    if (gSchedActive && rule.programGroup === 'veu') {
      continue;
    }

    // Solstice customer in a < 2 year old home: standard VEU replacement rules do not apply;
    // SOL-2 fires instead of N-AGE (Spec §5.2 SOL-2 & §8 Example 4).
    if (solsticeUnder2Years && rule.isReplacement) {
      continue;
    }

    if (!rule.when(answers, area)) continue;

    firedRuleIds.push(rule.id);

    if (rule.isNoteOnly) {
      banners.push(buildEvaluatedLine(rule, answers, area, context, checkedDateFormatted));
      continue;
    }

    // G-AGE converts VEU replacement lines to Not eligible (N-AGE) without blocking non-replacement lines
    if (gAgeActive && rule.isReplacement) {
      rawOutcomeLines.push(
        buildEvaluatedLine(rule, answers, area, context, checkedDateFormatted, {
          status: 'not-eligible',
          figureIds: [],
          coPayFigureIds: [],
          messageId: 'N-AGE',
        }),
      );
      continue;
    }

    // Handle B-RES-ONLY when BOTH heat-pump-dryer and household-only items are selected
    if (
      rule.id === 'B-RES-ONLY' &&
      Boolean(answers.B6?.includes('heat-pump-dryer')) &&
      (Boolean(answers.B6?.includes('household-only-inquiry')) ||
        (answers.BResItems?.length ?? 0) > 0)
    ) {
      rawOutcomeLines.push(
        buildEvaluatedLine(rule, answers, area, context, checkedDateFormatted, {
          status: 'possibly',
          title: 'Business heat pump clothes dryer',
          figureIds: ['vic-veu-appliance-dryer'],
          messageId: null,
        }),
      );
      rawOutcomeLines.push(
        buildEvaluatedLine(rule, answers, area, context, checkedDateFormatted, {
          status: 'not-eligible',
          title: 'Household-only VEU activities',
          figureIds: [],
          messageId: 'N-BIZ-RES',
        }),
      );
      continue;
    }

    rawOutcomeLines.push(
      buildEvaluatedLine(rule, answers, area, context, checkedDateFormatted),
    );
  }

  // If G-AGE fired on residential heating-cooling or hot-water before sub-questions (H1/W1) were answered,
  // still surface a clear N-AGE line so partial-answer tests or UI previews see the age block.
  if (gAgeActive) {
    const hasReplacementLine = rawOutcomeLines.some((l) => l.message?.id === 'N-AGE');
    const gAgeRule = RULES_BY_ID.get('G-AGE');
    if (!hasReplacementLine && gAgeRule) {
      rawOutcomeLines.push(
        buildEvaluatedLine(gAgeRule, answers, area, context, checkedDateFormatted, {
          status: 'not-eligible',
          figureIds: [],
          coPayFigureIds: [],
          messageId: 'N-AGE',
        }),
      );
    }
  }

  // If G-SCHED is active, emit an explicit VEU ineligible line with N-SCHED alongside any FEDERAL battery line.
  if (gSchedActive) {
    const gSchedRule = RULES_BY_ID.get('G-SCHED');
    if (gSchedRule) {
      rawOutcomeLines.push(
        buildEvaluatedLine(gSchedRule, answers, area, context, checkedDateFormatted, {
          status: 'not-eligible',
          figureIds: [],
          coPayFigureIds: [],
          messageId: 'N-SCHED',
        }),
      );
    }
  }

  // Attach RD-2 N-SEAL-GAS caution note directly onto RD-1 when both fire
  const rd2Banner = banners.find((b) => b.ruleId === 'RD-2');
  if (rd2Banner?.message) {
    const rd1Line = rawOutcomeLines.find((l) => l.ruleId === 'RD-1');
    if (rd1Line) {
      rd1Line.notes.push(rd2Banner.message.text);
    }
  }

  const veuLines = rawOutcomeLines.filter(
    (l) => l.status !== 'not-eligible' && l.programGroup === 'veu',
  );
  const solarHomesLines = rawOutcomeLines.filter(
    (l) => l.status !== 'not-eligible' && l.programGroup === 'solar-homes',
  );
  const federalLines = rawOutcomeLines.filter(
    (l) => l.status !== 'not-eligible' && l.programGroup === 'federal',
  );
  const ineligibleLines = rawOutcomeLines
    .filter((l) => l.status === 'not-eligible')
    .sort((a, b) => PROGRAM_ORDER[a.programGroup] - PROGRAM_ORDER[b.programGroup]);

  const lines: EvaluatedLine[] = [
    ...veuLines,
    ...solarHomesLines,
    ...federalLines,
    ...ineligibleLines,
  ];

  const hasEligibleOrPossibly = lines.some(
    (l) => l.status === 'likely' || l.status === 'possibly',
  );
  const allIneligibleMessage =
    !hasEligibleOrPossibly && ineligibleLines.length > 0
      ? renderMessage('N-NONE', context.figures, context.enabledUrls, checkedDateFormatted)
      : undefined;

  const ctas = buildCtas(
    branch,
    answers,
    lines,
    banners,
    allIneligibleMessage,
    areaCard.areaLink,
    context.enabledUrls,
  );

  return {
    validPostcode: true,
    branch,
    areaCard,
    lines,
    veuLines,
    solarHomesLines,
    federalLines,
    ineligibleLines,
    modifiers,
    banners,
    allIneligibleMessage,
    ctas,
    firedRuleIds,
    oldestCheckedOn,
  };
}
