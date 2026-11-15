import { SITE } from '../data/site';
import { renderFaqAnswerPlainText } from './faq-markdown';
import {
  getDefaultPeopleData,
  getSignedPageReviews,
  resolveAuthorProfile,
  type PeopleData,
} from './people';
import { resolveOgMeta, type OgKind } from './seo';
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

export type PageSchemaKind = 'guide' | 'area' | 'hub' | 'trust' | 'tool' | 'author';

export interface PageSchemaInput {
  kind: PageSchemaKind;
  headline: string;
  description: string;
  publishedOn?: Date | string;
  updatedOn?: Date | string;
  people?: PeopleData;
  ogKind?: OgKind;
}

export interface SchemaGraphOptions {
  pathname: string;
  breadcrumbs?: BreadcrumbItem[];
  faqs?: FaqSchemaItem[];
  howTo?: HowToSchemaInput;
  pageSchema?: PageSchemaInput;
}

export const ALLOWED_SCHEMA_TYPES = new Set([
  'Organization',
  'PropertyValue',
  'WebSite',
  'BreadcrumbList',
  'ListItem',
  'FAQPage',
  'Question',
  'Answer',
  'HowTo',
  'HowToStep',
  'Article',
  'WebPage',
  'ProfilePage',
  'Person',
  'WebApplication',
]);

const DISALLOWED_SCHEMA_TYPES = new Set([
  'LocalBusiness',
  'Offer',
  'PriceSpecification',
  'Product',
  'GovernmentService',
  'AggregateRating',
]);

const MELB_PARTS_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Australia/Melbourne',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZoneName: 'longOffset',
});

export function formatMelbourneIsoDateTime(input?: Date | string): string | undefined {
  if (!input) return undefined;
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return undefined;
  const parts = MELB_PARTS_FMT.formatToParts(d);
  const year = parts.find((p) => p.type === 'year')?.value ?? '2026';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  const rawTz = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+11:00';
  const offsetMatch = rawTz.match(/([+-]\d{2}:\d{2})$/);
  const offset = offsetMatch ? offsetMatch[1] : '+11:00';
  return `${year}-${month}-${day}T00:00:00${offset}`;
}

export function buildJsonLdGraph(options: SchemaGraphOptions): Record<string, unknown> {
  const peopleData = options.pageSchema?.people ?? getDefaultPeopleData();
  const pageUrl = canonicalUrl(options.pathname);

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
      '@id': `${pageUrl}#breadcrumb`,
      itemListElement: options.breadcrumbs.map((b, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: b.name,
        item: canonicalUrl(b.path),
      })),
    });
  }

  if (options.pageSchema) {
    const ps = options.pageSchema;
    const datePublished = formatMelbourneIsoDateTime(ps.publishedOn);
    const dateModified = formatMelbourneIsoDateTime(ps.updatedOn);
    const signedReviews = getSignedPageReviews(options.pathname, peopleData);

    for (const rev of signedReviews) {
      graph.push({
        '@type': 'Person',
        '@id': `${SITE.origin}/#reviewer-${rev.reviewerId}`,
        name: rev.name,
        identifier: {
          '@type': 'PropertyValue',
          propertyID: rev.licenceType,
          value: rev.licenceNumber,
        },
      });
    }

    if (ps.kind === 'author') {
      const author = resolveAuthorProfile(peopleData);
      if (author.bioReady) {
        const personNode: Record<string, unknown> = {
          '@type': 'Person',
          '@id': `${SITE.origin}/#person-gurinder-singh`,
          name: author.name,
          url: `${SITE.origin}/about/gurinder-singh/`,
          ...(author.role ? { jobTitle: author.role } : {}),
          ...(author.bio ? { description: author.bio } : {}),
          worksFor: { '@id': `${SITE.origin}/#publisher` },
        };
        if (author.image) {
          personNode.image = author.image.startsWith('http')
            ? author.image
            : `${SITE.origin}${author.image.startsWith('/') ? '' : '/'}${author.image}`;
        }
        if (author.sameAs.length > 0) {
          personNode.sameAs = author.sameAs;
        }
        graph.push(personNode);

        const profilePageNode: Record<string, unknown> = {
          '@type': 'ProfilePage',
          '@id': `${pageUrl}#webpage`,
          url: pageUrl,
          name: ps.headline,
          description: ps.description,
          inLanguage: 'en-AU',
          isPartOf: { '@id': `${SITE.origin}/#website` },
          ...(datePublished ? { dateCreated: datePublished } : {}),
          ...(dateModified ? { dateModified } : {}),
          mainEntity: { '@id': `${SITE.origin}/#person-gurinder-singh` },
        };
        if (signedReviews.length > 0) {
          const refs = signedReviews.map((r) => ({ '@id': `${SITE.origin}/#reviewer-${r.reviewerId}` }));
          profilePageNode.reviewedBy = refs.length === 1 ? refs[0] : refs;
          profilePageNode.lastReviewed = [...signedReviews]
            .map((r) => r.reviewDate)
            .sort()
            .at(-1);
        }
        graph.push(profilePageNode);
      }
    } else {
      const webPageNode: Record<string, unknown> = {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: ps.headline,
        description: ps.description,
        inLanguage: 'en-AU',
        isPartOf: { '@id': `${SITE.origin}/#website` },
        publisher: { '@id': `${SITE.origin}/#publisher` },
        ...(datePublished ? { datePublished } : {}),
        ...(dateModified ? { dateModified } : {}),
      };
      if (signedReviews.length > 0) {
        const refs = signedReviews.map((r) => ({ '@id': `${SITE.origin}/#reviewer-${r.reviewerId}` }));
        webPageNode.reviewedBy = refs.length === 1 ? refs[0] : refs;
        webPageNode.lastReviewed = [...signedReviews]
          .map((r) => r.reviewDate)
          .sort()
          .at(-1);
      }
      graph.push(webPageNode);

      if (ps.kind === 'guide') {
        const author = resolveAuthorProfile(peopleData);
        let articleAuthorId = `${SITE.origin}/#publisher`;

        if (author.bioReady) {
          articleAuthorId = `${SITE.origin}/#person-gurinder-singh`;
          const personNode: Record<string, unknown> = {
            '@type': 'Person',
            '@id': articleAuthorId,
            name: author.name,
            url: `${SITE.origin}/about/gurinder-singh/`,
            ...(author.role ? { jobTitle: author.role } : {}),
            ...(author.bio ? { description: author.bio } : {}),
            worksFor: { '@id': `${SITE.origin}/#publisher` },
          };
          if (author.image) {
            personNode.image = author.image.startsWith('http')
              ? author.image
              : `${SITE.origin}${author.image.startsWith('/') ? '' : '/'}${author.image}`;
          }
          if (author.sameAs.length > 0) {
            personNode.sameAs = author.sameAs;
          }
          graph.push(personNode);
        }

        graph.push({
          '@type': 'Article',
          '@id': `${pageUrl}#article`,
          headline: ps.headline,
          description: ps.description,
          image: resolveOgMeta(ps.ogKind ?? 'guide').url,
          ...(datePublished ? { datePublished } : {}),
          ...(dateModified ? { dateModified } : {}),
          author: { '@id': articleAuthorId },
          publisher: { '@id': `${SITE.origin}/#publisher` },
          inLanguage: 'en-AU',
          mainEntityOfPage: { '@id': `${pageUrl}#webpage` },
        });
      } else if (ps.kind === 'tool') {
        graph.push({
          '@type': 'WebApplication',
          '@id': `${pageUrl}#webapp`,
          name: ps.headline,
          description: ps.description,
          url: pageUrl,
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          isAccessibleForFree: true,
          inLanguage: 'en-AU',
          publisher: { '@id': `${SITE.origin}/#publisher` },
        });
      }
    }
  }

  if (options.faqs && options.faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${pageUrl}#faq`,
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
      '@id': `${pageUrl}#howto`,
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

  validateSchemaGraph(payload, { pathname: options.pathname, people: peopleData });
  return payload;
}

export function validateSchemaGraph(
  payload: Record<string, unknown>,
  context?: { pathname?: string; people?: PeopleData },
): void {
  const serialized = JSON.stringify(payload);
  if (/\$[0-9]/.test(serialized) || /\bAUD\b/.test(serialized)) {
    throw new Error('JSON-LD schema must never contain currency amounts or AUD prices.');
  }
  if (/\u003c\u003c|\u003e\u003e/.test(serialized)) {
    throw new Error('JSON-LD schema must never contain unresolved \u003c\u003c...\u003e\u003e placeholders.');
  }

  const peopleData = context?.people ?? getDefaultPeopleData();
  const signedForPath = context?.pathname ? getSignedPageReviews(context.pathname, peopleData) : [];
  const validReviewerIds = new Set(
    signedForPath.map((r) => `${SITE.origin}/#reviewer-${r.reviewerId}`),
  );

  function walkNode(node: unknown): void {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const item of node) walkNode(item);
      return;
    }
    const obj = node as Record<string, unknown>;
    const t = obj['@type'];
    if (typeof t === 'string') {
      if (DISALLOWED_SCHEMA_TYPES.has(t) || !ALLOWED_SCHEMA_TYPES.has(t)) {
        throw new Error(`Disallowed JSON-LD @type "${t}" in schema graph.`);
      }
    }
    if ('offers' in obj) {
      throw new Error('JSON-LD schema must never include an "offers" property.');
    }
    if (obj.estimatedCost !== undefined || obj.totalTime !== undefined) {
      throw new Error('HowTo schema must not include estimatedCost or totalTime.');
    }
    if ('reviewedBy' in obj) {
      if (t !== 'WebPage' && t !== 'ProfilePage') {
        throw new Error(`"reviewedBy" is only valid on WebPage/ProfilePage (found on "${String(t)}").`);
      }
      if (!context?.pathname || signedForPath.length === 0) {
        throw new Error(
          'JSON-LD contains "reviewedBy" without a matching signed reviewer in people.json.',
        );
      }
      const refs = Array.isArray(obj.reviewedBy) ? obj.reviewedBy : [obj.reviewedBy];
      for (const ref of refs) {
        const refId = (ref as Record<string, unknown>)?.['@id'];
        if (typeof refId !== 'string' || !validReviewerIds.has(refId)) {
          throw new Error(
            `JSON-LD "reviewedBy" reference "${String(refId)}" does not match a signed reviewer for ${context.pathname}.`,
          );
        }
      }
    }
    for (const v of Object.values(obj)) {
      walkNode(v);
    }
  }

  const graph = (payload['@graph'] as Record<string, unknown>[]) ?? [];
  walkNode(graph);
}
