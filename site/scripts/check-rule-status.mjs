import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.resolve(__dirname, '..');
const distDir = path.resolve(siteDir, 'dist');
const ruleStatusPath = path.resolve(siteDir, 'src/data/rule-status.json');
const sourcesDir = path.resolve(siteDir, 'src/content/sources');

const MAX_AGE_DAYS = Number(process.env.MAX_FIGURE_AGE_DAYS || 45);
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function parseIsoDateUtc(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '').trim());
  if (!m) {
    throw new Error(`Invalid YYYY-MM-DD date in rule-status check: "${iso}"`);
  }
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function todayMelbourneUtc() {
  const iso = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Melbourne',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return parseIsoDateUtc(iso);
}

function assertFresh(label, checkedOn) {
  const checkedUtc = parseIsoDateUtc(checkedOn);
  const refUtc = todayMelbourneUtc();
  const ageDays = Math.floor((refUtc - checkedUtc) / MS_PER_DAY);
  if (ageDays > MAX_AGE_DAYS) {
    throw new Error(
      `${label} is stale: checkedOn=${checkedOn} is ${ageDays} days old (max allowed ${MAX_AGE_DAYS}).`,
    );
  }
}

function walkFiles(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      results.push(...walkFiles(full, ext));
    } else if (e.name.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

function decodeEntities(str) {
  return str
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function stripTags(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

// 1. Validate rule-status.json and its referenced source freshness
if (!fs.existsSync(ruleStatusPath)) {
  throw new Error(`Missing ${ruleStatusPath}`);
}
const rawStatus = JSON.parse(fs.readFileSync(ruleStatusPath, 'utf8'));
const ew = rawStatus?.electionWatch;
if (!ew || !['pending', 'rechecked-unchanged', 'rechecked-changed'].includes(ew.status)) {
  throw new Error('rule-status.json: electionWatch.status must be pending | rechecked-unchanged | rechecked-changed');
}
assertFresh('rule-status.json (electionWatch.checkedOn)', ew.checkedOn);

const sourcePath = path.join(sourcesDir, `${ew.sourceId}.yaml`);
if (!fs.existsSync(sourcePath)) {
  throw new Error(`rule-status.json references missing source file: ${sourcePath}`);
}
const sourceDoc = YAML.parse(fs.readFileSync(sourcePath, 'utf8'));
if (!sourceDoc?.official) {
  throw new Error(`Source ${ew.sourceId}.yaml must have official: true`);
}
assertFresh(`sources/${ew.sourceId}.yaml`, sourceDoc.checkedOn);

// Also check MDX frontmatter directly in case status was flipped to rechecked-changed without rebuilding
const mdxFiles = walkFiles(path.resolve(siteDir, 'src/content'), '.mdx');
const mdxFlagged = mdxFiles.filter((f) => {
  const txt = fs.readFileSync(f, 'utf8');
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(txt);
  return fm && /^\s*ruleStatus:\s*election-watch\b/m.test(fm[1]);
});

if (ew.status === 'rechecked-changed' && mdxFlagged.length > 0) {
  throw new Error(
    `check-rule-status: status is "rechecked-changed" while ${mdxFlagged.length} MDX page(s) remain flagged with ruleStatus: election-watch. Update copy per Prompt 23 STOP list and clear ruleStatus.`,
  );
}

// Determine whether notice is expected to render in HTML
let noticeShouldBeVisible = true;
if (ew.status === 'rechecked-unchanged') {
  const recheckIso = ew.recheckedOn || ew.checkedOn;
  const recheckUtc = parseIsoDateUtc(recheckIso);
  const now = new Date();
  const refUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const daysSinceRecheck = Math.floor((refUtc - recheckUtc) / MS_PER_DAY);
  if (daysSinceRecheck > 30) {
    noticeShouldBeVisible = false;
  }
}

const htmlFiles = walkFiles(distDir, '.html').sort();
if (htmlFiles.length === 0) {
  throw new Error(`No built HTML files found in ${distDir}. Run npm run build first.`);
}

const OBLIGATION_RE =
  /\b(must|have to|has to|required|require|requires|banned|ban|can't|can’t|cannot|can no longer|no longer allowed|restricts)\b/i;
const YEAR_2027_RE = /\b2027\b/;
const QUALIFIED_RE = /currently legislated/i;
const RULE_DATE_RE = /\b1\s+(?:March|Mar|January|Jan|Jul)\s+2027\b/i;

let flaggedPages = 0;
let missingNotices = 0;
let unqualifiedObligations = 0;
const errors = [];

for (const file of htmlFiles) {
  const rel = path.relative(distDir, file).replace(/\\/g, '/');
  const urlPath = '/' + rel.replace(/(^|\/)index\.html$/, '$1');
  const html = fs.readFileSync(file, 'utf8');

  const isNoindex = /meta\s+name=["']robots["']\s+content=["']noindex/i.test(html);
  const isElectionWatch = /<main\b[^>]*\bdata-rule-status=["']election-watch["']/i.test(html);

  if (ew.status === 'rechecked-changed' && isElectionWatch) {
    errors.push(`${urlPath}: page still flagged with data-rule-status="election-watch" while status is rechecked-changed`);
  }

  if (isElectionWatch) {
    flaggedPages++;
    const hasNotice = /\bdata-rule-status-notice\b/.test(html);
    if (noticeShouldBeVisible && !hasNotice) {
      missingNotices++;
      errors.push(`${urlPath}: missing [data-rule-status-notice]`);
    }

    // Extract [data-answer], [data-body], and [data-gas-planner-root] regions
    const regions = [];
    for (const m of html.matchAll(/<section\b[^>]*\bdata-answer\b[^>]*>([\s\S]*?)<\/section>/gi)) {
      regions.push(m[1]);
    }
    for (const m of html.matchAll(/<div\b[^>]*\bdata-body\b[^>]*>([\s\S]*?)<!--\s*END_BODY\s*-->/gi)) {
      regions.push(m[1]);
    }
    // Extract [data-body] via balanced div scan so nested divs inside .page-body don't truncate early
    const bodyStartMatch = /<div\b[^>]*\bdata-body\b[^>]*>/i.exec(html);
    if (bodyStartMatch) {
      let depth = 1;
      let pos = bodyStartMatch.index + bodyStartMatch[0].length;
      const tagRe = /<\/?div\b[^>]*>/gi;
      tagRe.lastIndex = pos;
      let tm;
      while ((tm = tagRe.exec(html)) !== null) {
        if (tm[0].startsWith('</')) {
          depth--;
          if (depth === 0) {
            regions.push(html.slice(pos, tm.index));
            break;
          }
        } else if (!tm[0].endsWith('/>')) {
          depth++;
        }
      }
    }
    // Also inspect GasExitPlanner tool step cards if present
    const plannerStartMatch = /<section\b[^>]*\bdata-gas-planner\b[^>]*>/i.exec(html);
    if (plannerStartMatch) {
      const endSec = html.indexOf('</section>', plannerStartMatch.index);
      if (endSec !== -1) {
        regions.push(html.slice(plannerStartMatch.index, endSec));
      }
    }

    // Inspect block-level elements (<p>, <li>) within regions
    let lastParagraphQualified = false;
    for (const region of regions) {
      const blockMatches = region.matchAll(/<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi);
      for (const bm of blockMatches) {
        const tag = bm[1].toLowerCase();
        const blockText = stripTags(bm[2]);
        if (!blockText) continue;

        if (tag === 'p') {
          lastParagraphQualified = QUALIFIED_RE.test(blockText);
        }

        const sentences = blockText
          .split(/(?<=[.!?])\s+/)
          .map((s) => s.trim())
          .filter(Boolean);

        for (const sentence of sentences) {
          if (YEAR_2027_RE.test(sentence) && OBLIGATION_RE.test(sentence)) {
            const qualifiedInSentence = QUALIFIED_RE.test(sentence);
            const qualifiedInBlock = QUALIFIED_RE.test(blockText);
            const qualifiedViaListIntro = tag === 'li' && lastParagraphQualified && sentences.indexOf(sentence) === 0 && false;
            if (!qualifiedInSentence && !qualifiedInBlock && !qualifiedViaListIntro) {
              unqualifiedObligations++;
              errors.push(`${urlPath}: unqualified 2027 obligation sentence: "${sentence}"`);
            }
          }
        }
      }
    }
  } else if (!isNoindex) {
    // Guard against a primary 2027 rule page missing ruleStatus
    const h1Match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    const h1Text = h1Match ? stripTags(h1Match[1]) : '';
    const answerMatch = html.match(/<section\b[^>]*\bdata-answer\b[^>]*>([\s\S]*?)<\/section>/i);
    const answerText = answerMatch ? stripTags(answerMatch[1]) : '';
    const h2Texts = [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) => stripTags(m[1]));

    const primaryCandidates = [
      h1Text,
      answerText,
      ...h2Texts.filter((h) => /What changes in Victoria in 2027\?|Victoria['’]s 1 March 2027/i.test(h)),
    ];

    for (const candidate of primaryCandidates) {
      if (!candidate) continue;
      if (
        RULE_DATE_RE.test(candidate) ||
        /What changes in Victoria in 2027\?/i.test(candidate)
      ) {
        // Allow meta-directory summary on /faq/ and explicit exemption summary on /victoria/apartments-and-units/
        if (/\bask about\b/i.test(candidate)) continue;
        if (/\bare exempt from the 1 (?:March|Mar) 2027\b/i.test(candidate)) continue;
        errors.push(`${urlPath}: 2027 rule date without ruleStatus ("${candidate}")`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error('check-rule-status FAILED:');
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

console.log(
  `check-rule-status: ${flaggedPages} pages, ${missingNotices} missing notices, ${unqualifiedObligations} unqualified 2027 obligations`,
);
