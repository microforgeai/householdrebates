import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

const EXPECTED_NOTICE_TEXT =
  "Not a government website. Independent guide run by Agenor Services Pty Ltd (ABN 29 644 447 263).Installers pay us for enquiries, and we only show installers who pay us, not every installer in your area. How we're paid.";

const KEY_PAGES = [
  '/',
  '/victoria/eligibility-checker/',
  '/victoria/air-conditioner-rebate/',
  '/victoria/melbourne/',
  '/about/',
];

test.describe('Prompt 42 UI refresh & quick SEO fixes', () => {
  test('homepage at 375x812 meets scrollHeight <= 6500, word count <= 900, upgrade cards, election banner, and OG image', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const metrics = await page.evaluate(() => {
      const main = document.querySelector('main');
      const words = (main?.innerText ?? '').trim().split(/\s+/).filter(Boolean).length;
      return {
        scrollHeight: document.documentElement.scrollHeight,
        words,
      };
    });

    expect(metrics.scrollHeight).toBeLessThanOrEqual(6500);
    expect(metrics.words).toBeLessThanOrEqual(900);

    // 8 single-link upgrade cards + election-watch RuleStatusNotice
    await expect(page.locator('[data-upgrade-grid] .upgrade-card')).toHaveCount(8);
    await expect(page.locator('[data-rule-status-notice]').first()).toBeVisible();
    await expect(page.locator('[data-veu-flow-diagram]')).toBeVisible();

    // OG image exists and returns 200 PNG
    const ogImg = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImg).toBe('https://householdrebates.com.au/og/default.png');
    const res = await page.request.get('/og/default.png');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('image/png');
  });

  test('H1 top is <= 300px and IndependenceNotice is visible, <= 4 lines, >= 13px, non-sticky, and exact wording at 375x812', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    for (const url of KEY_PAGES) {
      await page.goto(url);

      const layout = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        const notice = document.querySelector('.independence-notice');
        const inner = document.querySelector('.independence-notice__inner') ?? notice;
        const style = notice ? getComputedStyle(notice) : null;

        let lines = 0;
        if (inner) {
          const range = document.createRange();
          range.selectNodeContents(inner);
          const tops = new Set<number>();
          for (const r of Array.from(range.getClientRects())) {
            if (r.width > 1 && r.height > 1) {
              tops.add(Math.round(r.top / 4) * 4);
            }
          }
          lines = tops.size;
        }

        const nRect = notice?.getBoundingClientRect();
        return {
          h1Top: h1 ? Math.round(h1.getBoundingClientRect().top) : 9999,
          noticeVisible: Boolean(nRect && nRect.height > 0 && nRect.top >= 0 && nRect.bottom <= 812),
          noticePosition: style?.position ?? '',
          noticeFontSize: style ? parseFloat(style.fontSize) : 0,
          noticeLines: lines,
          noticeText: (notice?.textContent ?? '').replace(/\s+/g, ' ').trim(),
        };
      });

      expect(layout.h1Top, `H1 top on ${url}`).toBeLessThanOrEqual(300);
      expect(layout.noticeVisible, `Notice visible on ${url}`).toBe(true);
      expect(layout.noticePosition, `Notice non-sticky on ${url}`).not.toBe('sticky');
      expect(layout.noticePosition, `Notice non-fixed on ${url}`).not.toBe('fixed');
      expect(layout.noticeFontSize, `Notice font >= 13px on ${url}`).toBeGreaterThanOrEqual(13);
      expect(layout.noticeLines, `Notice <= 4 lines on ${url}`).toBeLessThanOrEqual(4);
      expect(layout.noticeText, `Exact notice wording on ${url}`).toBe(EXPECTED_NOTICE_TEXT);
    }
  });

  test('checker first question is fully visible inside the first 375x812 viewport', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/victoria/eligibility-checker/');
    await expect(page.locator('[data-checker-hydrated="true"]')).toBeVisible();

    const stepBox = await page.locator('[data-checker-step="S1"]').boundingBox();
    expect(stepBox).not.toBeNull();
    expect(stepBox!.y).toBeGreaterThanOrEqual(0);
    expect(stepBox!.y + stepBox!.height).toBeLessThanOrEqual(812);
  });

  test('submitting postcode 3000 from homepage lands on checker with postcode 3000 pre-filled', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    await page.locator('#home-postcode-input').fill('3000');
    await page.locator('[data-home-postcode-form] button[type="submit"]').click();

    await expect(page).toHaveURL(/\/victoria\/eligibility-checker\/\?pc=3000$/);
    await expect(page.locator('[data-prefilled-postcode="3000"]')).toBeVisible();

    await page.locator('input[data-option-id="residential"]').check();
    await page.locator('[data-checker-next]').click();

    await expect(page.locator('[data-postcode-input]')).toHaveValue('3000');
  });

  test('mobile menu opens and closes with keyboard alone (including Escape focus return)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const menu = page.locator('[data-mobile-menu]');
    const summary = page.locator('[data-mobile-menu-summary]');

    await expect(menu).not.toHaveAttribute('open', '');
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(menu).toHaveAttribute('open', '');
    await expect(menu.locator('.mobile-menu__panel a').first()).toBeVisible();

    // Press Escape -> closes and returns focus to summary
    await page.keyboard.press('Escape');
    await expect(menu).not.toHaveAttribute('open', '');
    await expect(summary).toBeFocused();

    // Open and close via Space/Enter toggle alone as well
    await page.keyboard.press('Space');
    await expect(menu).toHaveAttribute('open', '');
    await page.keyboard.press('Enter');
    await expect(menu).not.toHaveAttribute('open', '');
  });

  test('mobile menu and homepage postcode form work with JavaScript disabled', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      javaScriptEnabled: false,
    });
    const page = await context.newPage();

    await page.goto('/');
    const menu = page.locator('[data-mobile-menu]');
    const summary = page.locator('[data-mobile-menu-summary]');

    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(menu).toHaveAttribute('open', '');
    await expect(menu.locator('a[href="/victoria/heat-pump-rebate/"]')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(menu).not.toHaveAttribute('open', '');

    // Submit postcode form without JS
    await page.locator('#home-postcode-input').fill('3000');
    await page.locator('[data-home-postcode-form] button[type="submit"]').click();
    await expect(page).toHaveURL(/\/victoria\/eligibility-checker\/\?pc=3000$/);

    await context.close();
  });

  test('zero horizontal scroll at 320px across key templates and tables', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 812 });
    const urls = [
      ...KEY_PAGES,
      '/victoria/gas-to-electric-hot-water-2027/',
      '/victoria/what-is-a-veec/',
      '/victoria/help-in-your-language/',
    ];

    for (const url of urls) {
      await page.goto(url);
      const dims = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(dims.scrollWidth, `No 320px overflow on ${url}`).toBeLessThanOrEqual(dims.clientWidth);
    }
  });

  test('dark-mode emulation passes axe (including color-contrast) across key templates and SVG diagrams', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      colorScheme: 'dark',
    });
    const page = await context.newPage();

    const darkUrls = [
      ...KEY_PAGES,
      '/victoria/gas-to-electric-hot-water-2027/',
      '/victoria/what-is-a-veec/',
    ];

    for (const url of darkUrls) {
      await page.goto(url);
      if (url === '/victoria/eligibility-checker/') {
        await expect(page.locator('[data-checker-hydrated="true"]')).toBeVisible();
      }
      const axe = await new AxeBuilder({ page }).analyze();
      expect(
        axe.violations,
        `Dark-mode axe violations on ${url}: ${JSON.stringify(axe.violations, null, 2)}`,
      ).toEqual([]);
    }

    await context.close();
  });
});
