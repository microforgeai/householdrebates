import { formatFigureAmount, type FigureData } from './figures';
import {
  VIC_ELIGIBILITY_RULES,
  type CheckerActivity,
} from '../data/eligibility/vic-rules';
import { ELIGIBILITY_NOTES, type NoteId } from '../data/eligibility/notes';
import { RESULT_LINKS, type ResultLinkKey } from '../data/eligibility/result-links';

export type { CheckerActivity, NoteId, ResultLinkKey };

export type CheckerStatus =
  | 'OUT_OF_AREA'
  | 'BUSINESS'
  | 'RETRO'
  | 'LIKELY_NOT'
  | 'POSSIBLE'
  | 'LIKELY';

export interface PostcodeInfo {
  area: 'Metropolitan' | 'Regional';
  reticulatedGas: boolean;
  climaticRegion: 'Mild' | 'Cold' | 'Hot';
  hpZone: 4 | 5;
}

export type PostcodeLookup = Record<string, PostcodeInfo>;

export function decodeCompactPostcodes(compact: Record<string, string>): PostcodeLookup {
  const out: PostcodeLookup = {};
  for (const [pc, code] of Object.entries(compact)) {
    if (code.length < 4) continue;
    out[pc] = {
      area: code[0] === 'M' ? 'Metropolitan' : 'Regional',
      reticulatedGas: code[1] === '1',
      climaticRegion: code[2] === 'M' ? 'Mild' : code[2] === 'C' ? 'Cold' : 'Hot',
      hpZone: code[3] === '5' ? 5 : 4,
    };
  }
  return out;
}

export interface CheckerAnswers {
  q1State: 'vic' | 'other';
  /** Legacy single-select compatibility; superseded by q2Activities */
  q2Upgrade?: 'rcac' | 'hotwater' | 'both';
  q2Activities?: CheckerActivity[];
  q3WorkStage: 'no' | 'bought_not_installed' | 'installed_or_started';
  q4PropertyType: 'home' | 'business';
  q5Tenure: 'own' | 'rent' | 'landlord';
  q6BuildingOver2Years: 'yes' | 'no' | 'not_sure';
  q7aCurrentHeating?:
    | 'ducted-gas'
    | 'room-gas'
    | 'central-electric'
    | 'hardwired-electric'
    | 'ducted-rcac'
    | 'split-rcac'
    | 'none';
  q7bTargetHeating?: 'ducted' | 'split' | 'not_sure';
  q8aCurrentHotWater?: 'mains-gas' | 'lpg' | 'electric' | 'broken-solar' | 'none';
  q8bPreviousHotWaterUpgrades?: '0' | '1' | '2_plus' | 'not_sure';
  q9aPostcode?: string;
  q9bCeilingNow?: 'none' | 'thin' | 'thicker' | 'not_sure';
  q9cUnsafeCeiling?: 'yes' | 'no' | 'not_sure';
  q10aCooktopNow?: 'gas' | 'electric' | 'induction' | 'none';
  q10bClaimedBefore?: 'no' | 'yes' | 'not_sure';
  q10cCooktopTarget?: 'builtin_or_freestanding' | 'portable' | 'not_sure';
  q11aHomeType?: 'apartment' | 'townhouse' | 'house';
  q11bOpenFluedGas?: 'yes' | 'no' | 'not_sure';
}

export interface ResolvedNote {
  id: NoteId;
  text: string;
  figureIds: string[];
  figures: FigureData[];
  sourceId?: string;
}

export interface CheckerResultItem {
  activity: CheckerActivity;
  status: CheckerStatus;
  headline: string;
  summary: string;
  figureIds: string[];
  matchedFigures: FigureData[];
  highlightedFigureIds: string[];
  figureCaption?: string;
  noteIds: NoteId[];
  noteItems: ResolvedNote[];
  notes: string[];
  links: ResultLinkKey[];
  allowQuoteForm: boolean;
}

export interface CheckerAssessment {
  overallStatus: CheckerStatus;
  allowForm: boolean;
  productBoughtFlag: boolean;
  cautionBanner?: string;
  headline: string;
  summary: string;
  externalLink?: { url: string; label: string };
  resultLinks: ResultLinkKey[];
  items: CheckerResultItem[];
  sharedNotes: string[];
  disclaimer: string;
}

const DISCLAIMER_TEXT =
  'Indicative only. The discount depends on the certificate price, product, location and provider.';

function resolveActivities(answers: CheckerAnswers): CheckerActivity[] {
  if (answers.q2Activities && answers.q2Activities.length > 0) {
    return answers.q2Activities;
  }
  if (answers.q2Upgrade === 'both') return ['rcac', 'hotwater'];
  if (answers.q2Upgrade === 'hotwater') return ['hotwater'];
  return ['rcac'];
}

export function assess(
  answers: CheckerAnswers,
  rules = VIC_ELIGIBILITY_RULES,
  figures: FigureData[] = [],
  postcodes: PostcodeLookup = {},
): CheckerAssessment {
  const byId = new Map<string, FigureData>(figures.map((f) => [f.id, f]));
  const pickFigures = (ids: readonly string[]): FigureData[] =>
    ids.map((id) => byId.get(id)).filter((f): f is FigureData => Boolean(f));

  const makeNote = (
    id: NoteId,
    opts?: { figureIds?: readonly string[]; customText?: string },
  ): ResolvedNote => {
    const def = ELIGIBILITY_NOTES[id];
    const figIds = [...(opts?.figureIds ?? def.figureIds ?? [])];
    const resolvedFigs = pickFigures(figIds);
    const text = opts?.customText ?? def.text;
    return {
      id,
      text,
      figureIds: figIds,
      figures: resolvedFigs,
      sourceId: def.sourceId,
    };
  };

  // Gate 1: Out of area
  if (answers.q1State !== 'vic') {
    return {
      overallStatus: 'OUT_OF_AREA',
      allowForm: false,
      productBoughtFlag: false,
      headline: 'We only cover Victoria for now.',
      summary:
        'Victorian Energy Upgrades (VEU) discounts apply only to properties in Victoria. Check the Australian Government rebates finder for programs in your state or territory.',
      externalLink: {
        url: rules.outOfAreaLink,
        label: 'Visit energy.gov.au rebates finder',
      },
      resultLinks: [],
      items: [],
      sharedNotes: [],
      disclaimer: DISCLAIMER_TEXT,
    };
  }

  // Gate 2: Business
  if (answers.q4PropertyType === 'business') {
    return {
      overallStatus: 'BUSINESS',
      allowForm: false,
      productBoughtFlag: false,
      headline: 'Business discounts exist, but this guide covers homes.',
      summary:
        'Business discounts exist under the Victorian Energy Upgrades program, but scenarios and requirements differ from household rules.',
      externalLink: {
        url: rules.businessLink,
        label: 'View Energy Victoria VEU business information',
      },
      resultLinks: [],
      items: [],
      sharedNotes: [],
      disclaimer: DISCLAIMER_TEXT,
    };
  }

  const activities = resolveActivities(answers);
  const nonInductionSelected = activities.some((a) => a !== 'induction');

  // Gate 3: Already installed or work started (only if NO induction activity is selected; induction handles installed as POSSIBLE)
  if (answers.q3WorkStage === 'installed_or_started' && !activities.includes('induction')) {
    return {
      overallStatus: 'RETRO',
      allowForm: false,
      productBoughtFlag: false,
      headline: 'Discounts generally require a provider before work starts.',
      summary:
        'Discounts generally need an accredited provider involved before work starts. Retrospective discounts are typically not possible.',
      externalLink: {
        url:
          RESULT_LINKS.retro.internal ??
          'https://www.energy.vic.gov.au/victorian-energy-upgrades/products/retrospective-discounts',
        label: 'Read retrospective discount rules',
      },
      resultLinks: ['retro'],
      items: [],
      sharedNotes: [],
      disclaimer: DISCLAIMER_TEXT,
    };
  }

  const productBoughtFlag = answers.q3WorkStage === 'bought_not_installed' && nonInductionSelected;
  const cautionBanner = productBoughtFlag
    ? 'Because you have already purchased the product, check with an accredited provider before any installation work starts. Energy Victoria advises that retrospective discounts are typically not possible.'
    : undefined;

  const sharedNotes: string[] = [];
  const hasRcacOrHw = activities.includes('rcac') || activities.includes('hotwater');
  if (answers.q5Tenure === 'rent' && hasRcacOrHw) {
    sharedNotes.push(
      "Renters can get the discount, but heating and cooling needs the landlord's approval.",
    );
  }
  if ((answers.q5Tenure === 'rent' || answers.q5Tenure === 'landlord') && hasRcacOrHw) {
    sharedNotes.push(ELIGIBILITY_NOTES['rental-standards-2027'].text);
  }

  const items: CheckerResultItem[] = [];

  for (const act of activities) {
    if (act !== 'induction' && answers.q3WorkStage === 'installed_or_started') {
      const retroNote = makeNote('retro');
      items.push({
        activity: act,
        status: 'RETRO',
        headline: 'Work has already started or finished',
        summary:
          'Discounts generally need an accredited provider involved before work starts. Retrospective discounts are typically not possible.',
        figureIds: [],
        matchedFigures: [],
        highlightedFigureIds: [],
        noteIds: ['retro'],
        noteItems: [retroNote],
        notes: [retroNote.text],
        links: ['retro'],
        allowQuoteForm: false,
      });
      continue;
    }

    if (act === 'rcac') {
      items.push(assessHeatingCooling(answers, rules, figures, pickFigures, makeNote));
    } else if (act === 'hotwater') {
      items.push(assessHotWater(answers, rules, pickFigures, makeNote));
    } else if (act === 'insulation') {
      items.push(assessInsulation(answers, postcodes, pickFigures, makeNote));
    } else if (act === 'induction') {
      items.push(assessInduction(answers, pickFigures, makeNote));
    } else if (act === 'sealing') {
      items.push(assessSealing(answers, rules, pickFigures, makeNote));
    }
  }

  let overallStatus: CheckerStatus = 'LIKELY';
  if (items.every((i) => i.status === 'RETRO')) {
    overallStatus = 'RETRO';
  } else if (items.every((i) => i.status === 'LIKELY_NOT')) {
    overallStatus = 'LIKELY_NOT';
  } else if (items.some((i) => i.status === 'POSSIBLE' || i.status === 'LIKELY_NOT' || i.status === 'RETRO')) {
    overallStatus = items.some((i) => i.status === 'LIKELY' || i.status === 'POSSIBLE')
      ? 'POSSIBLE'
      : 'LIKELY_NOT';
  }

  // Lead form is strictly restricted to rcac | hotwater when eligible
  const allowForm = items.some(
    (i) =>
      (i.activity === 'rcac' || i.activity === 'hotwater') &&
      (i.status === 'LIKELY' || i.status === 'POSSIBLE'),
  );

  const headline =
    overallStatus === 'LIKELY'
      ? 'This upgrade looks like it fits the VEU rules.'
      : overallStatus === 'POSSIBLE'
        ? 'This upgrade may fit the VEU rules — an accredited provider confirms when they quote.'
        : 'This upgrade looks unlikely to fit the standard replacement rules.';

  const summary = items.map((i) => i.summary).join(' ');
  const resultLinks = [...new Set(items.flatMap((i) => i.links))];

  return {
    overallStatus,
    allowForm,
    productBoughtFlag,
    cautionBanner,
    headline,
    summary,
    resultLinks,
    items,
    sharedNotes,
    disclaimer: DISCLAIMER_TEXT,
  };
}

function finalizeItem(
  partial: Omit<CheckerResultItem, 'noteIds' | 'notes' | 'figureIds'>,
): CheckerResultItem {
  const noteIds = partial.noteItems.map((n) => n.id);
  const notes = partial.noteItems.map((n) => {
    if (n.figures.length > 0) {
      const amounts = n.figures.map((f) => `${f.scenario}: ${formatFigureAmount(f)}`).join('; ');
      return `${n.text} (${amounts})`;
    }
    return n.text;
  });
  return {
    ...partial,
    figureIds: partial.matchedFigures.map((f) => f.id),
    noteIds,
    notes,
  };
}

function resolveHcCopayIds(
  current: NonNullable<CheckerAnswers['q7aCurrentHeating']>,
  target: NonNullable<CheckerAnswers['q7bTargetHeating']>,
  rules: typeof VIC_ELIGIBILITY_RULES,
): readonly string[] {
  if (target === 'not_sure') {
    return rules.heatingCoolingCopayMap.all;
  }
  if (target === 'ducted') {
    return rules.heatingCoolingCopayMap.ducted;
  }
  if (current === 'ducted-gas' && target === 'split') {
    return rules.heatingCoolingCopayMap.ductedToSplits;
  }
  return rules.heatingCoolingCopayMap.roomSplit;
}

function assessHeatingCooling(
  answers: CheckerAnswers,
  rules: typeof VIC_ELIGIBILITY_RULES,
  allFigures: FigureData[],
  pickFigures: (ids: readonly string[]) => FigureData[],
  makeNote: (id: NoteId, opts?: { figureIds?: readonly string[]; customText?: string }) => ResolvedNote,
): CheckerResultItem {
  const current = answers.q7aCurrentHeating ?? 'none';
  const target = answers.q7bTargetHeating ?? 'not_sure';
  const noteItems: ResolvedNote[] = [];

  if (answers.q6BuildingOver2Years === 'no' && current !== 'none') {
    const noDecomm = pickFigures(['vic-veu-rcac-room-no-decomm', 'vic-veu-rcac-ducted-no-decomm']);
    const copayIds =
      target === 'ducted'
        ? rules.heatingCoolingCopayMap.ducted
        : target === 'split'
          ? rules.heatingCoolingCopayMap.roomSplit
          : rules.heatingCoolingCopayMap.all;
    noteItems.push(makeNote('rcac-no-decomm-only'));
    noteItems.push(makeNote('copay-hc', { figureIds: copayIds }));

    return finalizeItem({
      activity: 'rcac',
      status: 'LIKELY_NOT',
      headline: 'Replacing a heater requires a property more than 2 years old.',
      summary:
        'Under VEU heating and cooling rules, replacing an existing heater requires a property more than 2 years old. Only the smaller "no decommissioned product" discount path may be available.',
      matchedFigures: noDecomm,
      highlightedFigureIds: [],
      noteItems,
      links: ['rcac'],
      allowQuoteForm: false,
    });
  }

  let matched: FigureData[] = [];
  if (target === 'not_sure') {
    matched = allFigures.filter(
      (f) => f.activity === 'rcac' && f.group !== 'vic-veu-running-savings' && f.group !== 'vic-veu-copayments' && !f.effectiveTo,
    );
    noteItems.push(makeNote('rcac-not-sure'));
  } else {
    const key = `${current}__${target}` as keyof typeof rules.heatingCoolingFigureMap;
    const ids = rules.heatingCoolingFigureMap[key] ?? ['vic-veu-rcac-room-no-decomm'];
    matched = pickFigures(ids);
    if (current === 'ducted-gas' && target === 'ducted') {
      noteItems.push(makeNote('rcac-ducted-size'));
    }
  }

  const copayIds = resolveHcCopayIds(current, target, rules);
  noteItems.push(makeNote('copay-hc', { figureIds: copayIds }));

  const isPossible = answers.q6BuildingOver2Years === 'not_sure' || target === 'not_sure';
  const status: CheckerStatus = isPossible ? 'POSSIBLE' : 'LIKELY';
  const leadFigureText =
    matched.length > 0 ? formatFigureAmount(matched[0]) : 'an indicative discount';

  const summary = isPossible
    ? `From what you've told us, your heating and cooling upgrade may fit the VEU rules (indicative discount of ${leadFigureText}). An accredited provider confirms this when they quote.`
    : `From what you've told us, this upgrade looks like it fits the VEU rules. Energy Victoria lists an indicative discount of ${leadFigureText} for this situation. The accredited provider confirms whether you're eligible, and the actual amount, in your quote.`;

  return finalizeItem({
    activity: 'rcac',
    status,
    headline: 'Heating and cooling assessment',
    summary,
    matchedFigures: matched,
    highlightedFigureIds: [],
    noteItems,
    links: ['rcac'],
    allowQuoteForm: true,
  });
}

function assessHotWater(
  answers: CheckerAnswers,
  rules: typeof VIC_ELIGIBILITY_RULES,
  pickFigures: (ids: readonly string[]) => FigureData[],
  makeNote: (id: NoteId, opts?: { figureIds?: readonly string[]; customText?: string }) => ResolvedNote,
): CheckerResultItem {
  const current = answers.q8aCurrentHotWater ?? 'none';
  const prevUpgrades = answers.q8bPreviousHotWaterUpgrades ?? '0';
  const noteItems: ResolvedNote[] = [
    makeNote('hw-min-contribution'),
    makeNote('hw-solar-homes'),
  ];

  if (current === 'none') {
    return finalizeItem({
      activity: 'hotwater',
      status: 'LIKELY_NOT',
      headline: 'Hot water discounts require replacing an existing system.',
      summary:
        'Under VEU hot water rules, you must be replacing an existing inefficient electric, gas, or solar hot water system.',
      matchedFigures: [],
      highlightedFigureIds: [],
      noteItems,
      links: ['hotwater'],
      allowQuoteForm: false,
    });
  }

  if (answers.q6BuildingOver2Years === 'no') {
    return finalizeItem({
      activity: 'hotwater',
      status: 'LIKELY_NOT',
      headline: 'Building must be at least 2 years old for a hot water discount.',
      summary:
        'Energy Victoria requires the existing hot water system being replaced to be in a building at least 2 years old.',
      matchedFigures: [],
      highlightedFigureIds: [],
      noteItems,
      links: ['hotwater'],
      allowQuoteForm: false,
    });
  }

  if (prevUpgrades === '2_plus') {
    return finalizeItem({
      activity: 'hotwater',
      status: 'LIKELY_NOT',
      headline: 'Households can upgrade up to 2 hot water systems under VEU.',
      summary:
        'Because 2 or more hot water systems have already been upgraded under VEU at this address, an additional household hot water discount is unlikely to be available.',
      matchedFigures: [],
      highlightedFigureIds: [],
      noteItems,
      links: ['hotwater'],
      allowQuoteForm: false,
    });
  }

  if (current === 'lpg') {
    const lpgNotes: ResolvedNote[] = [
      makeNote('lpg-provider-confirms'),
      makeNote('lpg-not-covered'),
      makeNote('hw-min-contribution'),
      makeNote('hw-solar-homes'),
    ];
    return finalizeItem({
      activity: 'hotwater',
      status: 'POSSIBLE',
      headline: 'Hot water assessment (LPG)',
      summary:
        'VEU covers replacing gas or LPG water heaters, though Energy Victoria publishes a household dollar example only for mains gas. An accredited provider confirms whether a discount applies to your LPG system and how much.',
      matchedFigures: [],
      highlightedFigureIds: [],
      noteItems: lpgNotes,
      links: ['hotwater'],
      allowQuoteForm: true,
    });
  }

  const ids = rules.hotWaterFigureMap[current] ?? ['vic-veu-hw-gas-to-heatpump'];
  const matched = pickFigures(ids);
  const links: ResultLinkKey[] = ['hotwater'];

  if (current === 'mains-gas') {
    noteItems.push(makeNote('hw-gas-2027'));
    links.push('gas-2027');
  } else if (current === 'broken-solar') {
    noteItems.push(makeNote('hw-broken-solar'));
  }

  const isPossible =
    answers.q6BuildingOver2Years === 'not_sure' ||
    prevUpgrades === 'not_sure' ||
    current === 'broken-solar';

  const status: CheckerStatus = isPossible ? 'POSSIBLE' : 'LIKELY';
  const leadFigureText =
    matched.length > 0 ? formatFigureAmount(matched[0]) : 'an indicative discount';

  const summary = isPossible
    ? `From what you've told us, your hot water upgrade may fit the VEU rules (indicative discount of ${leadFigureText}). An accredited provider confirms this when they quote.`
    : `From what you've told us, this upgrade looks like it fits the VEU rules. Energy Victoria lists an indicative discount of ${leadFigureText} for this situation. The accredited provider confirms whether you're eligible, and the actual amount, in your quote.`;

  return finalizeItem({
    activity: 'hotwater',
    status,
    headline: 'Hot water assessment',
    summary,
    matchedFigures: matched,
    highlightedFigureIds: [],
    noteItems,
    links,
    allowQuoteForm: true,
  });
}

function assessInsulation(
  answers: CheckerAnswers,
  postcodes: PostcodeLookup,
  pickFigures: (ids: readonly string[]) => FigureData[],
  makeNote: (id: NoteId, opts?: { figureIds?: readonly string[]; customText?: string }) => ResolvedNote,
): CheckerResultItem {
  const postcode = (answers.q9aPostcode ?? '').trim();
  const ceiling = answers.q9bCeilingNow ?? 'none';
  const unsafe = answers.q9cUnsafeCeiling ?? 'no';

  const noteItems: ResolvedNote[] = [];
  const matched = pickFigures([
    'vic-veu-insulation-metro',
    'vic-veu-insulation-regional',
    'vic-veu-copay-insulation',
  ]);
  const highlightedFigureIds: string[] = [];

  let status: CheckerStatus = 'LIKELY';

  if (unsafe === 'yes') {
    status = 'LIKELY_NOT';
    noteItems.push(makeNote('insulation-safety-fix-first'));
  } else if (ceiling === 'thicker') {
    status = 'LIKELY_NOT';
    noteItems.push(makeNote('insulation-r2'));
  } else if (ceiling === 'not_sure' || unsafe === 'not_sure') {
    status = 'POSSIBLE';
  }

  const pcEntry = /^3\d{3}$/.test(postcode) ? postcodes[postcode] : undefined;
  if (pcEntry) {
    let pcText = `In the VEU postcode table, ${postcode} is listed as ${pcEntry.area}, climatic region ${pcEntry.climaticRegion}.`;
    if (pcEntry.area === 'Metropolitan' && pcEntry.climaticRegion === 'Mild') {
      highlightedFigureIds.push('vic-veu-insulation-metro');
    } else if (pcEntry.area === 'Regional' && pcEntry.climaticRegion === 'Cold') {
      highlightedFigureIds.push('vic-veu-insulation-regional');
    } else {
      pcText += ' The accredited provider confirms which amount applies.';
    }
    noteItems.push(makeNote('insulation-postcode', { customText: pcText }));
  } else {
    if (status === 'LIKELY') {
      status = 'POSSIBLE';
    }
    noteItems.push(makeNote('postcode-unknown'));
  }

  noteItems.push(makeNote('insulation-safety-checks'));
  noteItems.push(makeNote('insulation-few-providers'));

  if (answers.q5Tenure === 'rent') {
    noteItems.push(makeNote('renter-permission'));
  }
  if (answers.q5Tenure === 'rent' || answers.q5Tenure === 'landlord') {
    noteItems.push(makeNote('rental-insulation-2027'));
  }

  const leadFigId = highlightedFigureIds[0] ?? 'vic-veu-insulation-metro';
  const leadFig = matched.find((f) => f.id === leadFigId) ?? matched[0];
  const leadText = leadFig ? formatFigureAmount(leadFig) : 'an indicative discount';

  const summary =
    status === 'LIKELY_NOT'
      ? 'From what you told us, ceiling insulation looks unlikely to fit the VEU rules until the ceiling eligibility or safety requirements are met.'
      : status === 'POSSIBLE'
        ? `From what you've told us, ceiling insulation may fit the VEU rules. An accredited provider confirms your ceiling eligibility, zone, and final discount when they quote.`
        : `From what you've told us, this upgrade looks like it fits the VEU rules. Energy Victoria lists an indicative discount of ${leadText} for a matching example. The accredited provider confirms whether you're eligible, and the actual amount, in your quote.`;

  return finalizeItem({
    activity: 'insulation',
    status,
    headline: 'Ceiling insulation assessment',
    summary,
    matchedFigures: status === 'LIKELY_NOT' ? [] : matched,
    highlightedFigureIds: status === 'LIKELY_NOT' ? [] : highlightedFigureIds,
    noteItems,
    links: ['insulation'],
    allowQuoteForm: false,
  });
}

function assessInduction(
  answers: CheckerAnswers,
  pickFigures: (ids: readonly string[]) => FigureData[],
  makeNote: (id: NoteId, opts?: { figureIds?: readonly string[]; customText?: string }) => ResolvedNote,
): CheckerResultItem {
  const cooktopNow = answers.q10aCooktopNow ?? 'gas';
  const claimedBefore = answers.q10bClaimedBefore ?? 'no';
  const target = answers.q10cCooktopTarget ?? 'builtin_or_freestanding';
  const noteItems: ResolvedNote[] = [];
  const links: ResultLinkKey[] = ['induction'];

  // TODO(prompt-17): optional gas-supply-saving note once vic-gas-supply-saving is added in prompt 17.

  if (cooktopNow !== 'gas') {
    noteItems.push(makeNote('induction-must-replace-gas'));
    return finalizeItem({
      activity: 'induction',
      status: 'LIKELY_NOT',
      headline: 'Induction cooktop discount requires replacing a gas cooktop.',
      summary:
        'Under VEU rules, the induction cooktop discount applies only when replacing an existing mains gas or LPG cooktop.',
      matchedFigures: [],
      highlightedFigureIds: [],
      noteItems,
      links,
      allowQuoteForm: false,
    });
  }

  if (answers.q6BuildingOver2Years === 'no') {
    noteItems.push(makeNote('property-age'));
    return finalizeItem({
      activity: 'induction',
      status: 'LIKELY_NOT',
      headline: 'Home must be more than 2 years old for an induction cooktop discount.',
      summary:
        'Energy Victoria requires the home to be more than 2 years old when claiming the induction cooktop discount.',
      matchedFigures: [],
      highlightedFigureIds: [],
      noteItems,
      links,
      allowQuoteForm: false,
    });
  }

  if (claimedBefore === 'yes') {
    noteItems.push(makeNote('induction-claimed-before'));
    return finalizeItem({
      activity: 'induction',
      status: 'LIKELY_NOT',
      headline: 'An induction cooktop discount has already been claimed at this address.',
      summary:
        'Energy Victoria states an address cannot claim a second induction cooktop discount if one was already claimed previously.',
      matchedFigures: [],
      highlightedFigureIds: [],
      noteItems,
      links,
      allowQuoteForm: false,
    });
  }

  if (target === 'portable') {
    noteItems.push(makeNote('induction-product-rules'));
    return finalizeItem({
      activity: 'induction',
      status: 'LIKELY_NOT',
      headline: 'Portable plug-in induction cooktops do not qualify.',
      summary:
        'Eligible cooktops must be built-in or freestanding, at least 550 by 380 mm, with 3 or more cooking zones and at least a 2-year warranty.',
      matchedFigures: [],
      highlightedFigureIds: [],
      noteItems,
      links,
      allowQuoteForm: false,
    });
  }

  const matched = pickFigures(['vic-veu-induction', 'vic-veu-copay-induction']);
  noteItems.push(makeNote('induction-process'));

  let isPossible =
    answers.q6BuildingOver2Years === 'not_sure' ||
    claimedBefore === 'not_sure' ||
    target === 'not_sure';

  if (answers.q3WorkStage === 'installed_or_started') {
    isPossible = true;
    noteItems.push(makeNote('retro'));
    links.push('retro');
  }

  if (answers.q5Tenure === 'rent') {
    noteItems.push(makeNote('renter-permission'));
  }

  const status: CheckerStatus = isPossible ? 'POSSIBLE' : 'LIKELY';
  const leadFig = matched[0];
  const leadText = leadFig ? formatFigureAmount(leadFig) : 'an indicative discount';

  const summary = isPossible
    ? `From what you've told us, your induction cooktop upgrade may fit the VEU rules (indicative discount of ${leadText}). An accredited provider confirms eligibility before processing a claim.`
    : `From what you've told us, this upgrade looks like it fits the VEU rules. Energy Victoria lists an indicative discount of ${leadText} for this situation. The accredited provider confirms whether you're eligible, and the actual amount, when you apply.`;

  return finalizeItem({
    activity: 'induction',
    status,
    headline: 'Induction cooktop assessment',
    summary,
    matchedFigures: matched,
    highlightedFigureIds: [],
    noteItems,
    links,
    allowQuoteForm: false,
  });
}

function assessSealing(
  answers: CheckerAnswers,
  rules: typeof VIC_ELIGIBILITY_RULES,
  pickFigures: (ids: readonly string[]) => FigureData[],
  makeNote: (id: NoteId, opts?: { figureIds?: readonly string[]; customText?: string }) => ResolvedNote,
): CheckerResultItem {
  const homeType = answers.q11aHomeType ?? 'house';
  const openFlued = answers.q11bOpenFluedGas ?? 'no';
  const noteItems: ResolvedNote[] = [];

  if (openFlued === 'yes') {
    noteItems.push(makeNote('sealing-co-risk'));
    return finalizeItem({
      activity: 'sealing',
      status: 'LIKELY_NOT',
      headline: 'Draught proofing is excluded where open-flued or flueless gas appliances are inside.',
      summary:
        'Homes with an open-flued or flueless gas heater, or an open-flued gas water heater inside, do not qualify under VEU weather sealing because sealing can raise carbon monoxide risk.',
      matchedFigures: [],
      highlightedFigureIds: [],
      noteItems,
      links: ['sealing'],
      allowQuoteForm: false,
    });
  }

  const ids = rules.sealingFigureMap[homeType];
  const matched = pickFigures(ids);

  let status: CheckerStatus = 'LIKELY';
  if (openFlued === 'not_sure') {
    status = 'POSSIBLE';
    noteItems.push(makeNote('sealing-co-risk'));
  }

  noteItems.push(makeNote('sealing-examples'));

  if (answers.q5Tenure === 'rent') {
    noteItems.push(makeNote('renter-sealing'));
  }
  if (answers.q5Tenure === 'rent' || answers.q5Tenure === 'landlord') {
    noteItems.push(makeNote('rental-sealing-2027'));
  }

  const leadFig = matched[matched.length - 1] ?? matched[0];
  const leadText = leadFig ? formatFigureAmount(leadFig) : 'an indicative discount';

  const summary =
    status === 'POSSIBLE'
      ? `From what you've told us, draught proofing (weather sealing) may fit the VEU rules once an accredited provider checks that there are no open-flued or flueless gas appliances inside.`
      : `From what you've told us, this upgrade looks like it fits the VEU rules. Energy Victoria lists example discounts up to ${leadText} depending on what is sealed and the product warranty. The accredited provider confirms whether you're eligible, and the actual amount, in your quote.`;

  return finalizeItem({
    activity: 'sealing',
    status,
    headline: 'Draught proofing (weather sealing) assessment',
    summary,
    matchedFigures: matched,
    highlightedFigureIds: [],
    figureCaption: "Energy Victoria's examples; the amount depends on what's sealed and the product warranty.",
    noteItems,
    links: ['sealing'],
    allowQuoteForm: false,
  });
}
