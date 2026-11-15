import rawTopics from '../data/alert-topics.json';
import { SITE } from '../data/site';

export interface AlertTopic {
  id: string;
  date: string;
  dateLabel: string;
  label: string;
}

export interface AlertsApp5Notice {
  beforeLink: string;
  linkLabel: string;
  linkHref: string;
  afterLink: string;
  fullText: string;
  markdownText: string;
}

export const ALERT_TOPICS: readonly AlertTopic[] = rawTopics;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PLACEHOLDER_RE = /\u003c\u003c|\u003e\u003e/;

export function todayMelbourneIsoDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Melbourne',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function getUpcomingAlertTopics(
  topics: readonly AlertTopic[] = ALERT_TOPICS,
  refIsoDate: string = todayMelbourneIsoDate(),
): AlertTopic[] {
  if (!ISO_DATE_RE.test(refIsoDate)) {
    throw new Error(`Invalid reference date "${refIsoDate}" (expected YYYY-MM-DD).`);
  }

  return topics.filter((topic) => {
    if (!ISO_DATE_RE.test(topic.date)) {
      throw new Error(`Invalid alert topic date "${topic.date}" on "${topic.id}".`);
    }
    if (topic.label.includes('$') || topic.dateLabel.includes('$')) {
      throw new Error(`Alert topic "${topic.id}" must not contain currency symbols.`);
    }
    return topic.date >= refIsoDate;
  });
}

export function formatAlertTopicsIntro(topics: readonly AlertTopic[]): string {
  if (topics.length === 0) {
    return 'Get an email when official Victorian household or business energy rebate rules change.';
  }

  const formatted = topics.map((t) => `${t.dateLabel} (${t.label})`);
  const listText =
    formatted.length === 1
      ? formatted[0]
      : `${formatted.slice(0, -1).join(', ')} and ${formatted[formatted.length - 1]}`;

  return `Key dates we track: ${listText}.`;
}

export function resolveAlertsApp5Notice(
  env: Record<string, string | undefined> = process.env,
  abn: string = SITE.publisher.abn,
): AlertsApp5Notice {
  const cleanAbn = (abn ?? '').trim();
  const rawServerCountry = (
    env.PUBLIC_SERVER_COUNTRY ??
    env.SERVER_COUNTRY ??
    'Malaysia'
  ).trim();
  const rawProvider = (
    env.PUBLIC_ALERTS_PROVIDER ??
    'Hostinger Mail (Hostinger International Ltd)'
  ).trim();
  const rawOverseas = (
    env.PUBLIC_ALERTS_OVERSEAS_NOTE ??
    '; it stores mail in France and Germany'
  ).trim();

  if (!cleanAbn || PLACEHOLDER_RE.test(cleanAbn)) {
    throw new Error('APP 5 collection notice requires a resolved ABN without placeholders.');
  }
  if (!rawServerCountry || PLACEHOLDER_RE.test(rawServerCountry)) {
    throw new Error(
      'PUBLIC_SERVER_COUNTRY must be set (without \u003c\u003c...\u003e\u003e placeholders) before building or enabling rule-change alerts.',
    );
  }
  if (!rawProvider || PLACEHOLDER_RE.test(rawProvider)) {
    throw new Error(
      'PUBLIC_ALERTS_PROVIDER must be set (without \u003c\u003c...\u003e\u003e placeholders) before building or enabling rule-change alerts.',
    );
  }
  if (!rawOverseas || PLACEHOLDER_RE.test(rawOverseas)) {
    throw new Error(
      'PUBLIC_ALERTS_OVERSEAS_NOTE must be set (for example "; it stores mail in France and Germany", or "none" when data stays in Australia, without \u003c\u003c...\u003e\u003e placeholders) before building or enabling rule-change alerts.',
    );
  }
  if (/outside\s+australia/i.test(rawOverseas)) {
    throw new Error(
      'PUBLIC_ALERTS_OVERSEAS_NOTE must name the specific countries where data is stored (for example "; it stores data in the United States and Ireland", or "none" when data stays in Australia), not a vague "outside Australia".',
    );
  }

  let overseasClause = '';
  if (rawOverseas.toLowerCase() !== 'none') {
    const trimmedClause = rawOverseas.replace(/\.+$/, '').trim();
    if (!trimmedClause) {
      throw new Error('PUBLIC_ALERTS_OVERSEAS_NOTE cannot be empty punctuation; use "none" if not applicable.');
    }
    overseasClause = trimmedClause.startsWith(';')
      ? `; ${trimmedClause.replace(/^;\s*/, '')}`
      : `; ${trimmedClause}`;
  }

  const beforeLink =
    `Household Rebates (Agenor Services Pty Ltd, ABN ${cleanAbn}, ${SITE.publisher.privacyEmail}) collects your email address only to send rule-change alerts you've asked for. ` +
    `If you don't give it, we can't send them. ` +
    `Your email address is stored on our server in ${rawServerCountry}. ` +
    `We don't share it with installers or anyone else, except our email service provider, ${rawProvider}, which sends the emails for us${overseasClause}. Our `;
  const linkLabel = 'privacy policy';
  const linkHref = '/privacy/';
  const afterLink =
    " explains how to access or correct your details and how to complain. We're not a government website.";

  const fullText = `${beforeLink}${linkLabel}${afterLink}`;
  const markdownText = `${beforeLink}[${linkLabel}](${linkHref})${afterLink}`;

  if (PLACEHOLDER_RE.test(fullText)) {
    throw new Error(`Unresolved placeholder in APP 5 collection notice: "${fullText}"`);
  }
  if (fullText.includes('$')) {
    throw new Error('APP 5 collection notice must not contain currency symbols.');
  }

  return {
    beforeLink,
    linkLabel,
    linkHref,
    afterLink,
    fullText,
    markdownText,
  };
}
