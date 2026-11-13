const STORAGE_KEY = 'hr_checker_prefill_v1';

function initLeadForms(): void {
  const forms = document.querySelectorAll<HTMLFormElement>('form[data-lead-form]');
  if (forms.length === 0) return;

  for (const form of forms) {
    // 1. Fetch signed form token
    const tokenInput = form.querySelector<HTMLInputElement>('[data-form-token]');
    if (tokenInput) {
      fetch('/api/form-token', { headers: { Accept: 'application/json' } })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && typeof data.token === 'string') {
            tokenInput.value = data.token;
          }
        })
        .catch(() => {
          // Graceful fallback if API is offline in static preview
        });
    }

    // 2. Pre-fill from sessionStorage if present
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, string>;
        const activitySel = form.querySelector<HTMLSelectElement>('select[name="activity"]');
        if (activitySel && (saved.activity === 'rcac' || saved.activity === 'hotwater')) {
          activitySel.value = saved.activity;
        }
        const currentSysSel = form.querySelector<HTMLSelectElement>('select[name="currentSystem"]');
        if (currentSysSel && saved.currentSystem) {
          currentSysSel.value = saved.currentSystem;
        }
        const ownSel = form.querySelector<HTMLSelectElement>('select[name="ownership"]');
        if (ownSel && saved.ownership) {
          ownSel.value = saved.ownership;
        }
        const bldgSel = form.querySelector<HTMLSelectElement>('select[name="buildingOver2Years"]');
        if (bldgSel && saved.buildingOver2Years) {
          bldgSel.value = saved.buildingOver2Years;
        }
        const workSel = form.querySelector<HTMLSelectElement>('select[name="workStarted"]');
        if (workSel && saved.workStarted) {
          workSel.value = saved.workStarted;
        }
        const boughtInput = form.querySelector<HTMLInputElement>('[data-product-bought]');
        if (boughtInput && saved.productBought === '1') {
          boughtInput.value = '1';
        }
      }
    } catch {
      // Ignore storage errors
    }

    // 3. Toggle landlord approval checkbox when tenant is selected
    const ownershipSelect = form.querySelector<HTMLSelectElement>('[data-lf-ownership]');
    const landlordWrap = form.querySelector<HTMLElement>('[data-landlord-ok-wrap]');
    if (ownershipSelect && landlordWrap) {
      const updateLandlordVisibility = () => {
        landlordWrap.hidden = ownershipSelect.value !== 'rent';
      };
      ownershipSelect.addEventListener('change', updateLandlordVisibility);
      updateLandlordVisibility();
    }

    // 4. Dynamic routing lookup when postcode or activity changes
    const postcodeInput = form.querySelector<HTMLInputElement>('[data-lf-postcode]');
    const activitySelect = form.querySelector<HTMLSelectElement>('[data-lf-activity]');
    const updateRouting = () => {
      const postcode = postcodeInput?.value.trim() ?? '';
      const activity = activitySelect?.value ?? 'rcac';
      if (!/^3\d{3}$/.test(postcode)) return;

      fetch(`/api/routing?postcode=${encodeURIComponent(postcode)}&activity=${encodeURIComponent(activity)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data || !Array.isArray(data.installers) || data.installers.length === 0) return;
          const ids = data.installers.map((i: { id: string }) => i.id).join(',');
          const listStr = data.installers
            .map(
              (i: { tradingName: string; accreditedProvider: string }) =>
                `${i.tradingName}, which works with Victorian Energy Upgrades accredited provider ${i.accreditedProvider}`,
            )
            .join('; ');
          const namesStr = data.installers.map((i: { tradingName: string }) => i.tradingName).join(' and ');

          const recipInput = form.querySelector<HTMLInputElement>('[data-recipient-ids]');
          if (recipInput) recipInput.value = ids;

          form.querySelectorAll<HTMLElement>('[data-installer-list]').forEach((el) => {
            el.textContent = listStr;
          });
          form.querySelectorAll<HTMLElement>('[data-installer-names]').forEach((el) => {
            el.textContent = namesStr;
          });
        })
        .catch(() => {
          // Keep build-time fallback
        });
    };

    postcodeInput?.addEventListener('change', updateRouting);
    activitySelect?.addEventListener('change', updateRouting);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLeadForms);
} else {
  initLeadForms();
}
