import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ALERTS_CONSENT_TEMPLATES, ALERTS_CONSENT_VERSION_V2 } from '../../src/data/consent/alerts-v1';
import {
  ALERT_TOPICS,
  formatAlertTopicsIntro,
  getUpcomingAlertTopics,
  resolveAlertsApp5Notice,
} from '../../src/lib/alerts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '../..');
const repoRoot = path.resolve(siteRoot, '..');

describe('Rule-change email alerts (Prompt 29b & Prompt 40 legal fixes)', () => {
  it('renders the consent checkbox unticked by default in AlertSignupIsland.astro and matches API alerts-v2 SHA-256', () => {
    const islandPath = path.join(siteRoot, 'src/components/AlertSignupIsland.astro');
    const islandMarkup = fs.readFileSync(islandPath, 'utf8');

    const checkboxTagMatch = islandMarkup.match(/<input\b[\s\S]*?\bdata-alert-consent\b[\s\S]*?\/>/);
    expect(checkboxTagMatch).not.toBeNull();
    expect(checkboxTagMatch![0]).not.toMatch(/\bchecked\b/i);

    const apiConsentPath = path.join(repoRoot, 'api/src/alerts/consent.ts');
    const apiConsentRaw = fs.readFileSync(apiConsentPath, 'utf8');
    const siteText = ALERTS_CONSENT_TEMPLATES[ALERTS_CONSENT_VERSION_V2];
    expect(apiConsentRaw).toContain(siteText);

    const spanMatch = islandMarkup.match(/<span\b[^>]*\bdata-alert-consent-text\b[^>]*>([\s\S]*?)<\/span>/);
    expect(spanMatch).not.toBeNull();
    const renderedSpanText = spanMatch![1].replace(/\s+/g, ' ').trim();
    expect(renderedSpanText).toBe(siteText);

    const sha = crypto.createHash('sha256').update(siteText, 'utf8').digest('hex');
    expect(sha).toHaveLength(64);
    expect(siteText).not.toContain('$');
  });

  it('drops past rule-change dates automatically at build time and carries zero currency symbols', () => {
    expect(ALERT_TOPICS.map((t) => t.dateLabel)).toEqual([
      '28 Nov 2026',
      '1 Jan 2027',
      '1 Mar 2027',
      '1 Jul 2027',
    ]);

    const on14Nov = getUpcomingAlertTopics(ALERT_TOPICS, '2026-11-14');
    expect(on14Nov).toHaveLength(4);
    const introAll = formatAlertTopicsIntro(on14Nov);
    expect(introAll).toContain('28 Nov 2026');
    expect(introAll).toContain('1 Jan 2027');
    expect(introAll).toContain('1 Mar 2027');
    expect(introAll).toContain('1 Jul 2027');
    expect(introAll).not.toContain('$');

    // Election day itself remains active; the day after drops 28 Nov 2026
    expect(getUpcomingAlertTopics(ALERT_TOPICS, '2026-11-28')).toHaveLength(4);
    const on29Nov = getUpcomingAlertTopics(ALERT_TOPICS, '2026-11-29');
    expect(on29Nov.map((t) => t.dateLabel)).toEqual(['1 Jan 2027', '1 Mar 2027', '1 Jul 2027']);

    const on2Feb = getUpcomingAlertTopics(ALERT_TOPICS, '2027-02-02');
    expect(on2Feb.map((t) => t.dateLabel)).toEqual(['1 Mar 2027', '1 Jul 2027']);

    const on2Apr = getUpcomingAlertTopics(ALERT_TOPICS, '2027-04-02');
    expect(on2Apr.map((t) => t.dateLabel)).toEqual(['1 Jul 2027']);
    expect(formatAlertTopicsIntro(on2Apr)).toBe(
      'Key dates we track: 1 Jul 2027 (solar moving into VEU).',
    );

    const afterAll = getUpcomingAlertTopics(ALERT_TOPICS, '2027-07-02');
    expect(afterAll).toHaveLength(0);
    expect(formatAlertTopicsIntro(afterAll)).toBe(
      'Get an email when official Victorian household or business energy rebate rules change.',
    );
  });

  it('resolves APP 5 collection notice placeholders (#8a/b/c) and rejects missing server country or vague "outside Australia"', () => {
    const withOverseas = resolveAlertsApp5Notice(
      {
        PUBLIC_SERVER_COUNTRY: 'Malaysia',
        PUBLIC_ALERTS_PROVIDER: 'Example Mail Pty Ltd',
        PUBLIC_ALERTS_OVERSEAS_NOTE: '; it stores data in the United States and Ireland',
      },
      '29 644 447 263',
    );

    expect(withOverseas.markdownText).toBe(
      "Household Rebates (Agenor Services Pty Ltd, ABN 29 644 447 263, privacy@householdrebates.com.au) collects your email address only to send rule-change alerts you've asked for. " +
        "If you don't give it, we can't send them. " +
        'Your email address is stored on our server in Malaysia. ' +
        "We don't share it with installers or anyone else, except our email service provider, Example Mail Pty Ltd, which sends the emails for us; it stores data in the United States and Ireland. " +
        "Our [privacy policy](/privacy/) explains how to access or correct your details and how to complain. We're not a government website.",
    );
    expect(withOverseas.fullText).not.toMatch(/<<|>>/);
    expect(withOverseas.fullText).not.toContain('$');

    const auOnly = resolveAlertsApp5Notice(
      {
        PUBLIC_SERVER_COUNTRY: 'Australia',
        PUBLIC_ALERTS_PROVIDER: 'AU Mail Pty Ltd',
        PUBLIC_ALERTS_OVERSEAS_NOTE: 'none',
      },
      '29 644 447 263',
    );
    expect(auOnly.markdownText).toContain(
      'Your email address is stored on our server in Australia. We don\'t share it with installers or anyone else, except our email service provider, AU Mail Pty Ltd, which sends the emails for us. Our [privacy policy](/privacy/)',
    );
    expect(auOnly.fullText).not.toMatch(/<<|>>/);

    // Missing PUBLIC_SERVER_COUNTRY -> fails closed
    expect(() =>
      resolveAlertsApp5Notice({
        PUBLIC_ALERTS_PROVIDER: 'Example Mail Pty Ltd',
        PUBLIC_ALERTS_OVERSEAS_NOTE: 'none',
      }),
    ).toThrow(/PUBLIC_SERVER_COUNTRY/);

    // Vague "outside Australia" -> rejected (#8b)
    expect(() =>
      resolveAlertsApp5Notice({
        PUBLIC_SERVER_COUNTRY: 'Malaysia',
        PUBLIC_ALERTS_PROVIDER: 'Example Mail Pty Ltd',
        PUBLIC_ALERTS_OVERSEAS_NOTE: '; it may store data outside Australia',
      }),
    ).toThrow(/specific countries/);

    expect(() =>
      resolveAlertsApp5Notice({
        PUBLIC_SERVER_COUNTRY: 'Malaysia',
        PUBLIC_ALERTS_OVERSEAS_NOTE: 'none',
      }),
    ).toThrow(/PUBLIC_ALERTS_PROVIDER/);

    expect(() =>
      resolveAlertsApp5Notice({
        PUBLIC_SERVER_COUNTRY: 'Malaysia',
        PUBLIC_ALERTS_PROVIDER: 'Example Mail Pty Ltd',
      }),
    ).toThrow(/PUBLIC_ALERTS_OVERSEAS_NOTE/);
  });

  it('check-legal passes with flags off and blocks PUBLIC_LEADS_ENABLED=true, PUBLIC_ALERTS_ENABLED=true, and RELEASE_ID while <<SERVER_COUNTRY>> / <<...>> or pending election status remain', () => {
    const checkLegalScript = path.join(siteRoot, 'scripts/check-legal.mjs');

    const okOut = execFileSync(process.execPath, [checkLegalScript], {
      cwd: siteRoot,
      env: {
        ...process.env,
        PUBLIC_LEADS_ENABLED: 'false',
        PUBLIC_ALERTS_ENABLED: 'false',
        RELEASE_ID: '',
      },
      encoding: 'utf8',
    });
    expect(okOut).toContain('check-legal: OK');

    // Alerts enabled -> blocked by lawyer flags, pending election, and <<SERVER_COUNTRY>> / <<...>> placeholders
    let alertsFailed = false;
    let alertsStderr = '';
    try {
      execFileSync(process.execPath, [checkLegalScript], {
        cwd: siteRoot,
        env: {
          ...process.env,
          PUBLIC_LEADS_ENABLED: 'false',
          PUBLIC_ALERTS_ENABLED: 'true',
          PUBLIC_ALERTS_PROVIDER: 'Example Mail Pty Ltd',
          PUBLIC_ALERTS_OVERSEAS_NOTE: 'none',
        },
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch (err: unknown) {
      alertsFailed = true;
      alertsStderr = String((err as { stderr?: string }).stderr ?? '');
    }
    expect(alertsFailed).toBe(true);
    expect(alertsStderr).toContain('alertsLegalReviewed=false');
    expect(alertsStderr).toContain('electionWatch.status="pending"');
    expect(alertsStderr).toContain('<<SERVER_COUNTRY>>');

    // Leads enabled -> blocked by lawyer flags, pending election (#11), and <<SERVER_COUNTRY>> / <<...>> placeholders (#1)
    let leadsFailed = false;
    let leadsStderr = '';
    try {
      execFileSync(process.execPath, [checkLegalScript], {
        cwd: siteRoot,
        env: {
          ...process.env,
          PUBLIC_LEADS_ENABLED: 'true',
          PUBLIC_ALERTS_ENABLED: 'false',
        },
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch (err: unknown) {
      leadsFailed = true;
      leadsStderr = String((err as { stderr?: string }).stderr ?? '');
    }
    expect(leadsFailed).toBe(true);
    expect(leadsStderr).toContain('legalReviewed=false');
    expect(leadsStderr).toContain('electionWatch.status="pending"');
    expect(leadsStderr).toContain('<<SERVER_COUNTRY>>');

    // Production deploy (RELEASE_ID set) -> blocked while <<SERVER_COUNTRY>> is in privacy.mdx (#1)
    let prodFailed = false;
    let prodStderr = '';
    try {
      execFileSync(process.execPath, [checkLegalScript], {
        cwd: siteRoot,
        env: {
          ...process.env,
          PUBLIC_LEADS_ENABLED: 'false',
          PUBLIC_ALERTS_ENABLED: 'false',
          RELEASE_ID: '20261115-prod-test',
        },
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch (err: unknown) {
      prodFailed = true;
      prodStderr = String((err as { stderr?: string }).stderr ?? '');
    }
    expect(prodFailed).toBe(true);
    expect(prodStderr).toContain('<<SERVER_COUNTRY>>');
  });
});
