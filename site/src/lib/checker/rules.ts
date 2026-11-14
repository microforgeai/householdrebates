import { resolveInsulationFigureId } from './area';
import type {
  CheckerAnswers,
  LinkKey,
  MessageId,
  PostcodeAreaRecord,
  ProgramGroup,
  RuleStatus,
} from './types';

export interface RuleDefinition {
  id: string;
  section: 'global' | 'residential' | 'business';
  branch: 'shared' | 'residential' | 'business';
  programGroup: ProgramGroup;
  title: string;
  when: (answers: CheckerAnswers, area: PostcodeAreaRecord | null) => boolean;
  status: RuleStatus;
  resolveStatus?: (answers: CheckerAnswers, area: PostcodeAreaRecord | null) => RuleStatus;
  figureIds: string[];
  resolveFigureIds?: (answers: CheckerAnswers, area: PostcodeAreaRecord | null) => string[];
  coPayFigureIds?: string[];
  resolveCoPayFigureIds?: (answers: CheckerAnswers, area: PostcodeAreaRecord | null) => string[];
  messageId?: MessageId;
  resolveMessageId?: (
    answers: CheckerAnswers,
    area: PostcodeAreaRecord | null,
  ) => MessageId | undefined;
  sourceIds: string[];
  why: string;
  links: LinkKey[];
  isReplacement?: boolean;
  isInstalledProduct?: boolean;
  isNoteOnly?: boolean;
}

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

function hasResUpgrade(a: CheckerAnswers, item: NonNullable<CheckerAnswers['R6']>[number]): boolean {
  return a.S1 === 'residential' && Boolean(a.R6?.includes(item));
}

function hasBizActivity(a: CheckerAnswers, item: NonNullable<CheckerAnswers['B6']>[number]): boolean {
  return a.S1 === 'business' && Boolean(a.B6?.includes(item));
}

function isEfficientExistingHw(w1: CheckerAnswers['W1']): boolean {
  return w1 === 'solar-working' || w1 === 'heat-pump-already';
}

function shHwConditionsPass(a: CheckerAnswers): boolean {
  if (!hasResUpgrade(a, 'hot-water')) return false;
  if (isEfficientExistingHw(a.W1)) return false;

  if (a.R2a === 'yes') {
    // Solstice exemptions: no income cap, any hot-water age, owner-occupier or rental provider
    if (a.R3 !== 'own-and-live' && a.R3 !== 'landlord') return false;
    if (a.SH2 === 'no') return false;
    if (a.SH3 === 'yes') return false;
    return true;
  }

  if (a.R3 !== 'own-and-live') return false;
  if (a.SH1 !== 'yes' && a.SH1 !== 'not-sure') return false;
  if (a.SH2 !== 'yes' && a.SH2 !== 'not-sure') return false;
  if (a.SH3 !== 'no' && a.SH3 !== 'not-sure') return false;
  if (a.W4 !== 'yes' && a.W4 !== 'not-sure') return false;
  return true;
}

function resolveShHwFailureMessage(a: CheckerAnswers): MessageId {
  if (a.R2a !== 'yes' && a.R3 !== 'own-and-live') return 'N-SH-TENURE';
  if (a.R2a === 'yes' && a.R3 !== 'own-and-live' && a.R3 !== 'landlord') return 'N-SH-TENURE';
  if (a.R2a !== 'yes' && a.SH1 === 'no') return 'N-SH-INC';
  if (a.SH2 === 'no') return 'N-SH-PROP';
  if (a.SH3 === 'yes') return 'N-SH-DUP';
  if (a.R2a !== 'yes' && a.W4 === 'no') return 'N-SH-AGE';
  return 'N-SH-INC';
}

function shPvConditionsPass(a: CheckerAnswers): boolean {
  if (!hasResUpgrade(a, 'solar-panels')) return false;
  if (a.R3 !== 'own-and-live' && a.R3 !== 'building-it') return false;
  if (a.P1 === 'yes') return false;
  if (a.R2a !== 'yes' && a.SH1 === 'no') return false;
  if (a.SH2 === 'no') return false;
  if (a.SH3 === 'yes') return false;
  return true;
}

function resolveShPvFailureMessage(a: CheckerAnswers): MessageId {
  if (a.P1 === 'yes') return 'N-PV-10Y';
  if (a.R2a !== 'yes' && a.SH1 === 'no') return 'N-SH-INC';
  if (a.SH2 === 'no') return 'N-SH-PROP';
  if (a.SH3 === 'yes') return 'N-SH-DUP';
  return 'N-SH-TENURE';
}

export function hasAnyGatingNotSure(a: CheckerAnswers): boolean {
  if (a.S1 === 'residential') {
    if (a.R2a === 'not-sure') return true;
    if (a.R5 === 'not-sure') return true;
    if (
      a.R4 === 'other-not-sure' &&
      (a.R6?.includes('ceiling-insulation') || a.R6?.includes('draughts'))
    ) {
      return true;
    }
    if (a.R6?.includes('heating-cooling') && (a.H1 === 'not-sure' || a.H3 === 'not-sure')) {
      return true;
    }
    if (
      a.R6?.includes('hot-water') &&
      (a.W1 === 'not-sure' || a.W3 === 'not-sure' || a.W4 === 'not-sure')
    ) {
      return true;
    }
    if (a.R6?.includes('ceiling-insulation') && (a.I1 === 'not-sure' || a.I2 === 'not-sure')) {
      return true;
    }
    if (a.R6?.includes('windows') && a.G1 === 'not-sure') return true;
    if (a.R6?.includes('solar-panels') && a.P1 === 'not-sure') return true;
    if (a.SH1 === 'not-sure' || a.SH2 === 'not-sure' || a.SH3 === 'not-sure') return true;
  }

  if (a.S1 === 'business') {
    if (a.B4 === 'not-sure' || a.B5 === 'not-sure') return true;
    if (a.B6?.includes('heating-cooling') && a.BH2 === 'not-sure') return true;
  }

  return false;
}

function resolveBusinessHeatingFigures(a: CheckerAnswers): string[] {
  const bh1 = a.BH1 ?? 'ducted-gas';
  const bh2 = a.BH2 ?? 'not-sure';

  if (bh1 === 'non-ducted-gas-heater') {
    return ['vic-veu-biz-rcac-room-gas'];
  }

  if (bh1 === 'ducted-gas') {
    if (bh2 === 'room-split-3-to-9-kw') {
      return ['vic-veu-biz-rcac-ducted-gas-4splits'];
    }
    if (bh2 === 'several-splits-multi-split') {
      return ['vic-veu-biz-rcac-ducted-gas-4splits', 'vic-veu-biz-rcac-ducted-gas-multisplit'];
    }
    if (bh2 === 'ducted-16-kw') return ['vic-veu-biz-rcac-ducted-gas-16kw'];
    if (bh2 === 'ducted-25-kw') return ['vic-veu-biz-rcac-ducted-gas-25kw'];
    if (bh2 === 'ducted-32-kw') return ['vic-veu-biz-rcac-ducted-gas-32kw'];
    if (bh2 === 'ducted-56-kw') return ['vic-veu-biz-rcac-ducted-gas-56kw'];
    return [
      'vic-veu-biz-rcac-ducted-gas-16kw',
      'vic-veu-biz-rcac-ducted-gas-25kw',
      'vic-veu-biz-rcac-ducted-gas-32kw',
      'vic-veu-biz-rcac-ducted-gas-56kw',
    ];
  }

  if (bh1 === 'central-electric-ducted') {
    return ['vic-veu-biz-rcac-central-electric-ducted'];
  }

  if (bh1 === 'ducted-reverse-cycle') {
    if (bh2 === 'ducted-16-kw') return ['vic-veu-biz-rcac-replaced-ducted-16kw'];
    if (bh2 === 'ducted-25-kw') return ['vic-veu-biz-rcac-replaced-ducted-25kw'];
    if (bh2 === 'ducted-32-kw') return ['vic-veu-biz-rcac-replaced-ducted-32kw'];
    if (bh2 === 'ducted-56-kw') return ['vic-veu-biz-rcac-replaced-ducted-56kw'];
    return [
      'vic-veu-biz-rcac-replaced-ducted-16kw',
      'vic-veu-biz-rcac-replaced-ducted-25kw',
      'vic-veu-biz-rcac-replaced-ducted-32kw',
      'vic-veu-biz-rcac-replaced-ducted-56kw',
    ];
  }

  if (bh1 === 'non-ducted-reverse-cycle') {
    return ['vic-veu-biz-rcac-replaced-room'];
  }

  if (bh1 === 'hard-wired-electric-room-heater') {
    return ['vic-veu-biz-rcac-hardwired-electric'];
  }

  // bh1 === 'nothing'
  if (bh2 === 'room-split-3-to-9-kw' || bh2 === 'several-splits-multi-split') {
    return ['vic-veu-biz-rcac-room-no-decomm'];
  }
  if (
    bh2 === 'ducted-16-kw' ||
    bh2 === 'ducted-25-kw' ||
    bh2 === 'ducted-32-kw' ||
    bh2 === 'ducted-56-kw'
  ) {
    return ['vic-veu-biz-rcac-ducted-no-decomm'];
  }
  return ['vic-veu-biz-rcac-room-no-decomm', 'vic-veu-biz-rcac-ducted-no-decomm'];
}

function resolveBusinessHeatingCoPayFigures(a: CheckerAnswers): string[] {
  const bh2 = a.BH2 ?? 'not-sure';
  if (bh2 === 'room-split-3-to-9-kw') {
    return ['vic-veu-copay-split-under-10kw'];
  }
  if (bh2 === 'several-splits-multi-split') {
    return ['vic-veu-copay-multisplit-under-10kw', 'vic-veu-copay-multisplit-10kw-plus'];
  }
  return ['vic-veu-copay-ducted'];
}

export const RULES: readonly RuleDefinition[] = [
  // =========================================================================
  // §5.1 Global modifiers (8 rules)
  // =========================================================================
  {
    id: 'G-AREA',
    section: 'global',
    branch: 'shared',
    programGroup: 'veu',
    title: 'Postcode area and climate calculation',
    when: (_a, area) => area !== null,
    status: 'info',
    figureIds: [],
    sourceIds: ['vic-veu-spec-v25'],
    why: 'VEU discounts are calculated using your postcode area and climate region, so an accredited provider quote may differ from Energy Victoria averages.',
    links: [],
    isNoteOnly: true,
  },
  {
    id: 'G-NOTSURE',
    section: 'global',
    branch: 'shared',
    programGroup: 'veu',
    title: 'Provider confirms uncertain details',
    when: (a) => hasAnyGatingNotSure(a),
    status: 'possibly',
    figureIds: [],
    sourceIds: ['energyvic-about-veu'],
    why: 'Because one or more property or appliance answers were marked Not sure, matching lines are shown as Possibly and your accredited provider confirms.',
    links: ['find-provider'],
    isNoteOnly: true,
  },
  {
    id: 'G-AGE',
    section: 'global',
    branch: 'shared',
    programGroup: 'veu',
    title: 'Building age requirement for replacement upgrades',
    when: (a) => {
      if (a.S1 === 'residential') {
        if (a.R2a === 'yes') return false;
        const hasReplacement =
          Boolean(a.R6?.includes('heating-cooling')) || Boolean(a.R6?.includes('hot-water'));
        return a.R5 === 'no' && hasReplacement;
      }
      if (a.S1 === 'business') {
        const hasReplacement =
          Boolean(a.B6?.includes('heating-cooling')) || Boolean(a.B6?.includes('hot-water'));
        return a.B5 === 'no' && hasReplacement;
      }
      return false;
    },
    status: 'not-eligible',
    figureIds: [],
    messageId: 'N-AGE',
    sourceIds: ['energyvic-heating-cooling', 'energyvic-hot-water'],
    why: 'VEU heating, cooling and hot water replacement discounts require an existing building that meets the two-year age rule.',
    links: ['new-homes-2027'],
    isNoteOnly: true,
  },
  {
    id: 'G-RETRO',
    section: 'global',
    branch: 'shared',
    programGroup: 'veu',
    title: 'Speak with an accredited provider before buying',
    when: (_a, area) => area !== null,
    status: 'info',
    figureIds: [],
    sourceIds: ['energyvic-retrospective'],
    why: 'Talk to an accredited provider before you buy; discounts after installation are rare and must be lodged within six months after the end of the calendar year.',
    links: ['retrospective-discount'],
    isNoteOnly: true,
  },
  {
    id: 'G-RENT',
    section: 'global',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Landlord permission for rental installations',
    when: (a) => a.S1 === 'residential' && a.R3 === 'tenant',
    status: 'info',
    figureIds: [],
    sourceIds: ['energyvic-renters-landlords'],
    why: 'Tenants may need their rental provider or landlord permission before installing fixed upgrades.',
    links: ['renters'],
    isNoteOnly: true,
  },
  {
    id: 'G-OC',
    section: 'global',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Owners corporation building classification',
    when: (a) => a.S1 === 'residential' && a.R3 === 'owners-corporation',
    status: 'possibly',
    figureIds: [],
    sourceIds: ['energyvic-renters-landlords'],
    why: 'Owners corporations are assessed as residential or commercial premises depending on building class, and the accredited provider confirms.',
    links: ['apartments-and-units'],
    isNoteOnly: true,
  },
  {
    id: 'G-SCHED',
    section: 'global',
    branch: 'business',
    programGroup: 'veu',
    title: 'ESC Register of Scheduled Activity Premises exclusion',
    when: (a) => a.S1 === 'business' && a.B4 === 'yes-not-opted-in',
    status: 'not-eligible',
    figureIds: [],
    messageId: 'N-SCHED',
    sourceIds: ['energyvic-businesses', 'esc-scheduled-premises'],
    why: 'Large energy-consuming sites listed on the ESC Register of Scheduled Activity Premises cannot participate in VEU unless opted in.',
    links: ['business-hub'],
    isNoteOnly: true,
  },
  {
    id: 'G-SCAM',
    section: 'global',
    branch: 'shared',
    programGroup: 'veu',
    title: 'Cold-call and telemarketing rules',
    when: (_a, area) => area !== null,
    status: 'info',
    figureIds: [],
    sourceIds: ['esc-cold-call-bans'],
    why: 'Unsolicited VEU telemarketing and doorknocking are banned in Victoria; check how to spot cold-call scams.',
    links: ['veu-scams'],
    isNoteOnly: true,
  },

  // =========================================================================
  // §5.2 Residential rules (43 rules)
  // =========================================================================
  {
    id: 'RH-1',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Heating and cooling: room gas heater to split system',
    when: (a) =>
      hasResUpgrade(a, 'heating-cooling') &&
      a.H1 === 'gas-room-heater' &&
      (a.H2 === 'split-one-room' || a.H2 === 'several-splits-or-multi-split'),
    status: 'likely',
    figureIds: ['vic-veu-rcac-room-gas'],
    coPayFigureIds: ['vic-veu-copay-split-under-10kw'],
    sourceIds: ['energyvic-heating-cooling', 'vic-veu-spec-v25'],
    why: 'Replacing a non-ducted room gas heater with an efficient reverse-cycle air conditioner.',
    links: ['find-provider', 'guide-gas-room-to-split'],
    isReplacement: true,
    isInstalledProduct: true,
  },
  {
    id: 'RH-2',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Heating and cooling: ducted gas to ducted reverse-cycle',
    when: (a) =>
      hasResUpgrade(a, 'heating-cooling') &&
      a.H1 === 'ducted-gas-heater' &&
      a.H2 === 'ducted-reverse-cycle',
    status: 'likely',
    figureIds: [
      'vic-veu-rcac-ducted-gas-10kw',
      'vic-veu-rcac-ducted-gas-16kw',
      'vic-veu-rcac-ducted-gas-22kw',
    ],
    coPayFigureIds: ['vic-veu-copay-ducted'],
    sourceIds: ['energyvic-heating-cooling', 'vic-veu-spec-v25'],
    why: 'Replacing a ducted gas heater with a ducted reverse-cycle air conditioner across Energy Victoria size examples.',
    links: ['find-provider', 'guide-ducted-gas-to-ducted', 'veu-copayment'],
    isReplacement: true,
    isInstalledProduct: true,
  },
  {
    id: 'RH-3',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Heating and cooling: ducted gas to split or multi-split systems',
    when: (a) =>
      hasResUpgrade(a, 'heating-cooling') &&
      a.H1 === 'ducted-gas-heater' &&
      (a.H2 === 'several-splits-or-multi-split' || a.H2 === 'split-one-room'),
    status: 'likely',
    figureIds: ['vic-veu-rcac-ducted-gas-4splits', 'vic-veu-rcac-ducted-gas-multisplit'],
    coPayFigureIds: [
      'vic-veu-copay-multisplit-under-10kw',
      'vic-veu-copay-multisplit-10kw-plus',
    ],
    resolveCoPayFigureIds: (a) => {
      if (a.H3 === 'under-10-kw') return ['vic-veu-copay-multisplit-under-10kw'];
      if (a.H3 === '10-kw-or-more') return ['vic-veu-copay-multisplit-10kw-plus'];
      return ['vic-veu-copay-multisplit-under-10kw', 'vic-veu-copay-multisplit-10kw-plus'];
    },
    sourceIds: ['energyvic-heating-cooling', 'vic-veu-spec-v25'],
    why: 'Replacing a ducted gas heater with room split systems or a multi-split reverse-cycle system.',
    links: ['find-provider', 'guide-ducted-gas-to-splits', 'veu-copayment'],
    isReplacement: true,
    isInstalledProduct: true,
  },
  {
    id: 'RH-4',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Heating and cooling: hard-wired electric heater to split system',
    when: (a) =>
      hasResUpgrade(a, 'heating-cooling') &&
      a.H1 === 'hard-wired-electric-room-heater' &&
      a.H2 !== 'ducted-reverse-cycle',
    status: 'likely',
    figureIds: ['vic-veu-rcac-hardwired-electric'],
    coPayFigureIds: ['vic-veu-copay-split-under-10kw'],
    sourceIds: ['energyvic-heating-cooling', 'vic-veu-spec-v25'],
    why: 'Replacing a hard-wired electric room heater with an efficient split-system air conditioner.',
    links: ['find-provider', 'guide-electric-to-rcac'],
    isReplacement: true,
    isInstalledProduct: true,
  },
  {
    id: 'RH-5',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Heating and cooling: central electric ducted heater to ducted reverse-cycle',
    when: (a) =>
      hasResUpgrade(a, 'heating-cooling') &&
      a.H1 === 'central-electric-ducted-heater' &&
      a.H2 === 'ducted-reverse-cycle',
    status: 'likely',
    figureIds: ['vic-veu-rcac-central-electric-ducted'],
    coPayFigureIds: ['vic-veu-copay-ducted'],
    sourceIds: ['energyvic-heating-cooling', 'vic-veu-spec-v25'],
    why: 'Replacing a central electric resistance ducted heater with a ducted reverse-cycle system.',
    links: ['find-provider', 'guide-electric-to-rcac', 'veu-copayment'],
    isReplacement: true,
    isInstalledProduct: true,
  },
  {
    id: 'RH-6',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Heating and cooling: older room reverse-cycle to new split system',
    when: (a) =>
      hasResUpgrade(a, 'heating-cooling') &&
      a.H1 === 'reverse-cycle-split-room-unit' &&
      a.H2 !== 'ducted-reverse-cycle',
    status: 'likely',
    figureIds: ['vic-veu-rcac-split-replaced'],
    coPayFigureIds: ['vic-veu-copay-split-under-10kw'],
    sourceIds: ['energyvic-heating-cooling', 'vic-veu-spec-v25'],
    why: 'Upgrading an older non-ducted reverse-cycle unit to a new high-efficiency split system.',
    links: ['find-provider', 'guide-ac-rebate'],
    isReplacement: true,
    isInstalledProduct: true,
  },
  {
    id: 'RH-7',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Heating and cooling: existing ducted reverse-cycle replacement',
    when: (a) =>
      hasResUpgrade(a, 'heating-cooling') &&
      a.H1 === 'ducted-reverse-cycle' &&
      a.H2 === 'ducted-reverse-cycle',
    status: 'likely',
    figureIds: [
      'vic-veu-rcac-replaced-10kw',
      'vic-veu-rcac-replaced-16kw',
      'vic-veu-rcac-replaced-22kw',
    ],
    coPayFigureIds: ['vic-veu-copay-ducted'],
    sourceIds: ['energyvic-heating-cooling', 'vic-veu-spec-v25'],
    why: 'Replacing an existing ducted reverse-cycle air conditioner across Energy Victoria size bands.',
    links: ['find-provider', 'guide-ac-rebate', 'veu-copayment'],
    isReplacement: true,
    isInstalledProduct: true,
  },
  {
    id: 'RH-8',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Heating and cooling: installation without decommissioning a fixed heater',
    when: (a) => {
      if (!hasResUpgrade(a, 'heating-cooling')) return false;
      if (a.H1 === 'nothing-portable-only' || a.H1 === 'not-sure') return true;
      // Fallback combinations not covered by RH-1..RH-7 (e.g. gas room heater -> ducted, split -> ducted)
      if (a.H1 === 'gas-room-heater' && a.H2 === 'ducted-reverse-cycle') return true;
      if (a.H1 === 'hard-wired-electric-room-heater' && a.H2 === 'ducted-reverse-cycle') return true;
      if (a.H1 === 'central-electric-ducted-heater' && a.H2 !== 'ducted-reverse-cycle') return true;
      if (a.H1 === 'reverse-cycle-split-room-unit' && a.H2 === 'ducted-reverse-cycle') return true;
      if (a.H1 === 'ducted-reverse-cycle' && a.H2 !== 'ducted-reverse-cycle') return true;
      return false;
    },
    status: 'possibly',
    figureIds: ['vic-veu-rcac-room-no-decomm', 'vic-veu-rcac-ducted-no-decomm'],
    resolveFigureIds: (a) => {
      if (a.H2 === 'ducted-reverse-cycle') return ['vic-veu-rcac-ducted-no-decomm'];
      if (a.H2 === 'split-one-room') return ['vic-veu-rcac-room-no-decomm'];
      return ['vic-veu-rcac-room-no-decomm', 'vic-veu-rcac-ducted-no-decomm'];
    },
    coPayFigureIds: [
      'vic-veu-copay-split-under-10kw',
      'vic-veu-copay-multisplit-under-10kw',
      'vic-veu-copay-multisplit-10kw-plus',
      'vic-veu-copay-ducted',
    ],
    resolveCoPayFigureIds: (a) => {
      if (a.H2 === 'ducted-reverse-cycle') return ['vic-veu-copay-ducted'];
      if (a.H2 === 'several-splits-or-multi-split') {
        if (a.H3 === 'under-10-kw') return ['vic-veu-copay-multisplit-under-10kw'];
        if (a.H3 === '10-kw-or-more') return ['vic-veu-copay-multisplit-10kw-plus'];
        return ['vic-veu-copay-multisplit-under-10kw', 'vic-veu-copay-multisplit-10kw-plus'];
      }
      return ['vic-veu-copay-split-under-10kw'];
    },
    sourceIds: ['energyvic-heating-cooling', 'vic-veu-spec-v25'],
    why: 'Installing a reverse-cycle system without decommissioning a matching fixed heater attracts a smaller VEU discount that the provider confirms.',
    links: ['find-provider', 'guide-ac-rebate'],
    isReplacement: true,
    isInstalledProduct: true,
  },
  {
    id: 'RH-9',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Rental heating replacement rule from 1 March 2027',
    when: (a) => hasResUpgrade(a, 'heating-cooling') && a.R3 === 'landlord',
    status: 'info',
    figureIds: [],
    sourceIds: ['energyvic-heating-cooling', 'energyvic-rental-efficiency'],
    why: 'Under rules currently legislated from 1 March 2027, a rental heater that fails in the main living area must be replaced with an efficient reverse-cycle air conditioner.',
    links: ['landlords-2027', 'find-provider'],
    isNoteOnly: true,
  },

  // Hot water
  {
    id: 'RW-1',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Hot water: mains gas to heat pump',
    when: (a) =>
      hasResUpgrade(a, 'hot-water') &&
      a.W1 === 'gas-mains' &&
      (a.W3 === 'heat-pump' || a.W3 === 'not-sure' || a.W3 === undefined),
    status: 'likely',
    figureIds: ['vic-veu-hw-gas-to-heatpump'],
    coPayFigureIds: ['vic-veu-hw-min-contribution'],
    sourceIds: ['energyvic-hot-water'],
    why: 'Replacing an existing mains-gas water heater with an approved heat pump water heater.',
    links: ['find-provider', 'guide-gas-hw-to-hp'],
    isReplacement: true,
    isInstalledProduct: true,
  },
  {
    id: 'RW-2',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Hot water: mains gas to solar-boosted water heater',
    when: (a) =>
      hasResUpgrade(a, 'hot-water') &&
      a.W1 === 'gas-mains' &&
      (a.W3 === 'solar-boosted' || a.W3 === 'not-sure'),
    status: 'likely',
    figureIds: ['vic-veu-hw-gas-to-solar'],
    coPayFigureIds: ['vic-veu-hw-min-contribution'],
    sourceIds: ['energyvic-hot-water'],
    why: 'Replacing an existing mains-gas water heater with a solar-boosted hot water system.',
    links: ['find-provider', 'guide-gas-hw-to-hp'],
    isReplacement: true,
    isInstalledProduct: true,
  },
  {
    id: 'RW-3',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Hot water: electric storage tank to heat pump',
    when: (a) =>
      hasResUpgrade(a, 'hot-water') &&
      a.W1 === 'electric-storage' &&
      (a.W3 === 'heat-pump' || a.W3 === 'not-sure' || a.W3 === undefined),
    status: 'likely',
    figureIds: ['vic-veu-hw-electric-to-heatpump'],
    coPayFigureIds: ['vic-veu-hw-min-contribution'],
    sourceIds: ['energyvic-hot-water'],
    why: 'Replacing an electric resistance storage water heater with a heat pump water heater.',
    links: ['find-provider', 'guide-electric-hw-to-hp'],
    isReplacement: true,
    isInstalledProduct: true,
  },
  {
    id: 'RW-4',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Hot water: electric storage tank to solar-boosted water heater',
    when: (a) =>
      hasResUpgrade(a, 'hot-water') &&
      a.W1 === 'electric-storage' &&
      (a.W3 === 'solar-boosted' || a.W3 === 'not-sure'),
    status: 'likely',
    figureIds: ['vic-veu-hw-electric-to-solar'],
    coPayFigureIds: ['vic-veu-hw-min-contribution'],
    sourceIds: ['energyvic-hot-water'],
    why: 'Replacing an electric resistance storage water heater with a solar-boosted hot water system.',
    links: ['find-provider', 'guide-electric-hw-to-hp'],
    isReplacement: true,
    isInstalledProduct: true,
  },
  {
    id: 'RW-5',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Hot water: broken or out-of-warranty solar water heater replacement',
    when: (a) =>
      hasResUpgrade(a, 'hot-water') && (a.W1 === 'solar-broken' || a.W1 === 'not-sure'),
    status: 'possibly',
    figureIds: [
      'vic-veu-hw-gas-to-heatpump',
      'vic-veu-hw-electric-to-heatpump',
      'vic-veu-hw-gas-to-solar',
      'vic-veu-hw-electric-to-solar',
    ],
    resolveFigureIds: (a) => {
      if (a.W3 === 'solar-boosted') {
        return ['vic-veu-hw-gas-to-solar', 'vic-veu-hw-electric-to-solar'];
      }
      return ['vic-veu-hw-gas-to-heatpump', 'vic-veu-hw-electric-to-heatpump'];
    },
    coPayFigureIds: ['vic-veu-hw-min-contribution'],
    sourceIds: ['energyvic-hot-water'],
    why: 'Some broken gas-boosted and electric-boosted solar water heaters count under the gas or electric replacement table; your provider confirms.',
    links: ['find-provider', 'guide-solar-hw'],
    isReplacement: true,
    isInstalledProduct: true,
  },
  {
    id: 'RW-6',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Hot water: bottled LPG water heater replacement',
    when: (a) => hasResUpgrade(a, 'hot-water') && a.W1 === 'lpg',
    status: 'possibly',
    figureIds: [],
    coPayFigureIds: ['vic-veu-hw-min-contribution'],
    sourceIds: ['vic-veu-spec-v25', 'energyvic-hot-water'],
    why: 'VEU Specifications Part 3 covers gas or LPG water heaters, while Energy Victoria publishes only a mains-gas figure, so your accredited provider confirms the discount.',
    links: ['find-provider', 'guide-gas-hw-to-hp'],
    isReplacement: true,
    isInstalledProduct: true,
  },
  {
    id: 'RW-7',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Hot water: existing system already efficient',
    when: (a) => hasResUpgrade(a, 'hot-water') && isEfficientExistingHw(a.W1),
    status: 'not-eligible',
    figureIds: [],
    messageId: 'N-HW-EFF',
    sourceIds: ['energyvic-hot-water'],
    why: 'Working solar and heat pump hot water units are already efficient systems and are not covered for a VEU replacement discount.',
    links: ['guide-gas-hw-to-hp'],
  },
  {
    id: 'RW-8',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Failed mains-gas water heater rule from 1 March 2027',
    when: (a) => hasResUpgrade(a, 'hot-water') && a.W1 === 'gas-mains' && a.W2 === 'yes',
    status: 'info',
    figureIds: [],
    sourceIds: ['energyvic-hot-water', 'austlii-reg-45e'],
    why: 'Under rules currently legislated from 1 March 2027, a failed mains-gas water heater in an existing home must be replaced with an electric system; before then you can still choose.',
    links: ['gas-hw-broken-2027', 'gas-hw-ban-exemptions'],
    isNoteOnly: true,
  },
  {
    id: 'RW-9',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Household hot water system limit and warranty',
    when: (a) => hasResUpgrade(a, 'hot-water') && !isEfficientExistingHw(a.W1),
    status: 'info',
    figureIds: [],
    sourceIds: ['energyvic-hot-water'],
    why: 'Households can upgrade up to two hot water systems under VEU, and a five-year minimum product warranty applies.',
    links: ['guide-heat-pump'],
    isNoteOnly: true,
  },

  // Cooktop
  {
    id: 'RC-1',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Induction cooktop replacing gas or LPG',
    when: (a) =>
      hasResUpgrade(a, 'cooktop') && (a.C1 === 'gas-mains' || a.C1 === 'lpg'),
    status: 'likely',
    figureIds: ['vic-veu-induction', 'vic-gas-supply-saving'],
    resolveFigureIds: (a) => {
      const alsoLeavingGas =
        a.C1 === 'gas-mains' &&
        Boolean(a.R6?.includes('heating-cooling')) &&
        Boolean(a.R6?.includes('hot-water'));
      return alsoLeavingGas
        ? ['vic-veu-induction', 'vic-gas-supply-saving']
        : ['vic-veu-induction'];
    },
    coPayFigureIds: ['vic-veu-copay-induction'],
    sourceIds: ['energyvic-induction', 'vic-veu-spec-v25'],
    why: 'Replacing an existing mains-gas or LPG cooktop with an approved induction cooktop.',
    links: ['find-provider', 'guide-cooktop-induction'],
    isInstalledProduct: true,
  },
  {
    id: 'RC-2',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Cooktop: existing electric or induction unit',
    when: (a) =>
      hasResUpgrade(a, 'cooktop') && (a.C1 === 'electric' || a.C1 === 'already-induction'),
    status: 'not-eligible',
    figureIds: [],
    messageId: 'N-COOK',
    sourceIds: ['energyvic-induction', 'vic-veu-spec-v25'],
    why: 'The VEU induction cooktop activity applies only where a mains-gas or LPG connection is present.',
    links: ['guide-cooktop-induction'],
  },

  // Ceiling insulation
  {
    id: 'RI-1',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Ceiling insulation for uninsulated or under-insulated ceilings',
    when: (a) =>
      hasResUpgrade(a, 'ceiling-insulation') &&
      a.R4 !== 'apartment' &&
      (a.I1 === 'nothing' || a.I1 === 'thin-or-patchy') &&
      a.I2 !== 'yes',
    status: 'likely',
    figureIds: [
      'vic-veu-insulation-metro',
      'vic-veu-insulation-regional',
      'vic-veu-insulation-est-regional-mild',
      'vic-veu-insulation-est-metro-cold',
      'vic-veu-insulation-est-regional-hot',
    ],
    resolveFigureIds: (_a, area) => {
      const figId = resolveInsulationFigureId(area);
      return figId ? [figId] : [];
    },
    coPayFigureIds: ['vic-veu-copay-insulation'],
    sourceIds: ['energyvic-insulation', 'vic-veu-spec-v25'],
    why: 'Adding ceiling insulation where none is present or existing insulation is below R2.0, subject to a pre-installation electrical safety assessment.',
    links: ['find-provider', 'guide-ceiling-insulation'],
    isInstalledProduct: true,
  },
  {
    id: 'RI-2',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Ceiling insulation: halogen downlights or wiring issue first',
    when: (a) =>
      hasResUpgrade(a, 'ceiling-insulation') &&
      a.R4 !== 'apartment' &&
      (a.I1 === 'nothing' || a.I1 === 'thin-or-patchy' || a.I1 === 'not-sure') &&
      a.I2 === 'yes',
    status: 'not-eligible',
    figureIds: [],
    messageId: 'N-INS-SAFE',
    sourceIds: ['energyvic-insulation', 'vic-veu-spec-v25'],
    why: 'Halogen downlights or unsafe ceiling wiring must be rectified by a licensed electrician before ceiling insulation can proceed.',
    links: ['guide-ceiling-insulation'],
  },
  {
    id: 'RI-3',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Ceiling insulation: already well insulated',
    when: (a) =>
      hasResUpgrade(a, 'ceiling-insulation') && a.R4 !== 'apartment' && a.I1 === 'thick',
    status: 'not-eligible',
    figureIds: [],
    messageId: 'N-INS-R2',
    sourceIds: ['energyvic-insulation', 'vic-veu-spec-v25'],
    why: 'Ceilings that already have thick, well-fitted insulation at or above R2.0 are outside the VEU ceiling insulation activity.',
    links: ['guide-ceiling-insulation'],
  },
  {
    id: 'RI-4',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Ceiling insulation: ceiling depth to be checked by assessor',
    when: (a) =>
      hasResUpgrade(a, 'ceiling-insulation') &&
      a.R4 !== 'apartment' &&
      a.I1 === 'not-sure' &&
      a.I2 !== 'yes',
    status: 'possibly',
    figureIds: [
      'vic-veu-insulation-metro',
      'vic-veu-insulation-regional',
      'vic-veu-insulation-est-regional-mild',
      'vic-veu-insulation-est-metro-cold',
      'vic-veu-insulation-est-regional-hot',
    ],
    resolveFigureIds: (_a, area) => {
      const figId = resolveInsulationFigureId(area);
      return figId ? [figId] : [];
    },
    coPayFigureIds: ['vic-veu-copay-insulation'],
    sourceIds: ['energyvic-insulation', 'vic-veu-spec-v25'],
    why: 'An accredited provider inspects your ceiling depth and electrical safety before confirming the ceiling insulation discount.',
    links: ['find-provider', 'guide-ceiling-insulation'],
    isInstalledProduct: true,
  },
  {
    id: 'RI-5',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Rental ceiling insulation standard from 1 March 2027',
    when: (a) => hasResUpgrade(a, 'ceiling-insulation') && a.R3 === 'landlord',
    status: 'info',
    figureIds: [],
    sourceIds: ['energyvic-rental-efficiency'],
    why: 'Under rules currently legislated from 1 March 2027, rentals entering a new lease require R5.0 ceiling insulation where no ceiling insulation is present.',
    links: ['landlords-2027'],
    isNoteOnly: true,
  },
  {
    id: 'I-APT',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Ceiling insulation in apartments and multi-storey units',
    when: (a) => hasResUpgrade(a, 'ceiling-insulation') && a.R4 === 'apartment',
    status: 'possibly',
    figureIds: [],
    sourceIds: ['energyvic-insulation', 'energyvic-renters-landlords'],
    why: 'Applies only if your unit has an accessible ceiling space directly beneath the roof; your accredited provider confirms.',
    links: ['apartments-and-units', 'guide-ceiling-insulation'],
    isInstalledProduct: true,
  },

  // Weather sealing (draught-proofing)
  {
    id: 'RD-1',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Weather sealing (draught-proofing)',
    when: (a) => hasResUpgrade(a, 'draughts') && a.R3 !== 'building-it',
    status: 'likely',
    figureIds: [
      'vic-veu-sealing-apartment-2yr',
      'vic-veu-sealing-apartment-5yr',
      'vic-veu-sealing-townhouse-2yr',
      'vic-veu-sealing-townhouse-5yr',
      'vic-veu-sealing-house-2yr',
      'vic-veu-sealing-house-5yr',
    ],
    resolveFigureIds: (a) => {
      if (a.R4 === 'apartment') {
        return ['vic-veu-sealing-apartment-2yr', 'vic-veu-sealing-apartment-5yr'];
      }
      if (a.R4 === 'house-or-townhouse') {
        return [
          'vic-veu-sealing-townhouse-2yr',
          'vic-veu-sealing-townhouse-5yr',
          'vic-veu-sealing-house-2yr',
          'vic-veu-sealing-house-5yr',
        ];
      }
      return [
        'vic-veu-sealing-apartment-2yr',
        'vic-veu-sealing-apartment-5yr',
        'vic-veu-sealing-townhouse-2yr',
        'vic-veu-sealing-townhouse-5yr',
        'vic-veu-sealing-house-2yr',
        'vic-veu-sealing-house-5yr',
      ];
    },
    sourceIds: ['energyvic-weather-sealing'],
    why: 'Sealing external doors, windows, exhaust fans and vents using two-year or five-year minimum warranty products; private renters can also take part.',
    links: ['find-provider', 'guide-draught-proofing'],
    isInstalledProduct: true,
  },
  {
    id: 'RD-2',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Weather sealing gas-appliance safety check',
    when: (a) => {
      if (!hasResUpgrade(a, 'draughts') || a.R3 === 'building-it') return false;
      if (!a.R6?.includes('heating-cooling') || !a.H1) return true;
      return (
        a.H1 === 'ducted-gas-heater' ||
        a.H1 === 'gas-room-heater' ||
        a.H1 === 'not-sure'
      );
    },
    status: 'info',
    figureIds: [],
    messageId: 'N-SEAL-GAS',
    sourceIds: ['energyvic-weather-sealing'],
    why: 'Homes with open-flued or flueless gas heaters or an indoor open-flued water heater cannot receive weather sealing because of carbon monoxide risk.',
    links: ['guide-draught-proofing'],
    isNoteOnly: true,
  },

  // Window glazing
  {
    id: 'RG-1',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Window glazing upgrade for single-glazed windows',
    when: (a) =>
      hasResUpgrade(a, 'windows') &&
      (a.G1 === 'yes' || a.G1 === 'some' || a.G1 === 'not-sure'),
    status: 'likely',
    figureIds: ['vic-veu-glazing-double'],
    sourceIds: ['energyvic-window-glazing'],
    why: 'Upgrading single-glazed windows to approved double glazing or secondary glazing.',
    links: ['find-provider', 'guide-draught-proofing'],
    isInstalledProduct: true,
  },
  {
    id: 'RG-2',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Window glazing: windows already double-glazed',
    when: (a) => hasResUpgrade(a, 'windows') && a.G1 === 'no',
    status: 'not-eligible',
    figureIds: [],
    messageId: 'N-GLAZE',
    sourceIds: ['energyvic-window-glazing'],
    why: 'Window glazing VEU discounts apply only when upgrading existing single-glazed windows.',
    links: ['guide-draught-proofing'],
  },

  // Appliances
  {
    id: 'RA-1',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Appliance discounts (dryer, fridge or freezer, TV, shower head, energy display)',
    when: (a) =>
      hasResUpgrade(a, 'appliances') &&
      a.R3 !== 'building-it' &&
      (a.A1?.length ?? 0) > 0,
    status: 'likely',
    figureIds: [
      'vic-veu-appliance-dryer',
      'vic-veu-appliance-fridge',
      'vic-veu-appliance-tv',
      'vic-veu-appliance-showerhead',
      'vic-veu-appliance-ihd',
    ],
    resolveFigureIds: (a) => {
      const map: Record<NonNullable<CheckerAnswers['A1']>[number], string> = {
        'heat-pump-clothes-dryer': 'vic-veu-appliance-dryer',
        'fridge-or-freezer': 'vic-veu-appliance-fridge',
        tv: 'vic-veu-appliance-tv',
        'shower-head': 'vic-veu-appliance-showerhead',
        'in-home-energy-display': 'vic-veu-appliance-ihd',
      };
      return (a.A1 ?? []).map((item) => map[item]).filter(Boolean);
    },
    sourceIds: ['energyvic-veu-products', 'energyvic-fridge-freezer', 'esc-veu-activities'],
    why: 'Purchasing or installing approved high-efficiency household appliances through participating VEU retailers or providers.',
    links: ['find-provider'],
  },

  // Solar Homes (Victoria)
  {
    id: 'SH-HW',
    section: 'residential',
    branch: 'residential',
    programGroup: 'solar-homes',
    title: 'Solar Homes hot water rebate (Solar Victoria)',
    when: (a) => shHwConditionsPass(a),
    status: 'likely',
    figureIds: [
      'vic-solar-homes-hw-rebate',
      'vic-solar-homes-hw-rebate-local',
      'vic-hw-combined-solar-homes',
      'vic-hw-combined-solar-homes-local',
    ],
    sourceIds: ['solarvic-hot-water-rebate', 'solarvic-income-cap-news', 'energyvic-hot-water'],
    why: 'Solar Homes hot water rebate applied after VEU discounts where income, property value, address history and system age rules are met; obtain Solar Victoria approval before installation.',
    links: ['solarvic-hw-external', 'veu-vs-solar-homes'],
  },
  {
    id: 'SH-HW-X',
    section: 'residential',
    branch: 'residential',
    programGroup: 'solar-homes',
    title: 'Solar Homes hot water rebate: criteria not met',
    when: (a) =>
      hasResUpgrade(a, 'hot-water') &&
      !isEfficientExistingHw(a.W1) &&
      !shHwConditionsPass(a),
    status: 'not-eligible',
    figureIds: [],
    messageId: 'N-SH-INC',
    resolveMessageId: (a) => resolveShHwFailureMessage(a),
    sourceIds: ['solarvic-hot-water-rebate', 'solarvic-income-cap-news'],
    why: 'One or more Solar Victoria hot water rebate rules did not match, though VEU hot water discounts have no income cap and still stand.',
    links: ['veu-vs-solar-homes'],
  },
  {
    id: 'SH-PV',
    section: 'residential',
    branch: 'residential',
    programGroup: 'solar-homes',
    title: 'Solar Homes solar panel (PV) rebate (Solar Victoria)',
    when: (a) => shPvConditionsPass(a),
    status: 'likely',
    figureIds: ['vic-solar-homes-pv-rebate'],
    sourceIds: ['solarvic-pv-rebate', 'solarvic-pv-into-veu', 'solarvic-income-cap-news'],
    why: 'Solar Homes solar panel rebate plus optional matching interest-free loan with approval required before installation; solar PV support transitions into VEU from 1 July 2027 after current rebates run to 30 June 2027.',
    links: ['solarvic-pv-external', 'veu-vs-solar-homes'],
  },
  {
    id: 'SH-PV-L',
    section: 'residential',
    branch: 'residential',
    programGroup: 'solar-homes',
    title: 'Solar Homes solar panel rebate for rental properties',
    when: (a) =>
      hasResUpgrade(a, 'solar-panels') &&
      a.R3 === 'landlord' &&
      a.P1 !== 'yes' &&
      (a.R2a === 'yes' || a.SH1 !== 'no') &&
      a.SH2 !== 'no' &&
      a.SH3 !== 'yes',
    status: 'possibly',
    figureIds: [],
    sourceIds: ['solarvic-pv-rebate', 'solarvic-income-cap-news'],
    why: 'Solar Victoria offers a rental solar panel rebate for qualifying tenanted homes subject to the household income cap; see Solar Victoria for landlord and tenant criteria.',
    links: ['solarvic-pv-external', 'veu-vs-solar-homes'],
  },
  {
    id: 'SH-PV-X',
    section: 'residential',
    branch: 'residential',
    programGroup: 'solar-homes',
    title: 'Solar Homes solar panel rebate: criteria not met',
    when: (a) => {
      if (!hasResUpgrade(a, 'solar-panels')) return false;
      if (shPvConditionsPass(a)) return false;
      if (
        a.R3 === 'landlord' &&
        a.P1 !== 'yes' &&
        (a.R2a === 'yes' || a.SH1 !== 'no') &&
        a.SH2 !== 'no' &&
        a.SH3 !== 'yes'
      ) {
        return false;
      }
      return true;
    },
    status: 'not-eligible',
    figureIds: [],
    messageId: 'N-PV-10Y',
    resolveMessageId: (a) => resolveShPvFailureMessage(a),
    sourceIds: ['solarvic-pv-rebate', 'solarvic-income-cap-news'],
    why: 'One or more Solar Victoria solar panel rebate requirements did not match for this property.',
    links: ['veu-vs-solar-homes'],
  },

  // Federal (residential)
  {
    id: 'FED-BAT',
    section: 'residential',
    branch: 'residential',
    programGroup: 'federal',
    title: 'Cheaper Home Batteries Program (FEDERAL)',
    when: (a) =>
      hasResUpgrade(a, 'home-battery') &&
      (a.BT1 === 'have-solar' || a.BT1 === 'adding-solar-now'),
    status: 'likely',
    figureIds: [
      'fed-battery-discount-pct',
      'fed-battery-size-kwh',
      'fed-battery-taper-0-14kwh',
      'fed-battery-taper-14-28kwh',
      'fed-battery-taper-28-50kwh',
    ],
    sourceIds: ['dcceew-cheaper-home-batteries', 'cer-battery-changes-may-2026'],
    why: 'Federal Small-scale Renewable Energy Scheme battery discount for solar-connected small-scale batteries installed by an accredited installer, with capacity tapering since 1 May 2026.',
    links: ['dcceew-battery-external', 'veu-vs-solar-homes'],
    isInstalledProduct: true,
  },
  {
    id: 'FED-BAT-X',
    section: 'residential',
    branch: 'residential',
    programGroup: 'federal',
    title: 'Cheaper Home Batteries Program: solar connection required',
    when: (a) => hasResUpgrade(a, 'home-battery') && a.BT1 === 'no-solar',
    status: 'not-eligible',
    figureIds: [],
    messageId: 'N-BAT-SOLAR',
    sourceIds: ['dcceew-cheaper-home-batteries'],
    why: 'Small-scale battery STCs require connection to new or existing rooftop solar panels.',
    links: ['veu-vs-solar-homes'],
  },
  {
    id: 'FED-STC',
    section: 'residential',
    branch: 'residential',
    programGroup: 'federal',
    title: 'Federal small-scale technology certificates (STCs) on hot water',
    when: (a) =>
      hasResUpgrade(a, 'hot-water') &&
      !isEfficientExistingHw(a.W1) &&
      (a.W3 === 'heat-pump' || a.W3 === 'solar-boosted' || a.W3 === 'not-sure'),
    status: 'info',
    figureIds: [],
    sourceIds: ['cer-heat-pumps'],
    why: 'Small-scale technology certificates may also reduce the upfront price for Clean Energy Regulator listed heat pumps under 425 L and solar water heaters, applied by your installer.',
    links: ['veu-vs-solar-homes'],
  },

  // Location & network residential banners/modifiers
  {
    id: 'SOL-1',
    section: 'residential',
    branch: 'residential',
    programGroup: 'solar-homes',
    title: 'Solstice compressed natural gas network exemptions',
    when: (a) => a.S1 === 'residential' && a.R2a === 'yes',
    status: 'info',
    figureIds: ['vic-solstice-topup'],
    sourceIds: ['solarvic-solstice'],
    why: 'Impacted Solstice CNG customers have no Solar Victoria income cap, can replace hot water systems of any age, include rental providers, and have access to a Solar Victoria top-up where VEU criteria are not met.',
    links: ['solstice-towns', 'get-off-gas-planner'],
    isNoteOnly: true,
  },
  {
    id: 'SOL-2',
    section: 'residential',
    branch: 'residential',
    programGroup: 'solar-homes',
    title: 'Solstice top-up where VEU building-age rules are not met',
    when: (a) =>
      a.S1 === 'residential' &&
      a.R2a === 'yes' &&
      a.R5 === 'no' &&
      (Boolean(a.R6?.includes('heating-cooling')) || Boolean(a.R6?.includes('hot-water'))),
    status: 'possibly',
    figureIds: ['vic-solstice-topup'],
    sourceIds: ['solarvic-solstice'],
    why: 'Because your home is under two years old and misses standard VEU replacement age rules, the Solar Victoria Solstice top-up may apply instead.',
    links: ['solstice-towns', 'get-off-gas-planner'],
  },
  {
    id: 'GAS-NO',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Postcode listed without reticulated mains gas',
    when: (a, area) =>
      a.S1 === 'residential' &&
      area !== null &&
      !area.reticulated_gas &&
      (a.W1 === 'gas-mains' ||
        a.C1 === 'gas-mains' ||
        a.H1 === 'ducted-gas-heater' ||
        a.H1 === 'gas-room-heater'),
    status: 'info',
    figureIds: [],
    sourceIds: ['vic-veu-spec-v25'],
    why: 'Your postcode is listed in VEU Table A as having no reticulated mains gas; check whether your appliance runs on bottled LPG.',
    links: ['gas-no-lpg'],
    isNoteOnly: true,
  },
  {
    id: 'HPZ-5',
    section: 'residential',
    branch: 'residential',
    programGroup: 'veu',
    title: 'Heat pump zone 5 postcode calculation',
    when: (a, area) =>
      hasResUpgrade(a, 'hot-water') && area !== null && area.heat_pump_zone === 5,
    status: 'info',
    figureIds: [],
    sourceIds: ['vic-veu-spec-v25'],
    why: 'Your postcode sits in colder heat pump zone 5, so VEU hot water calculations use zone-5 values for your area.',
    links: ['hw-size-guide'],
    isNoteOnly: true,
  },

  // =========================================================================
  // §5.3 Business rules (24 rules)
  // =========================================================================
  {
    id: 'BH-1..7',
    section: 'business',
    branch: 'business',
    programGroup: 'veu',
    title: 'Business space heating and cooling',
    when: (a) => hasBizActivity(a, 'heating-cooling') && Boolean(a.BH1) && Boolean(a.BH2),
    status: 'likely',
    resolveStatus: (a) =>
      a.BH1 === 'nothing' || a.BH2 === 'not-sure' ? 'possibly' : 'likely',
    figureIds: [
      'vic-veu-biz-rcac-room-gas',
      'vic-veu-biz-rcac-ducted-gas-4splits',
      'vic-veu-biz-rcac-ducted-gas-multisplit',
      'vic-veu-biz-rcac-ducted-gas-16kw',
      'vic-veu-biz-rcac-ducted-gas-25kw',
      'vic-veu-biz-rcac-ducted-gas-32kw',
      'vic-veu-biz-rcac-ducted-gas-56kw',
      'vic-veu-biz-rcac-central-electric-ducted',
      'vic-veu-biz-rcac-replaced-ducted-16kw',
      'vic-veu-biz-rcac-replaced-ducted-25kw',
      'vic-veu-biz-rcac-replaced-ducted-32kw',
      'vic-veu-biz-rcac-replaced-ducted-56kw',
      'vic-veu-biz-rcac-replaced-room',
      'vic-veu-biz-rcac-hardwired-electric',
      'vic-veu-biz-rcac-ducted-no-decomm',
      'vic-veu-biz-rcac-room-no-decomm',
    ],
    resolveFigureIds: (a) => resolveBusinessHeatingFigures(a),
    coPayFigureIds: [
      'vic-veu-copay-split-under-10kw',
      'vic-veu-copay-multisplit-under-10kw',
      'vic-veu-copay-multisplit-10kw-plus',
      'vic-veu-copay-ducted',
    ],
    resolveCoPayFigureIds: (a) => resolveBusinessHeatingCoPayFigures(a),
    sourceIds: ['energyvic-heating-cooling', 'vic-veu-spec-v25'],
    why: 'Upgrading commercial space heating and cooling under Energy Victoria business scenarios and Part 6 co-payment rules.',
    links: ['business-hub', 'business-heating-cooling', 'veu-copayment'],
    isReplacement: true,
  },
  {
    id: 'BW-1',
    section: 'business',
    branch: 'business',
    programGroup: 'veu',
    title: 'Business hot water: up to 5 standard systems',
    when: (a) =>
      hasBizActivity(a, 'hot-water') &&
      a.B3 !== 'apartment-common-areas' &&
      a.BW1 === 'household-size' &&
      (a.BW1Count ?? 1) <= 5,
    status: 'likely',
    resolveStatus: (a) =>
      a.BW2 === 'solar-broken' || a.BW2 === 'none' ? 'possibly' : 'likely',
    figureIds: [
      'vic-veu-hw-gas-to-heatpump',
      'vic-veu-hw-gas-to-solar',
      'vic-veu-hw-electric-to-heatpump',
      'vic-veu-hw-electric-to-solar',
    ],
    resolveFigureIds: (a) => {
      if (a.BW2 === 'gas') {
        return ['vic-veu-hw-gas-to-heatpump', 'vic-veu-hw-gas-to-solar'];
      }
      if (a.BW2 === 'electric') {
        return ['vic-veu-hw-electric-to-heatpump', 'vic-veu-hw-electric-to-solar'];
      }
      return [
        'vic-veu-hw-gas-to-heatpump',
        'vic-veu-hw-gas-to-solar',
        'vic-veu-hw-electric-to-heatpump',
        'vic-veu-hw-electric-to-solar',
      ];
    },
    coPayFigureIds: ['vic-veu-hw-min-contribution'],
    sourceIds: ['energyvic-hot-water'],
    why: 'Businesses can upgrade up to five household-size hot water systems at standard VEU hot water discount rates.',
    links: ['business-hub', 'business-hot-water-motors'],
    isReplacement: true,
  },
  {
    id: 'BW-2',
    section: 'business',
    branch: 'business',
    programGroup: 'veu',
    title: 'Business hot water: more than 5 household-size units',
    when: (a) =>
      hasBizActivity(a, 'hot-water') &&
      a.B3 !== 'apartment-common-areas' &&
      a.BW1 === 'household-size' &&
      (a.BW1Count ?? 1) > 5,
    status: 'possibly',
    figureIds: [],
    sourceIds: ['energyvic-hot-water'],
    why: 'Standard business hot water upgrades cover up to five systems; above five systems, ask an accredited provider about the commercial and industrial activity.',
    links: ['business-hub', 'business-hot-water-motors'],
    isReplacement: true,
  },
  {
    id: 'BW-3',
    section: 'business',
    branch: 'business',
    programGroup: 'veu',
    title: 'Business hot water: larger commercial and industrial heat pumps',
    when: (a) =>
      hasBizActivity(a, 'hot-water') &&
      (a.BW1 === 'larger-ci' || a.B3 === 'apartment-common-areas'),
    status: 'possibly',
    figureIds: [],
    coPayFigureIds: ['vic-veu-copay-business-large'],
    sourceIds: ['energyvic-hot-water', 'vic-veu-spec-v25'],
    why: 'Commercial (including multi-residential) and industrial heat pump water heaters under Part 44 have no cap on unit count and no published consumer figure; your provider quotes the discount.',
    links: ['business-hub', 'business-hot-water-motors'],
    isReplacement: true,
  },
  {
    id: 'BL-1',
    section: 'business',
    branch: 'business',
    programGroup: 'veu',
    title: 'Business lighting: indoor fluorescent tube replacement',
    when: (a) => hasBizActivity(a, 'lighting') && Boolean(a.BL1?.includes('indoor-fluorescent')),
    status: 'likely',
    resolveStatus: (a) => (a.B3 === 'apartment-common-areas' ? 'possibly' : 'likely'),
    figureIds: ['vic-veu-biz-lighting-100-tubes'],
    sourceIds: ['energyvic-lighting'],
    why: 'Replacing indoor fluorescent lighting with approved commercial LEDs under Energy Victoria example scenarios.',
    links: ['business-hub', 'business-led-lighting'],
  },
  {
    id: 'BL-2',
    section: 'business',
    branch: 'business',
    programGroup: 'veu',
    title: 'Business lighting: outdoor, car park or sports ground LED upgrade',
    when: (a) =>
      hasBizActivity(a, 'lighting') && Boolean(a.BL1?.includes('outdoor-carpark-sports')),
    status: 'likely',
    figureIds: ['vic-veu-biz-lighting-20-carpark'],
    sourceIds: ['energyvic-lighting'],
    why: 'Upgrading outdoor, car park or sports lighting to LED luminaires under Energy Victoria example scenarios.',
    links: ['business-hub', 'business-led-lighting'],
  },
  {
    id: 'BL-3',
    section: 'business',
    branch: 'business',
    programGroup: 'veu',
    title: 'Public street lighting upgrade (councils and road authorities)',
    when: (a) =>
      hasBizActivity(a, 'lighting') &&
      Boolean(a.BL1?.includes('street-lighting')) &&
      a.B3 === 'council',
    status: 'likely',
    figureIds: ['vic-veu-biz-lighting-100-street'],
    sourceIds: ['energyvic-lighting', 'vic-veu-spec-v25'],
    why: 'Upgrading council or road-authority street lights under VEU public lighting activity Part 27.',
    links: ['business-hub', 'business-led-lighting'],
  },
  {
    id: 'BL-4',
    section: 'business',
    branch: 'business',
    programGroup: 'veu',
    title: 'Business lighting: non-fluorescent indoor lights',
    when: (a) =>
      hasBizActivity(a, 'lighting') &&
      Boolean(a.BL1?.includes('indoor-other')) &&
      !a.BL1?.includes('indoor-fluorescent') &&
      !a.BL1?.includes('outdoor-carpark-sports') &&
      !(Boolean(a.BL1?.includes('street-lighting')) && a.B3 === 'council'),
    status: 'not-eligible',
    figureIds: [],
    messageId: 'N-LIGHT',
    sourceIds: ['energyvic-lighting'],
    why: 'Indoor commercial lighting upgrades apply only where existing indoor fittings are fluorescent.',
    links: ['business-hub', 'business-led-lighting'],
  },
  {
    id: 'BR-1',
    section: 'business',
    branch: 'business',
    programGroup: 'veu',
    title: 'Business refrigeration: walk-in cold room upgrade',
    when: (a) =>
      hasBizActivity(a, 'refrigeration') &&
      Boolean(a.BR1?.includes('walk-in-cold-room')) &&
      a.BR3 === 'yes' &&
      Boolean(a.BR2) &&
      a.BR2 !== 'under-4-m2',
    status: 'likely',
    figureIds: [
      'vic-veu-biz-coldroom-small',
      'vic-veu-biz-coldroom-medium',
      'vic-veu-biz-coldroom-large',
    ],
    resolveFigureIds: (a) => {
      if (a.BR2 === '4-to-9-m2') return ['vic-veu-biz-coldroom-small'];
      if (a.BR2 === 'over-9-to-under-24-m2') return ['vic-veu-biz-coldroom-medium'];
      if (a.BR2 === '24-m2-or-more') return ['vic-veu-biz-coldroom-large'];
      return [
        'vic-veu-biz-coldroom-small',
        'vic-veu-biz-coldroom-medium',
        'vic-veu-biz-coldroom-large',
      ];
    },
    coPayFigureIds: ['vic-veu-biz-coldroom-copay'],
    sourceIds: ['energyvic-cold-rooms'],
    why: 'Upgrading a qualifying walk-in cool room or freezer room with approved refrigeration controls and components.',
    links: ['business-hub', 'business-cold-rooms'],
  },
  {
    id: 'BR-2',
    section: 'business',
    branch: 'business',
    programGroup: 'veu',
    title: 'Business refrigeration: walk-in cold room size or temperature outside rules',
    when: (a) =>
      hasBizActivity(a, 'refrigeration') &&
      Boolean(a.BR1?.includes('walk-in-cold-room')) &&
      (a.BR2 === 'under-4-m2' || a.BR3 === 'no'),
    status: 'not-eligible',
    figureIds: [],
    messageId: 'N-COLD',
    sourceIds: ['energyvic-cold-rooms'],
    why: 'Walk-in cold room discounts require at least 4 m² internal floor area and chilled or freezer temperature operation.',
    links: ['business-hub', 'business-cold-rooms'],
  },
  {
    id: 'BR-3',
    section: 'business',
    branch: 'business',
    programGroup: 'veu',
    title: 'Business refrigeration: high-efficiency household-type fridge or freezer',
    when: (a) =>
      hasBizActivity(a, 'refrigeration') && Boolean(a.BR1?.includes('fridge-freezer')),
    status: 'likely',
    figureIds: ['vic-veu-appliance-fridge'],
    sourceIds: ['energyvic-fridge-freezer'],
    why: 'High-efficiency household-type refrigerators and freezers (250 to 700 L meeting star thresholds) are open to businesses as well as homes.',
    links: ['business-hub', 'business-cold-rooms'],
  },
  {
    id: 'BR-4',
    section: 'business',
    branch: 'business',
    programGroup: 'veu',
    title: 'Business refrigeration: display cabinets and refrigeration fan motors',
    when: (a) =>
      hasBizActivity(a, 'refrigeration') &&
      (Boolean(a.BR1?.includes('display-cabinets')) ||
        Boolean(a.BR1?.includes('refrigeration-fan-motors'))),
    status: 'possibly',
    figureIds: [],
    sourceIds: ['vic-veu-spec-v25'],
    why: 'Refrigerated display cabinets (Part 32) and refrigeration or ventilation fan motors (Part 33) are VEU activities with no published consumer figure; your provider confirms.',
    links: ['business-hub', 'business-cold-rooms'],
  },
  {
    id: 'BM-1',
    section: 'business',
    branch: 'business',
    programGroup: 'veu',
    title: 'Business high-efficiency motors (up to 185 kW)',
    when: (a) =>
      hasBizActivity(a, 'motors') && Boolean(a.BM1) && a.BM1 !== 'over-185-kw',
    status: 'likely',
    figureIds: [
      'vic-veu-biz-motor-15kw-premium',
      'vic-veu-biz-motor-75kw-he',
      'vic-veu-biz-motor-75kw-premium',
      'vic-veu-biz-motor-185kw-premium',
    ],
    resolveFigureIds: (a) => {
      if (a.BM1 === 'under-15-kw') return ['vic-veu-biz-motor-15kw-premium'];
      if (a.BM1 === '15-to-75-kw') {
        return [
          'vic-veu-biz-motor-15kw-premium',
          'vic-veu-biz-motor-75kw-he',
          'vic-veu-biz-motor-75kw-premium',
        ];
      }
      return [
        'vic-veu-biz-motor-75kw-he',
        'vic-veu-biz-motor-75kw-premium',
        'vic-veu-biz-motor-185kw-premium',
      ];
    },
    coPayFigureIds: ['vic-veu-biz-motor-copay'],
    sourceIds: ['energyvic-motors'],
    why: 'Installing a high-efficiency or premium-efficiency three-phase electric motor up to 185 kW.',
    links: ['business-hub', 'business-hot-water-motors'],
  },
  {
    id: 'BM-2',
    section: 'business',
    branch: 'business',
    programGroup: 'veu',
    title: 'Business motors above 185 kW (custom M&V route)',
    when: (a) => hasBizActivity(a, 'motors') && a.BM1 === 'over-185-kw',
    status: 'possibly',
    figureIds: [],
    sourceIds: ['energyvic-custom-upgrades'],
    why: 'Motors larger than the published examples can be assessed through a custom measurement and verification (M&V) upgrade.',
    links: ['energyvic-custom-external', 'business-hub', 'business-hot-water-motors'],
  },
  {
    id: 'BK-1',
    section: 'business',
    branch: 'business',
    programGroup: 'veu',
    title: 'Commercial kitchen pre-rinse spray valve',
    when: (a) => hasBizActivity(a, 'kitchen-spray-valves') && a.BK1 === 'yes',
    status: 'likely',
    figureIds: ['vic-veu-biz-prv'],
    sourceIds: ['energyvic-pre-rinse-spray-valve'],
    why: 'Replacing an existing commercial kitchen pre-rinse spray valve or fitting an approved water-efficient valve.',
    links: ['business-hub', 'business-hot-water-motors'],
  },
  {
    id: 'BK-2',
    section: 'business',
    branch: 'business',
    programGroup: 'veu',
    title: 'Commercial kitchen pre-rinse spray valve: existing valve or fitting needed',
    when: (a) => hasBizActivity(a, 'kitchen-spray-valves') && a.BK1 === 'no',
    status: 'not-eligible',
    figureIds: [],
    messageId: 'N-PRV',
    sourceIds: ['energyvic-pre-rinse-spray-valve'],
    why: 'The pre-rinse spray valve discount requires an existing pre-rinse spray valve or fitting on site.',
    links: ['business-hub', 'business-hot-water-motors'],
  },
  {
    id: 'BP-1',
    section: 'business',
    branch: 'business',
    programGroup: 'veu',
    title: 'Commercial and industrial solar PV (30 to 200 kW)',
    when: (a) =>
      hasBizActivity(a, 'solar-panels') &&
      a.B3 !== 'apartment-common-areas' &&
      (a.BP1 === '30-to-50-kw' || a.BP1 === '50-to-100-kw' || a.BP1 === '100-to-200-kw'),
    status: 'likely',
    figureIds: [
      'vic-veu-biz-solar-50kw',
      'vic-veu-biz-solar-75kw',
      'vic-veu-biz-solar-100kw',
      'vic-veu-biz-solar-150kw',
      'vic-veu-biz-solar-200kw',
      'vic-veu-biz-solar-veec-basis',
    ],
    resolveFigureIds: (a) => {
      if (a.BP1ExactKw === 50) return ['vic-veu-biz-solar-50kw', 'vic-veu-biz-solar-veec-basis'];
      if (a.BP1ExactKw === 75) return ['vic-veu-biz-solar-75kw', 'vic-veu-biz-solar-veec-basis'];
      if (a.BP1ExactKw === 100) return ['vic-veu-biz-solar-100kw', 'vic-veu-biz-solar-veec-basis'];
      if (a.BP1ExactKw === 150) return ['vic-veu-biz-solar-150kw', 'vic-veu-biz-solar-veec-basis'];
      if (a.BP1ExactKw === 200) return ['vic-veu-biz-solar-200kw', 'vic-veu-biz-solar-veec-basis'];

      if (a.BP1 === '30-to-50-kw') {
        return ['vic-veu-biz-solar-50kw', 'vic-veu-biz-solar-veec-basis'];
      }
      if (a.BP1 === '50-to-100-kw') {
        return [
          'vic-veu-biz-solar-50kw',
          'vic-veu-biz-solar-75kw',
          'vic-veu-biz-solar-100kw',
          'vic-veu-biz-solar-veec-basis',
        ];
      }
      return [
        'vic-veu-biz-solar-100kw',
        'vic-veu-biz-solar-150kw',
        'vic-veu-biz-solar-200kw',
        'vic-veu-biz-solar-veec-basis',
      ];
    },
    sourceIds: ['energyvic-solar-pv'],
    why: 'Commercial solar PV from 30 to 200 kW on non-residential premises (one system per NMI); federal STCs up to 100 kW or LGCs above 100 kW may also apply.',
    links: ['business-hub'],
  },
  {
    id: 'BP-2',
    section: 'business',
    branch: 'business',
    programGroup: 'veu',
    title: 'Commercial solar PV under 30 kW',
    when: (a) => hasBizActivity(a, 'solar-panels') && a.BP1 === 'under-30-kw',
    status: 'not-eligible',
    figureIds: [],
    messageId: 'N-PV-30',
    sourceIds: ['energyvic-solar-pv'],
    why: 'VEU commercial solar PV requires a system from 30 to 200 kW with at least a 30 kVA inverter.',
    links: ['business-hub'],
  },
  {
    id: 'BP-3',
    section: 'business',
    branch: 'business',
    programGroup: 'veu',
    title: 'Commercial solar PV above 200 kW (custom M&V route)',
    when: (a) => hasBizActivity(a, 'solar-panels') && a.BP1 === 'over-200-kw',
    status: 'possibly',
    figureIds: [],
    sourceIds: ['energyvic-solar-pv', 'energyvic-custom-upgrades'],
    why: 'Commercial solar systems above 200 kW sit outside deemed C&I solar and can be assessed through the custom M&V pathway.',
    links: ['energyvic-custom-external', 'business-hub'],
  },
  {
    id: 'BX-1',
    section: 'business',
    branch: 'business',
    programGroup: 'veu',
    title: 'Custom business upgrades (process heat, steam, boilers, industrial HVAC)',
    when: (a) => hasBizActivity(a, 'process-heat'),
    status: 'possibly',
    figureIds: [],
    sourceIds: ['energyvic-custom-upgrades'],
    why: 'Custom upgrades covering process heat and steam, industrial HVAC, refrigeration, fans, motors and renewables run via measurement and verification (M&V) with a qualified professional.',
    links: ['energyvic-custom-external', 'business-hub'],
  },
  {
    id: 'BG-1',
    section: 'business',
    branch: 'business',
    programGroup: 'veu',
    title: 'Business window glazing for single-glazed windows',
    when: (a) =>
      hasBizActivity(a, 'windows') && (a.BG1 === 'yes' || a.BG1 === 'some'),
    status: 'likely',
    figureIds: ['vic-veu-glazing-double'],
    sourceIds: ['energyvic-window-glazing'],
    why: 'Most businesses with single-glazed windows can access VEU window glazing discounts.',
    links: ['business-hub'],
  },
  {
    id: 'BB-1',
    section: 'business',
    branch: 'business',
    programGroup: 'federal',
    title: 'Business battery under Cheaper Home Batteries (FEDERAL)',
    when: (a) => hasBizActivity(a, 'battery') && a.BB1 !== 'no',
    status: 'likely',
    figureIds: [
      'fed-battery-discount-pct',
      'fed-battery-size-kwh',
      'fed-battery-taper-0-14kwh',
      'fed-battery-taper-14-28kwh',
      'fed-battery-taper-28-50kwh',
    ],
    sourceIds: ['dcceew-cheaper-home-batteries', 'cer-battery-changes-may-2026'],
    why: 'The federal Cheaper Home Batteries Program covers small businesses and community organisations installing solar-connected batteries.',
    links: ['dcceew-battery-external', 'business-hub'],
  },
  {
    id: 'B-RES-ONLY',
    section: 'business',
    branch: 'business',
    programGroup: 'veu',
    title: 'Household-only VEU activities vs non-residential clothes dryers',
    when: (a) =>
      hasBizActivity(a, 'heat-pump-dryer') ||
      hasBizActivity(a, 'household-only-inquiry') ||
      (a.S1 === 'business' && (a.BResItems?.length ?? 0) > 0),
    status: 'not-eligible',
    resolveStatus: (a) =>
      hasBizActivity(a, 'heat-pump-dryer') &&
      !hasBizActivity(a, 'household-only-inquiry') &&
      (a.BResItems?.length ?? 0) === 0
        ? 'possibly'
        : 'not-eligible',
    figureIds: ['vic-veu-appliance-dryer'],
    resolveFigureIds: (a) =>
      hasBizActivity(a, 'heat-pump-dryer') &&
      !hasBizActivity(a, 'household-only-inquiry') &&
      (a.BResItems?.length ?? 0) === 0
        ? ['vic-veu-appliance-dryer']
        : [],
    messageId: 'N-BIZ-RES',
    resolveMessageId: (a) =>
      hasBizActivity(a, 'heat-pump-dryer') &&
      !hasBizActivity(a, 'household-only-inquiry') &&
      (a.BResItems?.length ?? 0) === 0
        ? undefined
        : 'N-BIZ-RES',
    sourceIds: [
      'esc-veu-activities',
      'energyvic-veu-products',
      'energyvic-insulation',
      'energyvic-induction',
      'energyvic-weather-sealing',
    ],
    why: 'ESC lists ceiling insulation, induction cooktops, weather sealing and in-home displays as residential-only, while Part 25 clothes dryers cover residential and non-residential premises with provider confirmation.',
    links: ['business-hub'],
  },
  {
    id: 'B-OC',
    section: 'business',
    branch: 'business',
    programGroup: 'veu',
    title: 'Apartment building common areas (owners corporation)',
    when: (a) => a.S1 === 'business' && a.B3 === 'apartment-common-areas',
    status: 'possibly',
    figureIds: [],
    sourceIds: ['vic-veu-spec-v25', 'energyvic-renters-landlords'],
    why: 'Class 2 apartment common areas route hot water through commercial Part 44 rules and common-area lighting through Part 34; your accredited provider confirms.',
    links: ['business-hub', 'apartments-and-units'],
    isNoteOnly: true,
  },
];

export const RULES_BY_ID: ReadonlyMap<string, RuleDefinition> = new Map(
  RULES.map((r) => [r.id, r]),
);

export function getCheckerReferencedFigureIds(): string[] {
  const ids = new Set<string>();
  for (const rule of RULES) {
    for (const fid of rule.figureIds) ids.add(fid);
    for (const cid of rule.coPayFigureIds ?? []) ids.add(cid);
  }
  ids.add('vic-solar-homes-income-cap');
  ids.add('vic-solar-homes-property-cap');
  return [...ids];
}
