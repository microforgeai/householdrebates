import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

test.describe('Victorian Postcode Lookup (/victoria/postcode/) — Prompt 36', () => {
  test('3427 -> Diggers Rest card + corridor/fallback link + ?pc=3427 pre-fills checker R2 at S1', async ({
    page,
  }) => {
    const externalRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (!url.startsWith('http://localhost:') && !url.startsWith('http://127.0.0.1:')) {
        externalRequests.push(url);
      }
    });

    await page.goto('/victoria/postcode/');
    await expect(page.locator('[data-postcode-hydrated="true"]')).toBeVisible();

    const searchInput = page.locator('[data-postcode-search-input]');
    await searchInput.fill('3427');

    const card = page.locator('[data-area-card][data-area-postcode="3427"]');
    await expect(card).toBeVisible();
    await expect(card.locator('[data-area-summary]')).toHaveText(
      'Diggers Rest · Melton (93%) / Hume (7%) · Metropolitan · mains gas · Mild · zone 4',
    );
    await expect(card.locator('[data-area-meta]')).toContainText(
      'From VEU Specifications v25.0 Table A; councils from ABS ASGS Edition 3 allocation files, weighted by 2021 Census dwellings.',
    );

    // Official metro mild insulation figure (up to $1,500)
    const insBox = card.locator('[data-postcode-insulation]');
    await expect(insBox).toHaveAttribute('data-figure', 'vic-veu-insulation-metro');
    await expect(insBox).toHaveAttribute('data-figure-basis', 'official');
    await expect(insBox).toContainText('up to $1,500');

    // Area link: corridor when row 56 enabled, melbourne-west when row 62 enabled, else /victoria/ (never self-link)
    const areaAnchor = card.locator('[data-area-link] a');
    const areaHref = await areaAnchor.getAttribute('href');
    expect(['/victoria/north-west-corridor/', '/victoria/melbourne-west/', '/victoria/']).toContain(
      areaHref,
    );
    expect(areaHref).not.toBe('/victoria/postcode/');

    // Nothing typed stored in web storage or sent externally
    const storageKeys = await page.evaluate(() => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
    }));
    expect(storageKeys.local).toEqual([]);
    expect(storageKeys.session).toEqual([]);
    expect(externalRequests).toEqual([]);

    // Axe accessibility check with result card open
    const axe = await new AxeBuilder({ page }).analyze();
    const seriousOrCritical = axe.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(seriousOrCritical).toEqual([]);

    // Follow "Check your discounts for this postcode" -> /victoria/eligibility-checker/?pc=3427
    const checkerLink = card.locator('[data-postcode-checker-link]');
    await expect(checkerLink).toHaveAttribute('href', '/victoria/eligibility-checker/?pc=3427');
    await checkerLink.click();

    await expect(page).toHaveURL(/\/victoria\/eligibility-checker\/\?pc=3427$/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://householdrebates.com.au/victoria/eligibility-checker/',
    );
    await expect(page.locator('[data-checker-hydrated="true"]')).toBeVisible();
    await expect(page.locator('[data-checker-step="S1"]')).toBeVisible();

    // Advance from S1 -> R2 and verify 3427 is pre-filled
    await page.locator('input[type="radio"][data-option-id="residential"]').check();
    await page.locator('[data-checker-next]').click();
    await expect(page.locator('[data-checker-step="R2"]')).toBeVisible();
    await expect(page.locator('[data-postcode-input]')).toHaveValue('3427');
    await expect(page.locator('[data-area-card][data-area-postcode="3427"]')).toBeVisible();
  });

  test('3438 -> Cold, heat pump zone 5, HPZ-5 note, and "(our estimate)" insulation line', async ({
    page,
  }) => {
    await page.goto('/victoria/postcode/');
    await expect(page.locator('[data-postcode-hydrated="true"]')).toBeVisible();

    await page.locator('[data-postcode-search-input]').fill('3438');

    const card = page.locator('[data-area-card][data-area-postcode="3438"]');
    await expect(card).toBeVisible();
    await expect(card.locator('[data-area-summary]')).toContainText('New Gisborne');
    await expect(card.locator('[data-area-summary]')).toContainText('Metropolitan');
    await expect(card.locator('[data-area-summary]')).toContainText('Cold');
    await expect(card.locator('[data-area-summary]')).toContainText('zone 5');

    const insBox = card.locator('[data-postcode-insulation]');
    await expect(insBox).toHaveAttribute('data-figure', 'vic-veu-insulation-est-metro-cold');
    await expect(insBox).toHaveAttribute('data-figure-basis', 'estimate');
    await expect(insBox).toContainText('about $2,010 (our estimate)');
    await expect(insBox.locator('[data-estimate-disclosure]')).toBeVisible();

    const hpz5Note = card.locator('[data-postcode-note="HPZ-5"]');
    await expect(hpz5Note).toBeVisible();
    await expect(hpz5Note.locator('a')).toHaveAttribute(
      'href',
      '/victoria/heat-pump-hot-water-size-guide/',
    );
  });

  test('3430 -> no reticulated mains gas + GAS-NO note, and 3001 -> indicative PO-box council', async ({
    page,
  }) => {
    await page.goto('/victoria/postcode/');
    await expect(page.locator('[data-postcode-hydrated="true"]')).toBeVisible();

    await page.locator('[data-postcode-search-input]').fill('3430');

    const card = page.locator('[data-area-card][data-area-postcode="3430"]');
    await expect(card).toBeVisible();
    await expect(card).toContainText('No reticulated mains gas');

    const gasNoNote = card.locator('[data-postcode-note="GAS-NO"]');
    await expect(gasNoNote).toBeVisible();
    const gasHref = await gasNoNote.locator('a').getAttribute('href');
    expect(['/victoria/get-off-gas-planner/', '/victoria/lpg-homes/']).toContain(gasHref);

    // 3001 PO-box zero-dwelling postcode shows indicative council note
    await page.locator('[data-postcode-search-input]').fill('3001');
    const poCard = page.locator('[data-area-card][data-area-postcode="3001"]');
    await expect(poCard).toBeVisible();
    await expect(poCard).toContainText('Melbourne (indicative — non-residential postcode)');
  });

  test('"Gisborne" locality typeahead suggests and selects 3437', async ({ page }) => {
    await page.goto('/victoria/postcode/');
    await expect(page.locator('[data-postcode-hydrated="true"]')).toBeVisible();

    const searchInput = page.locator('[data-postcode-search-input]');
    await searchInput.fill('Gisborne');

    const listbox = page.locator('[data-postcode-suggestions]');
    await expect(listbox).toBeVisible();

    const firstSuggestion = listbox.locator('[role="option"]').first();
    await expect(firstSuggestion).toHaveAttribute('data-suggestion-postcode', '3437');
    await expect(firstSuggestion).toContainText('Gisborne');

    await firstSuggestion.click();

    const card = page.locator('[data-area-card][data-area-postcode="3437"]');
    await expect(card).toBeVisible();
    await expect(card.locator('[data-area-summary]')).toContainText('Regional');
    await expect(card.locator('[data-area-summary]')).toContainText('Cold');
    await expect(card.locator('[data-area-summary]')).toContainText('zone 5');
    await expect(card.locator('[data-postcode-insulation]')).toContainText('up to $2,100');
  });

  test('2000 (interstate postcode) renders spec message X1', async ({ page }) => {
    await page.goto('/victoria/postcode/');
    await expect(page.locator('[data-postcode-hydrated="true"]')).toBeVisible();

    await page.locator('[data-postcode-search-input]').fill('2000');

    const err = page.locator('[data-postcode-error][data-message-id="X1"]');
    await expect(err).toBeVisible();
    await expect(err).toContainText(
      "That postcode isn't in the Victorian Energy Upgrades postcode list, so we can't check it. VEU only covers Victoria.",
    );
    await expect(page.locator('[data-area-card]')).toHaveCount(0);
  });

  test('works without JavaScript via statewide counts and <details> postcode lists', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    await page.goto('/victoria/postcode/');

    await expect(page.locator('h1')).toContainText(
      'Is My Victorian Postcode Metro or Regional for VEU, and Does It Have Mains Gas?',
    );

    const countsSection = page.locator('[data-postcode-statewide-counts]');
    await expect(countsSection).toContainText('719');
    await expect(countsSection).toContainText('281');
    await expect(countsSection).toContainText('438');
    await expect(countsSection).toContainText('406');
    await expect(countsSection).toContainText('313');
    await expect(countsSection).toContainText('404');
    await expect(countsSection).toContainText('268');
    await expect(countsSection).toContainText('47');
    await expect(countsSection).toContainText('608');
    await expect(countsSection).toContainText('111');
    await expect(countsSection).toContainText('25');

    const groups = page.locator('[data-postcode-group]');
    await expect(groups).toHaveCount(5);

    const metroMild = page.locator('[data-postcode-group="metropolitan-mild"]');
    await metroMild.locator('summary').click();
    await expect(metroMild.locator('.postcode-group-details__list')).toContainText('3427');
    await expect(metroMild.locator('a')).toHaveCount(0);

    const metroCold = page.locator('[data-postcode-group="metropolitan-cold"]');
    await metroCold.locator('summary').click();
    await expect(metroCold.locator('.postcode-group-details__list')).toContainText('3438');

    const regionalCold = page.locator('[data-postcode-group="regional-cold"]');
    await regionalCold.locator('summary').click();
    await expect(regionalCold.locator('.postcode-group-details__list')).toContainText('3437');

    await context.close();
  });
});
