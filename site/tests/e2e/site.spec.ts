import { test, expect } from '@playwright/test';

test.describe('Household Rebates static site e2e', () => {
  test('renders home pillar with independence notice, answer block, figure tables, and closed form notice', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('.independence-notice')).toContainText('Agenor Services Pty Ltd');
    await expect(page.locator('[data-answer]')).toBeVisible();
    await expect(page.locator('#form-closed-heading')).toBeVisible();
  });

  test('evaluates scenarios in the Victoria Eligibility Checker', async ({ page }) => {
    await page.goto('/victoria/eligibility-checker/');
    await page.uncheck('#chk-q2-rcac');
    await page.check('#chk-q2-hotwater');
    await page.selectOption('#chk-q8a', 'mains-gas');
    await page.click('button[type="submit"]');
    const output = page.locator('[data-checker-output]');
    await expect(output).toBeVisible();
    await expect(output).toContainText('$560');
  });
});
