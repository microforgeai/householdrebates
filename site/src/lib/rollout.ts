import rolloutConfig from '../data/rollout.json';
import urlMapRows from '../data/url-map.json';

export interface UrlMapRow {
  row: number;
  url: string;
  wave: number;
  status: string;
  template: string;
  question: string;
  secondaryQuestions: string[];
  internalLinks: string[];
  cta: string;
  priority: string;
  priorityAndIntent: string;
  notes: string;
  checkedOn: string;
  gated: boolean;
}

export function parseRowRange(spec: string): Set<number> {
  const out = new Set<number>();
  for (const part of spec.split(',').map((s) => s.trim()).filter(Boolean)) {
    const m = part.match(/^(\d+)-(\d+)$/);
    if (m) {
      const start = Number(m[1]);
      const end = Number(m[2]);
      for (let i = start; i <= end; i++) out.add(i);
    } else if (/^\d+$/.test(part)) {
      out.add(Number(part));
    }
  }
  return out;
}

const ALL_ROWS = urlMapRows as UrlMapRow[];
const ROW_BY_NUM = new Map<number, UrlMapRow>(ALL_ROWS.map((r) => [r.row, r]));
const ROW_BY_URL = new Map<string, UrlMapRow>(ALL_ROWS.map((r) => [r.url, r]));

export function getEnabledRowNumbers(): Set<number> {
  const raw = parseRowRange(rolloutConfig.enabledRows);
  const gatedOk = new Set<number>(rolloutConfig.gatedApproved ?? []);
  const enabled = new Set<number>();
  for (const rowNum of raw) {
    const row = ROW_BY_NUM.get(rowNum);
    if (!row) continue;
    if (row.gated && !gatedOk.has(rowNum)) continue;
    enabled.add(rowNum);
  }
  return enabled;
}

export function getEnabledUrls(): Set<string> {
  const nums = getEnabledRowNumbers();
  const urls = new Set<string>();
  for (const n of nums) {
    const r = ROW_BY_NUM.get(n);
    if (r) urls.add(r.url);
  }
  return urls;
}

export function isUrlEnabled(url: string): boolean {
  return getEnabledUrls().has(url);
}

export function getMapRowByNumber(rowNum: number): UrlMapRow | undefined {
  return ROW_BY_NUM.get(rowNum);
}

export function getMapRowByUrl(url: string): UrlMapRow | undefined {
  return ROW_BY_URL.get(url);
}

export function assertEntryEnabled(mapRow: number | undefined, expectedUrl: string): void {
  const rowInMap = ROW_BY_URL.get(expectedUrl);
  if (rowInMap && mapRow !== undefined && rowInMap.row !== mapRow) {
    throw new Error(
      `mapRow mismatch for ${expectedUrl}: frontmatter has ${mapRow}, url-map.json has ${rowInMap.row}`,
    );
  }
  if (rowInMap) {
    const enabled = getEnabledRowNumbers();
    if (!enabled.has(rowInMap.row)) {
      throw new Error(
        `page not enabled in rollout.json: row ${rowInMap.row} (${expectedUrl})`,
      );
    }
  }
}
