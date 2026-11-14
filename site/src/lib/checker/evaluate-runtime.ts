import { formatAuDate } from '../dates';
import type { FigureData } from '../figures';
import { buildAreaCardFromData, lookupPostcode } from './area-runtime';
import {
  resolveLinkKeyFromData,
  type LinksCatalogData,
} from './links-runtime';
import {
  renderMessageFromMap,
  type MessageDefinition,
} from './messages-runtime';
import {
  getCheckerReferencedFigureIdsFromRules,
  type RuleDefinition,
} from './rules-hooks';
import type {
  BranchChoice,
  CheckerAnswers,
  CheckerEvaluationContext,
  CheckerResult,
  EvaluatedFigure,
  EvaluatedLine,
  GlobalModifierResult,
  LinkKey,
  MessageId,
  PostcodeAreaRecord,
  ProgramGroup,
  ResolvedLink,
  RuleStatus,
  SourceMeta,
} from './types';

export interface CheckerCatalogRuntime {
  rules: readonly RuleDefinition[];
  rulesById: ReadonlyMap<string, RuleDefinition>;
  messagesById: ReadonlyMap<MessageId, MessageDefinition>;
  links: LinksCatalogData;
}

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

function toIsoDateString(value: Date | string): string {
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }
  return value.toISOString().slice(0, 10);
}

export function computeOldestCheckerCheckedOnFromRules(
  rules: readonly Pick<RuleDefinition, 'figureIds' | 'coPayFigureIds'>[],
  figures: Map<string, FigureData>,
): string {
  const referenced = getCheckerReferencedFigureIdsFromRules(rules);
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
    formatted: fig.formatted ?? String(fig.amountMax),
    scenario: fig.scenario,
    kind: fig.kind,
    basis: fig.basis ?? 'official',
    method: fig.method,
    sourceId: typeof fig.sourceId === 'string' ? fig.sourceId : fig.sourceId.id,
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
    if (seen.has(link.href)) continue;
    seen.add(link.href);
    out.push(link);
  }
  return out;
}

function resolveBusinessRuleExtraLink(
  ruleId: string,
  enabledUrls: Set<string>,
  linksData: LinksCatalogData,
): ResolvedLink | null {
  const entry = linksData.businessResultLinks[ruleId];
  if (!entry) return null;
  const baseHref = entry.url.split('#')[0];
  if (enabledUrls.has(baseHref)) {
    return {
      label: entry.label,
      specHref: entry.url,
      href: entry.url,
      external: false,
    };
  }
  if (enabledUrls.has('/victoria/business-energy-upgrades/')) {
    return {
      label: resolveLinkKeyFromData('business-hub', enabledUrls, linksData).label,
      specHref: entry.url,
      href: '/victoria/business-energy-upgrades/',
      external: false,
    };
  }
  const fallback = resolveLinkKeyFromData('veu-copayment', enabledUrls, linksData);
  return {
    label: fallback.label,
    specHref: entry.url,
    href: fallback.href,
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

const RENT_NOTE = "You may need your landlord's permission.";
const OC_NOTE =
  'Eligible as residential or commercial premises depending on building class. Provider confirms.';

function evaluateGlobalModifiers(
  catalog: CheckerCatalogRuntime,
  answers: CheckerAnswers,
  branch: BranchChoice,
  area: PostcodeAreaRecord,
  context: CheckerEvaluationContext,
  checkedDateFormatted: string,
): { modifiers: GlobalModifierResult[]; firedIds: string[] } {
  const modifiers: GlobalModifierResult[] = [];
  const firedIds: string[] = [];

  for (const rule of catalog.rules) {
    if (rule.section !== 'global') continue;
    if (rule.branch !== 'shared' && rule.branch !== branch) continue;
    if (!rule.when(answers, area)) continue;

    firedIds.push(rule.id);
    const links = dedupeLinks(
      rule.links.map((k) => resolveLinkKeyFromData(k, context.enabledUrls, catalog.links)),
    );
    const message = rule.messageId
      ? renderMessageFromMap(
          rule.messageId,
          catalog.messagesById,
          catalog.links,
          context.figures,
          context.enabledUrls,
          checkedDateFormatted,
        )
      : undefined;

    let placement: GlobalModifierResult['placement'] = 'inline';
    let text = rule.why;

    if (rule.id === 'G-AREA') {
      placement = 'top';
      text = `Your postcode is ${area.veu_area}, ${area.veu_climatic_region} climate. VEU discounts are calculated for your area, so the provider's figure may differ from Energy Vic's average.`;
    } else if (rule.id === 'G-NOTSURE') {
      placement = 'top';
    } else if (rule.id === 'G-RETRO' || rule.id === 'G-SCAM' || rule.id === 'G-SCHED') {
      placement = 'footer';
    } else if (rule.id === 'G-RENT') {
      placement = 'top';
      text = RENT_NOTE;
    } else if (rule.id === 'G-OC') {
      placement = 'top';
      text = OC_NOTE;
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
  catalog: CheckerCatalogRuntime,
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
    ? renderMessageFromMap(
        resolvedMsgId,
        catalog.messagesById,
        catalog.links,
        context.figures,
        context.enabledUrls,
        checkedDateFormatted,
      )
    : undefined;

  const baseLinks = rule.links.map((k) =>
    resolveLinkKeyFromData(k, context.enabledUrls, catalog.links),
  );
  const bizExtra =
    rule.section === 'business'
      ? resolveBusinessRuleExtraLink(rule.id, context.enabledUrls, catalog.links)
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
    notes.push(RENT_NOTE);
  }

  if (
    answers.S1 === 'residential' &&
    answers.R3 === 'owners-corporation' &&
    rule.programGroup === 'veu' &&
    status !== 'not-eligible'
  ) {
    notes.push(OC_NOTE);
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
  linksData: LinksCatalogData,
): CheckerResult['ctas'] {
  const rk = (key: LinkKey) => resolveLinkKeyFromData(key, enabledUrls, linksData);
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
    secondary.push(rk('postcode-lookup'));
    return {
      primary: dedupeLinks(primary),
      secondary: dedupeLinks(secondary),
      area: areaLink,
    };
  }

  if (branch === 'residential') {
    const hasVeuEligible = eligibleLines.some((l) => l.programGroup === 'veu');
    if (hasVeuEligible) {
      primary.push(rk('find-provider'));
      for (const line of eligibleLines) {
        const guideKey = linksData.residentialGuideByRule[line.ruleId];
        if (guideKey) {
          secondary.push(rk(guideKey));
        }
      }
    }

    const largeCopaySet = new Set(linksData.largeCopayIds);
    const hasLargeCoPay = eligibleLines.some((l) =>
      l.coPayFigureIds.some((cid) => largeCopaySet.has(cid)),
    );
    if (hasLargeCoPay) {
      primary.push(rk('veu-copayment'));
    }

    if (eligibleIds.has('SH-HW')) {
      primary.push(rk('solarvic-hw-external'));
      secondary.push(rk('veu-vs-solar-homes'));
    }
    if (eligibleIds.has('SH-PV') || eligibleIds.has('SH-PV-L')) {
      primary.push(rk('solarvic-pv-external'));
      secondary.push(rk('veu-vs-solar-homes'));
    }
    if (eligibleIds.has('FED-BAT')) {
      primary.push(rk('dcceew-battery-external'));
      secondary.push(rk('veu-vs-solar-homes'));
    }

    if (answers.R3 === 'landlord') {
      primary.push(rk('landlords-2027'));
      secondary.push(rk('find-provider'));
    }
    if (answers.R3 === 'tenant') {
      primary.push(rk('renters'));
    }
    if (answers.R2a === 'yes') {
      primary.push(rk('solstice-towns'));
      secondary.push(rk('get-off-gas-planner'));
    }
    if (firedBannerIds.has('RW-8')) {
      primary.push(rk('gas-hw-broken-2027'));
      secondary.push(rk('gas-hw-ban-exemptions'));
    }
  } else {
    const hasCustom =
      eligibleIds.has('BX-1') || eligibleIds.has('BM-2') || eligibleIds.has('BP-3');
    const hasBizVeuEligible = eligibleLines.some((l) => l.programGroup === 'veu');
    const bizHubEnabled = enabledUrls.has('/victoria/business-energy-upgrades/');

    if (hasCustom) {
      primary.push(rk('energyvic-custom-external'));
      if (bizHubEnabled) {
        secondary.push(rk('business-hub'));
      } else {
        primary.push(rk('veu-copayment'));
      }
    }
    if (hasBizVeuEligible) {
      if (bizHubEnabled) {
        primary.push(rk('business-hub'));
        secondary.push(rk('energyvic-business-external'));
      } else {
        primary.push(rk('veu-copayment'));
        primary.push(rk('energyvic-business-external'));
      }
      for (const line of eligibleLines) {
        const extra = resolveBusinessRuleExtraLink(line.ruleId, enabledUrls, linksData);
        if (extra && (bizHubEnabled || extra.href !== '/victoria/veu-minimum-co-payment/')) {
          secondary.push(extra);
        }
      }
    }
    if (eligibleIds.has('BB-1')) {
      primary.push(rk('dcceew-battery-external'));
      secondary.push(rk(bizHubEnabled ? 'business-hub' : 'veu-copayment'));
    }
  }

  return {
    primary: dedupeLinks(primary),
    secondary: dedupeLinks(secondary),
    area: areaLink,
  };
}

export function evaluateWithCatalog(
  rawAnswers: CheckerAnswers,
  context: CheckerEvaluationContext,
  catalog: CheckerCatalogRuntime,
): CheckerResult {
  const { rules, rulesById, messagesById, links: linksData } = catalog;
  const branch: BranchChoice = rawAnswers.S1 ?? 'residential';
  const answers: CheckerAnswers = { ...rawAnswers, S1: branch };
  const oldestCheckedOn = computeOldestCheckerCheckedOnFromRules(rules, context.figures);
  const checkedDateFormatted = formatAuDate(oldestCheckedOn);

  const rawPostcode = branch === 'business' ? answers.B2 : answers.R2;
  const lookup = lookupPostcode(rawPostcode, context.postcodes);
  const renderMsg = (id: MessageId) =>
    renderMessageFromMap(
      id,
      messagesById,
      linksData,
      context.figures,
      context.enabledUrls,
      checkedDateFormatted,
    );

  if (!lookup.ok) {
    const postcodeError = renderMsg('X1');
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
        primary: [resolveLinkKeyFromData('postcode-lookup', context.enabledUrls, linksData)],
        secondary: [resolveLinkKeyFromData('victoria-hub', context.enabledUrls, linksData)],
      },
      firedRuleIds: [],
      oldestCheckedOn,
    };
  }

  const area = lookup.record;
  const areaCard = buildAreaCardFromData(
    area,
    context.postcodes.checkedOn,
    context.enabledUrls,
    linksData,
  );

  const { modifiers, firedIds: globalFiredIds } = evaluateGlobalModifiers(
    catalog,
    answers,
    branch,
    area,
    context,
    checkedDateFormatted,
  );

  const firedRuleIds: string[] = [...globalFiredIds];
  const banners: EvaluatedLine[] = [];
  const rawOutcomeLines: EvaluatedLine[] = [];
  const makeLine = (
    r: RuleDefinition,
    ov?: Parameters<typeof buildEvaluatedLine>[6],
  ) => buildEvaluatedLine(r, catalog, answers, area, context, checkedDateFormatted, ov);
  const makeIneligible = (r: RuleDefinition, messageId: MessageId) =>
    makeLine(r, { status: 'not-eligible', figureIds: [], coPayFigureIds: [], messageId });

  const gAgeActive = globalFiredIds.includes('G-AGE');
  const gSchedActive = globalFiredIds.includes('G-SCHED');
  const solsticeUnder2Years =
    branch === 'residential' && answers.R2a === 'yes' && answers.R5 === 'no';

  for (const rule of rules) {
    if (
      rule.section === 'global' ||
      rule.branch !== branch ||
      (gSchedActive && rule.programGroup === 'veu') ||
      (solsticeUnder2Years && rule.isReplacement) ||
      !rule.when(answers, area)
    ) {
      continue;
    }

    firedRuleIds.push(rule.id);

    if (rule.isNoteOnly) {
      banners.push(makeLine(rule));
      continue;
    }

    if (gAgeActive && rule.isReplacement) {
      rawOutcomeLines.push(makeIneligible(rule, 'N-AGE'));
      continue;
    }

    if (
      rule.id === 'B-RES-ONLY' &&
      Boolean(answers.B6?.includes('heat-pump-dryer')) &&
      (Boolean(answers.B6?.includes('household-only-inquiry')) ||
        (answers.BResItems?.length ?? 0) > 0)
    ) {
      rawOutcomeLines.push(
        makeLine(rule, {
          status: 'possibly',
          title: 'Business heat pump clothes dryer',
          figureIds: ['vic-veu-appliance-dryer'],
          messageId: null,
        }),
        makeLine(rule, {
          status: 'not-eligible',
          title: 'Household-only VEU activities',
          figureIds: [],
          messageId: 'N-BIZ-RES',
        }),
      );
      continue;
    }

    rawOutcomeLines.push(makeLine(rule));
  }

  if (gAgeActive && !rawOutcomeLines.some((l) => l.message?.id === 'N-AGE')) {
    const gAgeRule = rulesById.get('G-AGE');
    if (gAgeRule) rawOutcomeLines.push(makeIneligible(gAgeRule, 'N-AGE'));
  }

  if (gSchedActive) {
    const gSchedRule = rulesById.get('G-SCHED');
    if (gSchedRule) rawOutcomeLines.push(makeIneligible(gSchedRule, 'N-SCHED'));
  }

  const rd2Banner = banners.find((b) => b.ruleId === 'RD-2');
  if (rd2Banner?.message) {
    rawOutcomeLines.find((l) => l.ruleId === 'RD-1')?.notes.push(rd2Banner.message.text);
  }

  const byProg = (pg: ProgramGroup) =>
    rawOutcomeLines.filter((l) => l.status !== 'not-eligible' && l.programGroup === pg);
  const veuLines = byProg('veu');
  const solarHomesLines = byProg('solar-homes');
  const federalLines = byProg('federal');
  const ineligibleLines = rawOutcomeLines
    .filter((l) => l.status === 'not-eligible')
    .sort((a, b) => PROGRAM_ORDER[a.programGroup] - PROGRAM_ORDER[b.programGroup]);

  const lines: EvaluatedLine[] = [
    ...veuLines,
    ...solarHomesLines,
    ...federalLines,
    ...ineligibleLines,
  ];

  const allIneligibleMessage =
    !lines.some((l) => l.status === 'likely' || l.status === 'possibly') &&
    ineligibleLines.length > 0
      ? renderMsg('N-NONE')
      : undefined;

  const ctas = buildCtas(
    branch,
    answers,
    lines,
    banners,
    allIneligibleMessage,
    areaCard.areaLink,
    context.enabledUrls,
    linksData,
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
