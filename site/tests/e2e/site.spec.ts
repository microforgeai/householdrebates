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

  test('renders captioned MoneyPair on heat-pump-rebate (gas first, stacked at 320px) and DOM order on co-payment hero', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/victoria/heat-pump-rebate/');

    const pairBlocks = page.locator('[data-answer] [data-money-pair] [data-money-block]');
    await expect(pairBlocks).toHaveCount(2);
    await expect(pairBlocks.nth(0)).toHaveAttribute('data-figure', 'vic-veu-hw-gas-to-heatpump');
    await expect(pairBlocks.nth(0).locator('[data-money-label]')).toHaveText('Mains gas → heat pump');
    await expect(pairBlocks.nth(0).locator('[data-money-kind]')).toHaveText(
      'Indicative discount (the provider confirms)',
    );
    await expect(pairBlocks.nth(1)).toHaveAttribute('data-figure', 'vic-veu-hw-electric-to-heatpump');
    await expect(pairBlocks.nth(1).locator('[data-money-label]')).toHaveText(
      'Electric storage → heat pump',
    );

    const desktopBox0 = await pairBlocks.nth(0).boundingBox();
    const desktopBox1 = await pairBlocks.nth(1).boundingBox();
    expect(desktopBox0).not.toBeNull();
    expect(desktopBox1).not.toBeNull();
    expect(Math.abs(desktopBox0!.y - desktopBox1!.y)).toBeLessThan(4);

    // At 320px, pair stacks vertically without horizontal overflow
    await page.setViewportSize({ width: 320, height: 568 });
    const mobileBox0 = await pairBlocks.nth(0).boundingBox();
    const mobileBox1 = await pairBlocks.nth(1).boundingBox();
    expect(mobileBox0).not.toBeNull();
    expect(mobileBox1).not.toBeNull();
    expect(mobileBox1!.y).toBeGreaterThanOrEqual(mobileBox0!.y + mobileBox0!.height - 1);
    const overflow320 = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow320).toBe(false);

    // Screen-reader / DOM child order on co-payment hero: label -> kind tag -> amount -> checked-on line
    await page.goto('/victoria/veu-minimum-co-payment/');
    const copayHero = page.locator('[data-answer] [data-money-block]');
    await expect(copayHero).toHaveCount(1);
    await expect(copayHero).toHaveAttribute('data-kind', 'payment');
    const childClasses = await copayHero.evaluate((el) =>
      Array.from(el.children).map((c) => c.className),
    );
    expect(childClasses).toEqual([
      'money-block__label',
      'money-block__kind',
      'money-block__amount',
      'money-block__meta',
    ]);
    await expect(copayHero.locator('[data-money-kind]')).toHaveText('Minimum you pay');

    // Upgrade-time page has no money hero
    await page.goto('/victoria/how-long-does-an-upgrade-take/');
    await expect(page.locator('[data-money-block]')).toHaveCount(0);
    await expect(page.locator('[data-body]')).toContainText(
      'Plumbing work value that needs a compliance certificate',
    );
  });
});
