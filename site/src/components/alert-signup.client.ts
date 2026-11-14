const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function initCheckerAlertMount(): void {
  const mount = document.querySelector<HTMLElement>('[data-checker-alert-mount]');
  const island = document.querySelector<HTMLElement>('[data-checker-island]');
  if (!mount || !island) return;

  const sync = () => {
    mount.hidden = !island.querySelector('[data-checker-result]');
  };
  sync();
  new MutationObserver(sync).observe(island, { childList: true, subtree: true });
}

function setFieldError(
  input: HTMLInputElement | null,
  errEl: HTMLElement | null,
  msg: string | null,
): void {
  if (!input || !errEl) return;
  if (msg) {
    errEl.textContent = msg;
    errEl.hidden = false;
    input.setAttribute('aria-invalid', 'true');
  } else {
    errEl.textContent = '';
    errEl.hidden = true;
    input.removeAttribute('aria-invalid');
  }
}

function initAlertForms(): void {
  initCheckerAlertMount();

  const forms = document.querySelectorAll<HTMLFormElement>('form[data-alert-form]');
  if (forms.length === 0) return;

  for (const form of forms) {
    if (form.dataset.alertHydrated === '1') continue;
    form.dataset.alertHydrated = '1';

    const root = form.closest('section');
    const tokenInput = form.querySelector<HTMLInputElement>('[data-alert-form-token]');
    const versionInput = form.querySelector<HTMLInputElement>('[data-alert-consent-version]');
    const websiteInput = form.querySelector<HTMLInputElement>('[data-alert-website]');
    const emailInput = form.querySelector<HTMLInputElement>('[data-alert-email]');
    const emailError = form.querySelector<HTMLElement>('[data-alert-email-error]');
    const consentInput = form.querySelector<HTMLInputElement>('[data-alert-consent]');
    const consentError = form.querySelector<HTMLElement>('[data-alert-consent-error]');
    const formError = form.querySelector<HTMLElement>('[data-alert-form-error]');
    const submitBtn = form.querySelector<HTMLButtonElement>('[data-alert-submit]');
    const successBox = root?.querySelector<HTMLElement>('[data-alert-success]') ?? null;

    if (tokenInput) {
      fetch('/api/form-token', { headers: { Accept: 'application/json' } })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && typeof data.token === 'string') {
            tokenInput.value = data.token;
          }
        })
        .catch(() => {});
    }

    emailInput?.addEventListener('input', () => setFieldError(emailInput, emailError, null));
    consentInput?.addEventListener('change', () => setFieldError(consentInput, consentError, null));

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      if (formError) {
        formError.textContent = '';
        formError.hidden = true;
      }

      const rawEmail = (emailInput?.value ?? '').trim();
      const hasValidEmail = rawEmail.length > 0 && rawEmail.length <= 254 && EMAIL_RE.test(rawEmail);
      const hasConsent = Boolean(consentInput?.checked);

      setFieldError(
        emailInput,
        emailError,
        hasValidEmail ? null : 'Enter a valid email address.',
      );
      setFieldError(
        consentInput,
        consentError,
        hasConsent ? null : 'Tick the consent box to receive rule-change alerts.',
      );

      if (!hasValidEmail) {
        emailInput?.focus();
        return;
      }
      if (!hasConsent) {
        consentInput?.focus();
        return;
      }

      if (submitBtn) submitBtn.disabled = true;

      const payload = {
        email: rawEmail,
        consent: true,
        consentVersion: versionInput?.value ?? 'alerts-v1',
        formToken: tokenInput?.value ?? '',
        website: websiteInput?.value ?? '',
      };

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (res.status === 202 || res.ok) {
          form.hidden = true;
          if (successBox) {
            successBox.hidden = false;
            successBox.focus();
          }
          return;
        }

        const errData = (await res.json().catch(() => null)) as {
          error?: string;
          fields?: Record<string, string>;
        } | null;

        if (res.status === 422 && errData?.fields) {
          if (errData.fields.email) {
            setFieldError(emailInput, emailError, errData.fields.email);
            emailInput?.focus();
          }
          if (errData.fields.consent) {
            setFieldError(consentInput, consentError, errData.fields.consent);
            if (!errData.fields.email) consentInput?.focus();
          }
          return;
        }

        if (formError) {
          formError.textContent =
            errData?.error || 'Could not submit right now. Please try again shortly.';
          formError.hidden = false;
        }
      } catch {
        if (formError) {
          formError.textContent = 'Could not connect right now. Check your connection and try again.';
          formError.hidden = false;
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAlertForms);
} else {
  initAlertForms();
}
