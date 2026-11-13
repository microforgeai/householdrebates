import { SITE } from '../data/site';

export function ensureTrailingSlash(path: string): string {
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  if (path.endsWith('.html') || path.endsWith('.txt') || path.endsWith('.xml')) {
    return path;
  }
  return path.endsWith('/') ? path : `${path}/`;
}

export function canonicalUrl(pathname: string): string {
  const cleanPath = ensureTrailingSlash(pathname);
  return `${SITE.origin}${cleanPath}`;
}

export function resolveSlugToPath(slug: string): { path: string; label: string } {
  const map: Record<string, { path: string; label: string }> = {
    home: { path: '/', label: 'Victorian Energy Upgrades (VEU) Rebate Guide' },
    'air-conditioner-rebate': {
      path: '/victoria/air-conditioner-rebate/',
      label: 'Air Conditioner Rebate Victoria (2026 Guide)',
    },
    'heat-pump-rebate': {
      path: '/victoria/heat-pump-rebate/',
      label: 'Heat Pump Hot Water Rebate Victoria (2026 Guide)',
    },
    'reverse-cycle-vs-gas-heater': {
      path: '/victoria/reverse-cycle-vs-gas-heater/',
      label: 'Reverse-Cycle vs Gas Heater: The VEU Timing Rule',
    },
    'gas-to-electric-hot-water-2027': {
      path: '/victoria/gas-to-electric-hot-water-2027/',
      label: 'Victoria 1 March 2027 Gas to Electric Hot Water Rule',
    },
    'eligibility-checker': {
      path: '/victoria/eligibility-checker/',
      label: 'Victoria Rebate Eligibility Checker',
    },
    melbourne: {
      path: '/victoria/melbourne/',
      label: 'Melbourne VEU Heating, Cooling & Hot Water Discounts',
    },
    geelong: {
      path: '/victoria/geelong/',
      label: 'Geelong VEU Heating, Cooling & Hot Water Discounts',
    },
    frankston: {
      path: '/victoria/frankston/',
      label: 'Frankston VEU Heating, Cooling & Hot Water Discounts',
    },
    'mornington-peninsula': {
      path: '/victoria/mornington-peninsula/',
      label: 'Mornington Peninsula VEU Heating, Cooling & Hot Water Discounts',
    },
    'how-quotes-work': {
      path: '/how-quotes-work/',
      label: 'How Quotes, Installers and Consumer Rights Work',
    },
    faq: {
      path: '/faq/',
      label: 'Frequently Asked Questions',
    },
    about: {
      path: '/about/',
      label: 'About Household Rebates',
    },
    sources: {
      path: '/sources/',
      label: 'Official Sources and Editorial Method',
    },
    privacy: {
      path: '/privacy/',
      label: 'Privacy Policy and Collection Notice',
    },
    terms: {
      path: '/terms/',
      label: 'Website Terms of Use',
    },
  };

  return (
    map[slug] ?? {
      path: ensureTrailingSlash(slug),
      label: slug.replace(/-/g, ' '),
    }
  );
}
