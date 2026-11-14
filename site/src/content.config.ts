import { defineCollection, reference } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';
import { validateFaqAnswerMarkdown } from './lib/faq-markdown';

export const State = z.enum(['vic', 'nsw', 'qld', 'sa', 'wa', 'tas', 'act', 'nt', 'national']);
export const Section = z.enum(['rebates', 'areas', 'tools', 'trust', 'solar-battery']);
export const Activity = z.enum([
  'rcac',
  'hotwater',
  'solar',
  'battery',
  'insulation',
  'induction',
  'sealing',
  'glazing',
  'appliances',
  'lighting',
  'coldroom',
  'motors',
  'kitchen',
]);
export const NavGroup = z.enum([
  'hub',
  'rebate-guides',
  'upgrade-guides',
  'question-pages',
  'audience',
  'business',
  'tools',
  'support-guides',
  'areas',
  'trust',
]);
export const SourceKind = z.enum([
  'legislation',
  'regulator',
  'department',
  'council',
  'council-program',
  'state-owned',
  'network-business',
  'national-agency',
]);

const sources = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/sources' }),
  schema: z.object({
    title: z.string(),
    publisher: z.string(),
    url: z.url(),
    official: z.boolean(),
    state: State,
    checkedOn: z.coerce.date(),
    pageLastUpdated: z.coerce.date().optional(),
    mapKey: z.string().optional(),
    kind: SourceKind.optional(),
    attribution: z.string().optional(),
    notes: z.string().optional(),
    manualCheck: z.boolean().optional(),
    primarySourceId: z.string().optional(),
  }),
});

const figures = defineCollection({
  loader: file('src/content/figures/vic-veu.yaml'),
  schema: z
    .object({
      id: z.string(),
      group: z.string(),
      state: State,
      program: z.string(),
      activity: Activity,
      audience: z.enum(['household', 'business', 'both']),
      jurisdiction: z.enum(['state', 'federal', 'local']).optional(),
      scenario: z.string(),
      qualifier: z.enum([
        'up-to',
        'range',
        'exact',
        'about',
        'about-range',
        'minimum',
        'more-than',
        'almost',
      ]),
      unit: z.enum(['AUD', 'percent', 'count']).default('AUD'),
      display: z.enum(['standard', 'cents', 'compact']).default('standard'),
      basis: z.enum(['official', 'estimate']).default('official'),
      kind: z.enum(['discount', 'payment', 'threshold', 'rate', 'saving', 'count']),
      method: z.string().optional(),
      basedOn: z
        .union([reference('sources'), z.array(reference('sources')).min(1)])
        .optional(),
      amountMin: z.number().optional(),
      amountMax: z.number(),
      currency: z.literal('AUD').optional(),
      gstIncluded: z.boolean().optional(),
      effectiveFrom: z.coerce.date().optional(),
      effectiveTo: z.coerce.date().optional(),
      expiresOn: z.coerce.date().optional(),
      supersededBy: z.string().optional(),
      sourceId: reference('sources'),
      checkedOn: z.coerce.date(),
      conditions: z.array(z.string()).optional(),
      groupNote: z.string().optional(),
    })
    .refine((d) => (d.amountMin !== undefined ? d.amountMin <= d.amountMax : true), {
      message: 'amountMin must be <= amountMax',
    })
    .refine(
      (d) => (d.qualifier === 'range' || d.qualifier === 'about-range' ? d.amountMin !== undefined : true),
      {
        message: 'range / about-range qualifier requires amountMin',
      },
    )
    .refine((d) => (d.effectiveTo !== undefined ? Boolean(d.supersededBy) : true), {
      message: 'effectiveTo requires supersededBy',
    })
    .refine(
      (d) => (d.basis === 'estimate' ? Boolean(d.method && d.basedOn && d.kind === 'discount') : true),
      {
        message: 'estimate figure requires method, basedOn, and kind: "discount"',
      },
    ),
});

export const FigureKind = z.enum(['discount', 'payment', 'threshold', 'rate', 'saving', 'count']);

export const HeroConfig = z.union([
  z.literal(false),
  z.object({
    id: z.string().min(1),
    label: z.string().min(1),
  }),
  z.object({
    ids: z.tuple([z.string().min(1), z.string().min(1)]),
    labels: z.tuple([z.string().min(1), z.string().min(1)]),
  }),
]);

const pageBase = z.object({
  title: z.string().max(60),
  h1: z.string().min(1).optional(),
  description: z.string().min(70).max(155),
  state: State,
  section: Section,
  parent: z.enum(['about']).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  navGroup: NavGroup,
  mapRow: z.number().int(),
  reviewBy: z.coerce.date().optional(),
  ruleStatus: z.enum(['election-watch']).optional(),
  answer: z.string(),
  hero: HeroConfig.optional(),
  author: z.literal('Gurinder Singh'),
  publishedOn: z.coerce.date(),
  updatedOn: z.coerce.date(),
  checkedOn: z.coerce.date(),
  sources: z.array(reference('sources')).min(1),
  figures: z.array(z.string()).default([]),
  faq: z.array(reference('faqs')).default([]),
  howTo: z
    .object({
      name: z.string(),
      steps: z.array(z.object({ name: z.string(), text: z.string() })).min(3),
    })
    .optional(),
  leadForm: z.union([z.literal(false), z.enum(['rcac', 'hotwater', 'either'])]).default(false),
  alertSignup: z.boolean().default(false),
  noindex: z.boolean().default(false),
  related: z.array(z.string()).default([]),
  legalReviewed: z.boolean().default(false),
  alertsLegalReviewed: z.boolean().default(false),
});

const guides = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/guides' }),
  schema: pageBase,
});

const areas = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/areas' }),
  schema: pageBase
    .extend({
      areaName: z.string(),
      areaGroup: z.enum(['melbourne-hubs', 'regional', 'corridors-councils']),
      variant: z.enum(['standard', 'multi-town']).default('standard'),
      towns: z.array(z.string()).optional(),
      councils: z.array(z.string()).optional(),
      postcodes: z.array(z.string().regex(/^3\d{3}$/)).min(1),
      veuPostcodeTable: z.boolean().default(true),
      nccZone: z
        .object({
          zone: z.number().int(),
          places: z.array(z.string()).min(1),
        })
        .optional(),
      nccZones: z
        .array(
          z.object({
            zone: z.number().int(),
            places: z.array(z.string()).min(1),
          }),
        )
        .min(1)
        .optional(),
      localFacts: z
        .array(
          z.object({
            text: z.string(),
            sourceId: reference('sources'),
          }),
        )
        .min(4),
      councilPrograms: z
        .array(
          z.object({
            name: z.string(),
            operator: z.string().optional(),
            status: z.enum(['open', 'paused', 'closing', 'closed', 'unverified']),
            statusNote: z.string(),
            statusCheckedOn: z.coerce.date(),
            sourceId: reference('sources'),
          }),
        )
        .default([]),
      searchDemand: z
        .object({
          monthly: z.number(),
          source: z.string(),
          date: z.coerce.date(),
        })
        .optional(),
    })
    .refine(
      (d) => (d.variant === 'multi-town' ? (d.towns?.length ?? 0) >= 2 : (d.councils?.length ?? 0) >= 1),
      {
        message: 'standard areas require councils (>=1); multi-town areas require towns (>=2)',
      },
    )
    .refine((d) => d.localFacts.length >= 5, {
      message: 'Every area page requires at least 5 sourced localFacts.',
    }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/pages' }),
  schema: pageBase,
});

const CANONICAL_URL_RE = /^\/(?:[a-z0-9-]+\/)*$/;

const faqs = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/faqs' }),
  schema: z
    .object({
      question: z.string().min(1),
      answer: z.string().refine(
        (val) => {
          try {
            return validateFaqAnswerMarkdown(val);
          } catch {
            return false;
          }
        },
        {
          message:
            'FAQ answer must be plain text with optional [anchor](/internal-path/) links only (no HTML, no images, no dollar amounts).',
        },
      ),
      canonicalPage: z.string().regex(CANONICAL_URL_RE),
      alsoLinkFrom: z.array(z.string().regex(CANONICAL_URL_RE)).default([]),
      state: State,
      checkedOn: z.coerce.date(),
    })
    .refine((d) => !d.alsoLinkFrom.includes(d.canonicalPage), {
      message: 'alsoLinkFrom must not contain canonicalPage',
    }),
});

const installers = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/installers' }),
  schema: z.object({
    id: z.string(),
    tradingName: z.string(),
    legalName: z.string(),
    abn: z.string().regex(/^\d{11}$/),
    accreditedProvider: z.string(),
    isAccreditedProvider: z.boolean(),
    activities: z.array(Activity),
    postcodes: z.array(z.string().regex(/^3\d{3}$/)),
    licence: z.object({ type: z.string(), number: z.string() }),
    agreementSignedOn: z.coerce.date(),
    agreementVersion: z.string(),
    contactEmailForLeads: z.email(),
    publicBlurb: z.string().max(280),
    active: z.boolean(),
  }),
});

export const collections = {
  sources,
  figures,
  guides,
  areas,
  pages,
  faqs,
  installers,
};
