import { h, render } from 'preact';
import { CheckerApp, type CheckerBootstrapPayload } from './CheckerApp';

function mountChecker() {
  const mountEl = document.querySelector<HTMLElement>('[data-checker-island]');
  const bootstrapEl = document.getElementById('checker-bootstrap');
  if (!mountEl || !bootstrapEl?.textContent) return;

  const bootstrap = JSON.parse(bootstrapEl.textContent) as CheckerBootstrapPayload;
  mountEl.innerHTML = '';
  render(h(CheckerApp, { bootstrap }), mountEl);
}

mountChecker();
