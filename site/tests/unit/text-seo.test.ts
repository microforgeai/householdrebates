import { describe, expect, it } from 'vitest';
import {
  parseFaqAnswerMarkdown,
  renderFaqAnswerHtml,
  renderFaqAnswerPlainText,
  validateFaqAnswerMarkdown,
} from '../../src/lib/faq-markdown';
import { formatRenderedTitle } from '../../src/lib/seo';

describe('FAQ restricted Markdown parser and renderer', () => {
  it('renders internal Markdown links as HTML anchors and plain text in JSON-LD', () => {
    const md =
      'See [Can Renters Get VEU Discounts in Victoria?](/victoria/renters/) before agreeing to work.';
    expect(validateFaqAnswerMarkdown(md)).toBe(true);
    expect(renderFaqAnswerHtml(md, '/victoria/air-conditioner-rebate/')).toBe(
      'See <a href="/victoria/renters/">Can Renters Get VEU Discounts in Victoria?</a> before agreeing to work.',
    );
    expect(renderFaqAnswerPlainText(md)).toBe(
      'See Can Renters Get VEU Discounts in Victoria? before agreeing to work.',
    );
  });

  it('unwraps self-links without fragments to plain escaped text while keeping fragment links', () => {
    const selfMd =
      'Read [How VEU Discounts Vary](/victoria/reverse-cycle-vs-gas-heater/) for details.';
    expect(renderFaqAnswerHtml(selfMd, '/victoria/reverse-cycle-vs-gas-heater/')).toBe(
      'Read How VEU Discounts Vary for details.',
    );

    const fragMd =
      'Check [Minimum Co-Payments](/victoria/air-conditioner-rebate/#minimum-co-payment) above.';
    expect(renderFaqAnswerHtml(fragMd, '/victoria/air-conditioner-rebate/')).toBe(
      'Check <a href="/victoria/air-conditioner-rebate/#minimum-co-payment">Minimum Co-Payments</a> above.',
    );
  });

  it('rejects HTML, images, external URLs, non-trailing-slash paths, and dollar amounts in anchors', () => {
    expect(() => parseFaqAnswerMarkdown('Use <a href="/faq/">HTML</a> here.')).toThrow(
      /must not contain HTML tags/,
    );
    expect(() => parseFaqAnswerMarkdown('![diagram](/favicon.svg) text')).toThrow(
      /must not contain Markdown images/,
    );
    expect(() =>
      parseFaqAnswerMarkdown('See [Energy Victoria](https://www.energy.vic.gov.au/) for rules.'),
    ).toThrow(/internal path with trailing slash/);
    expect(() => parseFaqAnswerMarkdown('See [FAQ](/faq) for rules.')).toThrow(
      /internal path with trailing slash/,
    );
    expect(() => parseFaqAnswerMarkdown('Save [$500 discount](/faq/) today.')).toThrow(
      /dollar amounts/,
    );
  });
});

describe('formatRenderedTitle', () => {
  it('appends " | Household Rebates" when the combined title is 60 characters or fewer', () => {
    expect(formatRenderedTitle('Website Terms of Use')).toBe(
      'Website Terms of Use | Household Rebates',
    );
    const fortyChars = 'A'.repeat(40);
    const withBrand = formatRenderedTitle(fortyChars);
    expect(withBrand).toBe(`${fortyChars} | Household Rebates`);
    expect(withBrand.length).toBe(60);
  });

  it('omits " | Household Rebates" when appending it would exceed 60 characters', () => {
    const fiftyEightChars = 'V'.repeat(58);
    const rendered = formatRenderedTitle(fiftyEightChars);
    expect(rendered).toBe(fiftyEightChars);
    expect(rendered.length).toBe(58);
  });
});
