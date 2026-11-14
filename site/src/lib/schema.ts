import { SITE } from '../data/site';
import { renderFaqAnswerPlainText } from './faq-markdown';
import { canonicalUrl } from './urls';

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export interface FaqSchemaItem {
  question: string;
  answer: string;
}

export interface HowToSchemaInput {
  name: string;
  steps: { name: string; text: string }[];
}

export interface SchemaGraphOptions {
  pathname: string;
  breadcrumbs?: BreadcrumbItem[];
  faqs?: FaqSchemaItem[];
  howTo?: HowToSchemaInput;
}

const DISALLOWED_SCHEMA_TYPES = new Set([
  'LocalBusiness',
  'Offer',
  'PriceSpecification',
  'Product',
  'GovernmentService',
  'AggregateRating',
]);

export function buildJsonLdGraph(options: SchemaGraphOptions): Record<string, unknown> {
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Organization',
      '@id': `${SITE.origin}/#publisher`,
      name: SITE.publisher.legalName,
      alternateName: SITE.name,
      url: `${SITE.origin}/`,
      logo: `${SITE.origin}/favicon.svg`,
      identifier: {
        '@type': 'PropertyValue',
        propertyID: 'ABN',
        value: SITE.publisher.abn,
      },
      sameAs: SITE.publisher.sameAs,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE.origin}/#website`,
      name: SITE.name,
      url: `${SITE.origin}/`,
      publisher: { '@id': `${SITE.origin}/#publisher` },
      inLanguage: 'en-AU',
    },
  ];

  if (options.breadcrumbs && options.breadcrumbs.length > 0 && options.pathname !== '/') {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl(options.pathname)}#breadcrumb`,
      itemListElement: options.breadcrumbs.map((b, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: b.name,
        item: canonicalUrl(b.path),
      })),
    });
  }

  if (options.faqs && options.faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonicalUrl(options.pathname)}#faq`,
      mainEntity: options.faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: renderFaqAnswerPlainText(f.answer),
        },
      })),
    });
  }

  if (options.howTo) {
    graph.push({
      '@type': 'HowTo',
      '@id': `${canonicalUrl(options.pathname)}#howto`,
      name: options.howTo.name,
      step: options.howTo.steps.map((s, idx) => ({
        '@type': 'HowToStep',
        position: idx + 1,
        name: s.name,
        text: s.text,
      })),
    });
  }

  const payload = {
    '@context': 'https://schema.org',
    '@graph': graph,
  };

  validateSchemaGraph(payload);
  return payload;
}

export function validateSchemaGraph(payload: Record<string, unknown>): void {
  const serialized = JSON.stringify(payload);
  if (/\$[0-9]/.test(serialized) || /\bAUD\b/.test(serialized)) {
    throw new Error('JSON-LD schema must never contain currency amounts or AUD prices.');
  }
  const graph = (payload['@graph'] as Record<string, unknown>[]) ?? [];
  for (const node of graph) {
    const t = String(node['@type'] ?? '');
    if (DISALLOWED_SCHEMA_TYPES.has(t)) {
      throw new Error(`Disallowed JSON-LD @type "${t}" in schema graph.`);
    }
  }
}
