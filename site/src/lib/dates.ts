const MELBOURNE_FORMATTER = /*#__PURE__*/ new Intl.DateTimeFormat('en-AU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Australia/Melbourne',
});

const MELBOURNE_DAY_MONTH_FORMATTER = /*#__PURE__*/ new Intl.DateTimeFormat('en-AU', {
  day: 'numeric',
  month: 'short',
  timeZone: 'Australia/Melbourne',
});

export function formatAuDate(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return MELBOURNE_FORMATTER.format(d);
}

export function formatAuDayMonth(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return MELBOURNE_DAY_MONTH_FORMATTER.format(d);
}

export function daysBetween(checkedOn: Date | string, referenceDate: Date = new Date()): number {
  const checked = typeof checkedOn === 'string' ? new Date(checkedOn) : checkedOn;
  const diffMs = referenceDate.getTime() - checked.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function assertFigureNotStale(
  id: string,
  checkedOn: Date | string,
  maxAgeDays = 45,
  referenceDate: Date = new Date(),
): void {
  const age = daysBetween(checkedOn, referenceDate);
  if (age > maxAgeDays) {
    throw new Error(
      `Figure "${id}" is stale (${age} days old; checkedOn=${formatAuDate(checkedOn)}; maxAgeDays=${maxAgeDays}).`,
    );
  }
  if (age < -1) {
    throw new Error(`Figure "${id}" has a future checkedOn date (${formatAuDate(checkedOn)}).`);
  }
}

export function assertFigureNotExpired(
  id: string,
  expiresOn: Date | string | undefined,
  referenceDate: Date = new Date(),
): void {
  if (!expiresOn) return;
  const melbParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Melbourne',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(referenceDate);
  const [rY, rM, rD] = melbParts.split('-').map(Number);
  const refUtc = Date.UTC(rY, rM - 1, rD);

  const exp = typeof expiresOn === 'string' ? new Date(expiresOn) : expiresOn;
  const expUtc = Date.UTC(exp.getUTCFullYear(), exp.getUTCMonth(), exp.getUTCDate());
  if (refUtc > expUtc) {
    throw new Error(
      `Figure "${id}" has passed its expiresOn date (${formatAuDate(exp)}); remove or re-source expired content.`,
    );
  }
}
