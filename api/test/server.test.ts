import { describe, expect, it } from 'vitest';
import { buildServer } from '../src/server.js';
import { signFormToken } from '../src/antispam.js';
import type { ApiConfig, InstallerRecord } from '../src/config.js';
import { deliverLeadByRef } from '../src/cli/deliver.js';
import { withdrawConsent } from '../src/cli/withdraw.js';
import { exportPersonalData } from '../src/cli/export.js';
import { erasePersonalData } from '../src/cli/erase.js';
import { runRetentionPurge } from '../src/cli/purge.js';

const MOCK_INSTALLER: InstallerRecord = {
  id: 'inst-bayside-01',
  tradingName: 'Bayside Electrification Pty Ltd',
  legalName: 'Bayside Electrification Pty Ltd',
  abn: '12345678901',
  accreditedProvider: 'VEU Certifiers Victoria Pty Ltd',
  isAccreditedProvider: false,
  activities: ['rcac', 'hotwater'],
  postcodes: ['3000', '3199', '3220'],
  licence: { type: 'VBA Plumbing & ESV Electrical', number: 'LIC-998877' },
  agreementSignedOn: '2026-11-13',
  agreementVersion: '2026-v1',
  contactEmailForLeads: 'leads@bayside-example.com.au',
  publicBlurb: 'Licensed heat pump and reverse-cycle installer covering Melbourne and Bayside.',
  active: true,
};

function makeTestConfig(overrides: Partial<ApiConfig> = {}): ApiConfig {
  return {
    nodeEnv: 'test',
    host: '127.0.0.1',
    port: 0,
    dbPath: ':memory:',
    leadsEnabled: true,
    autoDeliver: false,
    siteOrigin: 'https://householdrebates.com.au',
    ipHashSecret: 'test-ip-secret-12345',
    formTokenSecret: 'test-token-secret-67890',
    mailTransport: 'memory',
    mailFrom: 'Household Rebates <quotes@householdrebates.com.au>',
    leadsNotifyTo: 'guri@householdrebates.com.au',
    privacyPolicyVersion: '2026-11-15-v2',
    consentReviewedBy: 'Victorian Legal Counsel',
    serverCountry: 'Malaysia',
    leadsEmailProviderNote: 'Postmark (United States)',
    installersPath: 'installers.json',
    ...overrides,
  };
}

describe('Lead Handler API & Startup Guards', () => {
  it('refuses to start with LEADS_ENABLED=true when installers list is empty', async () => {
    await expect(
      buildServer({
        config: makeTestConfig({ leadsEnabled: true }),
        installers: [],
      }),
    ).rejects.toThrow(/Refusing to start with LEADS_ENABLED=true/);
  });

  it('refuses to start with LEADS_ENABLED=true when CONSENT_REVIEWED_BY is missing', async () => {
    await expect(
      buildServer({
        config: makeTestConfig({ leadsEnabled: true, consentReviewedBy: '' }),
        installers: [MOCK_INSTALLER],
      }),
    ).rejects.toThrow(/CONSENT_REVIEWED_BY must be set/);
  });

  it('refuses to start with LEADS_ENABLED=true when SERVER_COUNTRY or LEADS_EMAIL_PROVIDER_NOTE contains <<...>> placeholders', async () => {
    await expect(
      buildServer({
        config: makeTestConfig({ leadsEnabled: true, serverCountry: '<<SERVER_COUNTRY>>' }),
        installers: [MOCK_INSTALLER],
      }),
    ).rejects.toThrow(/SERVER_COUNTRY must be set without <<\.\.\.>> placeholders/);

    await expect(
      buildServer({
        config: makeTestConfig({
          leadsEnabled: true,
          leadsEmailProviderNote: '<<EMAIL_PROVIDER_AND_COUNTRY>>',
        }),
        installers: [MOCK_INSTALLER],
      }),
    ).rejects.toThrow(/LEADS_EMAIL_PROVIDER_NOTE must be set without <<\.\.\.>> placeholders/);
  });

  it('returns 503 (JSON) or 303 redirect (HTML) when LEADS_ENABLED=false', async () => {
    const { app } = await buildServer({
      config: makeTestConfig({ leadsEnabled: false }),
      installers: [],
    });

    const jsonRes = await app.inject({
      method: 'POST',
      url: '/leads',
      headers: {
        origin: 'https://householdrebates.com.au',
        'content-type': 'application/json',
      },
      payload: {},
    });
    expect(jsonRes.statusCode).toBe(503);

    const htmlRes = await app.inject({
      method: 'POST',
      url: '/leads',
      headers: {
        origin: 'https://householdrebates.com.au',
        'content-type': 'application/x-www-form-urlencoded',
      },
      payload: 'activity=rcac',
    });
    expect(htmlRes.statusCode).toBe(303);
    expect(htmlRes.headers.location).toBe('/form-error/?reason=closed');
  });

  it('rejects requests without valid Origin/Referer with 403', async () => {
    const { app } = await buildServer({
      config: makeTestConfig(),
      installers: [MOCK_INSTALLER],
    });

    const res = await app.inject({
      method: 'POST',
      url: '/leads',
      headers: {
        origin: 'https://evil.example.com',
        'content-type': 'application/json',
      },
      payload: {},
    });
    expect(res.statusCode).toBe(403);
  });

  it('fakes success on honeypot fill without storing a lead', async () => {
    const { app, db } = await buildServer({
      config: makeTestConfig(),
      installers: [MOCK_INSTALLER],
    });

    const res = await app.inject({
      method: 'POST',
      url: '/leads',
      headers: {
        origin: 'https://householdrebates.com.au',
        'content-type': 'application/json',
      },
      payload: {
        website: 'http://spammer.example.com',
      },
    });
    expect(res.statusCode).toBe(200);
    const count = db.prepare('SELECT COUNT(*) as c FROM leads').get() as { c: number };
    expect(count.c).toBe(0);
    const hp = db.prepare('SELECT SUM(count) as s FROM rate_counters').get() as { s: number };
    expect(hp.s).toBe(1);
  });

  it('stores lead, consent snapshot, scopes, sends emails, and supports deliver/withdraw/export/erase/purge CLIs', async () => {
    const cfg = makeTestConfig();
    const { app, db, mail } = await buildServer({
      config: cfg,
      installers: [MOCK_INSTALLER],
    });

    const validToken = signFormToken(cfg.formTokenSecret, Date.now() - 10_000);

    const payload = {
      activity: 'rcac',
      currentSystem: 'room-gas',
      firstName: 'Sarah',
      lastName: 'Connor',
      email: 'sarah@example.com.au',
      phone: '0412 345 678',
      postcode: '3199',
      ownership: 'rent',
      landlordOk: 'yes',
      buildingOver2Years: 'yes',
      workStarted: 'no',
      contactPrefs: ['phone', 'email'],
      message: 'Looking to replace wall gas heater in living room.',
      howHeard: 'ChatGPT',
      consent: true,
      consentVersion: 'vic-rcac-v2',
      recipientIds: ['inst-bayside-01'],
      formToken: validToken,
      website: '',
      pageUrl: '/victoria/air-conditioner-rebate/',
    };

    const res = await app.inject({
      method: 'POST',
      url: '/leads',
      headers: {
        origin: 'https://householdrebates.com.au',
        'content-type': 'application/json',
      },
      payload,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as { ok: boolean; ref: string };
    expect(body.ok).toBe(true);
    expect(body.ref).toMatch(/^HR-[A-Z0-9]{6}$/);

    // Verify DB records
    const lead = db.prepare('SELECT * FROM leads WHERE ref = ?').get(body.ref) as Record<string, any>;
    expect(lead.email).toBe('sarah@example.com.au');
    expect(lead.phone_e164).toBe('+61412345678');
    expect(lead.status).toBe('new');

    const consent = db.prepare('SELECT * FROM consents WHERE lead_id = ?').get(lead.id) as Record<string, any>;
    expect(consent.version).toBe('vic-rcac-v2');
    expect(consent.text_snapshot).toContain('Bayside Electrification Pty Ltd');
    expect(consent.text_snapshot).toContain('VEU Certifiers Victoria Pty Ltd');
    expect(consent.text_snapshot).toContain('only to create the VEU certificates for your installation');
    expect(consent.text_snapshot).toContain('Your details are stored on our server in Malaysia and sent by email through Postmark (United States).');
    expect(consent.text_snapshot).toContain('Solar Victoria');
    expect(consent.text_snapshot).toContain('Clean Energy Regulator');
    expect(consent.text_snapshot).not.toContain('I have read');

    const scopes = db.prepare('SELECT * FROM consent_scopes WHERE consent_id = ?').all(consent.id) as any[];
    expect(scopes.length).toBe(2);

    // 2 emails sent on submission (internal notice + consumer confirmation)
    expect(mail.sentMessages?.length).toBe(2);
    expect(mail.sentMessages?.[0].subject).not.toContain('Sarah');

    // Test CLI deliver
    const deliv = await deliverLeadByRef(db, mail, [MOCK_INSTALLER], body.ref);
    expect(deliv.deliveredCount).toBe(1);
    expect(mail.sentMessages?.length).toBe(3);

    // Test CLI export
    const exported = exportPersonalData(db, 'sarah@example.com.au');
    expect((exported.records as any[]).length).toBe(1);

    // Test CLI withdraw
    const wd = await withdrawConsent(db, mail, [MOCK_INSTALLER], { ref: body.ref });
    expect(wd.withdrawnRefs).toEqual([body.ref]);
    expect(wd.notifiedInstallers).toBe(1);
    expect(mail.sentMessages?.length).toBe(4);
    expect(mail.sentMessages?.[3].subject).toContain('CONSENT WITHDRAWN');

    // Test CLI erase
    const erased = erasePersonalData(db, 'sarah@example.com.au');
    expect(erased.erasedCount).toBe(1);
    const afterErase = db.prepare('SELECT * FROM leads WHERE ref = ?').get(body.ref) as Record<string, any>;
    expect(afterErase.email).toBeNull();
    expect(afterErase.first_name).toBeNull();
    expect(afterErase.status).toBe('erased');

    // Test CLI purge
    const purgeRes = runRetentionPurge(db, new Date(Date.now() + 800 * 24 * 60 * 60 * 1000));
    expect(purgeRes.consentsDeleted).toBe(1);
  });
});
