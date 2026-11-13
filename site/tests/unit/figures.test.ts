import { describe, expect, it } from 'vitest';
import {
  formatAud,
  formatFigureAmount,
  formatUnitValue,
  isHistoricalFigure,
  isStale,
} from '../../src/lib/figures';

describe('figures formatting and validation helpers', () => {
  it('formats standard, cents, and compact AUD values', () => {
    expect(formatAud(5530)).toBe('$5,530');
    expect(formatAud(171.6, 'cents')).toBe('$171.60');
    expect(formatAud(62.4, 'cents')).toBe('$62.40');
    expect(formatAud(3000000, 'compact')).toBe('$3 million');
    expect(formatAud(150000, 'compact')).toBe('$150,000');
  });

  it('formats percent and count units', () => {
    expect(formatUnitValue(17.5, 'percent')).toBe('17.5%');
    expect(formatUnitValue(50, 'percent')).toBe('50%');
    expect(formatUnitValue(31, 'count')).toBe('31');
    expect(formatUnitValue(27000, 'count')).toBe('27,000');
  });

  it('formats all qualifiers and gstIncluded', () => {
    expect(formatFigureAmount({ qualifier: 'up-to', amountMax: 5530 })).toBe('up to $5,530');
    expect(
      formatFigureAmount({ qualifier: 'range', amountMin: 630, amountMax: 1610 }),
    ).toBe('$630 to $1,610');
    expect(formatFigureAmount({ qualifier: 'exact', amountMax: 560 })).toBe('$560');
    expect(formatFigureAmount({ qualifier: 'about', amountMax: 400 })).toBe('around $400');
    expect(
      formatFigureAmount({ qualifier: 'about-range', amountMin: 350, amountMax: 400 }),
    ).toBe('about $350 to $400');
    expect(
      formatFigureAmount({
        qualifier: 'about-range',
        amountMin: 30,
        amountMax: 50,
        unit: 'percent',
      }),
    ).toBe('about 30 to 50%');
    expect(
      formatFigureAmount({ qualifier: 'minimum', amountMax: 3000, gstIncluded: true }),
    ).toBe('at least $3,000 (including GST)');
    expect(formatFigureAmount({ qualifier: 'more-than', amountMax: 400 })).toBe('more than $400');
    expect(
      formatFigureAmount({ qualifier: 'almost', amountMax: 60, unit: 'percent' }),
    ).toBe('almost 60%');
    expect(
      formatFigureAmount({ qualifier: 'about', amountMax: 1590, basis: 'estimate' }),
    ).toBe('about $1,590 (our estimate)');
    expect(
      formatFigureAmount({ qualifier: 'about', amountMax: 2010, basis: 'estimate' }),
    ).toBe('about $2,010 (our estimate)');
    expect(
      formatFigureAmount({ qualifier: 'about', amountMax: 1510, basis: 'estimate' }),
    ).toBe('about $1,510 (our estimate)');
  });

  it('detects stale and historical figures', () => {
    const now = new Date('2026-11-13T00:00:00Z');
    expect(isStale({ checkedOn: '2026-11-13' }, 45, now)).toBe(false);
    expect(isStale({ checkedOn: '2026-09-01' }, 45, now)).toBe(true);
    expect(isHistoricalFigure({ effectiveTo: '2026-09-29' }, now)).toBe(true);
    expect(isHistoricalFigure({ effectiveTo: '2027-06-30' }, now)).toBe(false);
    expect(isHistoricalFigure({}, now)).toBe(false);
  });
});

