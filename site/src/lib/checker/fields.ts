import { isSolsticePostcode, SOLSTICE_POSTCODE_SET } from './area';
import type {
  CheckerAnswers,
  PostcodeAreaRecord,
} from './types';

export interface FieldOption {
  id: string;
  label: string;
  showWhen?: (answers: CheckerAnswers, area: PostcodeAreaRecord | null) => boolean;
}

export interface FieldDefinition {
  id: keyof CheckerAnswers;
  branch: 'shared' | 'residential' | 'business';
  label: string;
  helper?: string;
  type: 'single' | 'multi' | 'postcode' | 'single-with-count';
  required: boolean;
  options?: FieldOption[];
  showWhen: (
    answers: CheckerAnswers,
    area: PostcodeAreaRecord | null,
    solsticePostcodes?: ReadonlySet<string>,
  ) => boolean;
}

export function shouldShowSh1(answers: CheckerAnswers): boolean {
  if (answers.S1 !== 'residential') return false;
  if (answers.R2a === 'yes') return false;

  const hasHw = Boolean(answers.R6?.includes('hot-water'));
  const hasPv = Boolean(answers.R6?.includes('solar-panels'));
  if (!hasHw && !hasPv) return false;

  if (answers.R3 === 'own-and-live') {
    return true;
  }
  if (answers.R3 === 'building-it' || answers.R3 === 'landlord') {
    return hasPv;
  }
  return false;
}

export const FIELDS: readonly FieldDefinition[] = [
  {
    id: 'S1',
    branch: 'shared',
    label: 'Is this for a home or a business?',
    type: 'single',
    required: true,
    options: [
      {
        id: 'residential',
        label: 'Residential (my home, a rental I own or rent, an apartment)',
      },
      {
        id: 'business',
        label: 'Business (shop, office, factory, farm, school, community building)',
      },
    ],
    showWhen: () => true,
  },

  // 4.1 Residential branch
  {
    id: 'R2',
    branch: 'residential',
    label: "What's the postcode of the property?",
    type: 'postcode',
    required: true,
    showWhen: (a) => a.S1 === 'residential',
  },
  {
    id: 'R2a',
    branch: 'residential',
    label: "Are you a customer of Solstice Energy's compressed natural gas network?",
    type: 'single',
    required: true,
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
      { id: 'not-sure', label: 'Not sure' },
    ],
    showWhen: (a, _area, solsticeSet = SOLSTICE_POSTCODE_SET) =>
      a.S1 === 'residential' && isSolsticePostcode(a.R2, solsticeSet),
  },
  {
    id: 'R3',
    branch: 'residential',
    label: "What's your connection to the property?",
    type: 'single',
    required: true,
    options: [
      { id: 'own-and-live', label: 'I own it and live in it' },
      { id: 'landlord', label: 'I own it and rent it out (landlord)' },
      { id: 'tenant', label: 'I rent it (tenant)' },
      { id: 'owners-corporation', label: 'Owners corporation / body corporate' },
      { id: 'building-it', label: "I'm building it (under construction)" },
    ],
    showWhen: (a) => a.S1 === 'residential',
  },
  {
    id: 'R4',
    branch: 'residential',
    label: 'What type of home is it?',
    type: 'single',
    required: true,
    options: [
      { id: 'house-or-townhouse', label: 'House or townhouse' },
      { id: 'apartment', label: 'Apartment or unit in a multi-storey building' },
      { id: 'other-not-sure', label: 'Other / not sure' },
    ],
    showWhen: (a) => a.S1 === 'residential' && a.R3 !== undefined && a.R3 !== 'building-it',
  },
  {
    id: 'R5',
    branch: 'residential',
    label: 'Is the building more than 2 years old?',
    helper: 'Count from when the home was first finished, not when you moved in.',
    type: 'single',
    required: true,
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
      { id: 'not-sure', label: 'Not sure' },
    ],
    showWhen: (a) => a.S1 === 'residential' && a.R3 !== undefined && a.R3 !== 'building-it',
  },
  {
    id: 'R6',
    branch: 'residential',
    label: 'What would you like to upgrade?',
    type: 'multi',
    required: true,
    options: [
      {
        id: 'heating-cooling',
        label: 'Heating and cooling',
        showWhen: (a) => a.R3 !== 'building-it',
      },
      {
        id: 'hot-water',
        label: 'Hot water',
        showWhen: (a) => a.R3 !== 'building-it',
      },
      {
        id: 'cooktop',
        label: 'Cooktop',
        showWhen: (a) => a.R3 !== 'building-it',
      },
      {
        id: 'ceiling-insulation',
        label: 'Ceiling insulation',
        showWhen: (a) => a.R3 !== 'building-it',
      },
      {
        id: 'draughts',
        label: 'Draughts (weather sealing)',
        showWhen: (a) => a.R3 !== 'building-it',
      },
      {
        id: 'windows',
        label: 'Windows',
        showWhen: (a) => a.R3 !== 'building-it',
      },
      { id: 'solar-panels', label: 'Solar panels' },
      { id: 'home-battery', label: 'Home battery' },
      {
        id: 'appliances',
        label: 'Appliances (fridge, dryer, TV, shower head, energy display)',
        showWhen: (a) => a.R3 !== 'building-it',
      },
    ],
    showWhen: (a) => a.S1 === 'residential',
  },
  {
    id: 'H1',
    branch: 'residential',
    label: 'What heats your home now?',
    type: 'single',
    required: true,
    options: [
      { id: 'ducted-gas-heater', label: 'Ducted gas heater' },
      { id: 'gas-room-heater', label: 'Gas room heater (wall/space)' },
      { id: 'hard-wired-electric-room-heater', label: 'Electric heater hard-wired in a room' },
      { id: 'central-electric-ducted-heater', label: 'Central electric ducted heater' },
      { id: 'reverse-cycle-split-room-unit', label: 'Reverse-cycle split/room unit' },
      { id: 'ducted-reverse-cycle', label: 'Ducted reverse-cycle' },
      { id: 'nothing-portable-only', label: 'Nothing / portable heaters only' },
      { id: 'not-sure', label: 'Not sure' },
    ],
    showWhen: (a) => a.S1 === 'residential' && Boolean(a.R6?.includes('heating-cooling')),
  },
  {
    id: 'H2',
    branch: 'residential',
    label: 'What would you like to install?',
    type: 'single',
    required: true,
    options: [
      { id: 'split-one-room', label: 'Split system(s) (one room)' },
      { id: 'several-splits-or-multi-split', label: 'Several splits or a multi-split' },
      { id: 'ducted-reverse-cycle', label: 'Ducted reverse-cycle' },
    ],
    showWhen: (a) => a.S1 === 'residential' && Boolean(a.R6?.includes('heating-cooling')),
  },
  {
    id: 'H3',
    branch: 'residential',
    label: 'Rough size, if you know it',
    type: 'single',
    required: false,
    options: [
      { id: 'under-10-kw', label: 'Under 10 kW' },
      { id: '10-kw-or-more', label: '10 kW or more' },
      { id: 'not-sure', label: 'Not sure' },
    ],
    showWhen: (a) =>
      a.S1 === 'residential' &&
      Boolean(a.R6?.includes('heating-cooling')) &&
      a.H2 === 'several-splits-or-multi-split',
  },
  {
    id: 'W1',
    branch: 'residential',
    label: 'What hot water system do you have now?',
    type: 'single',
    required: true,
    options: [
      { id: 'gas-mains', label: 'Gas (mains), storage or instant' },
      { id: 'lpg', label: 'LPG (bottled gas)' },
      { id: 'electric-storage', label: 'Electric storage tank' },
      { id: 'solar-working', label: 'Solar, working' },
      { id: 'solar-broken', label: 'Solar, broken/out of warranty' },
      { id: 'heat-pump-already', label: 'Heat pump already' },
      { id: 'not-sure', label: 'Not sure' },
    ],
    showWhen: (a) => a.S1 === 'residential' && Boolean(a.R6?.includes('hot-water')),
  },
  {
    id: 'W2',
    branch: 'residential',
    label: 'Has it stopped working?',
    helper:
      'Under rules currently legislated from 1 March 2027, a failed mains-gas water heater in an existing home must be replaced with an electric system; before then you can still choose.',
    type: 'single',
    required: true,
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
    ],
    showWhen: (a) =>
      a.S1 === 'residential' &&
      Boolean(a.R6?.includes('hot-water')) &&
      (a.W1 === 'gas-mains' || a.W1 === 'lpg'),
  },
  {
    id: 'W3',
    branch: 'residential',
    label: 'What would you like instead?',
    type: 'single',
    required: true,
    options: [
      { id: 'heat-pump', label: 'Heat pump' },
      { id: 'solar-boosted', label: 'Solar-boosted' },
      { id: 'not-sure', label: 'Not sure' },
    ],
    showWhen: (a) =>
      a.S1 === 'residential' &&
      Boolean(a.R6?.includes('hot-water')) &&
      a.W1 !== undefined &&
      a.W1 !== 'heat-pump-already',
  },
  {
    id: 'W4',
    branch: 'residential',
    label: 'Is your current system at least 3 years old?',
    type: 'single',
    required: true,
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
      { id: 'not-sure', label: 'Not sure' },
    ],
    showWhen: (a) =>
      a.S1 === 'residential' &&
      Boolean(a.R6?.includes('hot-water')) &&
      a.R3 === 'own-and-live' &&
      a.R2a !== 'yes',
  },
  {
    id: 'C1',
    branch: 'residential',
    label: 'What cooktop do you have now?',
    type: 'single',
    required: true,
    options: [
      { id: 'gas-mains', label: 'Gas (mains)' },
      { id: 'lpg', label: 'LPG (bottled)' },
      { id: 'electric', label: 'Electric (coil/ceramic)' },
      { id: 'already-induction', label: 'Already induction' },
    ],
    showWhen: (a) => a.S1 === 'residential' && Boolean(a.R6?.includes('cooktop')),
  },
  {
    id: 'I1',
    branch: 'residential',
    label: "What's in your ceiling now?",
    type: 'single',
    required: true,
    options: [
      { id: 'nothing', label: 'Nothing' },
      { id: 'thin-or-patchy', label: 'Thin or patchy (about 90 mm or lower than the joists)' },
      { id: 'thick', label: 'Thick, well-fitted insulation' },
      { id: 'not-sure', label: "Can't access / not sure" },
    ],
    showWhen: (a) =>
      a.S1 === 'residential' &&
      Boolean(a.R6?.includes('ceiling-insulation')) &&
      a.R4 !== 'apartment',
  },
  {
    id: 'I2',
    branch: 'residential',
    label: 'Do you have halogen downlights or any known wiring problems?',
    type: 'single',
    required: true,
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
      { id: 'not-sure', label: 'Not sure' },
    ],
    showWhen: (a) =>
      a.S1 === 'residential' &&
      Boolean(a.R6?.includes('ceiling-insulation')) &&
      a.R4 !== 'apartment' &&
      (a.I1 === 'nothing' || a.I1 === 'thin-or-patchy' || a.I1 === 'not-sure'),
  },
  {
    id: 'G1',
    branch: 'residential',
    label: 'Are your windows single-glazed?',
    type: 'single',
    required: true,
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
      { id: 'some', label: 'Some' },
      { id: 'not-sure', label: 'Not sure' },
    ],
    showWhen: (a) => a.S1 === 'residential' && Boolean(a.R6?.includes('windows')),
  },
  {
    id: 'P1',
    branch: 'residential',
    label: 'Has solar been installed at this address in the last 10 years?',
    type: 'single',
    required: true,
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
      { id: 'not-sure', label: 'Not sure' },
    ],
    showWhen: (a) => a.S1 === 'residential' && Boolean(a.R6?.includes('solar-panels')),
  },
  {
    id: 'BT1',
    branch: 'residential',
    label: 'Do you have solar panels, or are you adding them?',
    type: 'single',
    required: true,
    options: [
      { id: 'have-solar', label: 'Have solar' },
      { id: 'adding-solar-now', label: 'Adding solar now' },
      { id: 'no-solar', label: 'No solar' },
    ],
    showWhen: (a) => a.S1 === 'residential' && Boolean(a.R6?.includes('home-battery')),
  },
  {
    id: 'A1',
    branch: 'residential',
    label: 'Which appliances?',
    type: 'multi',
    required: true,
    options: [
      { id: 'heat-pump-clothes-dryer', label: 'Heat pump clothes dryer' },
      { id: 'fridge-or-freezer', label: 'Fridge or freezer' },
      { id: 'tv', label: 'TV' },
      { id: 'shower-head', label: 'Shower head' },
      { id: 'in-home-energy-display', label: 'In-home energy display' },
    ],
    showWhen: (a) => a.S1 === 'residential' && Boolean(a.R6?.includes('appliances')),
  },
  {
    id: 'SH1',
    branch: 'residential',
    label: 'Is the combined taxable income of all owners below the Solar Victoria household income cap?',
    helper: 'This is a Solar Victoria rule, not a VEU rule.',
    type: 'single',
    required: true,
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
      { id: 'not-sure', label: 'Not sure' },
    ],
    showWhen: (a) => shouldShowSh1(a),
  },
  {
    id: 'SH2',
    branch: 'residential',
    label: 'Is the property valued below the Solar Victoria property value cap?',
    type: 'single',
    required: true,
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
      { id: 'not-sure', label: 'Not sure' },
    ],
    showWhen: (a) => shouldShowSh1(a),
  },
  {
    id: 'SH3',
    branch: 'residential',
    label: 'Has this address already had a Solar Homes rebate for the same thing (or a solar battery rebate)?',
    type: 'single',
    required: true,
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
      { id: 'not-sure', label: 'Not sure' },
    ],
    showWhen: (a) =>
      shouldShowSh1(a) ||
      (a.S1 === 'residential' &&
        a.R2a === 'yes' &&
        (Boolean(a.R6?.includes('hot-water')) || Boolean(a.R6?.includes('solar-panels')))),
  },

  // 4.2 Business branch
  {
    id: 'B2',
    branch: 'business',
    label: 'Postcode of the site',
    type: 'postcode',
    required: true,
    showWhen: (a) => a.S1 === 'business',
  },
  {
    id: 'B3',
    branch: 'business',
    label: 'What kind of site is it?',
    type: 'single',
    required: true,
    options: [
      { id: 'office-or-retail', label: 'Office or retail' },
      { id: 'hospitality-food', label: 'Hospitality / food' },
      { id: 'warehouse-factory-industrial', label: 'Warehouse, factory or industrial' },
      { id: 'farm-agriculture', label: 'Farm or agriculture' },
      {
        id: 'school-hospital-community-nfp',
        label: 'School, hospital, community or not-for-profit',
      },
      {
        id: 'apartment-common-areas',
        label: 'Apartment building common areas (owners corporation)',
      },
      { id: 'council', label: 'Council / public lighting authority' },
    ],
    showWhen: (a) => a.S1 === 'business',
  },
  {
    id: 'B4',
    branch: 'business',
    label: "Is the site on the ESC Register of Scheduled Activity Premises (Victoria's largest energy users)?",
    helper: 'Large energy-consuming sites on the ESC register cannot use VEU unless they opt in.',
    type: 'single',
    required: true,
    options: [
      { id: 'yes-not-opted-in', label: "Yes, and we haven't opted in" },
      { id: 'yes-opted-in', label: "Yes, and we've opted in" },
      { id: 'no', label: 'No' },
      { id: 'not-sure', label: 'Not sure' },
    ],
    showWhen: (a) => a.S1 === 'business' && a.B3 !== undefined && a.B3 !== 'council',
  },
  {
    id: 'B5',
    branch: 'business',
    label: 'Is the building more than 2 years old?',
    type: 'single',
    required: true,
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
      { id: 'not-sure', label: 'Not sure' },
    ],
    showWhen: (a) => a.S1 === 'business' && a.B4 !== 'yes-not-opted-in',
  },
  {
    id: 'B6',
    branch: 'business',
    label: 'What would you like to upgrade?',
    type: 'multi',
    required: true,
    options: [
      {
        id: 'heating-cooling',
        label: 'Heating and cooling',
        showWhen: (a) => a.B4 !== 'yes-not-opted-in',
      },
      {
        id: 'hot-water',
        label: 'Hot water',
        showWhen: (a) => a.B4 !== 'yes-not-opted-in',
      },
      {
        id: 'lighting',
        label: 'Lighting',
        showWhen: (a) => a.B4 !== 'yes-not-opted-in',
      },
      {
        id: 'refrigeration',
        label: 'Refrigeration',
        showWhen: (a) => a.B4 !== 'yes-not-opted-in',
      },
      {
        id: 'motors',
        label: 'Motors',
        showWhen: (a) => a.B4 !== 'yes-not-opted-in',
      },
      {
        id: 'kitchen-spray-valves',
        label: 'Commercial kitchen spray valves',
        showWhen: (a) => a.B4 !== 'yes-not-opted-in',
      },
      {
        id: 'solar-panels',
        label: 'Solar panels (30 kW+)',
        showWhen: (a) => a.B4 !== 'yes-not-opted-in',
      },
      {
        id: 'process-heat',
        label: 'Process heat, steam or boilers',
        showWhen: (a) => a.B4 !== 'yes-not-opted-in',
      },
      {
        id: 'windows',
        label: 'Windows',
        showWhen: (a) => a.B4 !== 'yes-not-opted-in',
      },
      { id: 'battery', label: 'Battery' },
      {
        id: 'heat-pump-dryer',
        label: 'Heat pump clothes dryer',
        showWhen: (a) => a.B4 !== 'yes-not-opted-in',
      },
      {
        id: 'household-only-inquiry',
        label: 'Ceiling insulation, induction cooktop, weather sealing or energy display',
        showWhen: (a) => a.B4 !== 'yes-not-opted-in',
      },
    ],
    showWhen: (a) => a.S1 === 'business',
  },
  {
    id: 'BH1',
    branch: 'business',
    label: 'What heats/cools the space now?',
    type: 'single',
    required: true,
    options: [
      { id: 'ducted-gas', label: 'Ducted gas' },
      { id: 'non-ducted-gas-heater', label: 'Non-ducted gas heater' },
      { id: 'hard-wired-electric-room-heater', label: 'Hard-wired electric room heater' },
      { id: 'central-electric-ducted', label: 'Central electric ducted' },
      { id: 'non-ducted-reverse-cycle', label: 'Non-ducted reverse-cycle' },
      { id: 'ducted-reverse-cycle', label: 'Ducted reverse-cycle' },
      { id: 'nothing', label: 'Nothing' },
    ],
    showWhen: (a) =>
      a.S1 === 'business' &&
      a.B4 !== 'yes-not-opted-in' &&
      Boolean(a.B6?.includes('heating-cooling')),
  },
  {
    id: 'BH2',
    branch: 'business',
    label: 'What would you install?',
    type: 'single',
    required: true,
    options: [
      { id: 'room-split-3-to-9-kw', label: 'Room split 3–9 kW' },
      { id: 'several-splits-multi-split', label: 'Several splits / multi-split' },
      { id: 'ducted-16-kw', label: 'Ducted 16 kW' },
      { id: 'ducted-25-kw', label: '25 kW' },
      { id: 'ducted-32-kw', label: '32 kW' },
      { id: 'ducted-56-kw', label: '56 kW' },
      { id: 'not-sure', label: 'Not sure' },
    ],
    showWhen: (a) =>
      a.S1 === 'business' &&
      a.B4 !== 'yes-not-opted-in' &&
      Boolean(a.B6?.includes('heating-cooling')),
  },
  {
    id: 'BW1',
    branch: 'business',
    label: 'How big is the hot water need?',
    type: 'single-with-count',
    required: true,
    options: [
      { id: 'household-size', label: 'Household-size units (how many? 1–5)' },
      { id: 'larger-ci', label: 'Larger commercial/industrial system' },
    ],
    showWhen: (a) =>
      a.S1 === 'business' &&
      a.B4 !== 'yes-not-opted-in' &&
      Boolean(a.B6?.includes('hot-water')),
  },
  {
    id: 'BW2',
    branch: 'business',
    label: 'Current system',
    type: 'single',
    required: true,
    options: [
      { id: 'gas', label: 'Gas' },
      { id: 'electric', label: 'Electric' },
      { id: 'solar-broken', label: 'Solar (broken)' },
      { id: 'none', label: 'None (new installation)' },
    ],
    showWhen: (a) =>
      a.S1 === 'business' &&
      a.B4 !== 'yes-not-opted-in' &&
      Boolean(a.B6?.includes('hot-water')),
  },
  {
    id: 'BL1',
    branch: 'business',
    label: 'Which lights?',
    type: 'multi',
    required: true,
    options: [
      { id: 'indoor-fluorescent', label: 'Indoor fluorescent tubes' },
      {
        id: 'indoor-other',
        label: 'Indoor other (LED, halogen, metal halide indoors)',
      },
      {
        id: 'outdoor-carpark-sports',
        label: 'Outdoor / car park / sports ground',
      },
      {
        id: 'street-lighting',
        label: 'Street lighting',
        showWhen: (a) => a.B3 === 'council',
      },
    ],
    showWhen: (a) =>
      a.S1 === 'business' &&
      a.B4 !== 'yes-not-opted-in' &&
      Boolean(a.B6?.includes('lighting')),
  },
  {
    id: 'BR1',
    branch: 'business',
    label: 'Which refrigeration?',
    type: 'multi',
    required: true,
    options: [
      { id: 'walk-in-cold-room', label: 'Walk-in cold room' },
      { id: 'fridge-freezer', label: 'Fridge/freezer (household-type)' },
      { id: 'display-cabinets', label: 'Display cabinets' },
      { id: 'refrigeration-fan-motors', label: 'Refrigeration fan motors' },
    ],
    showWhen: (a) =>
      a.S1 === 'business' &&
      a.B4 !== 'yes-not-opted-in' &&
      Boolean(a.B6?.includes('refrigeration')),
  },
  {
    id: 'BR2',
    branch: 'business',
    label: 'Cold room internal floor area',
    type: 'single',
    required: true,
    options: [
      { id: 'under-4-m2', label: 'Under 4 m²' },
      { id: '4-to-9-m2', label: '4–9 m²' },
      { id: 'over-9-to-under-24-m2', label: 'Over 9 to under 24 m²' },
      { id: '24-m2-or-more', label: '24 m² or more' },
    ],
    showWhen: (a) =>
      a.S1 === 'business' &&
      a.B4 !== 'yes-not-opted-in' &&
      Boolean(a.B6?.includes('refrigeration')) &&
      Boolean(a.BR1?.includes('walk-in-cold-room')),
  },
  {
    id: 'BR3',
    branch: 'business',
    label: 'Does it store goods below 7 °C or run as a freezer?',
    type: 'single',
    required: true,
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
    ],
    showWhen: (a) =>
      a.S1 === 'business' &&
      a.B4 !== 'yes-not-opted-in' &&
      Boolean(a.B6?.includes('refrigeration')) &&
      Boolean(a.BR1?.includes('walk-in-cold-room')),
  },
  {
    id: 'BM1',
    branch: 'business',
    label: 'Motor size',
    type: 'single',
    required: true,
    options: [
      { id: 'under-15-kw', label: 'Under 15 kW' },
      { id: '15-to-75-kw', label: '15–75 kW' },
      { id: '75-to-185-kw', label: '75–185 kW' },
      { id: 'over-185-kw', label: 'Over 185 kW' },
    ],
    showWhen: (a) =>
      a.S1 === 'business' &&
      a.B4 !== 'yes-not-opted-in' &&
      Boolean(a.B6?.includes('motors')),
  },
  {
    id: 'BK1',
    branch: 'business',
    label: 'Is a pre-rinse spray valve (or a fitting for one) already installed?',
    type: 'single',
    required: true,
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
    ],
    showWhen: (a) =>
      a.S1 === 'business' &&
      a.B4 !== 'yes-not-opted-in' &&
      Boolean(a.B6?.includes('kitchen-spray-valves')),
  },
  {
    id: 'BP1',
    branch: 'business',
    label: 'Planned solar size',
    type: 'single',
    required: true,
    options: [
      { id: 'under-30-kw', label: 'Under 30 kW' },
      { id: '30-to-50-kw', label: '30–50' },
      { id: '50-to-100-kw', label: '50–100' },
      { id: '100-to-200-kw', label: '100–200' },
      { id: 'over-200-kw', label: 'Over 200 kW' },
    ],
    showWhen: (a) =>
      a.S1 === 'business' &&
      a.B4 !== 'yes-not-opted-in' &&
      Boolean(a.B6?.includes('solar-panels')),
  },
  {
    id: 'BG1',
    branch: 'business',
    label: 'Are the windows single-glazed?',
    type: 'single',
    required: true,
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
      { id: 'some', label: 'Some' },
    ],
    showWhen: (a) =>
      a.S1 === 'business' &&
      a.B4 !== 'yes-not-opted-in' &&
      Boolean(a.B6?.includes('windows')),
  },
  {
    id: 'BB1',
    branch: 'business',
    label: 'Is the battery 5 to 100 kWh and connected to new or existing solar panels?',
    type: 'single',
    required: false,
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
    ],
    showWhen: (a) => a.S1 === 'business' && Boolean(a.B6?.includes('battery')),
  },
];

export function getVisibleFields(
  answers: CheckerAnswers,
  area: PostcodeAreaRecord | null,
  solsticePostcodes: ReadonlySet<string> = SOLSTICE_POSTCODE_SET,
): FieldDefinition[] {
  return FIELDS.filter((f) => f.showWhen(answers, area, solsticePostcodes));
}
