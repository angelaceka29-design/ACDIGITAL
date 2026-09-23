import { onScrollFrame, reducedMotion, scrollToTarget } from './utils.js';

function sameDocumentTarget(link) {
  const url = new URL(link.href, window.location.href);
  if (url.pathname !== window.location.pathname || !url.hash) return null;
  return document.getElementById(decodeURIComponent(url.hash.slice(1)));
}

export function initNav() {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return;

  let lastY = window.scrollY;
  onScrollFrame((y) => {
    nav.classList.toggle('is-scrolled', y > 40);
    const goingDown = y > lastY + 4;
    const goingUp = y < lastY - 4;
    const hasFocus = nav.contains(document.activeElement);
    if (goingDown && y > window.innerHeight * 0.6 && !hasFocus) nav.classList.add('is-hidden');
    else if (goingUp || y < 80) nav.classList.remove('is-hidden');
    if (goingDown || goingUp) lastY = y;
  });
  nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'));

  // Lien actif selon la section visible
  const links = [...nav.querySelectorAll('[data-nav-link]')];
  const sections = links
    .map((link) => document.getElementById(link.dataset.navLink))
    .filter(Boolean);
  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          const active = link.dataset.navLink === entry.target.id;
          link.classList.toggle('is-active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  sections.forEach((section) => observer.observe(section));
}

export function initMenu() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  if (!toggle || !menu) return;

  const root = document.documentElement;
  const label = toggle.querySelector('[data-menu-label]');
  const outside = [document.querySelector('main'), document.querySelector('footer')].filter(Boolean);
  let isOpen = false;
  let closeTimer = 0;

  const focusables = () =>
    [...menu.querySelectorAll('a[href], button:not([disabled])')].filter((el) => el.offsetParent !== null);

  function open() {
    if (isOpen) return;
    isOpen = true;
    window.clearTimeout(closeTimer);
    const rect = toggle.getBoundingClientRect();
    menu.style.setProperty('--mx', `${rect.left + rect.width / 2}px`);
    menu.style.setProperty('--my', `${rect.top + rect.height / 2}px`);
    menu.hidden = false;
    // force le reflow pour que la transition démarre depuis l’état fermé
    void menu.offsetWidth;
    menu.classList.add('is-open');
    root.classList.add('menu-open');
    toggle.setAttribute('aria-expanded', 'true');
    if (label) label.textContent = 'Fermer le menu';
    outside.forEach((el) => el.setAttribute('inert', ''));
    window.setTimeout(() => focusables()[0]?.focus(), reducedMotion() ? 0 : 250);
  }

  function close({ restoreFocus = true } = {}) {
    if (!isOpen) return;
    isOpen = false;
    menu.classList.remove('is-open');
    root.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    if (label) label.textContent = 'Ouvrir le menu';
    outside.forEach((el) => el.removeAttribute('inert'));
    closeTimer = window.setTimeout(() => {
      menu.hidden = true;
    }, reducedMotion() ? 0 : 650);
    if (restoreFocus) toggle.focus();
  }

  toggle.addEventListener('click', () => (isOpen ? close() : open()));

  menu.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || link.dataset.social) return;
    const target = sameDocumentTarget(link);
    close({ restoreFocus: false });
    if (target) {
      event.preventDefault();
      history.pushState(null, '', `#${target.id}`);
      scrollToTarget(target, { focus: true });
    }
  });

  document.addEventListener('keydown', (event) => {
    if (!isOpen) return;
    if (event.key === 'Escape') {
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    // piège de focus : menu + bouton de fermeture
    const items = [toggle, ...focusables()];
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => {
    if (e.matches) close({ restoreFocus: false });
  });
}

/* Ancres internes : défilement doux + focus déplacé sur la cible (clavier / lecteurs d’écran). */
export function initAnchors() {
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
    const link = event.target.closest('a[href*="#"]');
    if (!link || link.closest('[data-menu]') || link.dataset.social || link.hasAttribute('data-focus-form')) return;
    const target = sameDocumentTarget(link);
    if (!target) return;
    event.preventDefault();
    if (target.id === 'contenu') history.pushState(null, '', window.location.pathname);
    else history.pushState(null, '', `#${target.id}`);
    scrollToTarget(target, { focus: true });
  });
}
