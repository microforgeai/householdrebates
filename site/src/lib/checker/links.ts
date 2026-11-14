import linksJson from './links-data.json' with { type: 'json' };
import {
  resolveAreaLinkFromData,
  resolveInternalUrl,
  resolveLinkKeyFromData,
  type LinkCatalogEntry,
  type LinksCatalogData,
} from './links-runtime';
import type { LinkKey, PostcodeAreaRecord, ResolvedLink } from './types';

export {
  resolveAreaLinkFromData,
  resolveInternalUrl,
  resolveLinkKeyFromData,
  type LinkCatalogEntry,
  type LinksCatalogData,
};

export const LINKS_DATA: LinksCatalogData = linksJson as unknown as LinksCatalogData;

export const NORTH_WEST_CORRIDOR_POSTCODES: ReadonlySet<string> = new Set(
  LINKS_DATA.northWestCorridorPostcodes,
);
export const SPECIFIC_LGA_AREA_URLS: Readonly<Record<string, { url: string; label: string }>> =
  LINKS_DATA.specificLgaAreaUrls;
export const METRO_HUB_BY_LGA: Readonly<Record<string, { url: string; label: string }>> =
  LINKS_DATA.metroHubByLga;
export const BUSINESS_RESULT_LINKS: Record<string, { label: string; url: string }> =
  LINKS_DATA.businessResultLinks;
export const LINK_CATALOG: Readonly<Record<LinkKey, LinkCatalogEntry>> =
  LINKS_DATA.linkCatalog;

export function resolveLinkKey(key: LinkKey, enabledUrls: Set<string>): ResolvedLink {
  return resolveLinkKeyFromData(key, enabledUrls, LINKS_DATA);
}

export function resolveAreaLink(
  record: PostcodeAreaRecord,
  enabledUrls: Set<string>,
): ResolvedLink {
  return resolveAreaLinkFromData(record, enabledUrls, LINKS_DATA);
}
