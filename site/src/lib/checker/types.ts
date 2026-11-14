import type { FigureData } from '../figures';

export type BranchChoice = 'residential' | 'business';
export type YesNo = 'yes' | 'no';
export type YesNoNotSure = 'yes' | 'no' | 'not-sure';

export type ResidentialRelationship =
  | 'own-and-live'
  | 'landlord'
  | 'tenant'
  | 'owners-corporation'
  | 'building-it';

export type HomeType = 'house-or-townhouse' | 'apartment' | 'other-not-sure';

export type ResidentialUpgrade =
  | 'heating-cooling'
  | 'hot-water'
  | 'cooktop'
  | 'ceiling-insulation'
  | 'draughts'
  | 'windows'
  | 'solar-panels'
  | 'home-battery'
  | 'appliances';

export type ResidentialCurrentHeater =
  | 'ducted-gas-heater'
  | 'gas-room-heater'
  | 'hard-wired-electric-room-heater'
  | 'central-electric-ducted-heater'
  | 'reverse-cycle-split-room-unit'
  | 'ducted-reverse-cycle'
  | 'nothing-portable-only'
  | 'not-sure';

export type ResidentialNewHeater =
  | 'split-one-room'
  | 'several-splits-or-multi-split'
  | 'ducted-reverse-cycle';

export type MultiSplitSizeBand = 'under-10-kw' | '10-kw-or-more' | 'not-sure';

export type ResidentialCurrentHotWater =
  | 'gas-mains'
  | 'lpg'
  | 'electric-storage'
  | 'solar-working'
  | 'solar-broken'
  | 'heat-pump-already'
  | 'not-sure';

export type ResidentialNewHotWater = 'heat-pump' | 'solar-boosted' | 'not-sure';

export type CurrentCooktop = 'gas-mains' | 'lpg' | 'electric' | 'already-induction';

export type CurrentInsulation = 'nothing' | 'thin-or-patchy' | 'thick' | 'not-sure';

export type SingleGlazedChoice = 'yes' | 'no' | 'some' | 'not-sure';

export type BatterySolarStatus = 'have-solar' | 'adding-solar-now' | 'no-solar';

export type ResidentialAppliance =
  | 'heat-pump-clothes-dryer'
  | 'fridge-or-freezer'
  | 'tv'
  | 'shower-head'
  | 'in-home-energy-display';

export type BusinessSiteType =
  | 'office-or-retail'
  | 'hospitality-food'
  | 'warehouse-factory-industrial'
  | 'farm-agriculture'
  | 'school-hospital-community-nfp'
  | 'apartment-common-areas'
  | 'council';

export type ScheduledPremisesStatus =
  | 'yes-not-opted-in'
  | 'yes-opted-in'
  | 'no'
  | 'not-sure';

export type BusinessActivity =
  | 'heating-cooling'
  | 'hot-water'
  | 'lighting'
  | 'refrigeration'
  | 'motors'
  | 'kitchen-spray-valves'
  | 'solar-panels'
  | 'process-heat'
  | 'windows'
  | 'battery'
  | 'heat-pump-dryer'
  | 'household-only-inquiry';

export type BusinessHouseholdOnlyItem =
  | 'ceiling-insulation'
  | 'induction-cooktop'
  | 'weather-sealing'
  | 'in-home-display';

export type BusinessCurrentHeater =
  | 'ducted-gas'
  | 'non-ducted-gas-heater'
  | 'hard-wired-electric-room-heater'
  | 'central-electric-ducted'
  | 'non-ducted-reverse-cycle'
  | 'ducted-reverse-cycle'
  | 'nothing';

export type BusinessNewHeater =
  | 'room-split-3-to-9-kw'
  | 'several-splits-multi-split'
  | 'ducted-16-kw'
  | 'ducted-25-kw'
  | 'ducted-32-kw'
  | 'ducted-56-kw'
  | 'not-sure';

export type BusinessHotWaterScale = 'household-size' | 'larger-ci';

export type BusinessCurrentHotWater = 'gas' | 'electric' | 'solar-broken' | 'none';

export type BusinessLightingType =
  | 'indoor-fluorescent'
  | 'indoor-other'
  | 'outdoor-carpark-sports'
  | 'street-lighting';

export type BusinessRefrigerationType =
  | 'walk-in-cold-room'
  | 'fridge-freezer'
  | 'display-cabinets'
  | 'refrigeration-fan-motors';

export type ColdRoomAreaBand =
  | 'under-4-m2'
  | '4-to-9-m2'
  | 'over-9-to-under-24-m2'
  | '24-m2-or-more';

export type MotorSizeBand =
  | 'under-15-kw'
  | '15-to-75-kw'
  | '75-to-185-kw'
  | 'over-185-kw';

export type BusinessSolarBand =
  | 'under-30-kw'
  | '30-to-50-kw'
  | '50-to-100-kw'
  | '100-to-200-kw'
  | 'over-200-kw';

export type BusinessSingleGlazedChoice = 'yes' | 'no' | 'some';

export interface CheckerAnswers {
  S1?: BranchChoice;

  // Residential branch
  R2?: string;
  R2a?: YesNoNotSure;
  R3?: ResidentialRelationship;
  R4?: HomeType;
  R5?: YesNoNotSure;
  R6?: ResidentialUpgrade[];
  H1?: ResidentialCurrentHeater;
  H2?: ResidentialNewHeater;
  H3?: MultiSplitSizeBand;
  W1?: ResidentialCurrentHotWater;
  W2?: YesNo;
  W3?: ResidentialNewHotWater;
  W4?: YesNoNotSure;
  C1?: CurrentCooktop;
  I1?: CurrentInsulation;
  I2?: YesNoNotSure;
  G1?: SingleGlazedChoice;
  P1?: YesNoNotSure;
  BT1?: BatterySolarStatus;
  A1?: ResidentialAppliance[];
  SH1?: YesNoNotSure;
  SH2?: YesNoNotSure;
  SH3?: YesNoNotSure;

  // Business branch
  B2?: string;
  B3?: BusinessSiteType;
  B4?: ScheduledPremisesStatus;
  B5?: YesNoNotSure;
  B6?: BusinessActivity[];
  BResItems?: BusinessHouseholdOnlyItem[];
  BH1?: BusinessCurrentHeater;
  BH2?: BusinessNewHeater;
  BW1?: BusinessHotWaterScale;
  BW1Count?: number;
  BW2?: BusinessCurrentHotWater;
  BL1?: BusinessLightingType[];
  BR1?: BusinessRefrigerationType[];
  BR2?: ColdRoomAreaBand;
  BR3?: YesNo;
  BM1?: MotorSizeBand;
  BK1?: YesNo;
  BP1?: BusinessSolarBand;
  BP1ExactKw?: 50 | 75 | 100 | 150 | 200;
  BG1?: BusinessSingleGlazedChoice;
  BB1?: YesNo;
}

export interface OtherLgaShare {
  lga: string;
  pct: number;
}

export interface PostcodeAreaRecord {
  postcode: string;
  veu_area: 'Metropolitan' | 'Regional';
  reticulated_gas: boolean;
  veu_climatic_region: 'Mild' | 'Cold' | 'Hot';
  heat_pump_zone: 4 | 5;
  localities: string;
  localitiesList: string[];
  primary_lga: string;
  primary_lga_share_pct: number | null;
  other_lgas: OtherLgaShare[];
}

export interface PostcodesDataset {
  source: string;
  specVersion: string;
  checkedOn: string;
  rows: Record<string, PostcodeAreaRecord>;
}

export type MessageId =
  | 'X1'
  | 'N-AGE'
  | 'N-HW-EFF'
  | 'N-COOK'
  | 'N-INS-SAFE'
  | 'N-INS-R2'
  | 'N-GLAZE'
  | 'N-SEAL-GAS'
  | 'N-SH-INC'
  | 'N-SH-PROP'
  | 'N-SH-DUP'
  | 'N-SH-AGE'
  | 'N-SH-TENURE'
  | 'N-PV-10Y'
  | 'N-BAT-SOLAR'
  | 'N-SCHED'
  | 'N-LIGHT'
  | 'N-COLD'
  | 'N-PRV'
  | 'N-PV-30'
  | 'N-BIZ-RES'
  | 'N-NONE';

export type RuleStatus = 'likely' | 'possibly' | 'not-eligible' | 'info';
export type ProgramGroup = 'veu' | 'solar-homes' | 'federal';

export type LinkKey =
  | 'find-provider'
  | 'guide-ac-rebate'
  | 'guide-gas-room-to-split'
  | 'guide-ducted-gas-to-ducted'
  | 'guide-ducted-gas-to-splits'
  | 'guide-electric-to-rcac'
  | 'guide-heat-pump'
  | 'guide-gas-hw-to-hp'
  | 'guide-electric-hw-to-hp'
  | 'guide-solar-hw'
  | 'guide-cooktop-induction'
  | 'guide-ceiling-insulation'
  | 'guide-draught-proofing'
  | 'veu-copayment'
  | 'veu-vs-solar-homes'
  | 'can-claim-twice'
  | 'veu-scams'
  | 'retrospective-discount'
  | 'renters'
  | 'landlords-2027'
  | 'new-homes-2027'
  | 'apartments-and-units'
  | 'gas-hw-broken-2027'
  | 'gas-hw-ban-exemptions'
  | 'solstice-towns'
  | 'get-off-gas-planner'
  | 'gas-no-lpg'
  | 'hw-size-guide'
  | 'postcode-lookup'
  | 'victoria-hub'
  | 'business-hub'
  | 'business-heating-cooling'
  | 'business-led-lighting'
  | 'business-cold-rooms'
  | 'business-hot-water-motors'
  | 'solarvic-hw-external'
  | 'solarvic-pv-external'
  | 'dcceew-battery-external'
  | 'energyvic-business-external'
  | 'energyvic-custom-external';

export interface ResolvedLink {
  key?: LinkKey;
  label: string;
  specHref: string;
  href: string;
  external: boolean;
  rel?: string;
}

export interface SourceMeta {
  id: string;
  title: string;
  publisher: string;
  url: string;
  official: boolean;
  checkedOn: string;
}

export interface EvaluatedFigure {
  id: string;
  formatted: string;
  scenario: string;
  kind: FigureData['kind'];
  basis: FigureData['basis'];
  method?: string;
  sourceId: string;
  checkedOn: string;
  jurisdiction?: FigureData['jurisdiction'];
}

export interface EvaluatedMessage {
  id: MessageId;
  text: string;
  links: ResolvedLink[];
}

export interface EvaluatedLine {
  ruleId: string;
  programGroup: ProgramGroup;
  programLabel: 'VEU (Victoria)' | 'Solar Homes (Victoria)' | 'FEDERAL';
  status: RuleStatus;
  title: string;
  why: string;
  notes: string[];
  figureIds: string[];
  figures: EvaluatedFigure[];
  coPayFigureIds: string[];
  coPayFigures: EvaluatedFigure[];
  message?: EvaluatedMessage;
  sourceIds: string[];
  sources: SourceMeta[];
  links: ResolvedLink[];
}

export interface GlobalModifierResult {
  ruleId: string;
  placement: 'top' | 'footer' | 'inline';
  status: RuleStatus;
  text: string;
  message?: EvaluatedMessage;
  sourceIds: string[];
  links: ResolvedLink[];
}

export interface AreaCard {
  postcode: string;
  summaryText: string;
  localitiesDisplay: string;
  lgaDisplay: string;
  veuArea: 'Metropolitan' | 'Regional';
  reticulatedGas: boolean;
  climaticRegion: 'Mild' | 'Cold' | 'Hot';
  heatPumpZone: 4 | 5;
  insulationFigureId: string | null;
  areaLink: ResolvedLink;
  specCheckedOn: string;
}

export interface CheckerEvaluationContext {
  postcodes: PostcodesDataset;
  figures: Map<string, FigureData>;
  sources: Map<string, SourceMeta>;
  enabledUrls: Set<string>;
  solsticePostcodes?: ReadonlySet<string>;
}

export interface CheckerResult {
  validPostcode: boolean;
  branch: BranchChoice;
  postcodeError?: EvaluatedMessage;
  areaCard: AreaCard | null;
  lines: EvaluatedLine[];
  veuLines: EvaluatedLine[];
  solarHomesLines: EvaluatedLine[];
  federalLines: EvaluatedLine[];
  ineligibleLines: EvaluatedLine[];
  modifiers: GlobalModifierResult[];
  banners: EvaluatedLine[];
  allIneligibleMessage?: EvaluatedMessage;
  ctas: {
    primary: ResolvedLink[];
    secondary: ResolvedLink[];
    area?: ResolvedLink;
  };
  firedRuleIds: string[];
  oldestCheckedOn: string;
}
