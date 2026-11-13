export const SITE = {
  name: 'Household Rebates',
  domain: 'householdrebates.com.au',
  origin: 'https://householdrebates.com.au',
  publisher: {
    legalName: 'Agenor Services Pty Ltd',
    abn: '29 644 447 263',
    abnDigits: '29644447263',
    author: 'Gurinder Singh',
    location: 'Melbourne, Victoria, Australia',
    email: 'info@householdrebates.com.au',
    privacyEmail: 'privacy@householdrebates.com.au',
    sameAs: [
      'https://www.agenorit.com.au',
    ],
  },
  flags: {
    leadsEnabled: process.env.PUBLIC_LEADS_ENABLED === 'true',
    solarSectionEnabled: process.env.SOLAR_SECTION_ENABLED === 'true',
    maxFigureAgeDays: Number(process.env.MAX_FIGURE_AGE_DAYS || 45),
  },
} as const;
