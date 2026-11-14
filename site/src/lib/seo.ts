import { SITE } from '../data/site';

export const MAX_RENDERED_TITLE_LENGTH = 60;

export function formatRenderedTitle(title: string): string {
  const trimmed = title.trim();
  const withBrand = `${trimmed} | ${SITE.name}`;
  return withBrand.length <= MAX_RENDERED_TITLE_LENGTH ? withBrand : trimmed;
}
