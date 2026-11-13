import { resolveRunningCostScenario } from '../lib/tools';

function initRunningCostsPicker() {
  const root = document.querySelector<HTMLElement>('[data-running-costs-root]');
  if (!root) return;

  const figEl = root.querySelector<HTMLScriptElement>('#figures');
  if (figEl?.textContent) {
    try {
      JSON.parse(figEl.textContent);
    } catch {
      // Ignore malformed JSON fallback
    }
  }

  const radios = Array.from(root.querySelectorAll<HTMLInputElement>('[data-picker-radio]'));
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-scenario-panel]'));

  function sync() {
    const checked = radios.find((r) => r.checked)?.value ?? 'hot-water';
    const resolved = resolveRunningCostScenario(checked);
    for (const panel of panels) {
      panel.hidden = panel.dataset.scenarioPanel !== resolved.key;
    }
  }

  for (const radio of radios) {
    radio.addEventListener('change', sync);
  }

  sync();
}

initRunningCostsPicker();
