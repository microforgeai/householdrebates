import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';
import {
  evaluate,
  type CheckerAnswers,
  type CheckerResult,
} from '../../src/lib/checker';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = path.resolve(__dirname, '../../test-results/checker-35b');

const EXAMPLE_1_ANSWERS: CheckerAnswers = {
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
};

const EXAMPLE_5_ANSWERS: CheckerAnswers = {
  S1: 'business',
  B2: '3064',
  B3: 'warehouse-factory-industrial',
  B4: 'no',
  B5: 'yes',
  B6: ['lighting', 'solar-panels'],
  BL1: ['outdoor-carpark-sports'],
  BP1: '50-to-100-kw',
  BP1ExactKw: 100,
};

async function driveCheckerFlow(page: Page, answers: CheckerAnswers): Promise<void> {
  await page.goto('/victoria/eligibility-checker/');
  await expect(page.locator('[data-checker-hydrated="true"]')).toBeVisible();

  const resetBtn = page.locator('[data-checker-reset]');
  if (await resetBtn.isVisible()) {
    await resetBtn.click();
  }
  await expect(page.locator('[data-checker-step="S1"]')).toBeVisible();

  for (let guard = 0; guard < 30; guard++) {
    if (await page.locator('[data-checker-result]').isVisible()) {
      return;
    }

    const stepShell = page.locator('[data-checker-step]');
    await expect(stepShell).toBeVisible();
    const fieldId = (await stepShell.getAttribute('data-checker-step')) as keyof CheckerAnswers;
    expect(fieldId).toBeTruthy();

    if (fieldId === 'R2' || fieldId === 'B2') {
      const pc = String(answers[fieldId] ?? '');
      await page.locator('[data-postcode-input]').fill(pc);
      await page.locator('[data-checker-next]').click();
      continue;
    }

    const rawVal = answers[fieldId];
    if (Array.isArray(rawVal)) {
      for (const optId of rawVal) {
        const checkbox = page.locator(`input[type="checkbox"][data-option-id="${optId}"]`);
        if ((await checkbox.count()) > 0) {
          await checkbox.check();
        }
      }
      await page.locator('[data-checker-next]').click();
      continue;
    }

    expect(
      rawVal,
      `Missing test answer for visible step "${String(fieldId)}"`,
    ).toBeDefined();
    await page.locator(`input[type="radio"][data-option-id="${String(rawVal)}"]`).check();

    if (fieldId === 'BW1' && answers.BW1 === 'household-size' && answers.BW1Count !== undefined) {
      await page.locator('#checker-bw1-count').fill(String(answers.BW1Count));
    }
    if (fieldId === 'BP1' && answers.BP1ExactKw !== undefined) {
      await page.locator('#checker-bp1-exact').selectOption(String(answers.BP1ExactKw));
    }

    await page.locator('[data-checker-next]').click();
  }

  throw new Error('Checker flow did not reach [data-checker-result] within 30 steps.');
}

async function assertRenderedMatchesEvaluation(
  page: Page,
  expected: CheckerResult,
): Promise<void> {
  const resultRoot = page.locator('[data-checker-result]');
  await expect(resultRoot).toBeVisible();

  // Election notice at the top of result while rule-status.json is pending
  await expect(resultRoot.locator('[data-checker-election-notice]')).toBeVisible();

  // Area card summary & link match 35a fixture
  expect(expected.areaCard).not.toBeNull();
  const areaCard = resultRoot.locator('[data-area-card]');
  await expect(areaCard).toBeVisible();
  await expect(areaCard.locator('[data-area-summary]')).toHaveText(expected.areaCard!.summaryText);
  await expect(areaCard.locator('[data-area-link] a')).toHaveAttribute(
    'href',
    expected.areaCard!.areaLink.href,
  );

  // Program section ordering: VEU -> Solar Homes -> FEDERAL -> Not eligible
  if (expected.federalLines.length > 0) {
    await expect(
      resultRoot.locator('[data-program-group="federal"] .checker-program-section__heading'),
    ).toHaveText('FEDERAL');
  }

  const lineCards = resultRoot.locator('[data-program-group] [data-checker-line]');
  await expect(lineCards).toHaveCount(expected.lines.length);

  for (let i = 0; i < expected.lines.length; i++) {
    const expLine = expected.lines[i];
    const card = lineCards.nth(i);
    await expect(card).toHaveAttribute('data-rule-id', expLine.ruleId);
    await expect(card).toHaveAttribute('data-status', expLine.status);
    await expect(card.locator('.checker-line__title')).toHaveText(expLine.title);

    for (const fig of [...expLine.figures, ...expLine.coPayFigures]) {
      const figEl = card.locator(`[data-figure="${fig.id}"]`);
      await expect(figEl).toBeVisible();
      await expect(figEl.locator('[data-money-label]')).toHaveText(fig.scenario);
      await expect(figEl.locator('.money-block__amount')).toHaveText(fig.formatted);

      if (fig.basis === 'estimate') {
        await expect(figEl.locator('.money-block__amount')).toContainText('(our estimate)');
        const disclosure = figEl.locator('details[data-estimate-disclosure]');
        await expect(disclosure).toBeVisible();
        await disclosure.locator('summary').click();
        await expect(disclosure.locator('p')).toBeVisible();
        if (fig.method) {
          await expect(disclosure.locator('p')).toContainText(fig.method);
        }
      }
    }

    for (const lnk of expLine.links) {
      await expect(card.locator(`.checker-line__links a[href="${lnk.href}"]`)).toBeVisible();
    }

    if (expLine.sources.length > 0) {
      await expect(card.locator('.checker-line__sources')).toContainText('Checked');
    }
  }

  // Banners
  const bannerCards = resultRoot.locator('[data-checker-banners] [data-checker-line]');
  await expect(bannerCards).toHaveCount(expected.banners.length);
  for (let i = 0; i < expected.banners.length; i++) {
    await expect(bannerCards.nth(i)).toHaveAttribute('data-rule-id', expected.banners[i].ruleId);
  }

  // Top & footer modifiers
  const expectedTopMods = expected.modifiers.filter((m) => m.placement === 'top');
  const expectedFooterMods = expected.modifiers.filter((m) => m.placement === 'footer');
  await expect(resultRoot.locator('[data-checker-modifiers-top] [data-modifier-id]')).toHaveCount(
    expectedTopMods.length,
  );
  await expect(
    resultRoot.locator('[data-checker-modifiers-footer] [data-modifier-id]'),
  ).toHaveCount(expectedFooterMods.length);

  // CTAs match 35a ctas & zero /get-quotes/ links anywhere on page
  const primaryCtas = resultRoot.locator('[data-cta-tier="primary"] a');
  await expect(primaryCtas).toHaveCount(expected.ctas.primary.length);
  for (let i = 0; i < expected.ctas.primary.length; i++) {
    await expect(primaryCtas.nth(i)).toHaveAttribute('href', expected.ctas.primary[i].href);
  }

  const secondaryCtas = resultRoot.locator('[data-cta-tier="secondary"] a');
  await expect(secondaryCtas).toHaveCount(expected.ctas.secondary.length);
  for (let i = 0; i < expected.ctas.secondary.length; i++) {
    await expect(secondaryCtas.nth(i)).toHaveAttribute('href', expected.ctas.secondary[i].href);
  }

  await expect(page.locator('a[href*="get-quotes"]')).toHaveCount(0);
}

test.describe('Prompt 35b: Victoria Eligibility Checker v2 cascade & result screen', () => {
  test('Example 1 (3427 Diggers Rest residential) matches 35a fixture, fetches compact postcodes after Step 1, and renders cleanly at desktop + 375px with screenshots', async ({
    page,
  }) => {
    const postcodeRequestsBeforeStep1: string[] = [];
    const postcodeRequestsAfterStep1: string[] = [];
    let step1Submitted = false;

    page.on('request', (req) => {
      if (req.url().includes('/data/postcodes.v')) {
        if (step1Submitted) {
          postcodeRequestsAfterStep1.push(req.url());
        } else {
          postcodeRequestsBeforeStep1.push(req.url());
        }
      }
    });

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/victoria/eligibility-checker/');
    await expect(page.locator('[data-checker-hydrated="true"]')).toBeVisible();
    await expect(page.locator('[data-checker-step="S1"]')).toBeVisible();
    expect(postcodeRequestsBeforeStep1).toHaveLength(0);

    step1Submitted = true;
    await page.locator('input[data-option-id="residential"]').check();
    await page.locator('[data-checker-next]').click();

    await expect(page.locator('[data-checker-step="R2"]')).toBeVisible();
    await page.locator('[data-postcode-input]').fill('3427');
    await page.locator('[data-checker-next]').click();

    expect(postcodeRequestsAfterStep1.length).toBeGreaterThanOrEqual(1);
    await expect(page.locator('[data-area-card]')).toBeVisible();

    // Complete remaining steps via driveCheckerFlow-equivalent loop
    const remaining: Record<string, string | string[]> = {
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
    };

    while (!(await page.locator('[data-checker-result]').isVisible())) {
      const fieldId = (await page
        .locator('[data-checker-step]')
        .getAttribute('data-checker-step'))!;
      const ans = remaining[fieldId];
      if (Array.isArray(ans)) {
        for (const id of ans) {
          await page.locator(`input[type="checkbox"][data-option-id="${id}"]`).check();
        }
      } else {
        await page.locator(`input[type="radio"][data-option-id="${ans}"]`).check();
      }
      await page.locator('[data-checker-next]').click();
    }

    const expected = evaluate(EXAMPLE_1_ANSWERS);
    await assertRenderedMatchesEvaluation(page, expected);

    await page.locator('[data-checker-result]').screenshot({
      path: path.join(SCREENSHOT_DIR, 'example-1-result-desktop.png'),
    });

    await page.setViewportSize({ width: 375, height: 812 });
    const overflow375 = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow375).toBe(false);
    await page.locator('[data-checker-result]').screenshot({
      path: path.join(SCREENSHOT_DIR, 'example-1-result-375px.png'),
    });
  });

  test('Example 2 (3437 Gisborne official vs 3438 New Gisborne estimate) renders official figure and estimate disclosure matching 35a fixtures', async ({
    page,
  }) => {
    const gisborneAnswers: CheckerAnswers = {
      S1: 'residential',
      R2: '3437',
      R3: 'own-and-live',
      R4: 'house-or-townhouse',
      R5: 'yes',
      R6: ['ceiling-insulation'],
      I1: 'nothing',
      I2: 'no',
    };
    await driveCheckerFlow(page, gisborneAnswers);
    await assertRenderedMatchesEvaluation(page, evaluate(gisborneAnswers));
    await expect(page.locator('details[data-estimate-disclosure]')).toHaveCount(0);

    const newGisborneAnswers: CheckerAnswers = {
      ...gisborneAnswers,
      R2: '3438',
    };
    await driveCheckerFlow(page, newGisborneAnswers);
    await assertRenderedMatchesEvaluation(page, evaluate(newGisborneAnswers));
  });

  test('Example 3 (3029 Tarneit 2025 build) renders N-AGE on heating while keeping draughts and appliances Likely', async ({
    page,
  }) => {
    const ex3Answers: CheckerAnswers = {
      S1: 'residential',
      R2: '3029',
      R3: 'own-and-live',
      R4: 'house-or-townhouse',
      R5: 'no',
      R6: ['heating-cooling', 'draughts', 'appliances'],
      H1: 'nothing-portable-only',
      H2: 'split-one-room',
      A1: ['heat-pump-clothes-dryer'],
    };
    await driveCheckerFlow(page, ex3Answers);
    await assertRenderedMatchesEvaluation(page, evaluate(ex3Answers));
  });

  test('Example 4 (3515 Marong Solstice customer, 1-yr home) asks R2a, skips W4 and SH1, and renders SOL-1 + SOL-2 + SH-HW without N-AGE', async ({
    page,
  }) => {
    const ex4Answers: CheckerAnswers = {
      S1: 'residential',
      R2: '3515',
      R2a: 'yes',
      R3: 'own-and-live',
      R4: 'house-or-townhouse',
      R5: 'no',
      R6: ['hot-water'],
      W1: 'gas-mains',
      W2: 'no',
      W3: 'heat-pump',
      SH3: 'no',
    };
    await driveCheckerFlow(page, ex4Answers);
    await assertRenderedMatchesEvaluation(page, evaluate(ex4Answers));
  });

  test('Example 5 (3064 Craigieburn Business warehouse: 20 car-park lights + 100 kW PV) matches 35a fixture and captures screenshot', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await driveCheckerFlow(page, EXAMPLE_5_ANSWERS);
    await assertRenderedMatchesEvaluation(page, evaluate(EXAMPLE_5_ANSWERS));

    await page.locator('[data-checker-result]').screenshot({
      path: path.join(SCREENSHOT_DIR, 'example-5-business-result.png'),
    });

    // Verify topic link and hub section anchor link land on live built pages/sections (Prompt 28)
    const ledLink = page.locator('[data-rule-id="BL-2"] a[href="/victoria/business-led-lighting/"]');
    await expect(ledLink).toBeVisible();
    const solarAnchorLink = page.locator(
      '[data-rule-id="BP-1"] a[href="/victoria/business-energy-upgrades/#business-solar-30-200-kw"]',
    );
    await expect(solarAnchorLink).toBeVisible();
    await solarAnchorLink.click();
    await expect(page).toHaveURL(/\/victoria\/business-energy-upgrades\/#business-solar-30-200-kw$/);
    await expect(page.locator('#business-solar-30-200-kw')).toBeVisible();
  });

  test('Example 6 (3064 Business on ESC Scheduled Activity Premises register, not opted in) restricts B6 to battery and renders FEDERAL BB-1 + N-SCHED', async ({
    page,
  }) => {
    const ex6Answers: CheckerAnswers = {
      S1: 'business',
      B2: '3064',
      B3: 'warehouse-factory-industrial',
      B4: 'yes-not-opted-in',
      B6: ['lighting', 'battery'],
      BB1: 'yes',
    };

    await page.goto('/victoria/eligibility-checker/');
    await expect(page.locator('[data-checker-hydrated="true"]')).toBeVisible();
    await page.locator('input[data-option-id="business"]').check();
    await page.locator('[data-checker-next]').click();

    await page.locator('[data-postcode-input]').fill('3064');
    await page.locator('[data-checker-next]').click();

    await page.locator('input[data-option-id="warehouse-factory-industrial"]').check();
    await page.locator('[data-checker-next]').click();

    await page.locator('input[data-option-id="yes-not-opted-in"]').check();
    await page.locator('[data-checker-next]').click();

    // B5 is skipped; B6 shows only federal battery option
    await expect(page.locator('[data-checker-step="B6"]')).toBeVisible();
    await expect(page.locator('input[type="checkbox"][data-option-id="lighting"]')).toHaveCount(0);
    await expect(page.locator('input[type="checkbox"][data-option-id="battery"]')).toHaveCount(1);
    await page.locator('input[type="checkbox"][data-option-id="battery"]').check();
    await page.locator('[data-checker-next]').click();

    await page.locator('input[data-option-id="yes"]').check();
    await page.locator('[data-checker-next]').click();

    await assertRenderedMatchesEvaluation(page, evaluate(ex6Answers));

    // Verify N-SCHED link lands on #scheduled-premises on the business hub (Prompt 28)
    const schedLink = page.locator(
      '[data-rule-id="G-SCHED"] a[href="/victoria/business-energy-upgrades/#scheduled-premises"]',
    );
    await expect(schedLink).toBeVisible();
    await schedLink.click();
    await expect(page).toHaveURL(/\/victoria\/business-energy-upgrades\/#scheduled-premises$/);
    await expect(page.locator('#scheduled-premises')).toBeVisible();
  });

  test('shows X1 error on postcode 2000, preserves answers across Back navigation, and clears everything on Start again', async ({
    page,
  }) => {
    await page.goto('/victoria/eligibility-checker/');
    await expect(page.locator('[data-checker-hydrated="true"]')).toBeVisible();
    await page.locator('input[data-option-id="residential"]').check();
    await page.locator('[data-checker-next]').click();

    // X1 on non-Victorian postcode 2000
    await expect(page.locator('[data-checker-step="R2"]')).toBeVisible();
    await page.locator('[data-postcode-input]').fill('2000');
    await page.locator('[data-checker-next]').click();

    const pcError = page.locator('[data-postcode-error]');
    await expect(pcError).toBeVisible();
    await expect(pcError).toHaveAttribute('data-message-id', 'X1');
    await expect(pcError).toContainText("That postcode isn't in the Victorian Energy Upgrades postcode list");
    await expect(pcError).toContainText('VEU only covers Victoria.');
    await expect(pcError.locator('a')).toBeVisible();
    await expect(page.locator('[data-postcode-input]')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('[data-checker-step="R2"]')).toBeVisible();

    // Enter valid postcode 3000 and advance through R3 and R4
    await page.locator('[data-postcode-input]').fill('3000');
    await page.locator('[data-checker-next]').click();

    await expect(page.locator('[data-checker-step="R3"]')).toBeVisible();
    await page.locator('input[data-option-id="tenant"]').check();
    await page.locator('[data-checker-next]').click();

    await expect(page.locator('[data-checker-step="R4"]')).toBeVisible();
    await page.locator('input[data-option-id="apartment"]').check();

    // Back keeps answers in both directions (sessionStorage)
    await page.locator('[data-checker-back]').click();
    await expect(page.locator('[data-checker-step="R3"]')).toBeVisible();
    await expect(page.locator('input[data-option-id="tenant"]')).toBeChecked();

    await page.locator('[data-checker-back]').click();
    await expect(page.locator('[data-checker-step="R2"]')).toBeVisible();
    await expect(page.locator('[data-postcode-input]')).toHaveValue('3000');

    await page.locator('[data-checker-next]').click();
    await expect(page.locator('input[data-option-id="tenant"]')).toBeChecked();
    await page.locator('[data-checker-next]').click();
    await expect(page.locator('input[data-option-id="apartment"]')).toBeChecked();

    // Start again clears answers and sessionStorage
    await page.locator('[data-checker-reset]').click();
    await expect(page.locator('[data-checker-step="S1"]')).toBeVisible();
    await expect(page.locator('[data-checker-progress]')).toContainText('Step 1 of 6');
    await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
    const savedSession = await page.evaluate(() =>
      window.sessionStorage.getItem('hr_checker_v2_answers'),
    );
    expect(savedSession).toBeNull();
  });

  test('completes Example 1 end-to-end using keyboard only', async ({ page }) => {
    await page.goto('/victoria/eligibility-checker/');
    await expect(page.locator('[data-checker-hydrated="true"]')).toBeVisible();
    await expect(page.locator('[data-checker-step="S1"]')).toBeVisible();

    // Focus first radio in S1 ('residential', index 0) -> Space selects -> Enter submits
    await page.locator('input[data-option-id="residential"]').focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('Enter');

    // Step R2: Tab to postcode input -> type 3427 -> Enter submits
    await expect(page.locator('[data-checker-step="R2"]')).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.type('3427');
    await page.keyboard.press('Enter');

    // Step R3: 'own-and-live' is option index 0 -> Tab focuses radio group -> Space -> Enter
    await expect(page.locator('[data-checker-step="R3"]')).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await page.keyboard.press('Enter');

    // Step R4: 'house-or-townhouse' is option index 0 -> Tab -> Space -> Enter
    await expect(page.locator('[data-checker-step="R4"]')).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await page.keyboard.press('Enter');

    // Step R5: 'yes' is option index 0 -> Tab -> Space -> Enter
    await expect(page.locator('[data-checker-step="R5"]')).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await page.keyboard.press('Enter');

    // Step R6 (checkboxes): Tab to 'heating-cooling' -> Space; Tab to 'hot-water' -> Space; Tab across remaining 7 checkboxes to Next button -> Enter
    await expect(page.locator('[data-checker-step="R6"]')).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
    }
    await page.keyboard.press('Enter');

    // Step H1: 'ducted-gas-heater' is index 0 -> Tab -> Space -> Enter
    await expect(page.locator('[data-checker-step="H1"]')).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await page.keyboard.press('Enter');

    // Step H2: 'ducted-reverse-cycle' is index 2 -> Tab -> Space -> ArrowDown x2 -> Enter
    await expect(page.locator('[data-checker-step="H2"]')).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // Step W1: 'gas-mains' is index 0 -> Tab -> Space -> Enter
    await expect(page.locator('[data-checker-step="W1"]')).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await page.keyboard.press('Enter');

    // Step W2: 'no' is index 1 -> Tab -> Space -> ArrowDown -> Enter
    await expect(page.locator('[data-checker-step="W2"]')).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // Step W3: 'heat-pump' is index 0 -> Tab -> Space -> Enter
    await expect(page.locator('[data-checker-step="W3"]')).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await page.keyboard.press('Enter');

    // Step W4: 'yes' is index 0 -> Tab -> Space -> Enter
    await expect(page.locator('[data-checker-step="W4"]')).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await page.keyboard.press('Enter');

    // Step SH1: 'yes' is index 0 -> Tab -> Space -> Enter
    await expect(page.locator('[data-checker-step="SH1"]')).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await page.keyboard.press('Enter');

    // Step SH2: 'yes' is index 0 -> Tab -> Space -> Enter
    await expect(page.locator('[data-checker-step="SH2"]')).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await page.keyboard.press('Enter');

    // Step SH3: 'no' is index 1 -> Tab -> Space -> ArrowDown -> Enter ("See results")
    await expect(page.locator('[data-checker-step="SH3"]')).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect(page.locator('[data-checker-result]')).toBeVisible();
    const activeClass = await page.evaluate(() => document.activeElement?.className ?? '');
    expect(activeClass).toContain('checker-result__heading');
    await assertRenderedMatchesEvaluation(page, evaluate(EXAMPLE_1_ANSWERS));
  });

  test('passes axe accessibility audit with 0 serious or critical issues across question states and result screen', async ({
    page,
  }) => {
    const assertZeroSeriousAxe = async (label: string) => {
      const scan = await new AxeBuilder({ page }).analyze();
      const seriousOrCritical = scan.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );
      expect(
        seriousOrCritical,
        `axe serious/critical violations on ${label}: ${JSON.stringify(seriousOrCritical, null, 2)}`,
      ).toEqual([]);
    };

    await page.goto('/victoria/eligibility-checker/');
    await expect(page.locator('[data-checker-hydrated="true"]')).toBeVisible();
    await expect(page.locator('[data-checker-step="S1"]')).toBeVisible();
    await assertZeroSeriousAxe('Step S1');

    await page.locator('input[data-option-id="residential"]').check();
    await page.locator('[data-checker-next]').click();
    await page.locator('[data-postcode-input]').fill('2000');
    await page.locator('[data-checker-next]').click();
    await expect(page.locator('[data-postcode-error]')).toBeVisible();
    await assertZeroSeriousAxe('Step R2 with X1 postcode error');

    await driveCheckerFlow(page, EXAMPLE_1_ANSWERS);
    await assertZeroSeriousAxe('Example 1 Result screen');
  });

  test('tenant share link (#a=) encodes answers in URL hash without server requests and restores identical result in a fresh context', async ({
    page,
    browser,
  }) => {
    const tenantAnswers: CheckerAnswers = {
      S1: 'residential',
      R2: '3000',
      R3: 'tenant',
      R4: 'apartment',
      R5: 'yes',
      R6: ['heating-cooling', 'draughts'],
      H1: 'gas-room-heater',
      H2: 'split-one-room',
    };

    const postRequests: string[] = [];
    page.on('request', (req) => {
      if (req.method() !== 'GET' && req.method() !== 'HEAD') {
        postRequests.push(`${req.method()} ${req.url()}`);
      }
    });

    await driveCheckerFlow(page, tenantAnswers);
    const expected = evaluate(tenantAnswers);
    await assertRenderedMatchesEvaluation(page, expected);

    const shareBtn = page.locator('[data-checker-share]');
    await expect(shareBtn).toBeVisible();
    await expect(shareBtn).toHaveText('Share this result with your landlord');
    await shareBtn.click();

    await expect(page.locator('[data-share-box]')).toBeVisible();
    const shareUrl = await page.locator('[data-share-url-input]').inputValue();
    expect(shareUrl).toContain('/victoria/eligibility-checker/#a=');
    expect(postRequests).toEqual([]);

    // Open in a completely isolated browser context (equivalent to landlord opening link in private window)
    const freshContext = await browser.newContext();
    const freshPage = await freshContext.newPage();
    await freshPage.goto(shareUrl);
    await assertRenderedMatchesEvaluation(freshPage, expected);
    await freshContext.close();
  });
});
