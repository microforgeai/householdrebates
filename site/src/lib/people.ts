import peopleRaw from '../data/people.json' with { type: 'json' };
import { ensureTrailingSlash } from './urls';

export interface AuthorEntry {
  name: string;
  role: string;
  bio: string;
  credentials?: string;
  image?: string;
  sameAs?: string[];
}

export interface ReviewerLicence {
  type: string;
  number: string;
}

export interface ReviewedPageEntry {
  url: string;
  date: string;
}

export interface ReviewerEntry {
  id: string;
  name: string;
  licence: ReviewerLicence;
  scope: string[];
  paidInstaller: boolean;
  agreementSignedOn: string;
  reviewedPages: ReviewedPageEntry[];
}

export interface PeopleData {
  'gurinder-singh': AuthorEntry;
  reviewers: ReviewerEntry[];
  reviewerTemplate?: unknown;
}

export interface ResolvedAuthorProfile {
  name: string;
  role?: string;
  bio?: string;
  credentials?: string;
  image?: string;
  sameAs: string[];
  bioReady: boolean;
}

export interface SignedPageReview {
  reviewerId: string;
  name: string;
  licenceType: string;
  licenceNumber: string;
  paidInstaller: boolean;
  agreementSignedOn: string;
  reviewDate: string;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function hasPlaceholderToken(value: unknown): boolean {
  if (typeof value === 'string') {
    return /\u003c\u003c|\u003e\u003e/.test(value);
  }
  if (Array.isArray(value)) {
    return value.some((item) => hasPlaceholderToken(item));
  }
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some((v) => hasPlaceholderToken(v));
  }
  return false;
}

function cleanOptionalString(val: string | undefined): string | undefined {
  if (typeof val !== 'string') return undefined;
  const trimmed = val.trim();
  if (!trimmed || hasPlaceholderToken(trimmed)) return undefined;
  return trimmed;
}

export function getDefaultPeopleData(): PeopleData {
  return peopleRaw as unknown as PeopleData;
}

export function isAuthorBioReady(data: PeopleData = getDefaultPeopleData()): boolean {
  const bio = data?.['gurinder-singh']?.bio;
  return typeof bio === 'string' && bio.trim().length > 0 && !hasPlaceholderToken(bio);
}

export function resolveAuthorProfile(
  data: PeopleData = getDefaultPeopleData(),
): ResolvedAuthorProfile {
  const raw = data['gurinder-singh'];
  const name = cleanOptionalString(raw?.name) ?? 'Gurinder Singh';
  const role = cleanOptionalString(raw?.role);
  const bio = cleanOptionalString(raw?.bio);
  const credentials = cleanOptionalString(raw?.credentials);
  const image = cleanOptionalString(raw?.image);
  const sameAs = Array.isArray(raw?.sameAs)
    ? raw.sameAs
        .map((u) => cleanOptionalString(u))
        .filter((u): u is string => Boolean(u))
    : [];

  return {
    name,
    role,
    bio,
    credentials,
    image,
    sameAs,
    bioReady: Boolean(bio),
  };
}

export function isValidSignedReviewer(rev: ReviewerEntry): boolean {
  if (!rev || typeof rev !== 'object') return false;
  if (hasPlaceholderToken(rev)) return false;
  if (typeof rev.id !== 'string' || !/^[a-z0-9-]+$/.test(rev.id.trim())) return false;
  if (typeof rev.name !== 'string' || !rev.name.trim()) return false;
  if (
    !rev.licence ||
    typeof rev.licence.type !== 'string' ||
    !rev.licence.type.trim() ||
    typeof rev.licence.number !== 'string' ||
    !rev.licence.number.trim()
  ) {
    return false;
  }
  if (!Array.isArray(rev.scope) || rev.scope.length === 0 || rev.scope.some((s) => !s?.trim())) {
    return false;
  }
  if (typeof rev.paidInstaller !== 'boolean') return false;
  if (typeof rev.agreementSignedOn !== 'string' || !ISO_DATE_RE.test(rev.agreementSignedOn.trim())) {
    return false;
  }
  if (!Array.isArray(rev.reviewedPages)) return false;
  for (const rp of rev.reviewedPages) {
    if (
      !rp ||
      typeof rp.url !== 'string' ||
      !rp.url.startsWith('/') ||
      typeof rp.date !== 'string' ||
      !ISO_DATE_RE.test(rp.date.trim())
    ) {
      return false;
    }
  }
  return true;
}

export function getSignedPageReviews(
  pathname: string,
  data: PeopleData = getDefaultPeopleData(),
): SignedPageReview[] {
  const cleanPath = ensureTrailingSlash(pathname);
  const reviewers = Array.isArray(data?.reviewers) ? data.reviewers : [];
  const matches: SignedPageReview[] = [];

  for (const rev of reviewers) {
    if (!isValidSignedReviewer(rev)) continue;
    for (const rp of rev.reviewedPages) {
      if (ensureTrailingSlash(rp.url) === cleanPath) {
        matches.push({
          reviewerId: rev.id.trim(),
          name: rev.name.trim(),
          licenceType: rev.licence.type.trim(),
          licenceNumber: rev.licence.number.trim(),
          paidInstaller: rev.paidInstaller,
          agreementSignedOn: rev.agreementSignedOn.trim(),
          reviewDate: rp.date.trim(),
        });
      }
    }
  }

  return matches;
}

export function validatePeoplePublishingRules(options: {
  people: PeopleData;
  forceAuthorPublish?: boolean;
  authorHtml?: string;
  sitemapXml?: string;
  llmsTxt?: string;
}): string[] {
  const { people, forceAuthorPublish = false, authorHtml, sitemapXml, llmsTxt } = options;
  const errors: string[] = [];

  const author = people?.['gurinder-singh'];
  if (!author || typeof author !== 'object') {
    errors.push('people.json is missing the "gurinder-singh" author object');
    return errors;
  }

  if (typeof author.name !== 'string' || !author.name.trim() || hasPlaceholderToken(author.name)) {
    errors.push('people.json["gurinder-singh"].name is missing or contains a \u003c\u003c...\u003e\u003e placeholder');
  }
  if (typeof author.role !== 'string' || !author.role.trim() || hasPlaceholderToken(author.role)) {
    errors.push('people.json["gurinder-singh"].role is missing or contains a \u003c\u003c...\u003e\u003e placeholder');
  }

  const bioReady = isAuthorBioReady(people);

  if (forceAuthorPublish && !bioReady) {
    errors.push(
      'Cannot publish /about/gurinder-singh/ while people.json["gurinder-singh"].bio is empty or holds a \u003c\u003c...\u003e\u003e placeholder (Guri must supply his bio first)',
    );
  }

  // Once bio is supplied (publishing the author page), NO other author field may hold an angle-bracket placeholder
  if (bioReady) {
    if (author.credentials !== undefined && hasPlaceholderToken(author.credentials)) {
      errors.push(
        'people.json["gurinder-singh"].credentials still holds a \u003c\u003c...\u003e\u003e placeholder; supply credentials from Guri or remove the field before publishing /about/gurinder-singh/',
      );
    }
    if (author.image !== undefined && hasPlaceholderToken(author.image)) {
      errors.push(
        'people.json["gurinder-singh"].image still holds a \u003c\u003c...\u003e\u003e placeholder; supply a photo path from Guri or remove the field before publishing /about/gurinder-singh/',
      );
    }
    if (Array.isArray(author.sameAs) && hasPlaceholderToken(author.sameAs)) {
      errors.push(
        'people.json["gurinder-singh"].sameAs still holds a \u003c\u003c...\u003e\u003e placeholder; supply Guri\'s profile URLs or set sameAs to [] before publishing /about/gurinder-singh/',
      );
    }
  }

  if (typeof authorHtml === 'string') {
    const htmlHasNoindex = /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(
      authorHtml,
    );
    if (!bioReady && !htmlHasNoindex) {
      errors.push(
        'dist/about/gurinder-singh/index.html is missing noindex while people.json["gurinder-singh"].bio is still empty or a placeholder',
      );
    }
    if (/\u003c\u003c|\u003e\u003e|&lt;&lt;|&gt;&gt;/.test(authorHtml)) {
      errors.push('dist/about/gurinder-singh/index.html contains unresolved \u003c\u003c...\u003e\u003e placeholder text');
    }
  }

  if (!bioReady && typeof sitemapXml === 'string' && sitemapXml.includes('/about/gurinder-singh/')) {
    errors.push(
      'sitemap-0.xml includes /about/gurinder-singh/ while people.json["gurinder-singh"].bio is still empty or a placeholder',
    );
  }

  if (!bioReady && typeof llmsTxt === 'string' && llmsTxt.includes('/about/gurinder-singh/')) {
    errors.push(
      'llms.txt includes /about/gurinder-singh/ while people.json["gurinder-singh"].bio is still empty or a placeholder',
    );
  }

  if (!Array.isArray(people.reviewers)) {
    errors.push('people.json.reviewers must be an array');
  } else {
    people.reviewers.forEach((rev, idx) => {
      if (hasPlaceholderToken(rev)) {
        errors.push(
          `people.json.reviewers[${idx}] contains unresolved \u003c\u003c...\u003e\u003e placeholder values; keep reviewers: [] until a real reviewer signs in writing`,
        );
      } else if (!isValidSignedReviewer(rev)) {
        errors.push(
          `people.json.reviewers[${idx}] is missing required signed reviewer fields (id, name, licence.type, licence.number, scope[], boolean paidInstaller, YYYY-MM-DD agreementSignedOn, reviewedPages[])`,
        );
      }
    });
  }

  return errors;
}
