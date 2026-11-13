export type FigureQualifier =
  | 'up-to'
  | 'range'
  | 'exact'
  | 'about'
  | 'about-range'
  | 'minimum'
  | 'more-than'
  | 'almost';

export type FigureUnit = 'AUD' | 'percent' | 'count';
export type FigureDisplay = 'standard' | 'cents' | 'compact';
export type FigureBasis = 'official' | 'estimate';
export type FigureKind = 'discount' | 'payment' | 'threshold' | 'rate' | 'saving' | 'count';
export type FigureActivity =
  | 'rcac'
  | 'hotwater'
  | 'solar'
  | 'battery'
  | 'insulation'
  | 'induction'
  | 'sealing'
  | 'glazing';

export interface FigureData {
  id: string;
  group: string;
  state: string;
  program: string;
  activity: FigureActivity;
  audience: 'household' | 'business';
  scenario: string;
  qualifier: FigureQualifier;
  unit?: FigureUnit;
  display?: FigureDisplay;
  basis?: FigureBasis;
  kind?: FigureKind;
  method?: string;
  basedOn?: string | { id: string } | (string | { id: string })[];
  amountMin?: number;
  amountMax: number;
  currency?: 'AUD';
  gstIncluded?: boolean;
  effectiveFrom?: Date | string;
  effectiveTo?: Date | string;
  supersededBy?: string;
  sourceId: string | { id: string };
  checkedOn: Date | string;
  conditions?: string[];
  groupNote?: string;
}

const AUD_FORMATTER = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

const AUD_CENTS_FORMATTER = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const COUNT_FORMATTER = new Intl.NumberFormat('en-AU', {
  maximumFractionDigits: 0,
});

export function formatAud(amount: number, display: FigureDisplay = 'standard'): string {
  if (display === 'cents') {
    return AUD_CENTS_FORMATTER.format(amount);
  }
  if (display === 'compact' && amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    const numStr = Number.isInteger(millions) ? String(millions) : millions.toFixed(1);
    return `$${numStr} million`;
  }
  return AUD_FORMATTER.format(amount);
}

export function formatUnitValue(
  amount: number,
  unit: FigureUnit = 'AUD',
  display: FigureDisplay = 'standard',
): string {
  if (unit === 'percent') {
    const numStr = Number.isInteger(amount) ? String(amount) : amount.toFixed(1);
    return `${numStr}%`;
  }
  if (unit === 'count') {
    return COUNT_FORMATTER.format(amount);
  }
  return formatAud(amount, display);
}

export function formatFigureAmount(
  fig: Pick<
    FigureData,
    'qualifier' | 'amountMin' | 'amountMax' | 'unit' | 'display' | 'gstIncluded' | 'basis'
  >,
): string {
  const unit = fig.unit ?? 'AUD';
  const display = fig.display ?? 'standard';
  const maxStr = formatUnitValue(fig.amountMax, unit, display);

  if (fig.basis === 'estimate') {
    const estBase = `about ${maxStr} (our estimate)`;
    return fig.gstIncluded ? `${estBase} (including GST)` : estBase;
  }

  let base: string;
  switch (fig.qualifier) {
    case 'up-to':
      base = `up to ${maxStr}`;
      break;
    case 'range': {
      const minVal = fig.amountMin ?? fig.amountMax;
      const minStr =
        unit === 'percent'
          ? Number.isInteger(minVal)
            ? String(minVal)
            : minVal.toFixed(1)
          : formatUnitValue(minVal, unit, display);
      base = `${minStr} to ${maxStr}`;
      break;
    }
    case 'about':
      base = `around ${maxStr}`;
      break;
    case 'about-range': {
      const minVal = fig.amountMin ?? fig.amountMax;
      const minStr =
        unit === 'percent'
          ? Number.isInteger(minVal)
            ? String(minVal)
            : minVal.toFixed(1)
          : formatUnitValue(minVal, unit, display);
      base = `about ${minStr} to ${maxStr}`;
      break;
    }
    case 'minimum':
      base = `at least ${maxStr}`;
      break;
    case 'more-than':
      base = `more than ${maxStr}`;
      break;
    case 'almost':
      base = `almost ${maxStr}`;
      break;
    case 'exact':
      base = maxStr;
      break;
  }

  if (fig.gstIncluded) {
    return `${base} (including GST)`;
  }
  return base;
}

export const formatFigure = formatFigureAmount;
export const formatAUD = formatAud;

export function isHistoricalFigure(
  fig: Pick<FigureData, 'effectiveTo'>,
  now: Date = new Date(),
): boolean {
  if (!fig.effectiveTo) return false;
  const end = typeof fig.effectiveTo === 'string' ? new Date(fig.effectiveTo) : fig.effectiveTo;
  return end.getTime() < now.getTime();
}

export function isStale(
  fig: Pick<FigureData, 'checkedOn'>,
  maxDays = 45,
  now: Date = new Date(),
): boolean {
  const checked = typeof fig.checkedOn === 'string' ? new Date(fig.checkedOn) : fig.checkedOn;
  const ageDays = Math.floor((now.getTime() - checked.getTime()) / (1000 * 60 * 60 * 24));
  return ageDays > maxDays;
}

export function getFigureSourceId(fig: FigureData): string {
  return typeof fig.sourceId === 'string' ? fig.sourceId : fig.sourceId.id;
}
