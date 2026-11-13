import { formatFigureAmount, type FigureData } from './figures';
import { VIC_ELIGIBILITY_RULES } from '../data/eligibility/vic-rules';

export type CheckerStatus =
  | 'OUT_OF_AREA'
  | 'BUSINESS'
  | 'RETRO'
  | 'LIKELY_NOT'
  | 'POSSIBLE'
  | 'LIKELY';

export interface CheckerAnswers {
  q1State: 'vic' | 'other';
  q2Upgrade: 'rcac' | 'hotwater' | 'both';
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
}

export interface CheckerResultItem {
  activity: 'rcac' | 'hotwater';
  status: CheckerStatus;
  headline: string;
  summary: string;
  matchedFigures: FigureData[];
  notes: string[];
}

export interface CheckerAssessment {
  overallStatus: CheckerStatus;
  allowForm: boolean;
  productBoughtFlag: boolean;
  cautionBanner?: string;
  headline: string;
  summary: string;
  externalLink?: { url: string; label: string };
  items: CheckerResultItem[];
  sharedNotes: string[];
  disclaimer: string;
}

const DISCLAIMER_TEXT =
  'Indicative only. The discount depends on the certificate price, product, location and provider.';

export function assess(
  answers: CheckerAnswers,
  rules = VIC_ELIGIBILITY_RULES,
  figures: FigureData[] = [],
): CheckerAssessment {
  const byId = new Map<string, FigureData>(figures.map((f) => [f.id, f]));
  const pickFigures = (ids: readonly string[]): FigureData[] =>
    ids.map((id) => byId.get(id)).filter((f): f is FigureData => Boolean(f));

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
      items: [],
      sharedNotes: [],
      disclaimer: DISCLAIMER_TEXT,
    };
  }

  // Gate 3: Already installed or work started
  if (answers.q3WorkStage === 'installed_or_started') {
    return {
      overallStatus: 'RETRO',
      allowForm: false,
      productBoughtFlag: false,
      headline: 'Discounts generally require a provider before work starts.',
      summary:
        'Discounts generally need an accredited provider involved before work starts. Retrospective discounts are typically not possible.',
      externalLink: {
        url: 'https://www.energy.vic.gov.au/victorian-energy-upgrades/about',
        label: 'Read Energy Victoria timing rules',
      },
      items: [],
      sharedNotes: [],
      disclaimer: DISCLAIMER_TEXT,
    };
  }

  const productBoughtFlag = answers.q3WorkStage === 'bought_not_installed';
  const cautionBanner = productBoughtFlag
    ? 'Because you have already purchased the product, check with an accredited provider before any installation work starts. Energy Victoria advises that retrospective discounts are typically not possible.'
    : undefined;

  const sharedNotes: string[] = [];
  if (answers.q5Tenure === 'rent') {
    sharedNotes.push(
      "Renters can get the discount, but heating and cooling needs the landlord's approval.",
    );
  }
  if (answers.q5Tenure === 'rent' || answers.q5Tenure === 'landlord') {
    sharedNotes.push(
      'From 1 March 2027, Victorian rental minimum standards require an efficient electric water heater when an unrepairable unit is replaced, an efficient reverse-cycle air conditioner when a main living area heater fails, and efficient cooling in the main living area at the start of a new lease.',
    );
  }

  const items: CheckerResultItem[] = [];

  // Assess Heating & Cooling
  if (answers.q2Upgrade === 'rcac' || answers.q2Upgrade === 'both') {
    items.push(assessHeatingCooling(answers, rules, figures, pickFigures));
  }

  // Assess Hot Water
  if (answers.q2Upgrade === 'hotwater' || answers.q2Upgrade === 'both') {
    items.push(assessHotWater(answers, rules, pickFigures));
  }

  // Determine overall status
  let overallStatus: CheckerStatus = 'LIKELY';
  if (items.every((i) => i.status === 'LIKELY_NOT')) {
    overallStatus = 'LIKELY_NOT';
  } else if (items.some((i) => i.status === 'POSSIBLE')) {
    overallStatus = 'POSSIBLE';
  }

  const allowForm = overallStatus === 'LIKELY' || overallStatus === 'POSSIBLE';

  const headline =
    overallStatus === 'LIKELY'
      ? 'This upgrade looks like it fits the VEU rules.'
      : overallStatus === 'POSSIBLE'
        ? 'This upgrade may fit the VEU rules — an accredited provider confirms when they quote.'
        : 'This upgrade looks unlikely to fit the standard replacement rules.';

  const summary = items.map((i) => i.summary).join(' ');

  return {
    overallStatus,
    allowForm,
    productBoughtFlag,
    cautionBanner,
    headline,
    summary,
    items,
    sharedNotes,
    disclaimer: DISCLAIMER_TEXT,
  };
}

function assessHeatingCooling(
  answers: CheckerAnswers,
  rules: typeof VIC_ELIGIBILITY_RULES,
  allFigures: FigureData[],
  pickFigures: (ids: readonly string[]) => FigureData[],
): CheckerResultItem {
  const current = answers.q7aCurrentHeating ?? 'none';
  const target = answers.q7bTargetHeating ?? 'not_sure';
  const notes: string[] = [];

  if (answers.q6BuildingOver2Years === 'no' && current !== 'none') {
    const noDecomm = pickFigures(['vic-veu-rcac-room-no-decomm', 'vic-veu-rcac-ducted-no-decomm']);
    return {
      activity: 'rcac',
      status: 'LIKELY_NOT',
      headline: 'Replacing a heater requires a property more than 2 years old.',
      summary:
        'Under VEU heating and cooling rules, replacing an existing heater requires a property more than 2 years old. Only the smaller "no decommissioned product" discount path may be available.',
      matchedFigures: noDecomm,
      notes: [
        'An accredited provider can confirm whether the no-decommissioning activity applies to your property.',
      ],
    };
  }

  let matched: FigureData[] = [];
  if (target === 'not_sure') {
    matched = allFigures.filter((f) => f.activity === 'rcac' && f.group !== 'vic-veu-running-savings');
    notes.push('Because you are unsure between ducted and split systems, we have listed the household scenarios below. The accredited provider confirms which row applies.');
  } else {
    const key = `${current}__${target}` as keyof typeof rules.heatingCoolingFigureMap;
    const ids = rules.heatingCoolingFigureMap[key] ?? ['vic-veu-rcac-room-no-decomm'];
    matched = pickFigures(ids);
    if (current === 'ducted-gas' && target === 'ducted') {
      notes.push('Ducted reverse-cycle discounts depend on the capacity installed (10 kW, 16 kW, or 22.4 kW). Size decides which row applies.');
    }
  }

  const isPossible = answers.q6BuildingOver2Years === 'not_sure' || target === 'not_sure';
  const status: CheckerStatus = isPossible ? 'POSSIBLE' : 'LIKELY';
  const leadFigureText =
    matched.length > 0 ? formatFigureAmount(matched[0]) : 'an indicative discount';

  const summary = isPossible
    ? `From what you've told us, your heating and cooling upgrade may fit the VEU rules (indicative discount of ${leadFigureText}). An accredited provider confirms this when they quote.`
    : `From what you've told us, this upgrade looks like it fits the VEU rules. Energy Victoria lists an indicative discount of ${leadFigureText} for this situation. The accredited provider confirms whether you're eligible, and the actual amount, in your quote.`;

  return {
    activity: 'rcac',
    status,
    headline: 'Heating and cooling assessment',
    summary,
    matchedFigures: matched,
    notes,
  };
}

function assessHotWater(
  answers: CheckerAnswers,
  rules: typeof VIC_ELIGIBILITY_RULES,
  pickFigures: (ids: readonly string[]) => FigureData[],
): CheckerResultItem {
  const current = answers.q8aCurrentHotWater ?? 'none';
  const prevUpgrades = answers.q8bPreviousHotWaterUpgrades ?? '0';
  const minContribFig = pickFigures(['vic-veu-hw-min-contribution'])[0];
  const minContribStr = minContribFig ? formatFigureAmount(minContribFig) : 'the minimum statutory amount';
  const notes: string[] = [
    `All VEU hot water upgrades require a minimum customer co-contribution of ${minContribStr}.`,
    'Eligible households may also be able to combine the VEU discount with the Solar Victoria Solar Homes hot water rebate (confirmed during quoting).',
  ];

  if (current === 'none') {
    return {
      activity: 'hotwater',
      status: 'LIKELY_NOT',
      headline: 'Hot water discounts require replacing an existing system.',
      summary:
        'Under VEU hot water rules, you must be replacing an existing inefficient electric, gas, or solar hot water system.',
      matchedFigures: [],
      notes,
    };
  }

  if (answers.q6BuildingOver2Years === 'no') {
    return {
      activity: 'hotwater',
      status: 'LIKELY_NOT',
      headline: 'Building must be at least 2 years old for a hot water discount.',
      summary:
        'Energy Victoria requires the existing hot water system being replaced to be in a building at least 2 years old.',
      matchedFigures: [],
      notes,
    };
  }

  if (prevUpgrades === '2_plus') {
    return {
      activity: 'hotwater',
      status: 'LIKELY_NOT',
      headline: 'Households can upgrade up to 2 hot water systems under VEU.',
      summary:
        'Because 2 or more hot water systems have already been upgraded under VEU at this address, an additional household hot water discount is unlikely to be available.',
      matchedFigures: [],
      notes,
    };
  }

  const ids = rules.hotWaterFigureMap[current] ?? ['vic-veu-hw-gas-to-heatpump'];
  const matched = pickFigures(ids);

  if (current === 'mains-gas') {
    notes.push(
      'From 1 March 2027, a mains gas water heater needing replacement in an existing Victorian home must generally be replaced with an efficient electric system (unless an exemption applies).',
    );
  } else if (current === 'lpg') {
    notes.push(
      'The accredited provider confirms which replacement category applies to bottled LPG. Note that Victoria’s 1 March 2027 mains gas replacement rule does not affect LPG.',
    );
  } else if (current === 'broken-solar') {
    notes.push(
      'For a broken solar hot water unit, the accredited provider confirms whether the electric-boosted or gas-boosted replacement category applies.',
    );
  }

  const isPossible =
    answers.q6BuildingOver2Years === 'not_sure' ||
    prevUpgrades === 'not_sure' ||
    current === 'lpg' ||
    current === 'broken-solar';

  const status: CheckerStatus = isPossible ? 'POSSIBLE' : 'LIKELY';
  const leadFigureText =
    matched.length > 0 ? formatFigureAmount(matched[0]) : 'an indicative discount';

  const summary = isPossible
    ? `From what you've told us, your hot water upgrade may fit the VEU rules (indicative discount of ${leadFigureText}). An accredited provider confirms this when they quote.`
    : `From what you've told us, this upgrade looks like it fits the VEU rules. Energy Victoria lists an indicative discount of ${leadFigureText} for this situation. The accredited provider confirms whether you're eligible, and the actual amount, in your quote.`;

  return {
    activity: 'hotwater',
    status,
    headline: 'Hot water assessment',
    summary,
    matchedFigures: matched,
    notes,
  };
}
