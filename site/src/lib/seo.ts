import { SITE } from '../data/site';

export const MAX_RENDERED_TITLE_LENGTH = 60;

export type OgKind = 'default' | 'guide' | 'area' | 'tool' | 'business';

const OG_ALT_BY_KIND: Record<OgKind, string> = {
  default:
    'Household Rebates — Victorian energy upgrade guides. Independent guide, not a government website.',
  guide:
    'Household Rebates — Victorian home energy upgrade guides. Independent guide, not a government website.',
  area:
    'Household Rebates — Victorian council and postcode energy guides. Independent guide, not a government website.',
  tool:
    'Household Rebates — Victorian rebate and upgrade planning tools. Independent guide, not a government website.',
  business:
    'Household Rebates — Victorian business energy upgrade guides. Independent guide, not a government website.',
};

export function resolveOgMeta(kind: OgKind = 'default'): {
  url: string;
  width: string;
  height: string;
  alt: string;
} {
  return {
    url: `${SITE.origin}/og/${kind}.png`,
    width: '1200',
    height: '630',
    alt: OG_ALT_BY_KIND[kind],
  };
}

export function formatRenderedTitle(title: string): string {
  const trimmed = title.trim();
  const withBrand = `${trimmed} | ${SITE.name}`;
  return withBrand.length <= MAX_RENDERED_TITLE_LENGTH ? withBrand : trimmed;
}
