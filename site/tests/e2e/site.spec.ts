import AxeBuilder from '@axe-core/playwright';
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
    await page.locator('input[data-option-id="residential"]').check();
    await page.locator('[data-checker-next]').click();

    await page.locator('[data-postcode-input]').fill('3000');
    await page.locator('[data-checker-next]').click();

    await page.locator('input[data-option-id="own-and-live"]').check();
    await page.locator('[data-checker-next]').click();

    await page.locator('input[data-option-id="house-or-townhouse"]').check();
    await page.locator('[data-checker-next]').click();

    await page.locator('input[data-option-id="yes"]').check();
    await page.locator('[data-checker-next]').click();

    await page.locator('input[data-option-id="hot-water"]').check();
    await page.locator('[data-checker-next]').click();

    await page.locator('input[data-option-id="gas-mains"]').check();
    await page.locator('[data-checker-next]').click();

    await page.locator('input[data-option-id="no"]').check();
    await page.locator('[data-checker-next]').click();

    await page.locator('input[data-option-id="heat-pump"]').check();
    await page.locator('[data-checker-next]').click();

    await page.locator('input[data-option-id="yes"]').check();
    await page.locator('[data-checker-next]').click();

    await page.locator('input[data-option-id="yes"]').check();
    await page.locator('[data-checker-next]').click();

    await page.locator('input[data-option-id="yes"]').check();
    await page.locator('[data-checker-next]').click();

    await page.locator('input[data-option-id="no"]').check();
    await page.locator('[data-checker-next]').click();

    const output = page.locator('[data-checker-result]');
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
    await expect(notice).toContainText('The Victorian election on 28 November 2026 may change these rules.');
    await expect(notice).toContainText('Figures are as checked on');
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

    // Every page showing VEU / Solar Homes figures also renders the election banner while pending (#11)
    await page.goto('/victoria/heat-pump-rebate/');
    await expect(page.locator('[data-rule-status-notice]')).toContainText(
      'The Victorian election on 28 November 2026 may change these rules.',
    );
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

  test('renders unique canonical FAQs across home, /faq/, and original area pages, navigates 5 "→" links to visible answers, and emits valid FAQPage JSON-LD', async ({
    page,
  }) => {
    const checkPages = [
      '/',
      '/faq/',
      '/victoria/frankston/',
      '/victoria/geelong/',
      '/victoria/mornington-peninsula/',
    ];
    const seenQuestions = new Set<string>();

    for (const url of checkPages) {
      await page.goto(url);
      const canonicalItems = page.locator('[data-faq-canonical]');
      const count = await canonicalItems.count();
      expect(count, `${url} should have 3–5 canonical FAQs`).toBeGreaterThanOrEqual(3);
      expect(count, `${url} should have 3–5 canonical FAQs`).toBeLessThanOrEqual(5);

      for (let i = 0; i < count; i++) {
        const q = (await canonicalItems.nth(i).locator('h3').innerText()).trim();
        expect(seenQuestions.has(q), `Question "${q}" repeated on ${url}`).toBe(false);
        seenQuestions.add(q);
      }
    }

    // Home links to /faq/ for general VEU questions
    await page.goto('/');
    await expect(page.locator('.faq-more a[href="/faq/"]')).toBeVisible();

    // Follow 5 "→" alsoLinkFrom links and verify each lands on #faq-<id> with visible answer
    const linkChecks = [
      {
        from: '/faq/',
        targetHref: '/victoria/already-installed-retrospective-discount/#faq-retrospective-discounts',
        targetId: 'faq-retrospective-discounts',
      },
      {
        from: '/how-quotes-work/',
        targetHref: '/victoria/veu-scams-cold-calls/#faq-cold-call-and-doorknocking-ban',
        targetId: 'faq-cold-call-and-doorknocking-ban',
      },
      {
        from: '/victoria/air-conditioner-rebate/',
        targetHref: '/victoria/what-is-a-veec/#faq-why-rcac-discounts-vary',
        targetId: 'faq-why-rcac-discounts-vary',
      },
      {
        from: '/victoria/heat-pump-rebate/',
        targetHref: '/victoria/gas-to-electric-hot-water-2027/#faq-march-2027-gas-hot-water-rule',
        targetId: 'faq-march-2027-gas-hot-water-rule',
      },
      {
        from: '/victoria/eligibility-checker/',
        targetHref: '/victoria/renters/#faq-renters-and-landlords',
        targetId: 'faq-renters-and-landlords',
      },
    ];

    for (const c of linkChecks) {
      await page.goto(c.from);
      const link = page.locator(`[data-faq-links] a[href="${c.targetHref}"]`);
      await expect(link).toBeVisible();
      await expect(link).toContainText('→');
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${c.targetHref.replace('#', '\\#')}$`));
      const targetFaq = page.locator(`#${c.targetId}`);
      await expect(targetFaq).toBeVisible();
      await expect(targetFaq.locator('p')).toBeVisible();
    }

    // Validate 3 pages' FAQPage JSON-LD structure against schema.org rules and visible canonical FAQs
    for (const schemaUrl of ['/', '/faq/', '/victoria/geelong/']) {
      await page.goto(schemaUrl);
      const scripts = await page
        .locator('script[type="application/ld+json"]')
        .allTextContents();
      const graphs = scripts.map((s) => JSON.parse(s));
      const faqNodes = graphs.flatMap((g) =>
        (g['@graph'] ?? []).filter((n: Record<string, unknown>) => n['@type'] === 'FAQPage'),
      );
      expect(faqNodes).toHaveLength(1);
      const faqNode = faqNodes[0];
      expect(Array.isArray(faqNode.mainEntity)).toBe(true);

      const visibleCount = await page.locator('[data-faq-canonical]').count();
      expect(faqNode.mainEntity).toHaveLength(visibleCount);

      for (let i = 0; i < visibleCount; i++) {
        const entity = faqNode.mainEntity[i];
        expect(entity['@type']).toBe('Question');
        expect(typeof entity.name).toBe('string');
        expect(entity.acceptedAnswer?.['@type']).toBe('Answer');
        expect(typeof entity.acceptedAnswer?.text).toBe('string');
        expect(entity.acceptedAnswer.text.includes('$')).toBe(false);

        const visQ = (await page.locator('[data-faq-canonical]').nth(i).locator('h3').innerText()).trim();
        const visA = (await page.locator('[data-faq-canonical]').nth(i).locator('p').innerText()).trim();
        expect(entity.name).toBe(visQ);
        expect(entity.acceptedAnswer.text).toBe(visA);
      }
    }
  });

  test('renders Help in Your Language (11 Energy Vic + 14 Solar Vic rows, lang tags, 0 axe violations) plus footer, inbound links, and seniors boxes', async ({
    page,
  }) => {
    await page.goto('/victoria/help-in-your-language/');

    const tables = page.locator('[data-body] table');
    await expect(tables).toHaveCount(2);

    const energyVicRows = tables.nth(0).locator('tbody tr');
    await expect(energyVicRows).toHaveCount(11);
    const energyVicText = await tables.nth(0).innerText();
    expect(energyVicText).not.toContain('Punjabi');
    expect(energyVicText).not.toContain('Sinhalese');

    const solarVicRows = tables.nth(1).locator('tbody tr');
    await expect(solarVicRows).toHaveCount(14);
    await expect(tables.nth(1).locator('[lang]')).toHaveCount(14);
    await expect(tables.nth(1).locator('[lang="ar"][dir="rtl"]')).toHaveCount(1);
    await expect(tables.nth(1).locator('[lang="pa"]')).toHaveCount(1);
    await expect(tables.nth(1).locator('[lang="hi"]')).toHaveCount(1);

    await expect(page.locator('footer a[href="/victoria/help-in-your-language/"]')).toBeVisible();

    const axe = await new AxeBuilder({ page }).analyze();
    expect(
      axe.violations,
      `axe violations on /victoria/help-in-your-language/: ${JSON.stringify(axe.violations, null, 2)}`,
    ).toEqual([]);

    for (const seniorsPage of ['/victoria/veu-scams-cold-calls/', '/victoria/concession-card-holders/']) {
      await page.goto(seniorsPage);
      await expect(page.locator('main')).toContainText('Seniors: avoid pressure sales');
      await expect(
        page.locator('main a[href="/victoria/help-in-your-language/"]').first(),
      ).toBeVisible();
    }

    await page.goto('/victoria/wyndham/');
    await expect(
      page.locator('main a[href="/victoria/help-in-your-language/"]').first(),
    ).toBeVisible();
  });

  test('excludes /about/gurinder-singh/, Person schema, byline name, and author links from public output while bio is unfilled, while emitting Article + WebApplication JSON-LD', async ({
    page,
  }) => {
    const authorRes = await page.goto('/about/gurinder-singh/');
    expect(authorRes?.status()).toBe(404);

    await page.goto('/about/');
    const aboutHtml = await page.content();
    expect(aboutHtml).not.toContain('Gurinder');
    expect(aboutHtml).not.toContain('/about/gurinder-singh/');
    expect(aboutHtml).not.toContain('"@type":"Person"');

    await page.goto('/victoria/air-conditioner-rebate/');
    await expect(page.locator('a[href="/about/gurinder-singh/"]')).toHaveCount(0);
    await expect(page.locator('[data-reviewed-by]')).toHaveCount(0);
    await expect(page.locator('.byline')).not.toContainText('Gurinder');
    await expect(page.locator('.byline')).toContainText('Published by Agenor Services Pty Ltd');
    const guideScripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const guideTypes = guideScripts.flatMap((s) =>
      (JSON.parse(s)['@graph'] ?? []).map((n: Record<string, unknown>) => n['@type']),
    );
    expect(guideTypes).toContain('Article');
    expect(guideTypes).not.toContain('Person');
    expect(guideTypes).toContain('WebPage');

    for (const toolUrl of ['/victoria/eligibility-checker/', '/victoria/postcode/']) {
      await page.goto(toolUrl);
      const toolScripts = await page.locator('script[type="application/ld+json"]').allTextContents();
      const webApps = toolScripts.flatMap((s) =>
        (JSON.parse(s)['@graph'] ?? []).filter(
          (n: Record<string, unknown>) => n['@type'] === 'WebApplication',
        ),
      );
      expect(webApps).toHaveLength(1);
      expect(webApps[0].applicationCategory).toBe('UtilitiesApplication');
      expect(webApps[0].isAccessibleForFree).toBe(true);
      expect('offers' in webApps[0]).toBe(false);
    }
  });

  test('renders Melbourne North (66 rows) and rescoped Inner Melbourne (52 rows) usable and sortable at 375px with 0 axe violations', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto('/victoria/melbourne-north/');
    const northRows = page.locator('[data-postcode-table] tbody tr[data-postcode]');
    await expect(northRows).toHaveCount(66);
    await expect(northRows.first()).toHaveAttribute('data-postcode', '3043');

    const overflowNorth = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflowNorth).toBe(false);

    // Sort by Postcode descending -> 3764 (Kilmore) moves to top
    const postcodeSortBtn = page.locator('[data-postcode-table] button[data-sort-col="0"]');
    await postcodeSortBtn.click();
    await expect(
      page.locator('[data-postcode-table] thead th').first(),
    ).toHaveAttribute('aria-sort', 'descending');
    await expect(northRows.first()).toHaveAttribute('data-postcode', '3764');

    // Sort by Climatic region ascending -> Cold rows appear first
    await page.locator('[data-postcode-table] button[data-sort-col="5"]').click();
    await expect(
      page.locator('[data-postcode-table] thead th').nth(5),
    ).toHaveAttribute('aria-sort', 'ascending');
    await expect(northRows.first().locator('td').nth(5)).toHaveText('Cold');

    const northAxe = await new AxeBuilder({ page }).analyze();
    expect(northAxe.violations).toEqual([]);

    await page.goto('/victoria/melbourne/');
    const melbRows = page.locator('[data-postcode-table] tbody tr[data-postcode]');
    await expect(melbRows).toHaveCount(52);
    await expect(melbRows.first()).toHaveAttribute('data-postcode', '3000');

    const overflowMelb = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflowMelb).toBe(false);

    const melbAxe = await new AxeBuilder({ page }).analyze();
    expect(melbAxe.violations).toEqual([]);
  });

  test('renders /victoria/lpg-homes/ (election-watch, piped-LPG note, dynamic 313/719 counts) and dynamic 20-area footer with 0 axe violations', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/victoria/lpg-homes/');

    await expect(page.locator('main[data-rule-status="election-watch"]')).toBeVisible();
    await expect(page.locator('[data-rule-status-notice]')).toBeVisible();
    await expect(page.locator('main')).toContainText(
      'If your estate has piped LPG, your plumber confirms whether the rule applies to your water heater.',
    );
    await expect(page.locator('[data-figure-id="vic-veu-table-a-no-gas-postcodes"]')).toContainText('313');
    await expect(page.locator('[data-figure-id="vic-veu-table-a-total-postcodes"]')).toContainText('719');

    const footerAreas = page.locator('[data-footer-areas]');
    await expect(footerAreas).toBeVisible();
    await expect(footerAreas.locator('h2')).toHaveText('Areas covered');
    await expect(footerAreas.locator('[data-footer-area-group="melbourne-hubs"] li')).toHaveCount(5);
    await expect(footerAreas.locator('[data-footer-area-group="regional"] li')).toHaveCount(6);
    await expect(footerAreas.locator('[data-footer-area-group="corridors-councils"] li')).toHaveCount(9);
    await expect(footerAreas.locator('a')).toHaveCount(20);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);

    const lpgAxe = await new AxeBuilder({ page }).analyze();
    expect(lpgAxe.violations).toEqual([]);
  });
});
