import {
  CONSENT_VERSIONS,
  formatActivityLabel,
  formatApList,
  formatChannelList,
  formatInstallerList,
  formatInstallerNames,
  type ConsentChannel,
  type ConsentRecipient,
} from '../data/consent/vic-v1';

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

    // 4. Keep on-screen consent snapshot synchronized with selected activity & channels
    const activitySelect = form.querySelector<HTMLSelectElement>('[data-lf-activity]');
    const versionInput = form.querySelector<HTMLInputElement>('[data-consent-version]');
    const channelInputs = form.querySelectorAll<HTMLInputElement>('input[name="contactPrefs"]');

    const syncConsentActivityAndChannels = () => {
      const act = activitySelect?.value === 'hotwater' ? 'hotwater' : 'rcac';
      if (versionInput) {
        versionInput.value = CONSENT_VERSIONS[act];
      }
      const actLabel = formatActivityLabel(act);
      form.querySelectorAll<HTMLElement>('[data-activity-label]').forEach((el) => {
        el.textContent = actLabel;
      });

      const tickedChannels: ConsentChannel[] = [];
      channelInputs.forEach((cb) => {
        if (cb.checked && (cb.value === 'phone' || cb.value === 'email' || cb.value === 'site_visit')) {
          tickedChannels.push(cb.value);
        }
      });
      const channelText = formatChannelList(tickedChannels);
      form.querySelectorAll<HTMLElement>('[data-channel-list]').forEach((el) => {
        el.textContent = channelText;
      });
    };

    channelInputs.forEach((cb) => {
      cb.addEventListener('change', syncConsentActivityAndChannels);
    });
    activitySelect?.addEventListener('change', syncConsentActivityAndChannels);
    syncConsentActivityAndChannels();

    // 5. Dynamic routing lookup when postcode or activity changes
    const postcodeInput = form.querySelector<HTMLInputElement>('[data-lf-postcode]');
    const updateRouting = () => {
      const postcode = postcodeInput?.value.trim() ?? '';
      const activity = activitySelect?.value === 'hotwater' ? 'hotwater' : 'rcac';
      if (!/^3\d{3}$/.test(postcode)) return;

      fetch(`/api/routing?postcode=${encodeURIComponent(postcode)}&activity=${encodeURIComponent(activity)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data || !Array.isArray(data.installers) || data.installers.length === 0) return;
          const recipients = data.installers as ConsentRecipient[];
          const ids = recipients.map((i) => i.id).join(',');
          const listStr = formatInstallerList(recipients);
          const namesStr = formatInstallerNames(recipients);
          const apStr = formatApList(recipients);

          const recipInput = form.querySelector<HTMLInputElement>('[data-recipient-ids]');
          if (recipInput) recipInput.value = ids;

          form.querySelectorAll<HTMLElement>('[data-installer-list]').forEach((el) => {
            el.textContent = listStr;
          });
          form.querySelectorAll<HTMLElement>('[data-installer-names]').forEach((el) => {
            el.textContent = namesStr;
          });
          form.querySelectorAll<HTMLElement>('[data-ap-list]').forEach((el) => {
            el.textContent = apStr;
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
