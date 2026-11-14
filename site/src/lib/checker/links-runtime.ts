import { resolveAreaLinkFromData, type AreaLinksData } from './area-runtime';
import type { LinkKey, ResolvedLink } from './types';

export { resolveAreaLinkFromData, type AreaLinksData };

export interface LinkCatalogEntry {
  label: string;
  specHref: string;
  fallbackKeys?: LinkKey[];
  external: boolean;
  rel?: string;
}

export interface LinksCatalogData extends AreaLinksData {
  businessResultLinks: Record<string, { label: string; url: string }>;
  residentialGuideByRule: Record<string, LinkKey>;
  largeCopayIds: string[];
  linkCatalog: Record<LinkKey, LinkCatalogEntry>;
}

function stripHash(url: string): string {
  const idx = url.indexOf('#');
  return idx === -1 ? url : url.slice(0, idx);
}

export function resolveInternalUrl(
  specHref: string,
  enabledUrls: Set<string>,
  fallbackChain: string[] = ['/victoria/'],
): string {
  const base = stripHash(specHref);
  if (enabledUrls.has(base)) {
    return specHref;
  }
  for (const fb of fallbackChain) {
    const fbBase = stripHash(fb);
    if (enabledUrls.has(fbBase)) {
      return fb;
    }
  }
  return '/victoria/';
}

export function resolveLinkKeyFromData(
  key: LinkKey,
  enabledUrls: Set<string>,
  data: LinksCatalogData,
): ResolvedLink {
  const catalog = data.linkCatalog;
  const entry = catalog[key];
  if (entry.external) {
    return {
      key,
      label: entry.label,
      specHref: entry.specHref,
      href: entry.specHref,
      external: true,
      rel: entry.rel,
    };
  }

  if (enabledUrls.has(stripHash(entry.specHref))) {
    return {
      key,
      label: entry.label,
      specHref: entry.specHref,
      href: entry.specHref,
      external: false,
    };
  }

  const candidateKeys: LinkKey[] = [];
  for (const fbKey of entry.fallbackKeys ?? []) {
    candidateKeys.push(fbKey);
    for (const nestedKey of catalog[fbKey].fallbackKeys ?? []) {
      candidateKeys.push(nestedKey);
    }
  }
  candidateKeys.push('victoria-hub');

  for (const candKey of candidateKeys) {
    const candEntry = catalog[candKey];
    if (!candEntry.external && enabledUrls.has(stripHash(candEntry.specHref))) {
      return {
        key,
        label: candEntry.label,
        specHref: entry.specHref,
        href: candEntry.specHref,
        external: false,
      };
    }
  }

  return {
    key,
    label: catalog['victoria-hub'].label,
    specHref: entry.specHref,
    href: '/victoria/',
    external: false,
  };
}
