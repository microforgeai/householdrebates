const collator = new Intl.Collator('en-AU', { numeric: true, sensitivity: 'base' });

function initPostcodeTables(): void {
  const sections = document.querySelectorAll<HTMLElement>('[data-postcode-table]');
  for (const section of sections) {
    const table = section.querySelector<HTMLTableElement>('table');
    const tbody = table?.querySelector<HTMLTableSectionElement>('tbody');
    if (!table || !tbody) continue;

    const headers = Array.from(table.querySelectorAll<HTMLTableCellElement>('thead th'));
    const buttons = Array.from(
      table.querySelectorAll<HTMLButtonElement>('thead button[data-sort-col]'),
    );

    for (const btn of buttons) {
      btn.addEventListener('click', () => {
        const colIdx = Number(btn.dataset.sortCol ?? '0');
        const th = btn.closest('th');
        if (!th) return;

        const currentSort = th.getAttribute('aria-sort');
        const nextDir: 'ascending' | 'descending' =
          currentSort === 'ascending' ? 'descending' : 'ascending';

        for (const h of headers) {
          h.setAttribute('aria-sort', h === th ? nextDir : 'none');
        }

        const rows = Array.from(tbody.querySelectorAll<HTMLTableRowElement>('tr'));
        rows.sort((a, b) => {
          const aVal = a.cells[colIdx]?.textContent?.trim() ?? '';
          const bVal = b.cells[colIdx]?.textContent?.trim() ?? '';
          const cmp = collator.compare(aVal, bVal);
          if (cmp !== 0) {
            return nextDir === 'ascending' ? cmp : -cmp;
          }
          const aPc = a.dataset.postcode ?? '';
          const bPc = b.dataset.postcode ?? '';
          return collator.compare(aPc, bPc);
        });

        tbody.append(...rows);
      });
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPostcodeTables, { once: true });
} else {
  initPostcodeTables();
}
