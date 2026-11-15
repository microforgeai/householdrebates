import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

test.describe('Prompt 43 post-launch UI polish', () => {
  test('homepage uses a single VeuFlowDiagram DOM node: in hero right column at >=1024px and in How it works on phones', async ({
    page,
  }) => {
    // 1. Desktop 1280x800 & 1024x800: right column of hero
    for (const width of [1024, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');

      await expect(page.locator('[data-veu-flow-diagram]')).toHaveCount(1);
      await expect(page.locator('[data-veu-flow-diagram]')).toBeVisible();

      const boxes = await page.evaluate(() => {
        const hero = document.querySelector('.home-hero')!.getBoundingClientRect();
        const diag = document.querySelector('[data-veu-flow-diagram]')!.getBoundingClientRect();
        return {
          hero: { left: hero.left, right: hero.right, top: hero.top, bottom: hero.bottom },
          diag: { left: diag.left, right: diag.right, top: diag.top, bottom: diag.bottom },
        };
      });

      expect(boxes.diag.left).toBeGreaterThanOrEqual(boxes.hero.right);
      expect(boxes.diag.top).toBeLessThan(boxes.hero.bottom);
      expect(boxes.diag.bottom).toBeGreaterThan(boxes.hero.top);
    }

    // 2. Phone 375x812: stays in "How it works" and scrollHeight <= 6500
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.locator('[data-veu-flow-diagram]')).toHaveCount(1);

    const mobileBoxes = await page.evaluate(() => {
      const howHeading = document.querySelector('#how-it-works')!.getBoundingClientRect();
      const diag = document.querySelector('[data-veu-flow-diagram]')!.getBoundingClientRect();
      return {
        scrollHeight: document.documentElement.scrollHeight,
        howBottom: howHeading.bottom,
        diagTop: diag.top,
      };
    });

    expect(mobileBoxes.diagTop).toBeGreaterThan(mobileBoxes.howBottom);
    expect(mobileBoxes.scrollHeight).toBeLessThanOrEqual(6500);
  });

  test('desktop nav renders AC Rebate and Heat Pump Rebate without wrapping at 1024px and 1280px, and passes axe', async ({
    browser,
  }) => {
    for (const colorScheme of ['light', 'dark'] as const) {
      const context = await browser.newContext({
        viewport: { width: 1024, height: 800 },
        colorScheme,
      });
      const page = await context.newPage();

      for (const width of [1024, 1280]) {
        await page.setViewportSize({ width, height: 800 });
        await page.goto('/');

        const nav = page.locator('.site-nav--desktop');
        await expect(nav.locator('a[href="/victoria/air-conditioner-rebate/"]')).toHaveText(
          'AC Rebate',
        );
        await expect(nav.locator('a[href="/victoria/heat-pump-rebate/"]')).toHaveText(
          'Heat Pump Rebate',
        );

        const navFit = await page.evaluate(() => {
          const headerInner = document.querySelector('.site-header__inner')!;
          const brand = document.querySelector('.site-brand')!.getBoundingClientRect();
          const cta = document.querySelector('.nav-cta')!.getBoundingClientRect();
          const visibleLinks = Array.from(
            document.querySelectorAll<HTMLAnchorElement>('.site-nav--desktop a'),
          ).filter((a) => getComputedStyle(a).display !== 'none');

          const linkRects = visibleLinks.map((a) => a.getBoundingClientRect());
          const linkCenters = linkRects.map((r) => Math.round((r.top + r.bottom) / 2));
          const maxCenterDiff =
            Math.max(...linkCenters) - Math.min(...linkCenters);

          return {
            headerHeight: headerInner.getBoundingClientRect().height,
            maxCenterDiff,
            brandRight: brand.right,
            firstLinkLeft: linkRects[0]?.left ?? 0,
            lastLinkRight: linkRects[linkRects.length - 1]?.right ?? 0,
            ctaLeft: cta.left,
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
          };
        });

        expect(navFit.headerHeight).toBeLessThanOrEqual(68);
        expect(navFit.maxCenterDiff).toBeLessThanOrEqual(2);
        expect(navFit.firstLinkLeft).toBeGreaterThanOrEqual(navFit.brandRight);
        expect(navFit.ctaLeft).toBeGreaterThanOrEqual(navFit.lastLinkRight);
        expect(navFit.scrollWidth).toBeLessThanOrEqual(navFit.clientWidth);

        const axe = await new AxeBuilder({ page }).analyze();
        expect(axe.violations).toEqual([]);
      }

      await context.close();
    }
  });
});
