import { getCollection, getEntry } from 'astro:content';
import { isUrlEnabled } from './rollout';
import { ensureTrailingSlash } from './urls';

export interface CanonicalFaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface LinkedFaqItem {
  id: string;
  question: string;
  canonicalPage: string;
}

export async function resolvePageFaqs(
  pathname: string,
  faqRefs: (string | { id: string })[],
): Promise<{ canonicalFaqs: CanonicalFaqItem[]; linkedFaqs: LinkedFaqItem[] }> {
  const normPath = ensureTrailingSlash(pathname);

  const canonicalFaqs: CanonicalFaqItem[] = [];
  const seenIds = new Set<string>();

  for (const ref of faqRefs) {
    const id = typeof ref === 'string' ? ref : ref.id;
    if (seenIds.has(id)) {
      throw new Error(`Duplicate FAQ id "${id}" in frontmatter of "${normPath}"`);
    }
    seenIds.add(id);

    const entry = await getEntry('faqs', id);
    if (!entry) {
      throw new Error(`Missing FAQ entry "${id}" referenced by "${normPath}"`);
    }
    if (entry.data.canonicalPage !== normPath) {
      throw new Error(
        `FAQ "${id}" has canonicalPage="${entry.data.canonicalPage}" and cannot be rendered in full on "${normPath}"`,
      );
    }
    canonicalFaqs.push({
      id: entry.id,
      question: entry.data.question,
      answer: entry.data.answer,
    });
  }

  const allFaqs = await getCollection('faqs');
  const linkedFaqs: LinkedFaqItem[] = allFaqs
    .filter(
      (f) =>
        Array.isArray(f.data.alsoLinkFrom) &&
        f.data.alsoLinkFrom.includes(normPath) &&
        isUrlEnabled(f.data.canonicalPage),
    )
    .sort((a, b) =>
      a.data.canonicalPage === b.data.canonicalPage
        ? a.id.localeCompare(b.id)
        : a.data.canonicalPage.localeCompare(b.data.canonicalPage),
    )
    .map((f) => ({
      id: f.id,
      question: f.data.question,
      canonicalPage: f.data.canonicalPage,
    }));

  return { canonicalFaqs, linkedFaqs };
}
