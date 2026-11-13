export type RunningCostScenarioKey =
  | 'hot-water'
  | 'room-heating'
  | 'ducted-heating'
  | 'all-electric';

export interface RunningCostScenario {
  key: RunningCostScenarioKey;
  label: string;
  figureIds: string[];
  guideHref: string;
  guideLabel: string;
}

export const RUNNING_COST_SCENARIOS: RunningCostScenario[] = [
  {
    key: 'hot-water',
    label: 'Mains gas hot water to efficient electric hot water (heat pump or solar)',
    figureIds: ['vic-running-gas-to-electric-hw'],
    guideHref: '/victoria/gas-hot-water-to-heat-pump/',
    guideLabel: 'Gas hot water to heat pump guide',
  },
  {
    key: 'room-heating',
    label: 'Gas room heater to split-system reverse-cycle air conditioner',
    figureIds: ['vic-running-room-gas-to-rcac'],
    guideHref: '/victoria/gas-room-heater-to-split-system/',
    guideLabel: 'Gas room heater to split system guide',
  },
  {
    key: 'ducted-heating',
    label: 'Ducted gas heater to ducted reverse-cycle air conditioning',
    figureIds: ['vic-running-ducted-gas-to-rcac'],
    guideHref: '/victoria/ducted-gas-to-ducted-reverse-cycle/',
    guideLabel: 'Ducted gas to ducted reverse-cycle guide',
  },
  {
    key: 'all-electric',
    label: 'Whole existing home going all-electric (with and without solar)',
    figureIds: [
      'vic-existing-home-electric-saving',
      'vic-existing-home-electric-solar-saving',
      'vic-gas-supply-saving',
    ],
    guideHref: '/victoria/get-off-gas-planner/',
    guideLabel: 'Get-Off-Gas Planner',
  },
];

export function resolveRunningCostScenario(key: string): RunningCostScenario {
  return RUNNING_COST_SCENARIOS.find((s) => s.key === key) ?? RUNNING_COST_SCENARIOS[0];
}

export interface HwSizeRow {
  bedrooms: string;
  litres: string;
}

export function filterHwSizeRows(rows: HwSizeRow[], selectedBedrooms: string): HwSizeRow[] {
  if (!selectedBedrooms || selectedBedrooms === 'all') {
    return rows;
  }
  const matched = rows.filter((r) => r.bedrooms === selectedBedrooms);
  return matched.length > 0 ? matched : rows;
}

export type PostcodeHpLookupResult =
  | { status: 'empty' }
  | { status: 'invalid'; message: string }
  | { status: 'not_listed'; postcode: string; message: string }
  | { status: 'found'; postcode: string; hpZone: 4 | 5; note: string; frostAdvice: boolean };

export function lookupPostcodeHpZone(
  rawPostcode: string,
  compactMap: Record<string, string>,
): PostcodeHpLookupResult {
  const trimmed = rawPostcode.trim();
  if (!trimmed) {
    return { status: 'empty' };
  }
  if (!/^3\d{3}$/.test(trimmed)) {
    return {
      status: 'invalid',
      message: 'Enter a 4-digit Victorian postcode starting with 3.',
    };
  }
  const code = compactMap[trimmed];
  if (!code || code.length < 4) {
    return {
      status: 'not_listed',
      postcode: trimmed,
      message: `Postcode ${trimmed} is not listed separately in the VEU postcode table—ask your accredited provider which climate zone applies.`,
    };
  }
  const zoneNum = Number(code[3]);
  const hpZone: 4 | 5 = zoneNum === 5 ? 5 : 4;
  return {
    status: 'found',
    postcode: trimmed,
    hpZone,
    note: `In the VEU postcode table, ${trimmed} is in heat pump climatic zone ${hpZone}.`,
    frostAdvice: hpZone === 5,
  };
}

export type GasApplianceKey = 'hotwater' | 'room' | 'ducted' | 'cooktop';

export interface GasPlannerStep {
  key: GasApplianceKey;
  label: string;
  figureId: string;
  guideHref: string;
  guideLabel: string;
  detail: string;
}

export const GAS_PLANNER_STEPS: GasPlannerStep[] = [
  {
    key: 'hotwater',
    label: 'Mains gas water heater',
    figureId: 'vic-veu-hw-gas-to-heatpump',
    guideHref: '/victoria/gas-hot-water-to-heat-pump/',
    guideLabel: 'Gas hot water to heat pump guide',
    detail:
      'Trigger note: from 1 March 2027, a mains gas water heater in an existing home that needs replacing generally cannot be replaced with another mains gas heater.',
  },
  {
    key: 'room',
    label: 'Gas room or wall heater',
    figureId: 'vic-veu-rcac-room-gas',
    guideHref: '/victoria/gas-room-heater-to-split-system/',
    guideLabel: 'Gas room heater to split system guide',
    detail:
      'Existing owner-occupied homes do not have to remove working gas space heaters; replacing one with an approved split system accesses a VEU point-of-sale discount.',
  },
  {
    key: 'ducted',
    label: 'Ducted gas heater',
    figureId: 'vic-veu-rcac-ducted-gas-22kw',
    guideHref: '/victoria/ducted-gas-to-ducted-reverse-cycle/',
    guideLabel: 'Ducted gas to ducted reverse-cycle guide',
    detail:
      'The upper indicative figure applies specifically to replacing ducted gas with a large 22.4 kW ducted reverse-cycle system; 10 kW, 16 kW, and multi-split options have separate figures.',
  },
  {
    key: 'cooktop',
    label: 'Gas cooktop',
    figureId: 'vic-veu-induction',
    guideHref: '/victoria/gas-cooktop-to-induction/',
    guideLabel: 'Gas cooktop to induction guide',
    detail:
      'Existing homes do not have to remove gas cooktops; eligible 3-zone built-in or freestanding induction cooktops use a buy-first invoice claim process.',
  },
];

export interface GasPlannerEvaluation {
  activeSteps: GasPlannerStep[];
  showAbolishment: boolean;
  allFourTicked: boolean;
}

export function evaluateGasExitSelection(selectedKeys: GasApplianceKey[]): GasPlannerEvaluation {
  const set = new Set(selectedKeys);
  const activeSteps = GAS_PLANNER_STEPS.filter((s) => set.has(s.key));
  return {
    activeSteps,
    showAbolishment: activeSteps.length > 0,
    allFourTicked: activeSteps.length === GAS_PLANNER_STEPS.length,
  };
}
