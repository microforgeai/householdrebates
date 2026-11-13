export interface FigureData {
  id: string;
  group: string;
  state: string;
  program: string;
  activity: 'rcac' | 'hotwater' | 'solar' | 'battery';
  audience: 'household' | 'business';
  scenario: string;
  qualifier: 'up-to' | 'range' | 'exact' | 'about';
  amountMin?: number;
  amountMax: number;
  currency: 'AUD';
  sourceId: string | { id: string };
  checkedOn: Date | string;
  conditions?: string[];
}

const AUD_FORMATTER = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

export function formatAud(amount: number): string {
  return AUD_FORMATTER.format(amount);
}

export function formatFigureAmount(fig: Pick<FigureData, 'qualifier' | 'amountMin' | 'amountMax'>): string {
  const maxStr = formatAud(fig.amountMax);
  switch (fig.qualifier) {
    case 'up-to':
      return `up to ${maxStr}`;
    case 'range': {
      const minStr = formatAud(fig.amountMin ?? fig.amountMax);
      return `${minStr} to ${maxStr}`;
    }
    case 'about':
      return `around ${maxStr}`;
    case 'exact':
      return maxStr;
  }
}

export function getFigureSourceId(fig: FigureData): string {
  return typeof fig.sourceId === 'string' ? fig.sourceId : fig.sourceId.id;
}
