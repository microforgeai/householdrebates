import { evaluateGasExitSelection, type GasApplianceKey } from '../lib/tools';

function initGasExitPlanner() {
  const root = document.querySelector<HTMLElement>('[data-gas-planner-root]');
  if (!root) return;

  const figEl = root.querySelector<HTMLScriptElement>('#figures');
  if (figEl?.textContent) {
    try {
      JSON.parse(figEl.textContent);
    } catch {
      // Ignore malformed JSON fallback
    }
  }

  const checkboxes = Array.from(root.querySelectorAll<HTMLInputElement>('[data-planner-checkbox]'));
  const stepCards = Array.from(root.querySelectorAll<HTMLElement>('[data-planner-step]'));
  const abolishBox = root.querySelector<HTMLElement>('[data-planner-abolishment]');
  const emptyBox = root.querySelector<HTMLElement>('[data-planner-empty]');

  function sync() {
    const selected = checkboxes
      .filter((c) => c.checked)
      .map((c) => c.value as GasApplianceKey);
    const result = evaluateGasExitSelection(selected);
    const activeKeys = new Set(result.activeSteps.map((s) => s.key));

    for (const card of stepCards) {
      const k = card.dataset.plannerStep as GasApplianceKey;
      card.hidden = !activeKeys.has(k);
    }

    if (abolishBox) {
      abolishBox.hidden = !result.showAbolishment;
    }
    if (emptyBox) {
      emptyBox.hidden = result.activeSteps.length > 0;
    }
  }

  for (const cb of checkboxes) {
    cb.addEventListener('change', sync);
  }

  sync();
}

initGasExitPlanner();
