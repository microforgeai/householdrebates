const menu = document.querySelector<HTMLDetailsElement>('details[data-mobile-menu]');

if (menu) {
  const summary = menu.querySelector<HTMLElement>('summary');
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && menu.open) {
      menu.open = false;
      summary?.focus();
    }
  });
  document.addEventListener('click', (ev) => {
    if (menu.open && ev.target instanceof Node && !menu.contains(ev.target)) {
      menu.open = false;
    }
  });
}

function openHashTarget(): void {
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return;
  let id = '';
  try {
    id = decodeURIComponent(hash.slice(1));
  } catch {
    return;
  }
  const el = document.getElementById(id);
  if (el instanceof HTMLDetailsElement) {
    el.open = true;
  } else {
    const parentDetails = el?.closest('details');
    if (parentDetails) parentDetails.open = true;
  }
}

openHashTarget();
window.addEventListener('hashchange', openHashTarget);
