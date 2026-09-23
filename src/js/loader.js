import { session } from './utils.js';

const LOADER_KEY = 'acds:intro';
const COUNT_DURATION = 1500;
const LEAVE_AT = 1650;
const HERO_AT = 1800;
const REMOVE_AT = 2450;

function splitLetters(el) {
  const text = el.textContent;
  el.textContent = '';
  [...text].forEach((char, index) => {
    const span = document.createElement('span');
    span.className = 'loader__letter';
    span.style.setProperty('--l', index);
    span.textContent = char === ' ' ? '\u00a0' : char;
    el.appendChild(span);
  });
}

/**
 * Lance le loader si le script critique du <head> l’a demandé (1re visite, pas de reduced-motion).
 * Résout la promesse au moment où le hero doit commencer son entrée.
 */
export function initLoader() {
  const root = document.documentElement;
  const loader = document.querySelector('[data-loader]');

  if (!loader || !root.classList.contains('has-loader')) {
    loader?.remove();
    return Promise.resolve();
  }

  const counter = loader.querySelector('[data-loader-count]');
  const name = loader.querySelector('[data-loader-name]');
  if (name) splitLetters(name);

  return new Promise((resolve) => {
    const start = performance.now();
    let last = -1;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / COUNT_DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(eased * 100);
      if (value !== last && counter) {
        counter.textContent = String(value);
        last = value;
      }
      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(() => {
      loader.classList.add('is-running');
      requestAnimationFrame(tick);
    });

    window.setTimeout(() => loader.classList.add('is-leaving'), LEAVE_AT);
    window.setTimeout(() => {
      root.classList.remove('has-loader');
      resolve();
    }, HERO_AT);
    window.setTimeout(() => {
      loader.remove();
      session.set(LOADER_KEY, '1');
    }, REMOVE_AT);
  });
}
