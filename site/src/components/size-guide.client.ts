import { lookupPostcodeHpZone } from '../lib/tools';

function initSizeGuide() {
  const root = document.querySelector<HTMLElement>('[data-size-guide-root]');
  if (!root) return;

  const pcEl = root.querySelector<HTMLScriptElement>('#veu-postcodes');
  const compactMap: Record<string, string> = pcEl?.textContent ? JSON.parse(pcEl.textContent) : {};

  const form = root.querySelector<HTMLFormElement>('[data-size-guide-form]');
  const bedSelect = root.querySelector<HTMLSelectElement>('[data-hw-bedrooms]');
  const pcInput = root.querySelector<HTMLInputElement>('[data-hw-postcode]');
  const pcErr = root.querySelector<HTMLElement>('#hw-postcode-error');
  const rows = Array.from(root.querySelectorAll<HTMLTableRowElement>('[data-hw-row]'));
  const zoneOut = root.querySelector<HTMLElement>('[data-hw-zone-output]');

  function updateRows() {
    const selected = bedSelect?.value ?? 'all';
    for (const row of rows) {
      const match = selected === 'all' || row.dataset.hwRow === selected;
      row.hidden = !match;
      if (selected !== 'all' && match) {
        row.setAttribute('data-highlighted', 'true');
      } else {
        row.removeAttribute('data-highlighted');
      }
    }
  }

  function clearPostcodeError() {
    if (!pcInput || !pcErr) return;
    pcErr.hidden = true;
    pcErr.textContent = '';
    pcInput.removeAttribute('aria-invalid');
    pcInput.removeAttribute('aria-describedby');
  }

  function updateZone() {
    if (!pcInput || !zoneOut || !pcErr) return;
    const res = lookupPostcodeHpZone(pcInput.value, compactMap);

    if (res.status === 'empty') {
      clearPostcodeError();
      zoneOut.hidden = true;
      zoneOut.textContent = '';
      return;
    }

    if (res.status === 'invalid') {
      pcErr.textContent = res.message;
      pcErr.hidden = false;
      pcInput.setAttribute('aria-invalid', 'true');
      pcInput.setAttribute('aria-describedby', 'hw-postcode-error');
      zoneOut.hidden = true;
      return;
    }

    clearPostcodeError();
    if (res.status === 'not_listed') {
      zoneOut.textContent = res.message;
      zoneOut.hidden = false;
      return;
    }

    const frostSentence = res.frostAdvice
      ? ' Zone 5 covers cooler Victorian areas—Energy Victoria advises considering a heat pump model with frost protection (and cold-climate booster support if needed).'
      : ' Zone 4 covers milder Victorian areas; still check winter recovery specs and frost protection with your plumber.';
    zoneOut.textContent = `${res.note}${frostSentence}`;
    zoneOut.hidden = false;
  }

  bedSelect?.addEventListener('change', updateRows);
  pcInput?.addEventListener('input', () => {
    if (pcInput.value.trim().length === 4 || pcInput.value.trim().length === 0) {
      updateZone();
    }
  });
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    updateRows();
    updateZone();
  });

  updateRows();
}

initSizeGuide();
