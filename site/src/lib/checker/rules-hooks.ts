import { resolveInsulationFigureId } from './area-runtime';
import type {
  CheckerAnswers,
  LinkKey,
  MessageId,
  PostcodeAreaRecord,
  ProgramGroup,
  RuleStatus,
} from './types';

export interface RuleMeta {
  id: string;
  section: 'global' | 'residential' | 'business';
  branch: 'shared' | 'residential' | 'business';
  programGroup: ProgramGroup;
  title: string;
  status: RuleStatus;
  figureIds: string[];
  coPayFigureIds?: string[];
  messageId?: MessageId;
  sourceIds: string[];
  why: string;
  links: LinkKey[];
  isReplacement?: boolean;
  isInstalledProduct?: boolean;
  isNoteOnly?: boolean;
}

export interface RuleHooks {
  when: (answers: CheckerAnswers, area: PostcodeAreaRecord | null) => boolean;
  resolveStatus?: (answers: CheckerAnswers, area: PostcodeAreaRecord | null) => RuleStatus;
  resolveFigureIds?: (answers: CheckerAnswers, area: PostcodeAreaRecord | null) => string[];
  resolveCoPayFigureIds?: (answers: CheckerAnswers, area: PostcodeAreaRecord | null) => string[];
  resolveMessageId?: (
    answers: CheckerAnswers,
    area: PostcodeAreaRecord | null,
  ) => MessageId | undefined;
}

export type RuleDefinition = RuleMeta & RuleHooks;

function hasResUpgrade(a: CheckerAnswers, item: NonNullable<CheckerAnswers['R6']>[number]): boolean {
  return a.S1 === 'residential' && Boolean(a.R6?.includes(item));
}

function hasBizActivity(a: CheckerAnswers, item: NonNullable<CheckerAnswers['B6']>[number]): boolean {
  return a.S1 === 'business' && Boolean(a.B6?.includes(item));
}

const hasHc = (a: CheckerAnswers) => hasResUpgrade(a, 'heating-cooling');
const hasHw = (a: CheckerAnswers) => hasResUpgrade(a, 'hot-water');
const hasIns = (a: CheckerAnswers) => hasResUpgrade(a, 'ceiling-insulation');
const isDryerOnly = (a: CheckerAnswers) =>
  hasBizActivity(a, 'heat-pump-dryer') &&
  !hasBizActivity(a, 'household-only-inquiry') &&
  (a.BResItems?.length ?? 0) === 0;

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

const DUCTED_KW = ['16', '25', '32', '56'] as const;
const bizDuctedGasFig = (kw: string) => `vic-veu-biz-rcac-ducted-gas-${kw}kw`;
const bizReplacedDuctedFig = (kw: string) => `vic-veu-biz-rcac-replaced-ducted-${kw}kw`;

function resolveBusinessHeatingFigures(a: CheckerAnswers): string[] {
  const bh1 = a.BH1 ?? 'ducted-gas';
  const bh2 = a.BH2 ?? 'not-sure';

  if (bh1 === 'non-ducted-gas-heater') return ['vic-veu-biz-rcac-room-gas'];

  const exactKwMatch = bh2.match(/^ducted-(16|25|32|56)-kw$/)?.[1];

  if (bh1 === 'ducted-gas') {
    if (bh2 === 'room-split-3-to-9-kw') return ['vic-veu-biz-rcac-ducted-gas-4splits'];
    if (bh2 === 'several-splits-multi-split') {
      return ['vic-veu-biz-rcac-ducted-gas-4splits', 'vic-veu-biz-rcac-ducted-gas-multisplit'];
    }
    return exactKwMatch ? [bizDuctedGasFig(exactKwMatch)] : DUCTED_KW.map(bizDuctedGasFig);
  }

  if (bh1 === 'central-electric-ducted') return ['vic-veu-biz-rcac-central-electric-ducted'];
  if (bh1 === 'ducted-reverse-cycle') {
    return exactKwMatch
      ? [bizReplacedDuctedFig(exactKwMatch)]
      : DUCTED_KW.map(bizReplacedDuctedFig);
  }
  if (bh1 === 'non-ducted-reverse-cycle') return ['vic-veu-biz-rcac-replaced-room'];
  if (bh1 === 'hard-wired-electric-room-heater') return ['vic-veu-biz-rcac-hardwired-electric'];

  if (bh2 === 'room-split-3-to-9-kw' || bh2 === 'several-splits-multi-split') {
    return ['vic-veu-biz-rcac-room-no-decomm'];
  }
  return exactKwMatch
    ? ['vic-veu-biz-rcac-ducted-no-decomm']
    : ['vic-veu-biz-rcac-room-no-decomm', 'vic-veu-biz-rcac-ducted-no-decomm'];
}

function resolveMultiSplitCopay(a: CheckerAnswers): string[] {
  if (a.H3 === 'under-10-kw') return ['vic-veu-copay-multisplit-under-10kw'];
  if (a.H3 === '10-kw-or-more') return ['vic-veu-copay-multisplit-10kw-plus'];
  return ['vic-veu-copay-multisplit-under-10kw', 'vic-veu-copay-multisplit-10kw-plus'];
}

function resolveBusinessHeatingCoPayFigures(a: CheckerAnswers): string[] {
  const bh2 = a.BH2 ?? 'not-sure';
  if (bh2 === 'room-split-3-to-9-kw') return ['vic-veu-copay-split-under-10kw'];
  if (bh2 === 'several-splits-multi-split') {
    return ['vic-veu-copay-multisplit-under-10kw', 'vic-veu-copay-multisplit-10kw-plus'];
  }
  return ['vic-veu-copay-ducted'];
}

export type RuleHookEntry = RuleHooks['when'] | RuleHooks;

export const RULE_HOOKS: Readonly<Record<string, RuleHookEntry>> = {
  'G-AREA': (_a, area) => area !== null,
  'G-NOTSURE': (a) => hasAnyGatingNotSure(a),
  'G-AGE': (a) => {
    if (a.S1 === 'residential') {
      if (a.R2a === 'yes') return false;
      return a.R5 === 'no' && (hasHc(a) || hasHw(a));
    }
    if (a.S1 === 'business') {
      return a.B5 === 'no' && (hasBizActivity(a, 'heating-cooling') || hasBizActivity(a, 'hot-water'));
    }
    return false;
  },
  'G-RETRO': (_a, area) => area !== null,
  'G-RENT': (a) => a.S1 === 'residential' && a.R3 === 'tenant',
  'G-OC': (a) => a.S1 === 'residential' && a.R3 === 'owners-corporation',
  'G-SCHED': (a) => a.S1 === 'business' && a.B4 === 'yes-not-opted-in',
  'G-SCAM': (_a, area) => area !== null,
  'RH-1': (a) =>
    hasHc(a) &&
    a.H1 === 'gas-room-heater' &&
    (a.H2 === 'split-one-room' || a.H2 === 'several-splits-or-multi-split'),
  'RH-2': (a) =>
    hasHc(a) && a.H1 === 'ducted-gas-heater' && a.H2 === 'ducted-reverse-cycle',
  'RH-3': {
    when: (a) =>
      hasHc(a) &&
      a.H1 === 'ducted-gas-heater' &&
      (a.H2 === 'several-splits-or-multi-split' || a.H2 === 'split-one-room'),
    resolveCoPayFigureIds: resolveMultiSplitCopay,
  },
  'RH-4': (a) =>
    hasHc(a) &&
    a.H1 === 'hard-wired-electric-room-heater' &&
    a.H2 !== 'ducted-reverse-cycle',
  'RH-5': (a) =>
    hasHc(a) &&
    a.H1 === 'central-electric-ducted-heater' &&
    a.H2 === 'ducted-reverse-cycle',
  'RH-6': (a) =>
    hasHc(a) &&
    a.H1 === 'reverse-cycle-split-room-unit' &&
    a.H2 !== 'ducted-reverse-cycle',
  'RH-7': (a) =>
    hasHc(a) &&
    a.H1 === 'ducted-reverse-cycle' &&
    a.H2 === 'ducted-reverse-cycle',
  'RH-8': {
    when: (a) => {
      if (!hasHc(a)) return false;
      if (a.H1 === 'nothing-portable-only' || a.H1 === 'not-sure') return true;
      const toDucted = a.H2 === 'ducted-reverse-cycle';
      if (a.H1 === 'gas-room-heater' || a.H1 === 'hard-wired-electric-room-heater' || a.H1 === 'reverse-cycle-split-room-unit') {
        return toDucted;
      }
      return (a.H1 === 'central-electric-ducted-heater' || a.H1 === 'ducted-reverse-cycle') && !toDucted;
    },
    resolveFigureIds: (a) => {
      if (a.H2 === 'ducted-reverse-cycle') return ['vic-veu-rcac-ducted-no-decomm'];
      if (a.H2 === 'split-one-room') return ['vic-veu-rcac-room-no-decomm'];
      return ['vic-veu-rcac-room-no-decomm', 'vic-veu-rcac-ducted-no-decomm'];
    },
    resolveCoPayFigureIds: (a) => {
      if (a.H2 === 'ducted-reverse-cycle') return ['vic-veu-copay-ducted'];
      if (a.H2 === 'several-splits-or-multi-split') return resolveMultiSplitCopay(a);
      return ['vic-veu-copay-split-under-10kw'];
    },
  },
  'RH-9': (a) => hasHc(a) && a.R3 === 'landlord',
  'RW-1': (a) =>
    hasHw(a) &&
    a.W1 === 'gas-mains' &&
    (a.W3 === 'heat-pump' || a.W3 === 'not-sure' || a.W3 === undefined),
  'RW-2': (a) =>
    hasHw(a) &&
    a.W1 === 'gas-mains' &&
    (a.W3 === 'solar-boosted' || a.W3 === 'not-sure'),
  'RW-3': (a) =>
    hasHw(a) &&
    a.W1 === 'electric-storage' &&
    (a.W3 === 'heat-pump' || a.W3 === 'not-sure' || a.W3 === undefined),
  'RW-4': (a) =>
    hasHw(a) &&
    a.W1 === 'electric-storage' &&
    (a.W3 === 'solar-boosted' || a.W3 === 'not-sure'),
  'RW-5': {
    when: (a) => hasHw(a) && (a.W1 === 'solar-broken' || a.W1 === 'not-sure'),
    resolveFigureIds: (a) => {
      const target = a.W3 === 'solar-boosted' ? 'solar' : 'heatpump';
      return [`vic-veu-hw-gas-to-${target}`, `vic-veu-hw-electric-to-${target}`];
    },
  },
  'RW-6': (a) => hasHw(a) && a.W1 === 'lpg',
  'RW-7': (a) => hasHw(a) && isEfficientExistingHw(a.W1),
  'RW-8': (a) => hasHw(a) && a.W1 === 'gas-mains' && a.W2 === 'yes',
  'RW-9': (a) => hasHw(a) && !isEfficientExistingHw(a.W1),
  'RC-1': {
    when: (a) =>
      hasResUpgrade(a, 'cooktop') && (a.C1 === 'gas-mains' || a.C1 === 'lpg'),
    resolveFigureIds: (a) =>
      a.C1 === 'gas-mains' && hasHc(a) && hasHw(a)
        ? ['vic-veu-induction', 'vic-gas-supply-saving']
        : ['vic-veu-induction'],
  },
  'RC-2': (a) =>
    hasResUpgrade(a, 'cooktop') && (a.C1 === 'electric' || a.C1 === 'already-induction'),
  'RI-1': {
    when: (a) =>
      hasIns(a) &&
      a.R4 !== 'apartment' &&
      (a.I1 === 'nothing' || a.I1 === 'thin-or-patchy') &&
      a.I2 !== 'yes',
    resolveFigureIds: (_a, area) => {
      const figId = resolveInsulationFigureId(area);
      return figId ? [figId] : [];
    },
  },
  'RI-2': (a) =>
    hasIns(a) &&
    a.R4 !== 'apartment' &&
    (a.I1 === 'nothing' || a.I1 === 'thin-or-patchy' || a.I1 === 'not-sure') &&
    a.I2 === 'yes',
  'RI-3': (a) => hasIns(a) && a.R4 !== 'apartment' && a.I1 === 'thick',
  'RI-4': {
    when: (a) =>
      hasIns(a) && a.R4 !== 'apartment' && a.I1 === 'not-sure' && a.I2 !== 'yes',
    resolveFigureIds: (_a, area) => {
      const figId = resolveInsulationFigureId(area);
      return figId ? [figId] : [];
    },
  },
  'RI-5': (a) => hasIns(a) && a.R3 === 'landlord',
  'I-APT': (a) => hasIns(a) && a.R4 === 'apartment',
  'RD-1': {
    when: (a) => hasResUpgrade(a, 'draughts') && a.R3 !== 'building-it',
    resolveFigureIds: (a) => {
      const types =
        a.R4 === 'apartment'
          ? ['apartment']
          : a.R4 === 'house-or-townhouse'
            ? ['townhouse', 'house']
            : ['apartment', 'townhouse', 'house'];
      return types.flatMap((t) => [`vic-veu-sealing-${t}-2yr`, `vic-veu-sealing-${t}-5yr`]);
    },
  },
  'RD-2': (a) => {
    if (!hasResUpgrade(a, 'draughts') || a.R3 === 'building-it') return false;
    if (!hasHc(a) || !a.H1) return true;
    return a.H1 === 'ducted-gas-heater' || a.H1 === 'gas-room-heater' || a.H1 === 'not-sure';
  },
  'RG-1': (a) =>
    hasResUpgrade(a, 'windows') && (a.G1 === 'yes' || a.G1 === 'some' || a.G1 === 'not-sure'),
  'RG-2': (a) => hasResUpgrade(a, 'windows') && a.G1 === 'no',
  'RA-1': {
    when: (a) =>
      hasResUpgrade(a, 'appliances') && a.R3 !== 'building-it' && (a.A1?.length ?? 0) > 0,
    resolveFigureIds: (a) => {
      const map: Record<NonNullable<CheckerAnswers['A1']>[number], string> = {
        'heat-pump-clothes-dryer': 'dryer',
        'fridge-or-freezer': 'fridge',
        tv: 'tv',
        'shower-head': 'showerhead',
        'in-home-energy-display': 'ihd',
      };
      return (a.A1 ?? []).map((item) => map[item] && `vic-veu-appliance-${map[item]}`).filter(Boolean);
    },
  },
  'SH-HW': shHwConditionsPass,
  'SH-HW-X': {
    when: (a) => hasHw(a) && !isEfficientExistingHw(a.W1) && !shHwConditionsPass(a),
    resolveMessageId: resolveShHwFailureMessage,
  },
  'SH-PV': shPvConditionsPass,
  'SH-PV-L': (a) =>
    hasResUpgrade(a, 'solar-panels') &&
    a.R3 === 'landlord' &&
    a.P1 !== 'yes' &&
    (a.R2a === 'yes' || a.SH1 !== 'no') &&
    a.SH2 !== 'no' &&
    a.SH3 !== 'yes',
  'SH-PV-X': {
    when: (a) => {
      if (!hasResUpgrade(a, 'solar-panels') || shPvConditionsPass(a)) return false;
      return !(
        a.R3 === 'landlord' &&
        a.P1 !== 'yes' &&
        (a.R2a === 'yes' || a.SH1 !== 'no') &&
        a.SH2 !== 'no' &&
        a.SH3 !== 'yes'
      );
    },
    resolveMessageId: resolveShPvFailureMessage,
  },
  'FED-BAT': (a) =>
    hasResUpgrade(a, 'home-battery') && (a.BT1 === 'have-solar' || a.BT1 === 'adding-solar-now'),
  'FED-BAT-X': (a) => hasResUpgrade(a, 'home-battery') && a.BT1 === 'no-solar',
  'FED-STC': (a) =>
    hasHw(a) &&
    !isEfficientExistingHw(a.W1) &&
    (a.W3 === 'heat-pump' || a.W3 === 'solar-boosted' || a.W3 === 'not-sure'),
  'SOL-1': (a) => a.S1 === 'residential' && a.R2a === 'yes',
  'SOL-2': (a) =>
    a.S1 === 'residential' && a.R2a === 'yes' && a.R5 === 'no' && (hasHc(a) || hasHw(a)),
  'GAS-NO': (a, area) =>
    a.S1 === 'residential' &&
    area !== null &&
    !area.reticulated_gas &&
    (a.W1 === 'gas-mains' ||
      a.C1 === 'gas-mains' ||
      a.H1 === 'ducted-gas-heater' ||
      a.H1 === 'gas-room-heater'),
  'HPZ-5': (a, area) => hasHw(a) && area !== null && area.heat_pump_zone === 5,
  'BH-1..7': {
    when: (a) => hasBizActivity(a, 'heating-cooling') && Boolean(a.BH1 && a.BH2),
    resolveStatus: (a) => (a.BH1 === 'nothing' || a.BH2 === 'not-sure' ? 'possibly' : 'likely'),
    resolveFigureIds: resolveBusinessHeatingFigures,
    resolveCoPayFigureIds: resolveBusinessHeatingCoPayFigures,
  },
  'BW-1': {
    when: (a) =>
      hasBizActivity(a, 'hot-water') &&
      a.B3 !== 'apartment-common-areas' &&
      a.BW1 === 'household-size' &&
      (a.BW1Count ?? 1) <= 5,
    resolveStatus: (a) => (a.BW2 === 'solar-broken' || a.BW2 === 'none' ? 'possibly' : 'likely'),
    resolveFigureIds: (a) => {
      const fuels = a.BW2 === 'gas' ? ['gas'] : a.BW2 === 'electric' ? ['electric'] : ['gas', 'electric'];
      return fuels.flatMap((f) => [`vic-veu-hw-${f}-to-heatpump`, `vic-veu-hw-${f}-to-solar`]);
    },
  },
  'BW-2': (a) =>
    hasBizActivity(a, 'hot-water') &&
    a.B3 !== 'apartment-common-areas' &&
    a.BW1 === 'household-size' &&
    (a.BW1Count ?? 1) > 5,
  'BW-3': (a) =>
    hasBizActivity(a, 'hot-water') && (a.BW1 === 'larger-ci' || a.B3 === 'apartment-common-areas'),
  'BL-1': {
    when: (a) => hasBizActivity(a, 'lighting') && Boolean(a.BL1?.includes('indoor-fluorescent')),
    resolveStatus: (a) => (a.B3 === 'apartment-common-areas' ? 'possibly' : 'likely'),
  },
  'BL-2': (a) =>
    hasBizActivity(a, 'lighting') && Boolean(a.BL1?.includes('outdoor-carpark-sports')),
  'BL-3': (a) =>
    hasBizActivity(a, 'lighting') &&
    Boolean(a.BL1?.includes('street-lighting')) &&
    a.B3 === 'council',
  'BL-4': (a) =>
    hasBizActivity(a, 'lighting') &&
    Boolean(a.BL1?.includes('indoor-other')) &&
    !a.BL1?.includes('indoor-fluorescent') &&
    !a.BL1?.includes('outdoor-carpark-sports') &&
    !(a.BL1?.includes('street-lighting') && a.B3 === 'council'),
  'BR-1': {
    when: (a) =>
      hasBizActivity(a, 'refrigeration') &&
      Boolean(a.BR1?.includes('walk-in-cold-room')) &&
      a.BR3 === 'yes' &&
      Boolean(a.BR2) &&
      a.BR2 !== 'under-4-m2',
    resolveFigureIds: (a) => {
      const cr = (sz: string) => `vic-veu-biz-coldroom-${sz}`;
      if (a.BR2 === '4-to-9-m2') return [cr('small')];
      if (a.BR2 === 'over-9-to-under-24-m2') return [cr('medium')];
      if (a.BR2 === '24-m2-or-more') return [cr('large')];
      return ['small', 'medium', 'large'].map(cr);
    },
  },
  'BR-2': (a) =>
    hasBizActivity(a, 'refrigeration') &&
    Boolean(a.BR1?.includes('walk-in-cold-room')) &&
    (a.BR2 === 'under-4-m2' || a.BR3 === 'no'),
  'BR-3': (a) =>
    hasBizActivity(a, 'refrigeration') && Boolean(a.BR1?.includes('fridge-freezer')),
  'BR-4': (a) =>
    hasBizActivity(a, 'refrigeration') &&
    Boolean(a.BR1?.includes('display-cabinets') || a.BR1?.includes('refrigeration-fan-motors')),
  'BM-1': {
    when: (a) => hasBizActivity(a, 'motors') && Boolean(a.BM1) && a.BM1 !== 'over-185-kw',
    resolveFigureIds: (a) => {
      const m = (sz: string) => `vic-veu-biz-motor-${sz}`;
      if (a.BM1 === 'under-15-kw') return [m('15kw-premium')];
      if (a.BM1 === '15-to-75-kw') return ['15kw-premium', '75kw-he', '75kw-premium'].map(m);
      return ['75kw-he', '75kw-premium', '185kw-premium'].map(m);
    },
  },
  'BM-2': (a) => hasBizActivity(a, 'motors') && a.BM1 === 'over-185-kw',
  'BK-1': (a) => hasBizActivity(a, 'kitchen-spray-valves') && a.BK1 === 'yes',
  'BK-2': (a) => hasBizActivity(a, 'kitchen-spray-valves') && a.BK1 === 'no',
  'BP-1': {
    when: (a) =>
      hasBizActivity(a, 'solar-panels') &&
      a.B3 !== 'apartment-common-areas' &&
      (a.BP1 === '30-to-50-kw' || a.BP1 === '50-to-100-kw' || a.BP1 === '100-to-200-kw'),
    resolveFigureIds: (a) => {
      const s = (n: number) => `vic-veu-biz-solar-${n}kw`;
      const basis = 'vic-veu-biz-solar-veec-basis';
      if (a.BP1ExactKw) return [s(a.BP1ExactKw), basis];
      const sizes =
        a.BP1 === '30-to-50-kw' ? [50] : a.BP1 === '50-to-100-kw' ? [50, 75, 100] : [100, 150, 200];
      return [...sizes.map(s), basis];
    },
  },
  'BP-2': (a) => hasBizActivity(a, 'solar-panels') && a.BP1 === 'under-30-kw',
  'BP-3': (a) => hasBizActivity(a, 'solar-panels') && a.BP1 === 'over-200-kw',
  'BX-1': (a) => hasBizActivity(a, 'process-heat'),
  'BG-1': (a) => hasBizActivity(a, 'windows') && (a.BG1 === 'yes' || a.BG1 === 'some'),
  'BB-1': (a) => hasBizActivity(a, 'battery') && a.BB1 !== 'no',
  'B-RES-ONLY': {
    when: (a) =>
      hasBizActivity(a, 'heat-pump-dryer') ||
      hasBizActivity(a, 'household-only-inquiry') ||
      (a.S1 === 'business' && (a.BResItems?.length ?? 0) > 0),
    resolveStatus: (a) => (isDryerOnly(a) ? 'possibly' : 'not-eligible'),
    resolveFigureIds: (a) => (isDryerOnly(a) ? ['vic-veu-appliance-dryer'] : []),
    resolveMessageId: (a) => (isDryerOnly(a) ? undefined : 'N-BIZ-RES'),
  },
  'B-OC': (a) => a.S1 === 'business' && a.B3 === 'apartment-common-areas',
};

export function hydrateRules(
  metas: readonly RuleMeta[],
  hooksMap: Readonly<Record<string, RuleHookEntry>> = RULE_HOOKS,
): RuleDefinition[] {
  return metas.map((m) => {
    const raw = hooksMap[m.id];
    if (!raw) {
      throw new Error(`Missing rule hooks for rule "${m.id}"`);
    }
    return typeof raw === 'function' ? { ...m, when: raw } : { ...m, ...raw };
  });
}

export function getCheckerReferencedFigureIdsFromRules(rules: readonly Pick<RuleMeta, 'figureIds' | 'coPayFigureIds'>[]): string[] {
  const ids = new Set<string>();
  for (const rule of rules) {
    for (const fid of rule.figureIds) ids.add(fid);
    for (const cid of rule.coPayFigureIds ?? []) ids.add(cid);
  }
  ids.add('vic-solar-homes-income-cap');
  ids.add('vic-solar-homes-property-cap');
  return [...ids];
}
