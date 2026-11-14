import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { describe, expect, it } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '../../src');
const faqsDir = path.join(srcDir, 'content/faqs');
const areasDir = path.join(srcDir, 'content/areas/vic');

describe('FAQ canonical assignment and area localFacts invariants (Prompt 27)', () => {
  it('assigns every FAQ YAML to a single canonicalPage with no legacy pages[] or $ amounts', () => {
    const files = fs
      .readdirSync(faqsDir)
      .filter((f) => f.endsWith('.yaml'))
      .sort();
    expect(files.length).toBeGreaterThanOrEqual(150);

    const urlRe = /^\/(?:[a-z0-9-]+\/)*$/;
    const questions = new Map<string, string>();

    for (const file of files) {
      const data = YAML.parse(fs.readFileSync(path.join(faqsDir, file), 'utf8'));
      expect('pages' in data, `${file} must not use legacy pages[]`).toBe(false);
      expect(data.canonicalPage, `${file} canonicalPage`).toMatch(urlRe);
      expect(data.question.includes('$'), `${file} question must not contain $`).toBe(false);
      expect(data.answer.includes('$'), `${file} answer must not contain $`).toBe(false);

      const also: string[] = data.alsoLinkFrom ?? [];
      for (const fromUrl of also) {
        expect(fromUrl, `${file} alsoLinkFrom entry`).toMatch(urlRe);
        expect(fromUrl, `${file} alsoLinkFrom must not include canonicalPage`).not.toBe(
          data.canonicalPage,
        );
      }

      const normQ = String(data.question).trim().toLowerCase();
      expect(questions.has(normQ), `duplicate FAQ question in ${file}`).toBe(false);
      questions.set(normQ, file);
    }
  });

  it('requires at least 5 sourced localFacts on every area page', () => {
    const files = fs
      .readdirSync(areasDir)
      .filter((f) => f.endsWith('.mdx'))
      .sort();

    for (const file of files) {
      const raw = fs.readFileSync(path.join(areasDir, file), 'utf8');
      const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
      expect(fmMatch, `${file} frontmatter`).not.toBeNull();
      const fm = YAML.parse(fmMatch![1]);
      const facts: unknown[] = fm.localFacts ?? [];
      expect(facts.length, `${file} localFacts must have >= 5 entries`).toBeGreaterThanOrEqual(5);
      for (const fact of facts) {
        expect(String(fact).includes('$'), `${file} localFacts must not contain $`).toBe(false);
      }
    }
  });
});
