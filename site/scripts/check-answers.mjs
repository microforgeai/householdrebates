import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

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
  const rel = path.relative(distDir, file);
  const html = fs.readFileSync(file, 'utf8');

  // Verify no inline executable <script> tags (only application/ld+json or external src)
  const scriptTags = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  for (const m of scriptTags) {
    const attrs = m[1];
    const body = m[2].trim();
    const isJsonLd = /type=["']application\/ld\+json["']/i.test(attrs);
    const hasSrc = /\bsrc=["'][^"']+["']/i.test(attrs);
    if (!isJsonLd && (!hasSrc || body.length > 0)) {
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

  if (sentences.length < 2 || sentences.length > 4) {
    throw new Error(
      `${rel}: AnswerBlock must have 2–4 sentences (found ${sentences.length}): "${text}"`,
    );
  }

  checkedCount++;
}

console.log(`check-answers: OK (${checkedCount} indexable pages verified for 2–4 sentence AnswerBlock and strict CSP).`);
