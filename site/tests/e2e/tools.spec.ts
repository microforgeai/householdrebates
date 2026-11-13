import { test, expect } from '@playwright/test';

test.describe('Wave 2b tools — keyboard, JS-off fallback, and zero network requests', () => {
  test('RunningCostsPicker switches scenarios via keyboard and makes zero network calls', async ({
    page,
  }) => {
    await page.goto('/victoria/gas-vs-heat-pump-running-costs/');

    const requestsAfterLoad: string[] = [];
    page.on('request', (req) => requestsAfterLoad.push(req.url()));

    const firstRadio = page.locator('[data-picker-radio][value="hot-water"]');
    await firstRadio.focus();
    await page.keyboard.press('ArrowDown'); // room-heating
    await page.keyboard.press('ArrowDown'); // ducted-heating

    await expect(page.locator('[data-scenario-panel="ducted-heating"]')).toBeVisible();
    await expect(page.locator('[data-scenario-panel="hot-water"]')).toBeHidden();
    expect(requestsAfterLoad).toEqual([]);
  });

  test('HwSizeGuide filters bedroom rows and looks up postcode zone via keyboard with zero network calls', async ({
    page,
  }) => {
    await page.goto('/victoria/heat-pump-hot-water-size-guide/');

    const requestsAfterLoad: string[] = [];
    page.on('request', (req) => requestsAfterLoad.push(req.url()));

    await page.locator('#hw-bedrooms').focus();
    await page.selectOption('#hw-bedrooms', '3');

    await expect(page.locator('[data-hw-row="3"]')).toBeVisible();
    await expect(page.locator('[data-hw-row="1–2"]')).toBeHidden();

    await page.locator('#hw-postcode').focus();
    await page.keyboard.type('3350');
    await page.keyboard.press('Enter');

    const zoneOut = page.locator('[data-hw-zone-output]');
    await expect(zoneOut).toBeVisible();
    await expect(zoneOut).toContainText(
      'In the VEU postcode table, 3350 is in heat pump climatic zone 5.',
    );
    expect(requestsAfterLoad).toEqual([]);
  });

  test('GasExitPlanner toggles appliances via keyboard and makes zero network calls', async ({
    page,
  }) => {
    await page.goto('/victoria/get-off-gas-planner/');

    const requestsAfterLoad: string[] = [];
    page.on('request', (req) => requestsAfterLoad.push(req.url()));

    const roomCb = page.locator('[data-planner-checkbox][value="room"]');
    await roomCb.focus();
    await page.keyboard.press('Space'); // uncheck room heater

    await expect(page.locator('[data-planner-step="room"]')).toBeHidden();
    await expect(page.locator('[data-planner-step="hotwater"]')).toBeVisible();
    await expect(page.locator('[data-planner-abolishment]')).toBeVisible();
    expect(requestsAfterLoad).toEqual([]);
  });

  test('all three tools render full server-side data when JavaScript is disabled', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    await page.goto('/victoria/gas-vs-heat-pump-running-costs/');
    await expect(page.locator('[data-scenario-panel]')).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      await expect(page.locator('[data-scenario-panel]').nth(i)).toBeVisible();
    }

    await page.goto('/victoria/heat-pump-hot-water-size-guide/');
    await expect(page.locator('[data-hw-row]')).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      await expect(page.locator('[data-hw-row]').nth(i)).toBeVisible();
    }

    await page.goto('/victoria/get-off-gas-planner/');
    await expect(page.locator('[data-planner-step]')).toHaveCount(4);
    await expect(page.locator('[data-planner-abolishment]')).toBeVisible();

    await context.close();
  });
});
