export const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
export const mqFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
export const mqDesktop = window.matchMedia('(min-width: 1024px)');

export const reducedMotion = () => mqReduce.matches;
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const lerp = (a, b, t) => a + (b - a) * t;

/* Une seule boucle rAF pour tout ce qui dépend du scroll : pas de listeners dispersés. */
const scrollSubscribers = new Set();
let scrollTicking = false;

function flushScroll() {
  scrollTicking = false;
  const y = window.scrollY;
  scrollSubscribers.forEach((fn) => fn(y));
}

function requestScrollFlush() {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(flushScroll);
}

window.addEventListener('scroll', requestScrollFlush, { passive: true });
window.addEventListener('resize', requestScrollFlush, { passive: true });

export function onScrollFrame(fn) {
  scrollSubscribers.add(fn);
  fn(window.scrollY);
  return () => scrollSubscribers.delete(fn);
}

export const session = {
  get(key) {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      /* stockage indisponible (navigation privée stricte) : on ignore */
    }
  },
};

export function getConfig() {
  return window.AC_CONFIG || {};
}

export function isConfigured(value) {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  return v !== '' && !/^\[.*\]$/.test(v);
}

export function scrollToTarget(target, { focus = false } = {}) {
  if (!target) return;
  target.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  if (focus) {
    if (!target.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) {
      target.setAttribute('tabindex', '-1');
    }
    target.focus({ preventScroll: true });
  }
}
