import { describe, expect, it } from 'vitest';
import { buildJsonLdGraph, validateSchemaGraph } from '../../src/lib/schema';

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

  it('rejects any currency figure in JSON-LD', () => {
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
  });

  it('rejects disallowed schema @types such as Offer or LocalBusiness', () => {
    expect(() =>
      validateSchemaGraph({
        '@context': 'https://schema.org',
        '@graph': [{ '@type': 'LocalBusiness', name: 'Bad Type' }],
      }),
    ).toThrow(/Disallowed JSON-LD @type/);
  });
});
