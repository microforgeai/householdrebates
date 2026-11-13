import { defineCollection, reference } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

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
]);
export const NavGroup = z.enum([
  'hub',
  'rebate-guides',
  'upgrade-guides',
  'question-pages',
  'audience',
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
      audience: z.enum(['household', 'business']),
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
      amountMin: z.number().optional(),
      amountMax: z.number(),
      currency: z.literal('AUD').optional(),
      gstIncluded: z.boolean().optional(),
      effectiveFrom: z.coerce.date().optional(),
      effectiveTo: z.coerce.date().optional(),
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
    }),
});

const pageBase = z.object({
  title: z.string().max(60),
  description: z.string().min(70).max(160),
  state: State,
  section: Section,
  slug: z.string().regex(/^[a-z0-9-]+$/),
  navGroup: NavGroup,
  mapRow: z.number().int(),
  reviewBy: z.coerce.date().optional(),
  ruleStatus: z.enum(['election-watch']).optional(),
  answer: z.string(),
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
  noindex: z.boolean().default(false),
  related: z.array(z.string()).default([]),
  legalReviewed: z.boolean().default(false),
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
      localFacts: z
        .array(
          z.object({
            text: z.string(),
            sourceId: reference('sources'),
          }),
        )
        .min(4),
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
    ),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/pages' }),
  schema: pageBase,
});

const faqs = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/faqs' }),
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    pages: z.array(z.string()),
    state: State,
    checkedOn: z.coerce.date(),
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
