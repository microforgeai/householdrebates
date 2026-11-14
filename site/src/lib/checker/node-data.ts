import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import type { FigureData } from '../figures';
import { getEnabledUrls } from '../rollout';
import { SPEC_SOLSTICE_POSTCODES } from './area';
import { evaluateWithData } from './evaluate';
import type {
  CheckerAnswers,
  CheckerEvaluationContext,
  CheckerResult,
  PostcodesDataset,
  SourceMeta,
} from './types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '../../..');

let cachedContext: CheckerEvaluationContext | null = null;

export function loadSolsticePostcodesFromRow53(): string[] {
  const row53Path = path.join(
    siteRoot,
    'src/content/areas/vic/solstice-gas-shutdown-towns.mdx',
  );
  const raw = fs.readFileSync(row53Path, 'utf8');
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    throw new Error('solstice-gas-shutdown-towns.mdx is missing YAML frontmatter.');
  }
  const fm = YAML.parse(fmMatch[1]) as { postcodes?: (string | number)[] };
  const list = (fm.postcodes ?? []).map((p) => String(p).trim());
  const expected = [...SPEC_SOLSTICE_POSTCODES];
  if (
    list.length !== expected.length ||
    list.some((code, idx) => code !== expected[idx])
  ) {
    throw new Error(
      `Row 53 Solstice postcodes [${list.join(', ')}] do not match spec [${expected.join(', ')}]`,
    );
  }
  return list;
}

export function loadFiguresMap(): Map<string, FigureData> {
  const figuresPath = path.join(siteRoot, 'src/content/figures/vic-veu.yaml');
  const parsed = YAML.parse(fs.readFileSync(figuresPath, 'utf8')) as FigureData[];
  return new Map(parsed.map((f) => [f.id, f]));
}

export function loadSourcesMap(): Map<string, SourceMeta> {
  const sourcesDir = path.join(siteRoot, 'src/content/sources');
  const files = fs
    .readdirSync(sourcesDir)
    .filter((name) => name.endsWith('.yaml') || name.endsWith('.yml'));
  const map = new Map<string, SourceMeta>();
  for (const file of files) {
    const raw = fs.readFileSync(path.join(sourcesDir, file), 'utf8');
    const data = YAML.parse(raw) as {
      id?: string;
      title: string;
      publisher: string;
      url: string;
      official: boolean;
      checkedOn: string | Date;
    };
    const id = data.id ?? path.basename(file, path.extname(file));
    const checkedOn =
      typeof data.checkedOn === 'string'
        ? data.checkedOn.slice(0, 10)
        : data.checkedOn.toISOString().slice(0, 10);
    map.set(id, {
      id,
      title: data.title,
      publisher: data.publisher,
      url: data.url,
      official: Boolean(data.official),
      checkedOn,
    });
  }
  return map;
}

export function loadPostcodesDataset(): PostcodesDataset {
  const postcodesPath = path.join(siteRoot, 'src/data/postcodes.json');
  return JSON.parse(fs.readFileSync(postcodesPath, 'utf8')) as PostcodesDataset;
}

export function getDefaultCheckerContext(): CheckerEvaluationContext {
  if (!cachedContext) {
    const solsticeList = loadSolsticePostcodesFromRow53();
    cachedContext = {
      postcodes: loadPostcodesDataset(),
      figures: loadFiguresMap(),
      sources: loadSourcesMap(),
      enabledUrls: getEnabledUrls(),
      solsticePostcodes: new Set(solsticeList),
    };
  }
  return cachedContext;
}

export function evaluate(
  answers: CheckerAnswers,
  overrides?: Partial<CheckerEvaluationContext>,
): CheckerResult {
  const base = getDefaultCheckerContext();
  const ctx: CheckerEvaluationContext = overrides
    ? {
        postcodes: overrides.postcodes ?? base.postcodes,
        figures: overrides.figures ?? base.figures,
        sources: overrides.sources ?? base.sources,
        enabledUrls: overrides.enabledUrls ?? base.enabledUrls,
        solsticePostcodes: overrides.solsticePostcodes ?? base.solsticePostcodes,
      }
    : base;
  return evaluateWithData(answers, ctx);
}
