import { lerp, mqFinePointer, reducedMotion } from './utils.js';

const TEXT_FIELDS = 'input:not([type="checkbox"]):not([type="radio"]), textarea, select';

export function initCursor() {
  const cursor = document.querySelector('[data-cursor-root]');
  if (!cursor || !mqFinePointer.matches || reducedMotion()) {
    cursor?.remove();
    return;
  }

  const root = document.documentElement;
  const dot = cursor.querySelector('.cursor__dot');
  const ring = cursor.querySelector('.cursor__ring');
  const pos = { x: -100, y: -100 };
  const ringPos = { x: -100, y: -100 };
  let raf = 0;
  let visible = false;

  root.classList.add('has-cursor');

  const render = () => {
    ringPos.x = lerp(ringPos.x, pos.x, 0.2);
    ringPos.y = lerp(ringPos.y, pos.y, 0.2);
    dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
    if (Math.abs(ringPos.x - pos.x) > 0.1 || Math.abs(ringPos.y - pos.y) > 0.1) raf = requestAnimationFrame(render);
    else raf = 0;
  };

  window.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse') return;
      pos.x = event.clientX;
      pos.y = event.clientY;
      if (!visible) {
        visible = true;
        ringPos.x = pos.x;
        ringPos.y = pos.y;
        cursor.classList.add('is-visible');
      }
      if (!raf) raf = requestAnimationFrame(render);
    },
    { passive: true },
  );

  document.addEventListener('pointerleave', () => {
    visible = false;
    cursor.classList.remove('is-visible');
  });

  document.addEventListener('pointerover', (event) => {
    const target = event.target;
    const view = target.closest('[data-cursor="view"]');
    const field = target.closest(TEXT_FIELDS);
    const interactive = target.closest('a, button, label, [role="button"], summary');
    cursor.classList.toggle('is-view', Boolean(view));
    cursor.classList.toggle('is-link', Boolean(interactive) && !view);
    cursor.classList.toggle('is-hidden', Boolean(field));
  });

  document.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
  document.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
}

export function initMagnetic() {
  if (!mqFinePointer.matches || reducedMotion()) return;
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (event.clientY - rect.top - rect.height / 2) / rect.height;
      el.style.setProperty('--mx', `${(x * 10).toFixed(2)}px`);
      el.style.setProperty('--my', `${(y * 8).toFixed(2)}px`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--mx', '0px');
      el.style.setProperty('--my', '0px');
    });
  });
}

/* Rideau entre les pages du site (accueil ↔ pages légales) */
export function initPageTransitions() {
  const root = document.documentElement;
  window.addEventListener('pageshow', () => root.classList.remove('is-leaving'));
  if (reducedMotion()) return;

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
    event.preventDefault();
    root.classList.add('is-leaving');
    window.setTimeout(() => {
      window.location.href = url.href;
    }, 420);
  });
}
