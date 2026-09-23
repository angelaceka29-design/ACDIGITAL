import { clamp, onScrollFrame, reducedMotion } from './utils.js';

export function initReveal() {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  if (reducedMotion() || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
  );
  items.forEach((el) => observer.observe(el));

  // Navigation clavier : un élément focalisé doit être visible immédiatement
  document.addEventListener('focusin', (event) => {
    const host = event.target.closest('[data-reveal]:not(.is-in)');
    if (!host) return;
    host.style.transition = 'none';
    host.classList.add('is-in');
    observer.unobserve(host);
    requestAnimationFrame(() => host.style.removeProperty('transition'));
  });
}

/* Grande phrase qui « s’allume » mot à mot en fonction du scroll. */
export function initScrollWords() {
  document.querySelectorAll('[data-scroll-words]').forEach((el) => {
    const text = el.textContent.trim().replace(/\s+/g, ' ');
    el.textContent = '';

    const srText = document.createElement('span');
    srText.className = 'visually-hidden';
    srText.textContent = text;

    const visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    const words = text.split(' ').map((word, index, all) => {
      const span = document.createElement('span');
      span.className = 'sw';
      span.textContent = word;
      visual.appendChild(span);
      if (index < all.length - 1) {
        // Une phrase par ligne pour un rythme éditorial maîtrisé
        visual.appendChild(/[.!?]$/.test(word) ? document.createElement('br') : document.createTextNode(' '));
      }
      return span;
    });
    el.append(srText, visual);

    if (reducedMotion()) {
      words.forEach((w) => w.style.setProperty('--o', '1'));
      return;
    }

    let lastLit = -1;
    onScrollFrame(() => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.bottom < -vh || rect.top > vh * 2) return;
      const progress = clamp((vh * 0.85 - rect.top) / (vh * 0.55 + rect.height * 0.5), 0, 1);
      const lit = progress * words.length;
      const key = Math.round(lit * 10);
      if (key === lastLit) return;
      lastLit = key;
      words.forEach((w, i) => w.style.setProperty('--o', clamp(lit - i, 0, 1).toFixed(2)));
    });
  });
}
