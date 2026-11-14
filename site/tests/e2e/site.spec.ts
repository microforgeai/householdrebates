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
});
