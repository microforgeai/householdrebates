import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { assertNoDollarCharacter } from '../mail/templates/alerts-sender.js';

export interface AlertDraftTopicPreset {
  id: string;
  subject: string;
  paragraphs: string[];
}

export const ALERT_TOPIC_PRESETS: Record<string, AlertDraftTopicPreset> = {
  'election-2026': {
    id: 'election-2026',
    subject: 'Victorian election update: what we checked on 2027 energy rules',
    paragraphs: [
      'The 28 November 2026 Victorian state election result is in, and government websites are exiting caretaker mode.',
      'We have re-checked the official Victorian legislation and Energy Victoria program pages and updated our rule-status notes accordingly.',
    ],
  },
  'battery-stc-2027': {
    id: 'battery-stc-2027',
    subject: 'Federal battery rule change from 1 January 2027',
    paragraphs: [
      'The federal Cheaper Home Batteries Program certificate factor changes on 1 January 2027, and eligibility depends on the battery installation date rather than the quote date.',
      'We have updated our battery rebate guide with the current official factor schedule and taper rules.',
    ],
  },
  'gas-hot-water-2027': {
    id: 'gas-hot-water-2027',
    subject: 'Victorian gas hot water replacement rule from 1 March 2027',
    paragraphs: [
      'Victoria has updated its building and plumbing rules for end-of-life gas hot water replacements taking effect from 1 March 2027.',
      'Check our updated guide for what is currently legislated, how exemptions work, and which VEU hot water upgrades apply.',
    ],
  },
  'solar-pv-veu-2027': {
    id: 'solar-pv-veu-2027',
    subject: 'Victorian solar panel incentives moving into VEU from 1 July 2027',
    paragraphs: [
      'Solar Victoria and Energy Victoria have published an update on residential solar PV incentives transitioning into the Victorian Energy Upgrades program from 1 July 2027.',
      'Read our updated solar guide for how existing Solar Homes applications and upcoming VEU activities are affected.',
    ],
  },
};

export interface ParsedAlertDraft {
  topic: string;
  subject: string;
  pageUrl: string;
  createdAtUtc: string;
  paragraphs: string[];
  sha256: string;
}

export function resolveAlertPageUrl(rawPage: string, siteOrigin: string): string {
  const trimmed = rawPage.trim();
  if (!trimmed) {
    throw new Error('--page is required.');
  }
  const base = siteOrigin.replace(/\/+$/, '');
  if (trimmed.startsWith('/')) {
    return `${base}${trimmed}`;
  }
  const parsed = new URL(trimmed);
  const originParsed = new URL(base);
  if (parsed.origin !== originParsed.origin) {
    throw new Error(
      `Alert --page URL must belong to ${base} (got "${trimmed}").`,
    );
  }
  return parsed.toString();
}

export function writeAlertDraft(input: {
  topic: string;
  page: string;
  siteOrigin: string;
  draftsDir: string;
  now?: Date;
}): { filePath: string; sha256: string } {
  const cleanTopic = input.topic.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(cleanTopic)) {
    throw new Error(
      `Invalid --topic "${input.topic}" (expected lowercase letters, digits and hyphens).`,
    );
  }

  const pageUrl = resolveAlertPageUrl(input.page, input.siteOrigin);
  const now = input.now ?? new Date();
  const datePart = now.toISOString().slice(0, 10);
  const createdAtUtc = now.toISOString();

  const preset = ALERT_TOPIC_PRESETS[cleanTopic] ?? {
    id: cleanTopic,
    subject: `Victorian energy rebate rule update (${cleanTopic})`,
    paragraphs: [
      'Official Victorian or federal energy rebate rules have changed on a topic you asked us to track.',
      'We have re-checked the official program pages and updated our guide.',
    ],
  };

  assertNoDollarCharacter(preset.subject, 'draft subject');
  for (const p of preset.paragraphs) {
    assertNoDollarCharacter(p, 'draft paragraph');
  }

  const content = [
    '---',
    `topic: ${cleanTopic}`,
    `subject: ${preset.subject}`,
    `pageUrl: ${pageUrl}`,
    `createdAtUtc: ${createdAtUtc}`,
    '---',
    '',
    ...preset.paragraphs.flatMap((p, idx) =>
      idx === preset.paragraphs.length - 1 ? [p] : [p, ''],
    ),
    '',
  ].join('\n');

  fs.mkdirSync(input.draftsDir, { recursive: true });
  const filePath = path.join(input.draftsDir, `${datePart}-${cleanTopic}.md`);
  fs.writeFileSync(filePath, content, 'utf8');

  const sha256 = crypto.createHash('sha256').update(content, 'utf8').digest('hex');
  return { filePath, sha256 };
}

export function parseAlertDraftFile(filePath: string): ParsedAlertDraft {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Alert draft file not found: "${filePath}"`);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const sha256 = crypto.createHash('sha256').update(raw, 'utf8').digest('hex');

  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error(`Invalid alert draft frontmatter in "${filePath}"`);
  }

  const meta: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim();
      meta[k] = v;
    }
  }

  const topic = meta.topic || '';
  const subject = meta.subject || '';
  const pageUrl = meta.pageUrl || '';
  const createdAtUtc = meta.createdAtUtc || '';

  if (!topic || !subject || !pageUrl) {
    throw new Error(
      `Alert draft "${filePath}" must include topic, subject, and pageUrl in frontmatter.`,
    );
  }

  const paragraphs = match[2]
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length === 0) {
    throw new Error(`Alert draft "${filePath}" has an empty body.`);
  }

  assertNoDollarCharacter(subject, 'draft subject');
  for (const p of paragraphs) {
    assertNoDollarCharacter(p, 'draft body');
  }

  return {
    topic,
    subject,
    pageUrl,
    createdAtUtc,
    paragraphs,
    sha256,
  };
}
