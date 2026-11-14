import { describe, expect, it } from 'vitest';
import {
  evaluate,
  getDefaultCheckerContext,
  getVisibleFields,
} from '../../src/lib/checker';

function assertFigureAmount(
  figureId: string,
  expectedMax: number,
  expectedMin?: number,
): void {
  const fig = getDefaultCheckerContext().figures.get(figureId);
  expect(fig, `Expected figure "${figureId}" to exist in vic-veu.yaml`).toBeDefined();
  expect(
    fig?.amountMax,
    `Figure "${figureId}" amountMax changed: got ${fig?.amountMax}, spec expected ${expectedMax}`,
  ).toBe(expectedMax);
  if (expectedMin !== undefined) {
    expect(
      fig?.amountMin,
      `Figure "${figureId}" amountMin changed: got ${fig?.amountMin}, spec expected ${expectedMin}`,
    ).toBe(expectedMin);
  }
}

describe('Spec §8 acceptance examples (1–6)', () => {
  const ctx = getDefaultCheckerContext();

  it('Example 1: 3427 Diggers Rest, residential owner-occupier >2 yrs, ducted gas -> ducted + gas HW -> heat pump, income under cap', () => {
    // Separate assertions checking each referenced figure's current numeric value equals the spec's
    assertFigureAmount('vic-veu-rcac-ducted-gas-10kw', 2520);
    assertFigureAmount('vic-veu-rcac-ducted-gas-16kw', 4200);
    assertFigureAmount('vic-veu-rcac-ducted-gas-22kw', 5530);
    assertFigureAmount('vic-veu-copay-ducted', 3000);
    assertFigureAmount('vic-veu-hw-gas-to-heatpump', 560);
    assertFigureAmount('vic-solar-homes-hw-rebate', 1000);
    assertFigureAmount('vic-solar-homes-hw-rebate-local', 1400);
    assertFigureAmount('vic-hw-combined-solar-homes', 1560);
    assertFigureAmount('vic-hw-combined-solar-homes-local', 1960);

    const answers = {
      S1: 'residential' as const,
      R2: '3427',
      R3: 'own-and-live' as const,
      R4: 'house-or-townhouse' as const,
      R5: 'yes' as const,
      R6: ['heating-cooling', 'hot-water'] as const,
      H1: 'ducted-gas-heater' as const,
      H2: 'ducted-reverse-cycle' as const,
      W1: 'gas-mains' as const,
      W2: 'no' as const,
      W3: 'heat-pump' as const,
      W4: 'yes' as const,
      SH1: 'yes' as const,
      SH2: 'yes' as const,
      SH3: 'no' as const,
    };

    // Default live rollout (row 56 enabled in Prompt 37) resolves directly to /victoria/north-west-corridor/
    const res = evaluate({ ...answers, R6: [...answers.R6] });

    expect(res.validPostcode).toBe(true);
    expect(res.areaCard?.summaryText).toBe(
      'Diggers Rest · Melton (93%) / Hume (7%) · Metropolitan · mains gas · Mild · zone 4',
    );
    expect(res.areaCard?.areaLink.href).toBe('/victoria/north-west-corridor/');
    expect(res.ctas.area?.href).toBe('/victoria/north-west-corridor/');

    // Fallback when row 56 (corridor) and row 62 (melbourne-west) are not yet enabled:
    // resolves to /victoria/postcode/ when row 54 is enabled, else /victoria/
    const withoutCorridorOrWest = new Set(
      [...ctx.enabledUrls].filter(
        (u) => u !== '/victoria/north-west-corridor/' && u !== '/victoria/melbourne-west/',
      ),
    );
    const resFallback = evaluate(
      { ...answers, R6: [...answers.R6] },
      { enabledUrls: withoutCorridorOrWest },
    );
    expect(resFallback.areaCard?.areaLink.specHref).toBe('/victoria/north-west-corridor/');
    expect(resFallback.areaCard?.areaLink.href).toBe(
      withoutCorridorOrWest.has('/victoria/postcode/') ? '/victoria/postcode/' : '/victoria/',
    );

    // Ordered lines: VEU (RH-2, RW-1), Solar Homes (SH-HW), FEDERAL (FED-STC)
    expect(res.lines.map((l) => l.ruleId)).toEqual(['RH-2', 'RW-1', 'SH-HW', 'FED-STC']);

    const rh2 = res.lines.find((l) => l.ruleId === 'RH-2')!;
    expect(rh2.status).toBe('likely');
    expect(rh2.figureIds).toEqual([
      'vic-veu-rcac-ducted-gas-10kw',
      'vic-veu-rcac-ducted-gas-16kw',
      'vic-veu-rcac-ducted-gas-22kw',
    ]);
    expect(rh2.coPayFigureIds).toEqual(['vic-veu-copay-ducted']);

    const rw1 = res.lines.find((l) => l.ruleId === 'RW-1')!;
    expect(rw1.status).toBe('likely');
    expect(rw1.figureIds).toEqual(['vic-veu-hw-gas-to-heatpump']);

    const shHw = res.lines.find((l) => l.ruleId === 'SH-HW')!;
    expect(shHw.status).toBe('likely');
    expect(shHw.figureIds).toEqual([
      'vic-solar-homes-hw-rebate',
      'vic-solar-homes-hw-rebate-local',
      'vic-hw-combined-solar-homes',
      'vic-hw-combined-solar-homes-local',
    ]);

    const fedStc = res.lines.find((l) => l.ruleId === 'FED-STC')!;
    expect(fedStc.status).toBe('info');
    expect(fedStc.figureIds).toEqual([]);

    // G-RETRO footer modifier
    const gRetro = res.modifiers.find((m) => m.ruleId === 'G-RETRO');
    expect(gRetro).toBeDefined();
    expect(gRetro?.placement).toBe('footer');

    // CTAs: find-an-accredited-provider + the two guides (and co-payment explainer)
    const primaryHrefs = res.ctas.primary.map((c) => c.href);
    const secondaryHrefs = res.ctas.secondary.map((c) => c.href);
    expect(primaryHrefs).toContain('/victoria/find-an-accredited-provider/');
    expect(primaryHrefs).toContain('/victoria/veu-minimum-co-payment/');
    expect(secondaryHrefs).toContain('/victoria/ducted-gas-to-ducted-reverse-cycle/');
    expect(secondaryHrefs).toContain('/victoria/gas-hot-water-to-heat-pump/');
  });

  it('Example 2: 3437 Gisborne (official 2,100) vs 3438 New Gisborne (estimate 2,010) ceiling insulation', () => {
    assertFigureAmount('vic-veu-insulation-regional', 2100);
    assertFigureAmount('vic-veu-insulation-est-metro-cold', 2010);

    const resGisborne = evaluate({
      S1: 'residential',
      R2: '3437',
      R3: 'own-and-live',
      R4: 'house-or-townhouse',
      R5: 'yes',
      R6: ['ceiling-insulation'],
      I1: 'nothing',
      I2: 'no',
    });

    expect(resGisborne.areaCard?.veuArea).toBe('Regional');
    expect(resGisborne.areaCard?.climaticRegion).toBe('Cold');
    expect(resGisborne.lines.map((l) => l.ruleId)).toEqual(['RI-1']);
    expect(resGisborne.lines[0].status).toBe('likely');
    expect(resGisborne.lines[0].figureIds).toEqual(['vic-veu-insulation-regional']);
    expect(resGisborne.lines[0].figures[0].basis).toBe('official');
    expect(resGisborne.lines[0].figures[0].formatted).toBe('up to $2,100');

    const resNewGisborne = evaluate({
      S1: 'residential',
      R2: '3438',
      R3: 'own-and-live',
      R4: 'house-or-townhouse',
      R5: 'yes',
      R6: ['ceiling-insulation'],
      I1: 'nothing',
      I2: 'no',
    });

    expect(resNewGisborne.areaCard?.veuArea).toBe('Metropolitan');
    expect(resNewGisborne.areaCard?.climaticRegion).toBe('Cold');
    expect(resNewGisborne.lines.map((l) => l.ruleId)).toEqual(['RI-1']);
    expect(resNewGisborne.lines[0].status).toBe('likely');
    expect(resNewGisborne.lines[0].figureIds).toEqual(['vic-veu-insulation-est-metro-cold']);
    expect(resNewGisborne.lines[0].figures[0].basis).toBe('estimate');
    expect(resNewGisborne.lines[0].figures[0].formatted).toBe('about $2,010 (our estimate)');
  });

  it('Example 3: 3029 Tarneit, 2025 build (R5 = No), wants RCAC + draughts + appliances -> N-AGE on heating, draughts and appliances still offered', () => {
    assertFigureAmount('vic-veu-sealing-house-5yr', 700);
    assertFigureAmount('vic-veu-appliance-dryer', 70);

    const res = evaluate({
      S1: 'residential',
      R2: '3029',
      R3: 'own-and-live',
      R4: 'house-or-townhouse',
      R5: 'no',
      R6: ['heating-cooling', 'draughts', 'appliances'],
      H1: 'nothing-portable-only',
      H2: 'split-one-room',
      A1: ['heat-pump-clothes-dryer'],
    });

    expect(res.areaCard?.areaLink.href).toBe('/victoria/wyndham/');
    expect(res.firedRuleIds).toContain('G-AGE');

    // Draughts (RD-1) and appliances (RA-1) remain Likely
    const rd1 = res.veuLines.find((l) => l.ruleId === 'RD-1');
    const ra1 = res.veuLines.find((l) => l.ruleId === 'RA-1');
    expect(rd1?.status).toBe('likely');
    expect(ra1?.status).toBe('likely');
    expect(ra1?.figureIds).toEqual(['vic-veu-appliance-dryer']);

    // Heating line is ineligible with N-AGE
    expect(res.ineligibleLines).toHaveLength(1);
    expect(res.ineligibleLines[0].ruleId).toBe('RH-8');
    expect(res.ineligibleLines[0].status).toBe('not-eligible');
    expect(res.ineligibleLines[0].message?.id).toBe('N-AGE');
    expect(res.ineligibleLines[0].figureIds).toEqual([]);
    expect(res.allIneligibleMessage).toBeUndefined();
  });

  it('Example 4: 3515 Marong, Solstice customer (R2a = Yes), 1-year-old home (R5 = No), gas hot water -> SOL-1 banner, SOL-2 instead of N-AGE, no income question', () => {
    assertFigureAmount('vic-solstice-topup', 600);
    assertFigureAmount('vic-solar-homes-hw-rebate', 1000);

    const answers = {
      S1: 'residential' as const,
      R2: '3515',
      R2a: 'yes' as const,
      R3: 'own-and-live' as const,
      R4: 'house-or-townhouse' as const,
      R5: 'no' as const,
      R6: ['hot-water'] as const,
      W1: 'gas-mains' as const,
      W2: 'no' as const,
      W3: 'heat-pump' as const,
      SH3: 'no' as const,
    };

    const visibleIds = getVisibleFields(
      { ...answers, R6: [...answers.R6] },
      ctx.postcodes.rows['3515'],
      ctx.solsticePostcodes,
    ).map((f) => f.id);

    expect(visibleIds).toContain('R2a');
    expect(visibleIds).not.toContain('SH1');
    expect(visibleIds).not.toContain('W4');

    const res = evaluate({ ...answers, R6: [...answers.R6] });

    // SOL-1 banner fires
    expect(res.banners.map((b) => b.ruleId)).toContain('SOL-1');

    // SOL-2 fires instead of N-AGE (G-AGE does not fire)
    expect(res.firedRuleIds).not.toContain('G-AGE');
    expect(res.ineligibleLines).toEqual([]);
    expect(res.lines.some((l) => l.message?.id === 'N-AGE')).toBe(false);

    const sol2 = res.solarHomesLines.find((l) => l.ruleId === 'SOL-2');
    expect(sol2).toBeDefined();
    expect(sol2?.status).toBe('possibly');
    expect(sol2?.figureIds).toEqual(['vic-solstice-topup']);

    const shHw = res.solarHomesLines.find((l) => l.ruleId === 'SH-HW');
    expect(shHw?.status).toBe('likely');

    const primaryHrefs = res.ctas.primary.map((c) => c.href);
    expect(primaryHrefs).toContain('/victoria/solstice-gas-shutdown-towns/');
  });

  it('Example 5: Business, 3064 Craigieburn warehouse, not on register, 20 metal halide car-park lights + 100 kW PV -> BL-2 (3,150), BP-1 (9,100 at $70 VEEC) + STC note', () => {
    assertFigureAmount('vic-veu-biz-lighting-20-carpark', 3150);
    assertFigureAmount('vic-veu-biz-solar-100kw', 9100);
    assertFigureAmount('vic-veu-biz-solar-veec-basis', 70);

    const enabledWithBiz = new Set([
      ...ctx.enabledUrls,
      '/victoria/melbourne-north/',
      '/victoria/business-energy-upgrades/',
      '/victoria/business-led-lighting/',
    ]);

    const res = evaluate(
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
      { enabledUrls: enabledWithBiz },
    );

    expect(res.areaCard?.areaLink.href).toBe('/victoria/melbourne-north/');
    expect(res.lines.map((l) => l.ruleId)).toEqual(['BL-2', 'BP-1']);

    const bl2 = res.lines.find((l) => l.ruleId === 'BL-2')!;
    expect(bl2.status).toBe('likely');
    expect(bl2.figureIds).toEqual(['vic-veu-biz-lighting-20-carpark']);

    const bp1 = res.lines.find((l) => l.ruleId === 'BP-1')!;
    expect(bp1.status).toBe('likely');
    expect(bp1.figureIds).toEqual([
      'vic-veu-biz-solar-100kw',
      'vic-veu-biz-solar-veec-basis',
    ]);
    expect(bp1.notes.some((n) => /STC/i.test(n))).toBe(true);

    expect(res.ctas.primary.map((c) => c.href)).toContain(
      '/victoria/business-energy-upgrades/',
    );
    expect(bl2.links.map((l) => l.href)).toEqual([
      '/victoria/business-energy-upgrades/',
      '/victoria/business-led-lighting/',
    ]);
    expect(bp1.links.map((l) => l.href)).toEqual([
      '/victoria/business-energy-upgrades/',
      '/victoria/business-energy-upgrades/#business-solar-30-200-kw',
    ]);

    // Also verify default live rollout (rows 55 and 65-68 enabled) resolves directly without overrides
    const liveRes = evaluate({
      S1: 'business',
      B2: '3064',
      B3: 'warehouse-factory-industrial',
      B4: 'no',
      B5: 'yes',
      B6: ['lighting', 'solar-panels'],
      BL1: ['outdoor-carpark-sports'],
      BP1: '50-to-100-kw',
      BP1ExactKw: 100,
    });
    expect(liveRes.ctas.primary.map((c) => c.href)).toContain(
      '/victoria/business-energy-upgrades/',
    );
    expect(liveRes.lines.find((l) => l.ruleId === 'BL-2')?.links.map((l) => l.href)).toEqual([
      '/victoria/business-energy-upgrades/',
      '/victoria/business-led-lighting/',
    ]);
  });

  it('Example 6: Business on scheduled premises register, not opted in -> N-SCHED; only FEDERAL battery line offered', () => {
    assertFigureAmount('fed-battery-discount-pct', 30);
    assertFigureAmount('fed-battery-size-kwh', 100, 5);

    const answers = {
      S1: 'business' as const,
      B2: '3064',
      B3: 'warehouse-factory-industrial' as const,
      B4: 'yes-not-opted-in' as const,
      B6: ['lighting', 'battery'] as const,
      BB1: 'yes' as const,
    };

    const visibleB6 = getVisibleFields(
      { ...answers, B6: [...answers.B6] },
      ctx.postcodes.rows['3064'],
    ).find((f) => f.id === 'B6')!;
    const enabledB6OptionIds = (visibleB6.options ?? [])
      .filter((o) => !o.showWhen || o.showWhen({ ...answers, B6: [...answers.B6] }, null))
      .map((o) => o.id);
    expect(enabledB6OptionIds).toEqual(['battery']);

    const res = evaluate({ ...answers, B6: [...answers.B6] });

    expect(res.firedRuleIds).toContain('G-SCHED');
    expect(res.veuLines).toEqual([]);
    expect(res.federalLines.map((l) => l.ruleId)).toEqual(['BB-1']);
    expect(res.federalLines[0].status).toBe('likely');
    expect(res.federalLines[0].programLabel).toBe('FEDERAL');

    expect(res.ineligibleLines).toHaveLength(1);
    expect(res.ineligibleLines[0].ruleId).toBe('G-SCHED');
    expect(res.ineligibleLines[0].message?.id).toBe('N-SCHED');
    expect(res.allIneligibleMessage).toBeUndefined();
  });
});
