import type { LinkKey, PostcodeAreaRecord, ResolvedLink } from './types';

export interface LinkCatalogEntry {
  label: string;
  specHref: string;
  fallbackKeys?: LinkKey[];
  external: boolean;
  rel?: string;
}

export interface LinksCatalogData {
  northWestCorridorPostcodes: string[];
  specificLgaAreaUrls: Record<string, { url: string; label: string }>;
  metroHubByLga: Record<string, { url: string; label: string }>;
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

export function resolveAreaLinkFromData(
  record: PostcodeAreaRecord,
  enabledUrls: Set<string>,
  data: LinksCatalogData,
): ResolvedLink {
  const candidates: { url: string; label: string }[] = [];

  if (data.northWestCorridorPostcodes.includes(record.postcode)) {
    candidates.push({
      url: '/victoria/north-west-corridor/',
      label: 'More about the North-West Corridor',
    });
  }

  const specific = data.specificLgaAreaUrls[record.primary_lga];
  if (specific) {
    candidates.push(specific);
  }

  const hub = data.metroHubByLga[record.primary_lga];
  if (hub && (!specific || specific.url !== hub.url)) {
    candidates.push(hub);
  }

  const specCandidate =
    candidates[0] ??
    ({
      url: '/victoria/postcode/',
      label: 'Check Victorian VEU postcodes',
    } as const);

  for (const cand of candidates) {
    if (enabledUrls.has(cand.url)) {
      return {
        label: cand.label,
        specHref: specCandidate.url,
        href: cand.url,
        external: false,
      };
    }
  }

  if (enabledUrls.has('/victoria/postcode/')) {
    return {
      label: 'Check Victorian VEU postcodes',
      specHref: specCandidate.url,
      href: '/victoria/postcode/',
      external: false,
    };
  }

  return {
    label: 'Browse Victorian rebate guides',
    specHref: specCandidate.url,
    href: '/victoria/',
    external: false,
  };
}
