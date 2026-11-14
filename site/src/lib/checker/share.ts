import { FIELD_HOOKS } from './fields-hooks';
import type { CheckerAnswers } from './types';

const ALLOWED_KEYS: ReadonlySet<string> = /*#__PURE__*/ new Set([
  ...Object.keys(FIELD_HOOKS),
  'BW1Count',
  'BP1ExactKw',
  'BResItems',
]);

function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(b64url: string): string {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=');
  const bin = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodeAnswersToHash(answers: CheckerAnswers): string {
  return `#a=${toBase64Url(JSON.stringify(answers))}`;
}

export function decodeAnswersFromHash(rawHash: string): CheckerAnswers | null {
  if (!rawHash) return null;
  const trimmed = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash;
  if (!trimmed.startsWith('a=')) return null;
  const encoded = trimmed.slice(2).trim();
  if (!encoded) return null;

  try {
    const json = fromBase64Url(encoded);
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (!ALLOWED_KEYS.has(k)) continue;
      if (typeof v === 'string' || typeof v === 'number') {
        cleaned[k] = v;
      } else if (Array.isArray(v) && v.every((item) => typeof item === 'string')) {
        cleaned[k] = v;
      }
    }

    if (cleaned.S1 !== 'residential' && cleaned.S1 !== 'business') {
      return null;
    }

    return cleaned as CheckerAnswers;
  } catch {
    return null;
  }
}
