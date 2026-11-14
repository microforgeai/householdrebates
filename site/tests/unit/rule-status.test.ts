import { describe, expect, it } from 'vitest';
import rawRuleStatus from '../../src/data/rule-status.json';
import {
  buildPendingNoticeText,
  hasVicElectionFigure,
  resolveElectionWatchNotice,
} from '../../src/lib/rule-status';

describe('rule-status (election watch)', () => {
  it('renders the exact Prompt 40 #11 election banner wording with page checkedOn date when pending', () => {
    const renderedDefault = buildPendingNoticeText({
      electionDate: '2026-11-28',
      checkedOn: '2026-11-14',
    });
    expect(renderedDefault).toBe(
      "The Victorian election on 28 November 2026 may change these rules. Figures are as checked on 14 Nov 2026; we'll update this page once the new government confirms its policy.",
    );
    expect(renderedDefault).toBe(rawRuleStatus.electionWatch.text);

    const renderedPageDate = buildPendingNoticeText(
      {
        electionDate: '2026-11-28',
        checkedOn: '2026-11-15',
      },
      '2026-11-13',
    );
    expect(renderedPageDate).toBe(
      "The Victorian election on 28 November 2026 may change these rules. Figures are as checked on 13 Nov 2026; we'll update this page once the new government confirms its policy.",
    );

    const resolved = resolveElectionWatchNotice(rawRuleStatus, new Date('2026-11-15T00:00:00Z'));
    expect(resolved.visible).toBe(true);
    expect(resolved.message).toBe(rawRuleStatus.electionWatch.text);
    expect(resolved.sourceId).toBe('energyvic-caretaker-banner');
  });

  it('flags pages carrying VEU or Solar Homes figures for the election banner while ignoring federal-only figures', () => {
    expect(hasVicElectionFigure(['VEU'])).toBe(true);
    expect(hasVicElectionFigure(['Solar Homes'])).toBe(true);
    expect(hasVicElectionFigure(['VEU + Solar Homes'])).toBe(true);
    expect(hasVicElectionFigure(['Cheaper Home Batteries'])).toBe(false);
    expect(hasVicElectionFigure([])).toBe(false);
  });

  it('shows rechecked-unchanged notice for 30 days and hides it after 30 days', () => {
    const unchanged = {
      electionWatch: {
        ...rawRuleStatus.electionWatch,
        status: 'rechecked-unchanged' as const,
        checkedOn: '2026-12-01',
        recheckedOn: '2026-12-01',
      },
    };

    const within30 = resolveElectionWatchNotice(unchanged, new Date('2026-12-20T00:00:00Z'));
    expect(within30.visible).toBe(true);
    expect(within30.message).toBe(
      'Re-checked after the 28 Nov 2026 election on 1 Dec 2026: no change to these rules yet.',
    );

    const after30 = resolveElectionWatchNotice(unchanged, new Date('2027-01-02T00:00:00Z'));
    expect(after30.visible).toBe(false);
  });

  it('throws on rechecked-changed while pages are still flagged', () => {
    const changed = {
      electionWatch: {
        ...rawRuleStatus.electionWatch,
        status: 'rechecked-changed' as const,
      },
    };
    expect(() => resolveElectionWatchNotice(changed, new Date('2026-12-01T00:00:00Z'))).toThrow(
      /rechecked-changed/,
    );
  });

  it('throws when checkedOn exceeds the 45-day freshness threshold', () => {
    const stale = {
      electionWatch: {
        ...rawRuleStatus.electionWatch,
        checkedOn: '2026-09-20',
      },
    };
    expect(() => resolveElectionWatchNotice(stale, new Date('2026-11-15T00:00:00Z'))).toThrow(/stale/i);
  });
});
