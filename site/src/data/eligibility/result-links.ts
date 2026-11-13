export type ResultLinkKey =
  | 'retro'
  | 'rcac'
  | 'hotwater'
  | 'insulation'
  | 'induction'
  | 'sealing'
  | 'gas-2027';

export interface ResultLinkEntry {
  internal?: string;
  external: {
    sourceId: string;
  };
}

export const RESULT_LINKS: Record<ResultLinkKey, ResultLinkEntry> = {
  retro: {
    external: { sourceId: 'energyvic-retrospective' },
  },
  rcac: {
    internal: '/victoria/air-conditioner-rebate/',
    external: { sourceId: 'energyvic-heating-cooling' },
  },
  hotwater: {
    internal: '/victoria/heat-pump-rebate/',
    external: { sourceId: 'energyvic-hot-water' },
  },
  insulation: {
    external: { sourceId: 'energyvic-insulation' },
  },
  induction: {
    external: { sourceId: 'energyvic-induction' },
  },
  sealing: {
    external: { sourceId: 'energyvic-weather-sealing' },
  },
  'gas-2027': {
    internal: '/victoria/gas-to-electric-hot-water-2027/',
    external: { sourceId: 'energyvic-electrification' },
  },
};
