import {
  assess,
  decodeCompactPostcodes,
  type CheckerActivity,
  type CheckerAnswers,
  type ResultLinkKey,
} from '../lib/eligibility';
import { formatFigureAmount, type FigureData } from '../lib/figures';
import { VIC_ELIGIBILITY_RULES } from '../data/eligibility/vic-rules';

const STORAGE_KEY = 'hr_checker_prefill_v1';

interface ClientFigureData extends FigureData {
  sourceUrl?: string;
  sourceTitle?: string;
}

interface ResolvedLinkInfo {
  internal?: string;
  externalUrl: string;
  externalLabel: string;
}

function readJsonScript<T>(root: HTMLElement, id: string, fallback: T): T {
  const el = root.querySelector<HTMLScriptElement>(`script#${id}`) ?? document.getElementById(id);
  if (!el || !el.textContent) return fallback;
  try {
    return JSON.parse(el.textContent) as T;
  } catch {
    return fallback;
  }
}

function initEligibilityChecker(): void {
  const roots = document.querySelectorAll<HTMLElement>('[data-checker-root]');
  if (roots.length === 0) return;

  for (const root of roots) {
    const figures = readJsonScript<ClientFigureData[]>(root, 'figures', []);
    const compactPostcodes = readJsonScript<Record<string, string>>(root, 'veu-postcodes', {});
    const linkMap = readJsonScript<Record<string, ResolvedLinkInfo>>(root, 'checker-links', {});
    const postcodes = decodeCompactPostcodes(compactPostcodes);

    const form = root.querySelector<HTMLFormElement>('[data-checker-form]');
    const output = root.querySelector<HTMLElement>('[data-checker-output]');
    const progressEl = root.querySelector<HTMLElement>('[data-checker-progress]');
    const activityBoxes = Array.from(
      root.querySelectorAll<HTMLInputElement>('input[data-chk-activity]'),
    );
    const q2Error = root.querySelector<HTMLElement>('#chk-q2-error');
    const ageGroup = root.querySelector<HTMLElement>('[data-chk-age-group]');
    const postcodeInput = root.querySelector<HTMLInputElement>('#chk-q9a');
    const postcodeError = root.querySelector<HTMLElement>('#chk-q9a-error');

    if (!form || !output) continue;

    const getSelectedActivities = (): CheckerActivity[] =>
      activityBoxes
        .filter((cb) => cb.checked)
        .map((cb) => cb.value as CheckerActivity);

    const updateVisibilityAndProgress = () => {
      const selected = new Set(getSelectedActivities());
      if (q2Error && selected.size > 0) {
        q2Error.hidden = true;
      }

      const groups = root.querySelectorAll<HTMLElement>('[data-chk-group]');
      for (const grp of groups) {
        const act = grp.getAttribute('data-chk-group') as CheckerActivity;
        grp.hidden = !selected.has(act);
      }

      if (ageGroup) {
        const needsAge =
          selected.has('rcac') || selected.has('hotwater') || selected.has('induction');
        ageGroup.hidden = !needsAge;
      }

      if (progressEl) {
        const allQuestionItems = Array.from(
          form.querySelectorAll<HTMLElement>('[data-question-item]'),
        );
        const visibleCount = allQuestionItems.filter(
          (el) => !el.hidden && !el.closest('[hidden]'),
        ).length;
        progressEl.textContent = `Showing ${visibleCount} question${visibleCount === 1 ? '' : 's'} for your selected upgrades.`;
      }
    };

    for (const cb of activityBoxes) {
      cb.addEventListener('change', updateVisibilityAndProgress);
    }

    if (postcodeInput && postcodeError) {
      postcodeInput.addEventListener('input', () => {
        if (/^3\d{3}$/.test(postcodeInput.value.trim())) {
          postcodeError.hidden = true;
          postcodeInput.removeAttribute('aria-invalid');
        }
      });
    }

    updateVisibilityAndProgress();

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const selectedActivities = getSelectedActivities();

      if (selectedActivities.length === 0) {
        if (q2Error) q2Error.hidden = false;
        activityBoxes[0]?.focus();
        return;
      }

      if (selectedActivities.includes('insulation') && postcodeInput && postcodeError) {
        const pcVal = postcodeInput.value.trim();
        if (!/^3\d{3}$/.test(pcVal)) {
          postcodeError.hidden = false;
          postcodeInput.setAttribute('aria-invalid', 'true');
          postcodeInput.focus();
          return;
        }
        postcodeError.hidden = true;
        postcodeInput.removeAttribute('aria-invalid');
      }

      const fd = new FormData(form);

      const answers: CheckerAnswers = {
        q1State: (fd.get('q1State') as CheckerAnswers['q1State']) || 'vic',
        q2Activities: selectedActivities,
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
        q9aPostcode: String(fd.get('q9aPostcode') ?? '').trim(),
        q9bCeilingNow:
          (fd.get('q9bCeilingNow') as CheckerAnswers['q9bCeilingNow']) || 'none',
        q9cUnsafeCeiling:
          (fd.get('q9cUnsafeCeiling') as CheckerAnswers['q9cUnsafeCeiling']) || 'no',
        q10aCooktopNow:
          (fd.get('q10aCooktopNow') as CheckerAnswers['q10aCooktopNow']) || 'gas',
        q10bClaimedBefore:
          (fd.get('q10bClaimedBefore') as CheckerAnswers['q10bClaimedBefore']) || 'no',
        q10cCooktopTarget:
          (fd.get('q10cCooktopTarget') as CheckerAnswers['q10cCooktopTarget']) ||
          'builtin_or_freestanding',
        q11aHomeType:
          (fd.get('q11aHomeType') as CheckerAnswers['q11aHomeType']) || 'house',
        q11bOpenFluedGas:
          (fd.get('q11bOpenFluedGas') as CheckerAnswers['q11bOpenFluedGas']) || 'no',
      };

      const result = assess(answers, VIC_ELIGIBILITY_RULES, figures, postcodes);

      // Save to sessionStorage for lead form pre-fill only if rcac or hotwater is selected (no cookies)
      const leadActivity = selectedActivities.find((a) => a === 'rcac' || a === 'hotwater');
      if (leadActivity) {
        try {
          window.sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              activity: leadActivity,
              currentSystem:
                leadActivity === 'hotwater'
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
      }

      renderResult(output, result, linkMap);
      output.hidden = false;
    });
  }
}

function renderResult(
  container: HTMLElement,
  result: ReturnType<typeof assess>,
  linkMap: Record<string, ResolvedLinkInfo>,
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
    if (result.externalLink.url.startsWith('http')) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = `${result.externalLink.label} ↗`;
    } else {
      a.textContent = result.externalLink.label;
    }
    p.appendChild(a);
    container.appendChild(p);
  }

  for (const item of result.items) {
    const sectionEl = document.createElement('div');
    sectionEl.setAttribute('data-result-activity', item.activity);
    sectionEl.style.marginTop = '1rem';

    const h4 = document.createElement('h4');
    h4.textContent = item.headline;
    sectionEl.appendChild(h4);

    if (item.figureCaption) {
      const cap = document.createElement('p');
      cap.style.fontSize = 'var(--text-sm)';
      cap.style.color = 'var(--text-secondary)';
      cap.textContent = item.figureCaption;
      sectionEl.appendChild(cap);
    }

    if (item.matchedFigures.length > 0) {
      const highlightedSet = new Set(item.highlightedFigureIds);
      const tableWrap = document.createElement('div');
      tableWrap.className = 'figure-table-wrap';
      const table = document.createElement('table');
      table.className = 'figure-table';

      const thead = document.createElement('thead');
      thead.innerHTML =
        '<tr><th scope="col">Matching VEU scenario</th><th scope="col">Indicative amount</th></tr>';
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      for (const fig of item.matchedFigures as ClientFigureData[]) {
        const tr = document.createElement('tr');
        tr.setAttribute('data-figure', fig.id);
        if (highlightedSet.has(fig.id)) {
          tr.setAttribute('data-highlighted', 'true');
          tr.style.fontWeight = '600';
        }

        const tdScenario = document.createElement('td');
        tdScenario.textContent = fig.scenario;
        if (highlightedSet.has(fig.id)) {
          const badge = document.createElement('span');
          badge.textContent = ' (matches postcode zone)';
          badge.style.fontSize = 'var(--text-xs)';
          tdScenario.appendChild(badge);
        }

        const metaSpan = document.createElement('div');
        metaSpan.style.fontSize = 'var(--text-xs)';
        metaSpan.style.color = 'var(--text-secondary)';
        metaSpan.textContent = `Checked on ${String(fig.checkedOn)} · `;
        if (fig.sourceUrl) {
          const srcLink = document.createElement('a');
          srcLink.href = fig.sourceUrl;
          srcLink.target = '_blank';
          srcLink.rel = 'noopener noreferrer';
          srcLink.textContent = fig.sourceTitle || 'Official source ↗';
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
      sectionEl.appendChild(tableWrap);
    }

    if (item.noteItems.length > 0) {
      const ul = document.createElement('ul');
      for (const note of item.noteItems) {
        const li = document.createElement('li');
        li.setAttribute('data-note-id', note.id);
        li.appendChild(document.createTextNode(note.text));

        if (note.figures.length > 0) {
          const subUl = document.createElement('ul');
          for (const fig of note.figures as ClientFigureData[]) {
            const subLi = document.createElement('li');
            subLi.setAttribute('data-figure', fig.id);
            subLi.textContent = `${fig.scenario}: ${formatFigureAmount(fig)} (checked ${String(fig.checkedOn)})`;
            subUl.appendChild(subLi);
          }
          li.appendChild(subUl);
        }
        ul.appendChild(li);
      }
      sectionEl.appendChild(ul);
    }

    const linkEls = renderLinks(item.links, linkMap);
    if (linkEls) sectionEl.appendChild(linkEls);

    container.appendChild(sectionEl);
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

function renderLinks(
  keys: ResultLinkKey[],
  linkMap: Record<string, ResolvedLinkInfo>,
): HTMLElement | null {
  const unique = [...new Set(keys)].map((k) => linkMap[k]).filter(Boolean);
  if (unique.length === 0) return null;

  const p = document.createElement('p');
  p.style.fontSize = 'var(--text-sm)';
  p.appendChild(document.createTextNode('Read more: '));

  unique.forEach((info, idx) => {
    if (idx > 0) p.appendChild(document.createTextNode(' · '));
    const a = document.createElement('a');
    if (info.internal) {
      a.href = info.internal;
      a.textContent = info.internal;
    } else {
      a.href = info.externalUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = `${info.externalLabel} ↗`;
    }
    p.appendChild(a);
  });

  return p;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEligibilityChecker);
} else {
  initEligibilityChecker();
}
