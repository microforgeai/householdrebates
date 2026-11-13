import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const pagesDir = path.join(siteRoot, 'src/content/pages');

const leadsEnabled = process.env.PUBLIC_LEADS_ENABLED === 'true';
const legalSlugs = ['privacy', 'terms'];

for (const slug of legalSlugs) {
  const filePath = path.join(pagesDir, `${slug}.mdx`);
  const raw = fs.readFileSync(filePath, 'utf8');
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    throw new Error(`Missing frontmatter in ${slug}.mdx`);
  }
  const fm = YAML.parse(fmMatch[1]);
  if (leadsEnabled && fm.legalReviewed !== true) {
    throw new Error(
      `Refusing build with PUBLIC_LEADS_ENABLED=true: ${slug}.mdx has legalReviewed=${fm.legalReviewed}. A lawyer must review and sign off first.`,
    );
  }
}

console.log(`check-legal: OK (PUBLIC_LEADS_ENABLED=${leadsEnabled}).`);
