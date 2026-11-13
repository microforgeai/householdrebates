import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const srcDir = path.join(siteRoot, 'src');
const distDir = path.join(siteRoot, 'dist');

const maxAgeDays = Number(process.env.MAX_FIGURE_AGE_DAYS || 45);
const now = new Date();
const melbourneTodayParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Australia/Melbourne',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(now);
const [melbY, melbM, melbD] = melbourneTodayParts.split('-').map(Number);
const todayMelbourneUtc = Date.UTC(melbY, melbM - 1, melbD);

function ageDaysMelbourne(checkedOn) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(checkedOn || '').trim());
  if (m) {
    const checkedUtc = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Math.floor((todayMelbourneUtc - checkedUtc) / (1000 * 60 * 60 * 24));
  }
  const d = new Date(checkedOn);
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function walkFiles(dir, extRegex) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      results.push(...walkFiles(full, extRegex));
    } else if (extRegex.test(e.name)) {
      results.push(full);
    }
  }
  return results;
}

// 1. Load sources map
const sourcesDir = path.join(srcDir, 'content/sources');
const sourcesMap = new Map();
for (const file of fs.readdirSync(sourcesDir).filter((f) => f.endsWith('.yaml'))) {
  sourcesMap.set(file.replace(/\.yaml$/, ''), YAML.parse(fs.readFileSync(path.join(sourcesDir, file), 'utf8')));
}

function assertProgramRecord(prog, contextLabel) {
  if (!prog.name || !prog.status || !prog.statusNote || !prog.statusCheckedOn || !prog.sourceId) {
    throw new Error(`${contextLabel}: councilProgram "${prog.name ?? '(unnamed)'}" is missing required fields`);
  }
  if (!sourcesMap.has(prog.sourceId)) {
    throw new Error(`${contextLabel}: councilProgram "${prog.name}" references missing source "${prog.sourceId}"`);
  }
  if (prog.status === 'open') {
    const age = ageDaysMelbourne(prog.statusCheckedOn);
    if (age > maxAgeDays) {
      throw new Error(
        `${contextLabel}: open councilProgram "${prog.name}" has stale statusCheckedOn (${age} days > ${maxAgeDays} days)`,
      );
    }
    if (age < -1) {
      throw new Error(
        `${contextLabel}: councilProgram "${prog.name}" has future statusCheckedOn (${prog.statusCheckedOn})`,
      );
    }
  }
  if (prog.status !== 'open') {
    if (/\b(open|available now|apply now)\b/i.test(prog.statusNote)) {
      throw new Error(
        `${contextLabel}: councilProgram "${prog.name}" has status="${prog.status}" but statusNote uses open/available now/apply now wording: "${prog.statusNote}"`,
      );
    }
  }
}

// 2. Check src/data/council-programs.json
const registryPath = path.join(srcDir, 'data/council-programs.json');
let registryCount = 0;
if (fs.existsSync(registryPath)) {
  const reg = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  for (const p of reg.programs ?? []) {
    assertProgramRecord(p, 'data/council-programs.json');
    registryCount++;
  }
}

// 3. Check area MDX files
const areaMdxFiles = walkFiles(path.join(srcDir, 'content/areas'), /\.mdx$/);
let mdxProgramCount = 0;
for (const file of areaMdxFiles) {
  const rel = path.relative(siteRoot, file);
  const raw = fs.readFileSync(file, 'utf8');
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) continue;
  const fm = YAML.parse(fmMatch[1]);
  const body = fmMatch[2];

  for (const prog of fm.councilPrograms ?? []) {
    assertProgramRecord(prog, rel);
    mdxProgramCount++;

    // If a non-open program is also discussed in MDX body sentences, ensure those sentences don't claim it is open/available now/apply now
    if (prog.status !== 'open') {
      const nameEsc = prog.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const nameRe = new RegExp(nameEsc, 'i');
      for (const sentence of body.split(/[.!?\n]+/)) {
        if (nameRe.test(sentence) && /\b(is open|are open|available now|apply now)\b/i.test(sentence)) {
          throw new Error(
            `${rel}: body sentence for ${prog.status} program "${prog.name}" claims open/available now/apply now: "${sentence.trim()}"`,
          );
        }
      }
    }
  }
}

// 4. Post-build HTML check in dist/
let renderedCount = 0;
if (fs.existsSync(distDir)) {
  const htmlFiles = walkFiles(distDir, /\.html$/);
  for (const htmlFile of htmlFiles) {
    const rel = path.relative(siteRoot, htmlFile);
    const html = fs.readFileSync(htmlFile, 'utf8');

    if (/data-program-status=["']unverified["']/i.test(html)) {
      throw new Error(`${rel}: unverified council program must never be rendered`);
    }

    for (const m of html.matchAll(
      /<li\b[^>]*\bdata-council-program=["']([^"']+)["'][^>]*>([\s\S]*?)<\/li>/gi,
    )) {
      const fullTag = m[0];
      const name = m[1];
      const inner = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const statusMatch = fullTag.match(/\bdata-program-status=["']([^"']+)["']/i);
      const checkedMatch = fullTag.match(/\bdata-status-checked-on=["']([^"']+)["']/i);
      const status = statusMatch ? statusMatch[1] : '';
      const checkedIso = checkedMatch ? checkedMatch[1] : '';

      if (status === 'unverified') {
        throw new Error(`${rel}: unverified council program "${name}" rendered in HTML`);
      }
      if (!/Status checked\s+\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}/.test(inner)) {
        throw new Error(`${rel}: rendered council program "${name}" is missing "Status checked {date}"`);
      }
      if (status === 'open') {
        const age = ageDaysMelbourne(checkedIso);
        if (!checkedIso || age > maxAgeDays) {
          throw new Error(
            `${rel}: rendered open council program "${name}" has missing or stale statusCheckedOn (${checkedIso})`,
          );
        }
      } else {
        // Strip the "Status: ..." prefix and program name before checking copy
        const noteText = inner.replace(name, '');
        if (/\b(open|available now|apply now)\b/i.test(noteText)) {
          throw new Error(
            `${rel}: rendered ${status} council program "${name}" uses "open", "available now", or "apply now": "${inner}"`,
          );
        }
      }
      renderedCount++;
    }
  }
}

console.log(
  `check-council-status: OK (${registryCount} registry entries, ${mdxProgramCount} area program entries, ${renderedCount} rendered; 0 stale open, 0 unverified rendered).`,
);
