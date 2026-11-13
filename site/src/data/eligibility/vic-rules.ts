export type CheckerActivity = 'rcac' | 'hotwater' | 'insulation' | 'induction' | 'sealing';

export interface QuestionOption {
  value: string;
  label: string;
}

export interface CheckerQuestionSpec {
  id: string;
  label: string;
  type: 'select' | 'checkbox-group' | 'postcode';
  showIfActivity?: CheckerActivity;
  helpText?: string;
  options?: readonly QuestionOption[];
}

export const CHECKER_QUESTIONS: readonly CheckerQuestionSpec[] = [
  {
    id: 'q1State',
    label: '1. Where is the property located?',
    type: 'select',
    options: [
      { value: 'vic', label: 'Victoria' },
      { value: 'other', label: 'Another state or territory' },
    ],
  },
  {
    id: 'q2Activities',
    label: '2. What do you want to look at? (choose one or more)',
    type: 'checkbox-group',
    options: [
      { value: 'rcac', label: 'Heating and cooling' },
      { value: 'hotwater', label: 'Hot water' },
      { value: 'insulation', label: 'Ceiling insulation' },
      { value: 'induction', label: 'Induction cooktop' },
      { value: 'sealing', label: 'Draught proofing' },
    ],
  },
  {
    id: 'q3WorkStage',
    label: '3. Have you already bought or installed the new system, or has work started?',
    type: 'select',
    options: [
      { value: 'no', label: 'No — not bought or installed yet' },
      { value: 'bought_not_installed', label: 'Bought, not installed' },
      { value: 'installed_or_started', label: 'Installed or work started' },
    ],
  },
  {
    id: 'q4PropertyType',
    label: '4. Is the property a home or a business?',
    type: 'select',
    options: [
      { value: 'home', label: 'Home (residential property)' },
      { value: 'business', label: 'Business or commercial premises' },
    ],
  },
  {
    id: 'q5Tenure',
    label: '5. Do you own or rent?',
    type: 'select',
    options: [
      { value: 'own', label: 'Own and live there' },
      { value: 'rent', label: 'Rent (tenant)' },
      { value: 'landlord', label: 'Landlord (rental property owner)' },
    ],
  },
  {
    id: 'q6BuildingOver2Years',
    label: '6. Is the building more than 2 years old?',
    type: 'select',
    options: [
      { value: 'yes', label: 'Yes — more than 2 years old' },
      { value: 'no', label: 'No — built within the last 2 years' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  {
    id: 'q7aCurrentHeating',
    label: '7a. What heats the home now?',
    type: 'select',
    showIfActivity: 'rcac',
    options: [
      { value: 'room-gas', label: 'Room (non-ducted) gas heater' },
      { value: 'ducted-gas', label: 'Ducted gas heater' },
      { value: 'central-electric', label: 'Central electric resistance ducted heater' },
      { value: 'hardwired-electric', label: 'Hard-wired electric room heater' },
      { value: 'ducted-rcac', label: 'Ducted reverse-cycle air conditioner' },
      { value: 'split-rcac', label: 'Split-system reverse-cycle air conditioner' },
      { value: 'none', label: 'Nothing or other (e.g. wood heater or plug-in portable)' },
    ],
  },
  {
    id: 'q7bTargetHeating',
    label: '7b. What heating and cooling system would you like?',
    type: 'select',
    showIfActivity: 'rcac',
    options: [
      { value: 'split', label: 'Split system(s) (single or multi-split)' },
      { value: 'ducted', label: 'Ducted reverse-cycle system' },
      { value: 'not_sure', label: 'Not sure yet' },
    ],
  },
  {
    id: 'q8aCurrentHotWater',
    label: '8a. What is your current hot water system?',
    type: 'select',
    showIfActivity: 'hotwater',
    options: [
      { value: 'mains-gas', label: 'Mains gas (storage or instantaneous)' },
      { value: 'electric', label: 'Electric storage water heater' },
      { value: 'lpg', label: 'Bottled LPG gas water heater' },
      { value: 'broken-solar', label: 'Solar water heater that no longer works' },
      { value: 'none', label: 'None (new connection without an existing heater)' },
    ],
  },
  {
    id: 'q8bPreviousHotWaterUpgrades',
    label: '8b. How many hot water systems have already been upgraded through VEU at this address?',
    type: 'select',
    showIfActivity: 'hotwater',
    options: [
      { value: '0', label: '0 (none upgraded yet)' },
      { value: '1', label: '1 system' },
      { value: '2_plus', label: '2 or more systems' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  {
    id: 'q9aPostcode',
    label: "9a. What's the property's postcode?",
    type: 'postcode',
    showIfActivity: 'insulation',
  },
  {
    id: 'q9bCeilingNow',
    label: "9b. What's in the ceiling now?",
    type: 'select',
    showIfActivity: 'insulation',
    options: [
      { value: 'none', label: 'No insulation' },
      {
        value: 'thin',
        label: 'Some, but thin (less than about 90 mm, or lower than the top of the ceiling joists)',
      },
      { value: 'thicker', label: 'Thicker than that' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  {
    id: 'q9cUnsafeCeiling',
    label: '9c. Are there halogen downlights in the ceiling, or any wiring you know is unsafe?',
    type: 'select',
    showIfActivity: 'insulation',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Yes' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  {
    id: 'q10aCooktopNow',
    label: '10a. What cooktop do you have now?',
    type: 'select',
    showIfActivity: 'induction',
    options: [
      { value: 'gas', label: 'Gas' },
      { value: 'electric', label: 'Electric (not induction)' },
      { value: 'induction', label: 'Induction already' },
      { value: 'none', label: 'None' },
    ],
  },
  {
    id: 'q10bClaimedBefore',
    label: '10b. Has an induction cooktop discount already been claimed at this address?',
    type: 'select',
    showIfActivity: 'induction',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Yes' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  {
    id: 'q10cCooktopTarget',
    label: '10c. What kind of induction cooktop do you want?',
    type: 'select',
    showIfActivity: 'induction',
    options: [
      {
        value: 'builtin_or_freestanding',
        label: 'Built-in or freestanding, at least 550 × 380 mm, 3 or more zones',
      },
      { value: 'portable', label: 'Portable' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  {
    id: 'q11aHomeType',
    label: '11a. What kind of home is it?',
    type: 'select',
    showIfActivity: 'sealing',
    options: [
      { value: 'house', label: 'House' },
      { value: 'townhouse', label: 'Townhouse' },
      { value: 'apartment', label: 'Apartment' },
    ],
  },
  {
    id: 'q11bOpenFluedGas',
    label:
      '11b. Is there an open-flued or flueless gas heater, or an open-flued gas water heater, inside the home?',
    type: 'select',
    showIfActivity: 'sealing',
    helpText:
      "These are heaters and water heaters that take air from the room or release fumes into it. If you're not sure, choose 'Not sure'.",
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Yes' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
] as const;

export const VIC_ELIGIBILITY_RULES = {
  state: 'vic',
  minBuildingAgeYears: 2,
  maxHouseholdHotWaterSystems: 2,
  minHotWaterContributionFigureId: 'vic-veu-hw-min-contribution',
  gasRuleEffectiveDate: '2027-03-01',
  outOfAreaLink: 'https://www.energy.gov.au/rebates',
  businessLink: 'https://www.energy.vic.gov.au/victorian-energy-upgrades',
  providerListLink: 'https://www.energy.vic.gov.au/victorian-energy-upgrades/find-a-provider',
  heatingCoolingFigureMap: {
    'ducted-gas__ducted': [
      'vic-veu-rcac-ducted-gas-10kw',
      'vic-veu-rcac-ducted-gas-16kw',
      'vic-veu-rcac-ducted-gas-22kw',
    ],
    'ducted-gas__split': [
      'vic-veu-rcac-ducted-gas-4splits',
      'vic-veu-rcac-ducted-gas-multisplit',
    ],
    'room-gas__split': ['vic-veu-rcac-room-gas'],
    'room-gas__ducted': ['vic-veu-rcac-ducted-no-decomm'],
    'central-electric__ducted': ['vic-veu-rcac-central-electric-ducted'],
    'central-electric__split': ['vic-veu-rcac-room-no-decomm'],
    'hardwired-electric__split': ['vic-veu-rcac-hardwired-electric'],
    'hardwired-electric__ducted': ['vic-veu-rcac-ducted-no-decomm'],
    'ducted-rcac__ducted': [
      'vic-veu-rcac-replaced-10kw',
      'vic-veu-rcac-replaced-16kw',
      'vic-veu-rcac-replaced-22kw',
    ],
    'ducted-rcac__split': ['vic-veu-rcac-room-no-decomm'],
    'split-rcac__split': ['vic-veu-rcac-split-replaced'],
    'split-rcac__ducted': ['vic-veu-rcac-ducted-no-decomm'],
    'none__split': ['vic-veu-rcac-room-no-decomm'],
    'none__ducted': ['vic-veu-rcac-ducted-no-decomm'],
  },
  heatingCoolingCopayMap: {
    ducted: ['vic-veu-copay-ducted'],
    ductedToSplits: [
      'vic-veu-copay-multisplit-10kw-plus',
      'vic-veu-copay-multisplit-under-10kw',
      'vic-veu-copay-nonducted-10kw-plus',
      'vic-veu-copay-split-under-10kw',
    ],
    roomSplit: ['vic-veu-copay-split-under-10kw', 'vic-veu-copay-nonducted-10kw-plus'],
    all: [
      'vic-veu-copay-split-under-10kw',
      'vic-veu-copay-nonducted-10kw-plus',
      'vic-veu-copay-multisplit-under-10kw',
      'vic-veu-copay-multisplit-10kw-plus',
      'vic-veu-copay-ducted',
    ],
  },
  hotWaterFigureMap: {
    'mains-gas': ['vic-veu-hw-gas-to-heatpump', 'vic-veu-hw-gas-to-solar'],
    electric: ['vic-veu-hw-electric-to-heatpump', 'vic-veu-hw-electric-to-solar'],
    'broken-solar': [
      'vic-veu-hw-electric-to-heatpump',
      'vic-veu-hw-gas-to-heatpump',
      'vic-veu-hw-electric-to-solar',
      'vic-veu-hw-gas-to-solar',
    ],
    lpg: [],
  },
  sealingFigureMap: {
    apartment: ['vic-veu-sealing-apartment-2yr', 'vic-veu-sealing-apartment-5yr'],
    townhouse: ['vic-veu-sealing-townhouse-2yr', 'vic-veu-sealing-townhouse-5yr'],
    house: ['vic-veu-sealing-house-2yr', 'vic-veu-sealing-house-5yr'],
  },
} as const;
