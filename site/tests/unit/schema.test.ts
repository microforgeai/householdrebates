import { describe, expect, it } from 'vitest';
import {
  getDefaultPeopleData,
  getSignedPageReviews,
  isAuthorBioReady,
  resolveAuthorProfile,
  validatePeoplePublishingRules,
  type PeopleData,
} from '../../src/lib/people';
import { buildJsonLdGraph, validateSchemaGraph } from '../../src/lib/schema';

const PLACEHOLDER_PEOPLE: PeopleData = {
  'gurinder-singh': {
    name: 'Gurinder Singh',
    role: 'Editor, Household Rebates; director, Agenor Services Pty Ltd',
    bio: '<<GURI_BIO: 2–4 sentences, from Guri>>',
    credentials: '<<GURI_CREDENTIALS: from Guri, or remove the field>>',
    image: '<<GURI_PHOTO: path, or remove>>',
    sameAs: ['<<GURI_PROFILE_URLS: from Guri, e.g. LinkedIn; or empty>>'],
  },
  reviewers: [],
};

const FILLED_PEOPLE: PeopleData = {
  'gurinder-singh': {
    name: 'Gurinder Singh',
    role: 'Editor, Household Rebates; director, Agenor Services Pty Ltd',
    bio: 'Gurinder Singh edits Household Rebates and verifies every Victorian rebate figure against official program publications.',
    sameAs: ['https://www.linkedin.com/company/agenor-services'],
  },
  reviewers: [
    {
      id: 'alex-chen',
      name: 'Alex Chen',
      licence: {
        type: 'VBA Licensed Plumber',
        number: '99887',
      },
      scope: ['hot-water'],
      paidInstaller: false,
      agreementSignedOn: '2026-11-14',
      reviewedPages: [{ url: '/victoria/heat-pump-hot-water-rebate/', date: '2026-11-14' }],
    },
  ],
};

describe('JSON-LD Schema Builder and Validator', () => {
  it('builds valid Organization, WebSite, BreadcrumbList, FAQPage, and HowTo graph', () => {
    const graph = buildJsonLdGraph({
      pathname: '/how-quotes-work/',
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'How Quotes Work', path: '/how-quotes-work/' },
      ],
      faqs: [
        {
          question: 'Are cold calls banned?',
          answer: 'Yes, cold calls are banned under the VEU code of conduct without prior consent.',
        },
      ],
      howTo: {
        name: 'How to get a quote',
        steps: [
          { name: 'Step 1', text: 'Check system' },
          { name: 'Step 2', text: 'Contact provider' },
          { name: 'Step 3', text: 'Review quote' },
        ],
      },
    });

    const nodes = graph['@graph'] as Record<string, unknown>[];
    expect(nodes.map((n) => n['@type'])).toEqual([
      'Organization',
      'WebSite',
      'BreadcrumbList',
      'FAQPage',
      'HowTo',
    ]);
  });

  it('builds guide Article + WebPage + Person without author page URL while bio is a placeholder', () => {
    const graph = buildJsonLdGraph({
      pathname: '/victoria/air-conditioner-rebate/',
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'Victoria', path: '/victoria/' },
        { name: 'Air conditioner discount', path: '/victoria/air-conditioner-rebate/' },
      ],
      pageSchema: {
        kind: 'guide',
        headline: 'Victorian air conditioner discount (VEU)',
        description: 'Indicative Victorian Energy Upgrades discounts for reverse-cycle air conditioners.',
        publishedOn: new Date('2026-11-13T00:00:00Z'),
        updatedOn: new Date('2026-11-14T00:00:00Z'),
        people: PLACEHOLDER_PEOPLE,
      },
    });

    const serialized = JSON.stringify(graph);
    expect(serialized).not.toContain('<<');
    expect(serialized).not.toContain('/about/gurinder-singh/');
    expect(serialized).not.toContain('reviewedBy');

    const nodes = graph['@graph'] as Record<string, unknown>[];
    expect(nodes.map((n) => n['@type'])).toEqual([
      'Organization',
      'WebSite',
      'BreadcrumbList',
      'WebPage',
      'Person',
      'Article',
    ]);

    const article = nodes.find((n) => n['@type'] === 'Article')!;
    expect(article.mainEntityOfPage).toEqual({
      '@id': 'https://householdrebates.com.au/victoria/air-conditioner-rebate/#webpage',
    });
    expect(article.author).toEqual({
      '@id': 'https://householdrebates.com.au/#person-gurinder-singh',
    });
  });

  it('emits signed reviewedBy + lastReviewed on WebPage (never Article) when a reviewer has signed', () => {
    const graph = buildJsonLdGraph({
      pathname: '/victoria/heat-pump-hot-water-rebate/',
      pageSchema: {
        kind: 'guide',
        headline: 'Heat pump hot water rebate in Victoria',
        description: 'Combined VEU and Solar Homes rebates for heat pump hot water in Victoria.',
        publishedOn: '2026-11-13',
        updatedOn: '2026-11-14',
        people: FILLED_PEOPLE,
      },
    });

    const nodes = graph['@graph'] as Record<string, unknown>[];
    const webPage = nodes.find((n) => n['@type'] === 'WebPage')!;
    const article = nodes.find((n) => n['@type'] === 'Article')!;
    const authorPerson = nodes.find(
      (n) => n['@id'] === 'https://householdrebates.com.au/#person-gurinder-singh',
    )!;
    const reviewerPerson = nodes.find(
      (n) => n['@id'] === 'https://householdrebates.com.au/#reviewer-alex-chen',
    )!;

    expect(webPage.reviewedBy).toEqual({
      '@id': 'https://householdrebates.com.au/#reviewer-alex-chen',
    });
    expect(webPage.lastReviewed).toBe('2026-11-14');
    expect(article.reviewedBy).toBeUndefined();
    expect(authorPerson.url).toBe('https://householdrebates.com.au/about/gurinder-singh/');
    expect(reviewerPerson.identifier).toEqual({
      '@type': 'PropertyValue',
      propertyID: 'VBA Licensed Plumber',
      value: '99887',
    });
  });

  it('omits ProfilePage and Person on /about/gurinder-singh/ while bio is placeholder, and emits both once bio is supplied', () => {
    const noindexGraph = buildJsonLdGraph({
      pathname: '/about/gurinder-singh/',
      pageSchema: {
        kind: 'author',
        headline: 'Gurinder Singh — Editor, Household Rebates',
        description: 'How Household Rebates checks Victorian rebate figures and discloses conflicts.',
        publishedOn: '2026-11-14',
        updatedOn: '2026-11-14',
        people: PLACEHOLDER_PEOPLE,
      },
    });
    const noindexTypes = (noindexGraph['@graph'] as Record<string, unknown>[]).map(
      (n) => n['@type'],
    );
    expect(noindexTypes).not.toContain('Person');
    expect(noindexTypes).not.toContain('ProfilePage');

    const liveGraph = buildJsonLdGraph({
      pathname: '/about/gurinder-singh/',
      pageSchema: {
        kind: 'author',
        headline: 'Gurinder Singh — Editor, Household Rebates',
        description: 'How Household Rebates checks Victorian rebate figures and discloses conflicts.',
        publishedOn: '2026-11-14',
        updatedOn: '2026-11-14',
        people: FILLED_PEOPLE,
      },
    });
    const liveNodes = liveGraph['@graph'] as Record<string, unknown>[];
    expect(liveNodes.map((n) => n['@type'])).toContain('Person');
    expect(liveNodes.map((n) => n['@type'])).toContain('ProfilePage');
    const profilePage = liveNodes.find((n) => n['@type'] === 'ProfilePage')!;
    expect(profilePage.mainEntity).toEqual({
      '@id': 'https://householdrebates.com.au/#person-gurinder-singh',
    });
  });

  it('builds WebApplication on tools with UtilitiesApplication, isAccessibleForFree, and no offers', () => {
    const graph = buildJsonLdGraph({
      pathname: '/victoria/eligibility-checker/',
      pageSchema: {
        kind: 'tool',
        headline: 'Victorian rebate eligibility checker',
        description: 'Check indicative Victorian Energy Upgrades and Solar Homes eligibility.',
        publishedOn: '2026-11-13',
        updatedOn: '2026-11-14',
        people: PLACEHOLDER_PEOPLE,
      },
    });

    const nodes = graph['@graph'] as Record<string, unknown>[];
    const webApp = nodes.find((n) => n['@type'] === 'WebApplication')!;
    expect(webApp).toBeDefined();
    expect(webApp.applicationCategory).toBe('UtilitiesApplication');
    expect(webApp.operatingSystem).toBe('Any');
    expect(webApp.isAccessibleForFree).toBe(true);
    expect(webApp.publisher).toEqual({ '@id': 'https://householdrebates.com.au/#publisher' });
    expect('offers' in webApp).toBe(false);
  });

  it('rejects any currency figure, <<placeholder>>, offers property, disallowed @type, or unsigned reviewedBy in JSON-LD', () => {
    expect(() =>
      buildJsonLdGraph({
        pathname: '/faq/',
        faqs: [
          {
            question: 'How much is the discount?',
            answer: 'Up to $5,530 for ducted gas replacements.',
          },
        ],
      }),
    ).toThrow(/currency amounts/);

    expect(() =>
      validateSchemaGraph({
        '@context': 'https://schema.org',
        '@graph': [{ '@type': 'Person', name: '<<GURI_BIO>>' }],
      }),
    ).toThrow(/placeholders/);

    expect(() =>
      validateSchemaGraph({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: 'Checker',
            offers: { '@type': 'Offer' },
          },
        ],
      }),
    ).toThrow(/offers/);

    expect(() =>
      validateSchemaGraph({
        '@context': 'https://schema.org',
        '@graph': [{ '@type': 'LocalBusiness', name: 'Bad Type' }],
      }),
    ).toThrow(/Disallowed JSON-LD @type/);

    expect(() =>
      validateSchemaGraph(
        {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebPage',
              reviewedBy: { '@id': 'https://householdrebates.com.au/#reviewer-unsigned' },
            },
          ],
        },
        { pathname: '/victoria/heat-pump-hot-water-rebate/', people: PLACEHOLDER_PEOPLE },
      ),
    ).toThrow(/without a matching signed reviewer/);
  });
});

describe('People & check-legal publishing rules', () => {
  it('keeps default people.json bio in placeholder state with zero signed reviewers', () => {
    const def = getDefaultPeopleData();
    expect(isAuthorBioReady(def)).toBe(false);
    const resolved = resolveAuthorProfile(def);
    expect(resolved.bioReady).toBe(false);
    expect(resolved.bio).toBeUndefined();
    expect(resolved.credentials).toBeUndefined();
    expect(resolved.image).toBeUndefined();
    expect(resolved.sameAs).toEqual([]);
    expect(getSignedPageReviews('/victoria/heat-pump-hot-water-rebate/', def)).toEqual([]);
  });

  it('blocks publishing if bio is placeholder when forced or missing noindex, or if reviewers/other fields hold <<...>>', () => {
    expect(
      validatePeoplePublishingRules({
        people: PLACEHOLDER_PEOPLE,
        authorHtml: '<head><meta name="robots" content="noindex, follow"></head>',
        sitemapXml: '<urlset></urlset>',
        llmsTxt: '# Household Rebates',
      }),
    ).toEqual([]);

    expect(
      validatePeoplePublishingRules({
        people: PLACEHOLDER_PEOPLE,
        forceAuthorPublish: true,
      }),
    ).toEqual(expect.arrayContaining([expect.stringMatching(/Guri must supply his bio first/)]));

    expect(
      validatePeoplePublishingRules({
        people: PLACEHOLDER_PEOPLE,
        authorHtml: '<head><title>No noindex</title></head>',
      }),
    ).toEqual(expect.arrayContaining([expect.stringMatching(/missing noindex/)]));

    expect(
      validatePeoplePublishingRules({
        people: {
          'gurinder-singh': {
            ...PLACEHOLDER_PEOPLE['gurinder-singh'],
            bio: 'Real bio supplied by Guri.',
          },
          reviewers: [],
        },
      }),
    ).toHaveLength(3); // credentials, image, and sameAs still hold <<...>>

    expect(
      validatePeoplePublishingRules({
        people: {
          ...PLACEHOLDER_PEOPLE,
          reviewers: [
            {
              id: '<<REVIEWER_ID>>',
              name: '<<REVIEWER_NAME>>',
              licence: { type: 'VBA', number: '<<LIC>>' },
              scope: ['hot-water'],
              paidInstaller: false,
              agreementSignedOn: '2026-11-14',
              reviewedPages: [],
            },
          ],
        },
      }),
    ).toEqual(expect.arrayContaining([expect.stringMatching(/contains unresolved <<\.\.\.>>/)]));

    expect(validatePeoplePublishingRules({ people: FILLED_PEOPLE, forceAuthorPublish: true })).toEqual(
      [],
    );
  });
});
