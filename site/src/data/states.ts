export type StateCode = 'vic' | 'nsw' | 'qld' | 'sa' | 'wa' | 'tas' | 'act' | 'nt' | 'national';

export interface StateMeta {
  code: StateCode;
  name: string;
  slug: string;
  enabled: boolean;
  programName: string;
}

export const STATES: Record<StateCode, StateMeta> = {
  vic: {
    code: 'vic',
    name: 'Victoria',
    slug: 'victoria',
    enabled: true,
    programName: 'Victorian Energy Upgrades (VEU)',
  },
  nsw: {
    code: 'nsw',
    name: 'New South Wales',
    slug: 'nsw',
    enabled: false,
    programName: 'NSW Energy Savings Scheme (ESS)',
  },
  qld: {
    code: 'qld',
    name: 'Queensland',
    slug: 'qld',
    enabled: false,
    programName: 'Queensland rebates',
  },
  sa: {
    code: 'sa',
    name: 'South Australia',
    slug: 'sa',
    enabled: false,
    programName: 'Retailer Energy Productivity Scheme (REPS)',
  },
  wa: {
    code: 'wa',
    name: 'Western Australia',
    slug: 'wa',
    enabled: false,
    programName: 'WA energy rebates',
  },
  tas: {
    code: 'tas',
    name: 'Tasmania',
    slug: 'tas',
    enabled: false,
    programName: 'Tasmania energy rebates',
  },
  act: {
    code: 'act',
    name: 'Australian Capital Territory',
    slug: 'act',
    enabled: false,
    programName: 'Sustainable Household Scheme',
  },
  nt: {
    code: 'nt',
    name: 'Northern Territory',
    slug: 'nt',
    enabled: false,
    programName: 'NT energy rebates',
  },
  national: {
    code: 'national',
    name: 'Australia',
    slug: 'australia',
    enabled: true,
    programName: 'Commonwealth programs',
  },
};
