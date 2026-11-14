import { isUrlEnabled } from './rollout';
import { ensureTrailingSlash } from './urls';

const LINK_RE = /\[([^\[\]\n]+)\]\(([^)\s]+)\)/g;
const INTERNAL_HREF_RE = /^\/(?:[a-z0-9-]+\/)*(?:#[a-z0-9-]+)?$/;
const HTML_TAG_RE = /<\/?[a-z!]|<!--/i;
const IMAGE_MD_RE = /!\[/;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface FaqSegment {
  type: 'text' | 'link';
  text: string;
  href?: string;
}

export function parseFaqAnswerMarkdown(answer: string): FaqSegment[] {
  if (typeof answer !== 'string' || !answer.trim()) {
    throw new Error('FAQ answer must be a non-empty string.');
  }
  if (IMAGE_MD_RE.test(answer)) {
    throw new Error(`FAQ answer must not contain Markdown images: "${answer}"`);
  }
  if (HTML_TAG_RE.test(answer)) {
    throw new Error(`FAQ answer must not contain HTML tags: "${answer}"`);
  }

  const segments: FaqSegment[] = [];
  let lastIndex = 0;

  for (const match of answer.matchAll(LINK_RE)) {
    const start = match.index ?? 0;
    const rawMatch = match[0];
    const anchor = match[1];
    const href = match[2];

    if (start > lastIndex) {
      const before = answer.slice(lastIndex, start);
      if (before.includes('[') || before.includes(']')) {
        throw new Error(`FAQ answer contains malformed square brackets near "${before}"`);
      }
      segments.push({ type: 'text', text: before });
    }

    const trimmedAnchor = anchor.trim();
    if (!trimmedAnchor) {
      throw new Error(`FAQ answer link has empty anchor text: "${rawMatch}"`);
    }
    if (/\$[0-9]/.test(trimmedAnchor)) {
      throw new Error(`FAQ answer link anchor must not contain dollar amounts: "${rawMatch}"`);
    }
    if (!INTERNAL_HREF_RE.test(href)) {
      throw new Error(
        `FAQ answer link href must be an internal path with trailing slash (got "${href}")`,
      );
    }

    segments.push({ type: 'link', text: anchor, href });
    lastIndex = start + rawMatch.length;
  }

  if (lastIndex < answer.length) {
    const tail = answer.slice(lastIndex);
    if (tail.includes('[') || tail.includes(']')) {
      throw new Error(`FAQ answer contains malformed square brackets near "${tail}"`);
    }
    segments.push({ type: 'text', text: tail });
  }

  return segments;
}

export function validateFaqAnswerMarkdown(answer: string): boolean {
  parseFaqAnswerMarkdown(answer);
  return true;
}

export function renderFaqAnswerHtml(answer: string, currentPathname?: string): string {
  const segments = parseFaqAnswerMarkdown(answer);
  const normCurrent = currentPathname ? ensureTrailingSlash(currentPathname) : undefined;

  return segments
    .map((seg) => {
      if (seg.type === 'text' || !seg.href) {
        return escapeHtml(seg.text);
      }
      const [basePath, hash] = seg.href.split('#');
      const normBase = ensureTrailingSlash(basePath);
      const isSelfWithoutFragment = Boolean(normCurrent && normBase === normCurrent && !hash);
      if (isSelfWithoutFragment || !isUrlEnabled(normBase)) {
        return escapeHtml(seg.text);
      }
      const finalHref = hash ? `${normBase}#${hash}` : normBase;
      return `<a href="${escapeHtml(finalHref)}">${escapeHtml(seg.text)}</a>`;
    })
    .join('');
}

export function renderFaqAnswerPlainText(answer: string): string {
  const segments = parseFaqAnswerMarkdown(answer);
  return segments.map((seg) => seg.text).join('');
}
