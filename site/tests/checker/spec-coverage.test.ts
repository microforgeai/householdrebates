import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  evaluate,
  getDefaultCheckerContext,
  loadSolsticePostcodesFromRow53,
  MESSAGES,
  resolveAreaLink,
  RULES,
  SPEC_SECTION_9_UNVERIFIED_RULE_IDS,
  SPEC_SOLSTICE_POSTCODES,
} from '../../src/lib/checker';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const specPath = path.join(repoRoot, 'docs/eligibility-checker-spec.md');

function parseSpecRuleAndMessageIds(markdown: string): {
  ruleIds: string[];
  messageIds: string[];
} {
  const lines = markdown.split(/\r?\n/);
  let currentSection = '';
  const ruleIds: string[] = [];
  const messageIds: string[] = [];

  for (const line of lines) {
    if (line.startsWith('## ') || line.startsWith('### ')) {
      currentSection = line.trim();
      continue;
    }

    if (!line.startsWith('|')) continue;
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length < 2) continue;

    const firstCell = cells[0];
    if (!firstCell || firstCell === 'ID' || /^-+$/.test(firstCell)) {
      continue;
    }

    if (
      currentSection.startsWith('### 5.1') ||
      currentSection.startsWith('### 5.2') ||
      currentSection.startsWith('### 5.3')
    ) {
      ruleIds.push(firstCell);
    } else if (currentSection.startsWith('## 6.')) {
      messageIds.push(firstCell);
    }
  }

  return { ruleIds, messageIds };
}

describe('spec coverage and rule integrity', () => {
  const specMarkdown = fs.readFileSync(specPath, 'utf8');
  const { ruleIds: specRuleIds, messageIds: specMessageIds } =
    parseSpecRuleAndMessageIds(specMarkdown);

  it('implements every §5 rule ID and §6 message ID 1-to-1 with no extras', () => {
    const implRuleIds = RULES.map((r) => r.id);
    const implMessageIds = MESSAGES.map((m) => m.id);

    console.info(
      `spec coverage: rules ${implRuleIds.length}/${specRuleIds.length}, messages ${implMessageIds.length}/${specMessageIds.length}`,
    );

    expect(specRuleIds.length).toBe(75);
    expect(specMessageIds.length).toBe(22);

    expect(new Set(implRuleIds).size).toBe(implRuleIds.length);
    expect(new Set(implMessageIds).size).toBe(implMessageIds.length);

    const missingRules = specRuleIds.filter((id) => !implRuleIds.includes(id));
    const extraRules = implRuleIds.filter((id) => !specRuleIds.includes(id));
    expect(missingRules).toEqual([]);
    expect(extraRules).toEqual([]);

    const missingMessages = specMessageIds.filter(
      (id) => !implMessageIds.includes(id as (typeof implMessageIds)[number]),
    );
    const extraMessages = implMessageIds.filter((id) => !specMessageIds.includes(id));
    expect(missingMessages).toEqual([]);
    expect(extraMessages).toEqual([]);
  });

  it('cites >= 1 official source on every rule, resolves all figures, and keeps §9 UNVERIFIED rules figure-free', () => {
    const ctx = getDefaultCheckerContext();

    for (const rule of RULES) {
      expect(
        rule.sourceIds.length,
        `Rule ${rule.id} must cite at least one sourceId`,
      ).toBeGreaterThanOrEqual(1);

      for (const sourceId of rule.sourceIds) {
        const src = ctx.sources.get(sourceId);
        expect(src, `Rule ${rule.id} references missing source "${sourceId}"`).toBeDefined();
        expect(
          src?.official,
          `Rule ${rule.id} source "${sourceId}" must be official`,
        ).toBe(true);
      }

      for (const figId of rule.figureIds) {
        expect(
          ctx.figures.has(figId),
          `Rule ${rule.id} references missing figure "${figId}"`,
        ).toBe(true);
      }

      for (const coPayId of rule.coPayFigureIds ?? []) {
        expect(
          ctx.figures.has(coPayId),
          `Rule ${rule.id} references missing coPay figure "${coPayId}"`,
        ).toBe(true);
      }

      if (SPEC_SECTION_9_UNVERIFIED_RULE_IDS.has(rule.id)) {
        expect(
          rule.figureIds,
          `Spec §9 UNVERIFIED rule ${rule.id} must not publish consumer figures`,
        ).toEqual([]);
      }
    }
  });

  it('keeps rule why strings free of dollar amounts and banned eligibility promises', () => {
    const bannedPhrases =
      /\b(?:eligible|you'll get|you will get|you qualify|guaranteed|claim now)\b/i;

    for (const rule of RULES) {
      expect(rule.why, `Rule ${rule.id} why contains "$"`).not.toMatch(/\$/);
      expect(
        rule.why,
        `Rule ${rule.id} why contains banned wording`,
      ).not.toMatch(bannedPhrases);
    }

    for (const id2027 of ['RH-9', 'RW-8', 'RI-5']) {
      const rule = RULES.find((r) => r.id === id2027);
      expect(rule?.why).toContain('currently legislated');
    }
  });

  it('matches row 53 Solstice postcodes exactly against the spec list', () => {
    const row53Postcodes = loadSolsticePostcodesFromRow53();
    expect(row53Postcodes).toEqual([...SPEC_SOLSTICE_POSTCODES]);
  });
});

describe('area link resolution', () => {
  const ctx = getDefaultCheckerContext();

  it('resolves 3427, 3029, 3064, 3000 and all five metro hubs under live rollout.json, with metro-regions.json 1:1 parity', () => {
    // Live rollout.json now has rows 61–64 enabled alongside row 14 and the specific council/corridor pages
    expect(resolveAreaLink(ctx.postcodes.rows['3029'], ctx.enabledUrls).href).toBe('/victoria/wyndham/');
    expect(resolveAreaLink(ctx.postcodes.rows['3064'], ctx.enabledUrls).href).toBe('/victoria/melbourne-north/');
    expect(resolveAreaLink(ctx.postcodes.rows['3000'], ctx.enabledUrls).href).toBe('/victoria/melbourne/');
    expect(resolveAreaLink(ctx.postcodes.rows['3427'], ctx.enabledUrls).href).toBe(
      '/victoria/north-west-corridor/',
    );
    expect(resolveAreaLink(ctx.postcodes.rows['3020'], ctx.enabledUrls).href).toBe('/victoria/melbourne-west/');
    expect(resolveAreaLink(ctx.postcodes.rows['3128'], ctx.enabledUrls).href).toBe('/victoria/melbourne-east/');
    expect(resolveAreaLink(ctx.postcodes.rows['3810'], ctx.enabledUrls).href).toBe(
      '/victoria/melbourne-south-east/',
    );
    // Specific enabled council pages take precedence over their containing metro hub
    expect(resolveAreaLink(ctx.postcodes.rows['3805'], ctx.enabledUrls).href).toBe('/victoria/casey/');
    expect(resolveAreaLink(ctx.postcodes.rows['3076'], ctx.enabledUrls).href).toBe('/victoria/whittlesea/');
    expect(resolveAreaLink(ctx.postcodes.rows['3140'], ctx.enabledUrls).href).toBe('/victoria/yarra-ranges/');
    expect(resolveAreaLink(ctx.postcodes.rows['3756'], ctx.enabledUrls).href).toBe('/victoria/mitchell/');

    // Verify metro-regions.json agrees 1-to-1 with links-data.json metroHubByLga
    const metroRegions = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'site/src/data/metro-regions.json'), 'utf8'),
    );
    const linksData = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'site/src/lib/checker/links-data.json'), 'utf8'),
    );
    const expectedByLga: Record<string, { url: string; label: string }> = {};
    for (const reg of metroRegions.regions) {
      for (const lga of reg.lgas) {
        expectedByLga[lga] = { url: reg.url, label: reg.checkerLabel };
      }
    }
    expect(linksData.metroHubByLga).toEqual(expectedByLga);

    // Fallback when specific/hub rows aren't enabled, with row 54 enabled vs disabled
    const withPostcodePageOnly = new Set(['/victoria/', '/victoria/postcode/']);
    expect(resolveAreaLink(ctx.postcodes.rows['3427'], withPostcodePageOnly).href).toBe(
      '/victoria/postcode/',
    );

    const victoriaHubOnly = new Set(['/victoria/']);
    expect(resolveAreaLink(ctx.postcodes.rows['3427'], victoriaHubOnly).href).toBe(
      '/victoria/',
    );
  });

  it('computes oldestCheckedOn across all checker-referenced figures', () => {
    const res = evaluate({
      S1: 'residential',
      R2: '3000',
      R3: 'own-and-live',
      R4: 'house-or-townhouse',
      R5: 'yes',
      R6: ['heating-cooling'],
      H1: 'gas-room-heater',
      H2: 'split-one-room',
    });
    expect(res.oldestCheckedOn).toBe('2026-11-13');
  });
});
