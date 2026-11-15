import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

// Homepage hero and tool-first pages use a concise 1-sentence AnswerText lead above the fold (Prompt 42 Parts D & E)
const ONE_SENTENCE_ALLOWED_REL = new Set([
  'index.html',
  'victoria/eligibility-checker/index.html',
  'victoria/postcode/index.html',
  'victoria/gas-vs-heat-pump-running-costs/index.html',
  'victoria/heat-pump-hot-water-size-guide/index.html',
  'victoria/get-off-gas-planner/index.html',
]);

function walkHtml(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      results.push(...walkHtml(full));
    } else if (e.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

const htmlFiles = walkHtml(distDir);
let checkedCount = 0;

for (const file of htmlFiles) {
  const rel = path.relative(distDir, file).replace(/\\/g, '/');
  const html = fs.readFileSync(file, 'utf8');

  // Verify no inline executable <script> tags (only application/ld+json or external src)
  const scriptTags = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  for (const m of scriptTags) {
    const attrs = m[1];
    const body = m[2].trim();
    const isDataJson = /type=["']application\/(ld\+)?json["']/i.test(attrs);
    const hasSrc = /\bsrc=["'][^"']+["']/i.test(attrs);
    if (!isDataJson && (!hasSrc || body.length > 0)) {
      throw new Error(
        `${rel}: Inline executable <script> detected (violates strict CSP script-src 'self'). Attrs: ${attrs}`,
      );
    }
  }

  // Skip noindex utility pages for answer block check
  if (/meta\s+name=["']robots["']\s+content=["']noindex/i.test(html)) {
    continue;
  }

  const answerMatch = html.match(/<section[^>]*data-answer[^>]*>([\s\S]*?)<\/section>/i);
  if (!answerMatch) {
    throw new Error(`${rel}: Indexable page is missing <AnswerBlock> ([data-answer]).`);
  }

  // Extract first paragraph text inside AnswerBlock
  const pMatch = answerMatch[1].match(/<p>([\s\S]*?)<\/p>/i);
  const text = (pMatch ? pMatch[1] : answerMatch[1])
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const words = text.split(/\s+/).filter(Boolean);
  const minSentences = ONE_SENTENCE_ALLOWED_REL.has(rel) ? 1 : 2;

  if (sentences.length < minSentences || sentences.length > 4 || words.length < 12) {
    throw new Error(
      `${rel}: AnswerBlock must have ${minSentences}–4 sentences and >= 12 words (found ${sentences.length} sentences, ${words.length} words): "${text}"`,
    );
  }

  checkedCount++;
}

console.log(`check-answers: OK (${checkedCount} indexable pages verified for AEO AnswerBlock and strict CSP).`);
