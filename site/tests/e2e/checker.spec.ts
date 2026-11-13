import { test, expect } from '@playwright/test';

test.describe('Victoria Eligibility Checker — Prompt 16 paths', () => {
  test('keyboard-only run of ceiling insulation path with postcode 3350 highlights regional row and makes zero network calls', async ({
    page,
  }) => {
    await page.goto('/victoria/eligibility-checker/');

    const requestsAfterLoad: string[] = [];
    page.on('request', (req) => {
      requestsAfterLoad.push(req.url());
    });

    // Keyboard-only interaction on Q2 checkboxes and Q9a postcode
    await page.locator('#chk-q2-rcac').focus();
    await page.keyboard.press('Space'); // uncheck rcac
    await expect(page.locator('#chk-q2-rcac')).not.toBeChecked();

    await page.locator('#chk-q2-insulation').focus();
    await page.keyboard.press('Space'); // check insulation
    await expect(page.locator('#chk-q2-insulation')).toBeChecked();

    await page.locator('#chk-q9a').focus();
    await page.keyboard.type('3350');

    await page.locator('button[type="submit"]').focus();
    await page.keyboard.press('Enter');

    const output = page.locator('[data-checker-output]');
    await expect(output).toBeVisible();
    await expect(output).toContainText('3350 is listed as Regional, climatic region Cold');
    await expect(
      output.locator('tr[data-figure="vic-veu-insulation-regional"][data-highlighted="true"]'),
    ).toBeVisible();
    await expect(output.locator('tr[data-figure="vic-veu-insulation-metro"]')).toBeVisible();
    expect(requestsAfterLoad).toEqual([]);
  });

  test('runs the induction cooktop path and shows the buy-first process and $140 figure', async ({
    page,
  }) => {
    await page.goto('/victoria/eligibility-checker/');

    const requestsAfterLoad: string[] = [];
    page.on('request', (req) => requestsAfterLoad.push(req.url()));

    await page.uncheck('#chk-q2-rcac');
    await page.check('#chk-q2-induction');
    await page.selectOption('#chk-q3', 'bought_not_installed');
    await page.click('button[type="submit"]');

    const output = page.locator('[data-checker-output]');
    await expect(output).toBeVisible();
    await expect(output.locator('tr[data-figure="vic-veu-induction"]')).toContainText('$140');
    await expect(output).toContainText('send the invoice to an accredited provider');
    // Induction bought_not_installed does not show retrospective caution banner
    await expect(output.locator('.callout--caution')).toHaveCount(0);
    expect(requestsAfterLoad).toEqual([]);
  });

  test('announces inline postcode error via aria-describedby when invalid postcode is entered', async ({
    page,
  }) => {
    await page.goto('/victoria/eligibility-checker/');
    await page.uncheck('#chk-q2-rcac');
    await page.check('#chk-q2-insulation');
    await page.fill('#chk-q9a', '2000');
    await page.click('button[type="submit"]');

    const err = page.locator('#chk-q9a-error');
    await expect(err).toBeVisible();
    await expect(err).toHaveText('Enter a 4-digit Victorian postcode');
    await expect(page.locator('#chk-q9a')).toHaveAttribute('aria-describedby', 'chk-q9a-error');
    await expect(page.locator('#chk-q9a')).toHaveAttribute('aria-invalid', 'true');
  });

  test('shows fallback note when JavaScript is disabled', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/victoria/eligibility-checker/');
    const noscriptNote = page.locator('[data-checker-noscript]');
    await expect(noscriptNote).toBeVisible();
    await expect(noscriptNote).toContainText('needs JavaScript turned on');
    await context.close();
  });
});
