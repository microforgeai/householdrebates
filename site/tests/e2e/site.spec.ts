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

  test('renders election-watch RuleStatusNotice cleanly at 320px below AnswerBlock as a single role="note"', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/victoria/gas-to-electric-hot-water-2027/');

    const answer = page.locator('[data-answer]');
    const notice = page.locator('[data-rule-status-notice]');
    const byline = page.locator('.byline');

    await expect(notice).toHaveCount(1);
    await expect(notice).toHaveAttribute('role', 'note');
    await expect(notice).toContainText('Victorian election 28 Nov 2026.');
    await expect(notice).toContainText('currently legislated');
    await expect(notice.locator('a')).toContainText('Energy Victoria');

    const answerBox = await answer.boundingBox();
    const noticeBox = await notice.boundingBox();
    const bylineBox = await byline.boundingBox();
    expect(answerBox).not.toBeNull();
    expect(noticeBox).not.toBeNull();
    expect(bylineBox).not.toBeNull();

    // Notice sits directly under AnswerBlock (never above it, so it never pushes AnswerBlock down) and above byline
    expect(answerBox!.y).toBeLessThan(noticeBox!.y);
    expect(noticeBox!.y).toBeGreaterThanOrEqual(answerBox!.y + answerBox!.height - 1);
    expect(bylineBox!.y).toBeGreaterThanOrEqual(noticeBox!.y + noticeBox!.height - 1);

    // No horizontal overflow at 320px
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
});
