import { assess, type CheckerAnswers } from '../lib/eligibility';
import { formatFigureAmount, type FigureData } from '../lib/figures';
import { VIC_ELIGIBILITY_RULES } from '../data/eligibility/vic-rules';

const STORAGE_KEY = 'hr_checker_prefill_v1';

interface ClientFigureData extends FigureData {
  sourceUrl?: string;
  sourceTitle?: string;
}

function initEligibilityChecker(): void {
  const roots = document.querySelectorAll<HTMLElement>('[data-checker-root]');
  if (roots.length === 0) return;

  for (const root of roots) {
    const rawFigures = root.getAttribute('data-figures');
    const figures: ClientFigureData[] = rawFigures ? JSON.parse(rawFigures) : [];

    const form = root.querySelector<HTMLFormElement>('[data-checker-form]');
    const output = root.querySelector<HTMLElement>('[data-checker-output]');
    const upgradeSel = root.querySelector<HTMLSelectElement>('[data-chk-upgrade]');
    const hcGroup = root.querySelector<HTMLElement>('[data-chk-hc-group]');
    const hwGroup = root.querySelector<HTMLElement>('[data-chk-hw-group]');

    if (!form || !output || !upgradeSel || !hcGroup || !hwGroup) continue;

    const toggleQuestionGroups = () => {
      const val = upgradeSel.value;
      hcGroup.hidden = !(val === 'rcac' || val === 'both');
      hwGroup.hidden = !(val === 'hotwater' || val === 'both');
    };

    upgradeSel.addEventListener('change', toggleQuestionGroups);
    toggleQuestionGroups();

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);

      const answers: CheckerAnswers = {
        q1State: (fd.get('q1State') as CheckerAnswers['q1State']) || 'vic',
        q2Upgrade: (fd.get('q2Upgrade') as CheckerAnswers['q2Upgrade']) || 'rcac',
        q3WorkStage: (fd.get('q3WorkStage') as CheckerAnswers['q3WorkStage']) || 'no',
        q4PropertyType: (fd.get('q4PropertyType') as CheckerAnswers['q4PropertyType']) || 'home',
        q5Tenure: (fd.get('q5Tenure') as CheckerAnswers['q5Tenure']) || 'own',
        q6BuildingOver2Years:
          (fd.get('q6BuildingOver2Years') as CheckerAnswers['q6BuildingOver2Years']) || 'yes',
        q7aCurrentHeating:
          (fd.get('q7aCurrentHeating') as CheckerAnswers['q7aCurrentHeating']) || 'room-gas',
        q7bTargetHeating:
          (fd.get('q7bTargetHeating') as CheckerAnswers['q7bTargetHeating']) || 'split',
        q8aCurrentHotWater:
          (fd.get('q8aCurrentHotWater') as CheckerAnswers['q8aCurrentHotWater']) || 'mains-gas',
        q8bPreviousHotWaterUpgrades:
          (fd.get('q8bPreviousHotWaterUpgrades') as CheckerAnswers['q8bPreviousHotWaterUpgrades']) ||
          '0',
      };

      const result = assess(answers, VIC_ELIGIBILITY_RULES, figures);

      // Save to sessionStorage for lead form pre-fill (no cookies)
      try {
        window.sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            activity: answers.q2Upgrade === 'hotwater' ? 'hotwater' : 'rcac',
            currentSystem:
              answers.q2Upgrade === 'hotwater'
                ? answers.q8aCurrentHotWater
                : answers.q7aCurrentHeating,
            ownership: answers.q5Tenure,
            buildingOver2Years: answers.q6BuildingOver2Years,
            workStarted:
              answers.q3WorkStage === 'bought_not_installed' ? 'bought_not_installed' : 'no',
            productBought: result.productBoughtFlag ? '1' : '0',
          }),
        );
      } catch {
        // Ignore storage errors
      }

      renderResult(output, result);
      output.hidden = false;
    });
  }
}

function renderResult(
  container: HTMLElement,
  result: ReturnType<typeof assess>,
): void {
  container.innerHTML = '';

  const titleEl = document.createElement('h3');
  titleEl.textContent = result.headline;
  container.appendChild(titleEl);

  if (result.cautionBanner) {
    const cautionEl = document.createElement('p');
    cautionEl.className = 'callout callout--caution';
    cautionEl.textContent = result.cautionBanner;
    container.appendChild(cautionEl);
  }

  const summaryEl = document.createElement('p');
  summaryEl.textContent = result.summary;
  container.appendChild(summaryEl);

  if (result.externalLink) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = result.externalLink.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = `${result.externalLink.label} ↗`;
    p.appendChild(a);
    container.appendChild(p);
  }

  for (const item of result.items) {
    if (item.matchedFigures.length > 0) {
      const tableWrap = document.createElement('div');
      tableWrap.className = 'figure-table-wrap';
      const table = document.createElement('table');
      table.className = 'figure-table';

      const thead = document.createElement('thead');
      thead.innerHTML =
        '<tr><th scope="col">Matching VEU scenario</th><th scope="col">Indicative discount</th></tr>';
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      for (const fig of item.matchedFigures as ClientFigureData[]) {
        const tr = document.createElement('tr');
        const tdScenario = document.createElement('td');
        tdScenario.textContent = fig.scenario;

        const metaSpan = document.createElement('div');
        metaSpan.style.fontSize = 'var(--text-xs)';
        metaSpan.style.color = 'var(--text-secondary)';
        metaSpan.textContent = `Checked on ${String(fig.checkedOn)} · `;
        if (fig.sourceUrl) {
          const srcLink = document.createElement('a');
          srcLink.href = fig.sourceUrl;
          srcLink.target = '_blank';
          srcLink.rel = 'noopener noreferrer';
          srcLink.textContent = fig.sourceTitle || 'Energy Victoria ↗';
          metaSpan.appendChild(srcLink);
        }
        tdScenario.appendChild(metaSpan);

        const tdAmount = document.createElement('td');
        tdAmount.className = 'amount-cell';
        tdAmount.textContent = formatFigureAmount(fig);

        tr.appendChild(tdScenario);
        tr.appendChild(tdAmount);
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      tableWrap.appendChild(table);
      container.appendChild(tableWrap);
    }

    if (item.notes.length > 0) {
      const ul = document.createElement('ul');
      for (const note of item.notes) {
        const li = document.createElement('li');
        li.textContent = note;
        ul.appendChild(li);
      }
      container.appendChild(ul);
    }
  }

  if (result.sharedNotes.length > 0) {
    const ul = document.createElement('ul');
    for (const note of result.sharedNotes) {
      const li = document.createElement('li');
      li.textContent = note;
      ul.appendChild(li);
    }
    container.appendChild(ul);
  }

  const discEl = document.createElement('p');
  discEl.style.fontSize = 'var(--text-xs)';
  discEl.style.color = 'var(--text-secondary)';
  discEl.style.marginBottom = '0';
  discEl.textContent = result.disclaimer;
  container.appendChild(discEl);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEligibilityChecker);
} else {
  initEligibilityChecker();
}
