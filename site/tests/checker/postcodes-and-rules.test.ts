import { describe, expect, it } from 'vitest';
import {
  evaluate,
  FIELDS_META,
  getDefaultCheckerContext,
  LINKS_DATA,
  lookupPostcode,
  MESSAGES,
  RULES_META,
  type CheckerAnswers,
  type MessageId,
} from '../../src/lib/checker';
import {
  evaluateWithCatalog,
  FIELD_HOOKS,
  hydrateFields,
  hydrateRules,
  pruneHiddenAnswersFromList,
  RULE_HOOKS,
} from '../../src/lib/checker/client';
import { hydrateCompactPostcodes } from '../../src/lib/checker/postcode-client';
import { buildCompactPostcodeArtifact } from '../../src/lib/checker/postcode-compact';
import { decodeAnswersFromHash, encodeAnswersToHash } from '../../src/lib/checker/share';

describe('Postcode validation and 719-row coverage', () => {
  const ctx = getDefaultCheckerContext();

  it('resolves all 719 postcodes in postcodes.json including 3000', () => {
    const allCodes = Object.keys(ctx.postcodes.rows);
    expect(allCodes).toHaveLength(719);
    expect(allCodes).toContain('3000');

    for (const code of allCodes) {
      const res = lookupPostcode(code, ctx.postcodes);
      expect(res.ok, `Expected postcode ${code} to resolve`).toBe(true);
    }
  });

  it('returns X1 for 2000, 300, 30000, "3abc", and a 3xxx postcode absent from postcodes.csv', () => {
    // Pick a 4-digit 3xxx code verified absent from the 719-row table
    let unlisted3xxx = '';
    for (let n = 3000; n <= 3999; n++) {
      const candidate = String(n);
      if (!ctx.postcodes.rows[candidate]) {
        unlisted3xxx = candidate;
        break;
      }
    }
    expect(unlisted3xxx).toMatch(/^3\d{3}$/);

    for (const bad of ['2000', '300', '30000', '3abc', unlisted3xxx, '']) {
      const lookup = lookupPostcode(bad, ctx.postcodes);
      expect(lookup).toEqual({ ok: false, messageId: 'X1' });

      const evaluated = evaluate({ S1: 'residential', R2: bad });
      expect(evaluated.validPostcode).toBe(false);
      expect(evaluated.postcodeError?.id).toBe('X1');
      expect(evaluated.areaCard).toBeNull();
    }
  });
});

describe('Rule tests beyond the 6 spec examples', () => {
  const ctx = getDefaultCheckerContext();

  it('RD-1 returns 2-year/5-year pairs by home type and never a lone 5-year house figure', () => {
    const resApt = evaluate({
      S1: 'residential',
      R2: '3000',
      R3: 'tenant',
      R4: 'apartment',
      R5: 'yes',
      R6: ['draughts'],
    });
    const rd1Apt = resApt.veuLines.find((l) => l.ruleId === 'RD-1')!;
    expect(rd1Apt.status).toBe('likely');
    expect(rd1Apt.figureIds).toEqual([
      'vic-veu-sealing-apartment-2yr',
      'vic-veu-sealing-apartment-5yr',
    ]);
    expect(rd1Apt.notes).toContain("You may need your landlord's permission.");

    const resHouse = evaluate({
      S1: 'residential',
      R2: '3000',
      R3: 'own-and-live',
      R4: 'house-or-townhouse',
      R5: 'yes',
      R6: ['draughts'],
    });
    const rd1House = resHouse.veuLines.find((l) => l.ruleId === 'RD-1')!;
    expect(rd1House.figureIds).toEqual([
      'vic-veu-sealing-townhouse-2yr',
      'vic-veu-sealing-townhouse-5yr',
      'vic-veu-sealing-house-2yr',
      'vic-veu-sealing-house-5yr',
    ]);
    expect(rd1House.figureIds).not.toEqual(['vic-veu-sealing-house-5yr']);

    const resNotSure = evaluate({
      S1: 'residential',
      R2: '3000',
      R3: 'own-and-live',
      R4: 'other-not-sure',
      R5: 'yes',
      R6: ['draughts'],
    });
    const rd1NotSure = resNotSure.veuLines.find((l) => l.ruleId === 'RD-1')!;
    expect(rd1NotSure.figureIds).toEqual([
      'vic-veu-sealing-apartment-2yr',
      'vic-veu-sealing-apartment-5yr',
      'vic-veu-sealing-townhouse-2yr',
      'vic-veu-sealing-townhouse-5yr',
      'vic-veu-sealing-house-2yr',
      'vic-veu-sealing-house-5yr',
    ]);
  });

  it('RD-2 adds N-SEAL-GAS for a gas room heater or unasked H1, and omits it for a split system', () => {
    const withGasRoom = evaluate({
      S1: 'residential',
      R2: '3000',
      R3: 'own-and-live',
      R4: 'house-or-townhouse',
      R5: 'yes',
      R6: ['heating-cooling', 'draughts'],
      H1: 'gas-room-heater',
      H2: 'split-one-room',
    });
    expect(withGasRoom.firedRuleIds).toContain('RD-2');
    const rd2Banner = withGasRoom.banners.find((b) => b.ruleId === 'RD-2');
    expect(rd2Banner?.message?.id).toBe('N-SEAL-GAS');

    const withSplit = evaluate({
      S1: 'residential',
      R2: '3000',
      R3: 'own-and-live',
      R4: 'house-or-townhouse',
      R5: 'yes',
      R6: ['heating-cooling', 'draughts'],
      H1: 'reverse-cycle-split-room-unit',
      H2: 'split-one-room',
    });
    expect(withSplit.firedRuleIds).not.toContain('RD-2');
  });

  it('B-RES-ONLY gives Possibly with dryer figure for a business heat pump dryer, and N-BIZ-RES for household-only items', () => {
    const dryerOnly = evaluate({
      S1: 'business',
      B2: '3000',
      B3: 'hospitality-food',
      B4: 'no',
      B5: 'yes',
      B6: ['heat-pump-dryer'],
    });
    expect(dryerOnly.veuLines).toHaveLength(1);
    expect(dryerOnly.veuLines[0].ruleId).toBe('B-RES-ONLY');
    expect(dryerOnly.veuLines[0].status).toBe('possibly');
    expect(dryerOnly.veuLines[0].figureIds).toEqual(['vic-veu-appliance-dryer']);
    expect(dryerOnly.ineligibleLines).toEqual([]);
    expect(dryerOnly.lines.some((l) => l.message?.id === 'N-BIZ-RES')).toBe(false);

    const householdOnly = evaluate({
      S1: 'business',
      B2: '3000',
      B3: 'office-or-retail',
      B4: 'no',
      B5: 'yes',
      B6: ['household-only-inquiry'],
    });
    expect(householdOnly.veuLines).toEqual([]);
    expect(householdOnly.ineligibleLines).toHaveLength(1);
    expect(householdOnly.ineligibleLines[0].message?.id).toBe('N-BIZ-RES');
    expect(householdOnly.allIneligibleMessage?.id).toBe('N-NONE');

    const both = evaluate({
      S1: 'business',
      B2: '3000',
      B3: 'hospitality-food',
      B4: 'no',
      B5: 'yes',
      B6: ['heat-pump-dryer', 'household-only-inquiry'],
    });
    expect(both.veuLines).toHaveLength(1);
    expect(both.veuLines[0].figureIds).toEqual(['vic-veu-appliance-dryer']);
    expect(both.ineligibleLines).toHaveLength(1);
    expect(both.ineligibleLines[0].message?.id).toBe('N-BIZ-RES');
  });

  it('GAS-NO links to lpg-homes now that row 74 is enabled (with get-off-gas-planner fallback), and HPZ-5 fires on zone-5 postcodes with no figure', () => {
    // 3463 Maldon is Regional, no reticulated gas, Cold, heat pump zone 5
    const resDefault = evaluate({
      S1: 'residential',
      R2: '3463',
      R2a: 'no',
      R3: 'own-and-live',
      R4: 'house-or-townhouse',
      R5: 'yes',
      R6: ['hot-water'],
      W1: 'gas-mains',
      W2: 'no',
      W3: 'heat-pump',
      W4: 'yes',
      SH1: 'yes',
      SH2: 'yes',
      SH3: 'no',
    });

    const gasNo = resDefault.banners.find((b) => b.ruleId === 'GAS-NO')!;
    expect(gasNo).toBeDefined();
    expect(gasNo.figureIds).toEqual([]);
    expect(gasNo.links[0].href).toBe('/victoria/lpg-homes/');

    const hpz5 = resDefault.banners.find((b) => b.ruleId === 'HPZ-5')!;
    expect(hpz5).toBeDefined();
    expect(hpz5.figureIds).toEqual([]);

    const withoutLpgUrls = new Set([...ctx.enabledUrls].filter((u) => u !== '/victoria/lpg-homes/'));
    const resFallback = evaluate(
      {
        S1: 'residential',
        R2: '3463',
        R2a: 'no',
        R3: 'own-and-live',
        R4: 'house-or-townhouse',
        R5: 'yes',
        R6: ['hot-water'],
        W1: 'gas-mains',
        W2: 'no',
        W3: 'heat-pump',
        W4: 'yes',
        SH1: 'yes',
        SH2: 'yes',
        SH3: 'no',
      },
      { enabledUrls: withoutLpgUrls },
    );
    const gasNoFallback = resFallback.banners.find((b) => b.ruleId === 'GAS-NO')!;
    expect(gasNoFallback.links[0].href).toBe('/victoria/get-off-gas-planner/');
  });

  it('client bootstrap hydration, compact postcodes, and #a= share hash match server evaluate() identically', () => {
    const compactArtifact = buildCompactPostcodeArtifact();
    const hydratedPostcodes = hydrateCompactPostcodes(JSON.parse(compactArtifact.json));
    expect(Object.keys(hydratedPostcodes.rows)).toHaveLength(719);

    const rules = hydrateRules(JSON.parse(JSON.stringify(RULES_META)), RULE_HOOKS);
    const fields = hydrateFields(JSON.parse(JSON.stringify(FIELDS_META)), FIELD_HOOKS);
    const catalog = {
      rules,
      rulesById: new Map(rules.map((r) => [r.id, r])),
      messagesById: new Map(MESSAGES.map((m) => [m.id as MessageId, m])),
      links: JSON.parse(JSON.stringify(LINKS_DATA)),
    };

    const sampleAnswers: CheckerAnswers[] = [
      {
        S1: 'residential',
        R2: '3427',
        R3: 'own-and-live',
        R4: 'house-or-townhouse',
        R5: 'yes',
        R6: ['heating-cooling', 'hot-water'],
        H1: 'ducted-gas-heater',
        H2: 'ducted-reverse-cycle',
        W1: 'gas-mains',
        W2: 'no',
        W3: 'heat-pump',
        W4: 'yes',
        SH1: 'yes',
        SH2: 'yes',
        SH3: 'no',
      },
      {
        S1: 'business',
        B2: '3064',
        B3: 'warehouse-factory-industrial',
        B4: 'no',
        B5: 'yes',
        B6: ['lighting', 'solar-panels'],
        BL1: ['outdoor-carpark-sports'],
        BP1: '50-to-100-kw',
        BP1ExactKw: 100,
      },
    ];

    for (const ans of sampleAnswers) {
      const pc = ans.S1 === 'business' ? ans.B2! : ans.R2!;
      const pruned = pruneHiddenAnswersFromList(
        fields,
        ans,
        hydratedPostcodes.rows[pc],
        ctx.solsticePostcodes,
      );
      const hash = encodeAnswersToHash(pruned);
      expect(hash.startsWith('#a=')).toBe(true);
      const decoded = decodeAnswersFromHash(hash);
      expect(decoded).toEqual(pruned);

      const clientRes = evaluateWithCatalog(
        decoded!,
        {
          postcodes: hydratedPostcodes,
          figures: ctx.figures,
          sources: ctx.sources,
          enabledUrls: ctx.enabledUrls,
          solsticePostcodes: ctx.solsticePostcodes,
        },
        catalog,
      );
      expect(clientRes).toEqual(evaluate(ans));
    }

    expect(decodeAnswersFromHash('')).toBeNull();
    expect(decodeAnswersFromHash('#faq-something')).toBeNull();
    expect(decodeAnswersFromHash('#a=not-valid-json!')).toBeNull();
  });
});
