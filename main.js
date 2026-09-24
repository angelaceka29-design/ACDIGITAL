/*
 * ─────────────────────────────────────────────────────────────
 *  AC DIGITAL STUDIO — CONFIGURATION DU SITE
 *  Modifiez UNIQUEMENT ce bloc pour brancher vos liens.
 *  Toute valeur laissée entre crochets [ ] est considérée comme
 *  « non configurée » : le lien reste inactif et un message
 *  discret l’indique au visiteur, sans erreur ni lien cassé.
 * ─────────────────────────────────────────────────────────────
 */
window.AC_CONFIG = {
  // Coordonnées
  EMAIL: '[EMAIL]', //            ex. 'bonjour@acdigitalstudio.fr'
  TELEPHONE: '[TELEPHONE]', //    ex. '+33 6 00 00 00 00'

  // Réseaux sociaux (URL complètes)
  INSTAGRAM_URL: '[INSTAGRAM_URL]', // ex. 'https://www.instagram.com/votrecompte'
  FACEBOOK_URL: '[FACEBOOK_URL]', //   ex. 'https://www.facebook.com/votrepage'
  SNAPCHAT_URL: '[SNAPCHAT_URL]', //   ex. 'https://www.snapchat.com/add/votrecompte'
  WHATSAPP_URL: '[WHATSAPP_URL]', //   ex. 'https://wa.me/33600000000' (format international, sans + ni espaces)
  WHATSAPP_MESSAGE: 'Bonjour AC Digital Studio, j’aimerais vous parler d’un projet.',

  // Formulaire : URL d’un service d’envoi (Formspree, Getform, Basin, votre API…).
  // Laisser vide = le formulaire ouvre le logiciel de messagerie du visiteur vers EMAIL.
  FORM_ENDPOINT: '',

  // Fourchettes proposées dans le champ « Budget » (modifiables librement)
  BUDGET_OPTIONS: [
    'À définir ensemble',
    'Moins de 1 000 €',
    '1 000 € à 3 000 €',
    '3 000 € à 6 000 €',
    'Plus de 6 000 €',
  ],
};

/* ═══════════════════════════════════════════════
   APPLICATION (ne pas modifier)
   ═══════════════════════════════════════════════ */
(() => {
'use strict';
/* utils.js */
const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const mqFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const mqDesktop = window.matchMedia('(min-width: 1024px)');

const reducedMotion = () => mqReduce.matches;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;

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

function onScrollFrame(fn) {
  scrollSubscribers.add(fn);
  fn(window.scrollY);
  return () => scrollSubscribers.delete(fn);
}

const session = {
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

function getConfig() {
  return window.AC_CONFIG || {};
}

function isConfigured(value) {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  return v !== '' && !/^\[.*\]$/.test(v);
}

function scrollToTarget(target, { focus = false } = {}) {
  if (!target) return;
  target.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  if (focus) {
    if (!target.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) {
      target.setAttribute('tabindex', '-1');
    }
    target.focus({ preventScroll: true });
  }
}

/* cubes.js */
/**
 * Champ de cubes isométriques animé (canvas 2D).
 * - Sert de fond génératif quand la vidéo du hero n'est pas disponible.
 * - Sert aussi à produire la vidéo/poster de marque (scripts/render-hero.mjs) :
 *   l'animation est parfaitement périodique (PERIOD secondes) pour une boucle sans couture.
 */

const TAU = Math.PI * 2;

const PALETTE = {
  top: [41, 41, 50],
  left: [13, 13, 18],
  right: [23, 23, 30],
  glow: [124, 108, 255],
  cool: [61, 123, 255],
};

function mix(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function rgb(c) {
  return `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
}

function createCubeField(canvas, options = {}) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const cfg = {
    grid: 26,
    period: 8,
    resolution: 1,
    fps: 60,
    interactive: false,
    ...options,
  };

  let width = 0;
  let height = 0;
  let tile = 0;
  let originX = 0;
  let originY = 0;
  let raf = 0;
  let running = false;
  let lastFrame = 0;
  let startTime = 0;
  const focus = { x: 0.62, y: 0.46, tx: 0.62, ty: 0.46 };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(1, rect.width || canvas.width);
    const cssH = Math.max(1, rect.height || canvas.height);
    width = Math.round(cssW * cfg.resolution);
    height = Math.round(cssH * cfg.resolution);
    canvas.width = width;
    canvas.height = height;
    // Le losange de la grille doit contenir tout le rectangle : n·W ≥ w + 2h
    tile = ((width + height * 2) * 1.28) / cfg.grid;
    originX = width / 2;
    originY = height / 2 - ((cfg.grid - 1) * tile) / 4;
  }

  function draw(seconds) {
    const n = cfg.grid;
    const h2 = tile / 2;
    const q = tile / 4;
    const phase = (seconds / cfg.period) * TAU;
    const amp = tile * 1.35;
    const cx = (n - 1) * focus.x;
    const cy = (n - 1) * (1 - focus.y);

    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, width, height);

    // Du fond vers l'avant : somme i + j croissante
    for (let s = 0; s <= (n - 1) * 2; s++) {
      const iStart = Math.max(0, s - (n - 1));
      const iEnd = Math.min(n - 1, s);
      for (let i = iStart; i <= iEnd; i++) {
        const j = s - i;
        const dx = i - cx;
        const dy = j - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ripple = 0.5 + 0.5 * Math.sin(phase - dist * 0.55);
        const sweep = 0.5 + 0.5 * Math.sin(phase * 2 + (i - j) * 0.35);
        const f = ripple * 0.75 + sweep * 0.25;
        const lift = f * f * amp;

        const sx = originX + (i - j) * h2;
        const sy = originY + (i + j) * q - lift;
        const depth = lift + tile * 1.2;

        if (sx + h2 < 0 || sx - h2 > width || sy - q > height || sy + q + depth < 0) continue;

        const glow = Math.pow(f, 7);
        const shade = 0.55 + f * 0.45;
        const base = [PALETTE.top[0] * shade, PALETTE.top[1] * shade, PALETTE.top[2] * shade];
        const top = mix(mix(base, PALETTE.cool, glow * 0.3), PALETTE.glow, glow * 0.8);
        const left = mix(PALETTE.left, PALETTE.glow, glow * 0.16);
        const right = mix(PALETTE.right, PALETTE.cool, glow * 0.1);

        // Face gauche
        ctx.fillStyle = rgb(left);
        ctx.beginPath();
        ctx.moveTo(sx - h2, sy);
        ctx.lineTo(sx, sy + q);
        ctx.lineTo(sx, sy + q + depth);
        ctx.lineTo(sx - h2, sy + depth);
        ctx.closePath();
        ctx.fill();

        // Face droite
        ctx.fillStyle = rgb(right);
        ctx.beginPath();
        ctx.moveTo(sx, sy + q);
        ctx.lineTo(sx + h2, sy);
        ctx.lineTo(sx + h2, sy + depth);
        ctx.lineTo(sx, sy + q + depth);
        ctx.closePath();
        ctx.fill();

        // Face supérieure
        ctx.fillStyle = rgb(top);
        ctx.beginPath();
        ctx.moveTo(sx, sy - q);
        ctx.lineTo(sx + h2, sy);
        ctx.lineTo(sx, sy + q);
        ctx.lineTo(sx - h2, sy);
        ctx.closePath();
        ctx.fill();

        // Arête lumineuse sur les cubes les plus hauts
        if (glow > 0.2) {
          ctx.strokeStyle = `rgba(183,174,255,${(glow - 0.2) * 0.45})`;
          ctx.lineWidth = Math.max(1, tile * 0.012);
          ctx.beginPath();
          ctx.moveTo(sx - h2, sy);
          ctx.lineTo(sx, sy - q);
          ctx.lineTo(sx + h2, sy);
          ctx.stroke();
        }
      }
    }
  }

  function loop(now) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    const minDelta = 1000 / cfg.fps;
    if (now - lastFrame < minDelta - 1) return;
    lastFrame = now;
    focus.x += (focus.tx - focus.x) * 0.04;
    focus.y += (focus.ty - focus.y) * 0.04;
    draw((now - startTime) / 1000);
  }

  function onPointer(event) {
    focus.tx = 0.5 + (event.clientX / window.innerWidth - 0.5) * 0.35;
    focus.ty = 0.5 + (event.clientY / window.innerHeight - 0.5) * 0.35;
  }

  resize();

  return {
    renderAt(seconds) {
      draw(seconds);
    },
    resize() {
      resize();
      if (!running) draw(0);
    },
    start() {
      if (running) return;
      running = true;
      if (!startTime) startTime = performance.now();
      if (cfg.interactive) window.addEventListener('pointermove', onPointer, { passive: true });
      raf = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointer);
    },
    get running() {
      return running;
    },
  };
}

/* loader.js */

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
function initLoader() {
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

/* nav.js */

function sameDocumentTarget(link) {
  const url = new URL(link.href, window.location.href);
  if (url.pathname !== window.location.pathname || !url.hash) return null;
  return document.getElementById(decodeURIComponent(url.hash.slice(1)));
}

function initNav() {
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

function initMenu() {
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
function initAnchors() {
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

/* hero.js */


function canUseVideo() {
  if (reducedMotion()) return false;
  const connection = navigator.connection;
  if (connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || ''))) return false;
  return true;
}

function initHero() {
  const hero = document.querySelector('.hero');
  if (!hero) return { play() {} };

  const video = hero.querySelector('[data-hero-video]');
  const canvas = hero.querySelector('[data-hero-canvas]');
  const content = hero.querySelector('.hero__content');
  let field = null;
  let heroVisible = true;
  let started = false;

  function startCanvas() {
    if (!canvas || field || reducedMotion()) return;
    const small = window.innerWidth < 768;
    // Fond atténué par l’overlay : une résolution interne réduite et 30 i/s suffisent,
    // et laissent le thread principal libre pour un scroll à 60 i/s.
    field = createCubeField(canvas, {
      grid: small ? 16 : 22,
      resolution: small ? 0.5 : 0.55,
      fps: 30,
      interactive: mqFinePointer.matches,
    });
    canvas.classList.add('is-on');
    if (heroVisible) field.start();
    let resizeTimer = 0;
    window.addEventListener('resize', () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => field.resize(), 150);
    });
  }

  function startVideo() {
    if (!video || !canUseVideo()) return false;
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    const webm = video.dataset[mobile ? 'srcMobileWebm' : 'srcDesktopWebm'];
    const mp4 = video.dataset[mobile ? 'srcMobileMp4' : 'srcDesktopMp4'];
    if (!webm && !mp4) return false;

    [
      [webm, 'video/webm'],
      [mp4, 'video/mp4'],
    ].forEach(([src, type]) => {
      if (!src) return;
      const source = document.createElement('source');
      source.src = src;
      source.type = type;
      video.appendChild(source);
    });

    const lastSource = video.querySelector('source:last-of-type');
    lastSource?.addEventListener('error', () => {
      video.remove();
      startCanvas();
    });
    video.addEventListener('playing', () => video.classList.add('is-on'), { once: true });
    video.load();
    video.play().catch(() => {
      // Autoplay refusé (mode économie d’énergie iOS…) : le poster reste affiché.
    });
    return true;
  }

  // Pause des médias quand le hero sort de l’écran (CPU / batterie)
  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    if (!started) return;
    if (field) (heroVisible ? field.start() : field.stop());
    if (video && video.isConnected && video.classList.contains('is-on')) {
      if (heroVisible) video.play().catch(() => {});
      else video.pause();
    }
  }).observe(hero);

  document.addEventListener('visibilitychange', () => {
    if (!field) return;
    if (document.hidden) field.stop();
    else if (heroVisible) field.start();
  });

  // Parallax léger du contenu en sortie de hero
  if (!reducedMotion() && content) {
    onScrollFrame((y) => {
      const h = hero.offsetHeight;
      if (y > h) return;
      const p = y / h;
      content.style.transform = `translate3d(0, ${y * 0.22}px, 0)`;
      content.style.opacity = String(1 - p * 1.1);
    });
  }

  return {
    play() {
      if (started) return;
      started = true;
      if (!startVideo()) startCanvas();
    },
  };
}

/* reveal.js */

function initReveal() {
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
function initScrollWords() {
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

/* sections.js */

/* ── Services : la ligne qui traverse le centre de l’écran devient active ── */
function initServices() {
  const rows = [...document.querySelectorAll('[data-service]')];
  const stage = document.querySelector('[data-services-stage]');
  if (!rows.length) return;

  const indexEl = stage?.querySelector('[data-services-index]');
  const visuals = stage ? [...stage.querySelectorAll('[data-svis]')] : [];
  let current = -1;

  function activate(i) {
    if (i === current) return;
    const previous = current;
    current = i;
    rows.forEach((row, n) => row.classList.toggle('is-active', n === i));
    visuals.forEach((svg, n) => svg.classList.toggle('is-active', n === i));
    if (indexEl) {
      indexEl.classList.remove('is-up', 'is-down');
      void indexEl.offsetWidth;
      indexEl.textContent = String(i + 1).padStart(2, '0');
      if (previous !== -1 && !reducedMotion()) indexEl.classList.add(i > previous ? 'is-up' : 'is-down');
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) activate(rows.indexOf(entry.target));
      });
    },
    { rootMargin: '-48% 0px -48% 0px' },
  );
  rows.forEach((row, i) => {
    observer.observe(row);
    row.addEventListener('pointerenter', () => {
      if (mqDesktop.matches) activate(i);
    });
  });
  activate(0);
}

/* ── Processus : une ligne se remplit au fil du scroll et active chaque étape ── */
function initProcess() {
  const section = document.querySelector('[data-process]');
  if (!section) return;
  const track = section.querySelector('.process__track');
  const fill = section.querySelector('[data-process-fill]');
  const steps = [...section.querySelectorAll('[data-step]')];

  if (reducedMotion()) {
    fill?.style.setProperty('--p', '1');
    steps.forEach((s) => s.classList.add('is-active'));
    return;
  }

  onScrollFrame(() => {
    const rect = track.getBoundingClientRect();
    const vh = window.innerHeight;
    if (rect.bottom < 0 || rect.top > vh) return;
    const progress = clamp((vh * 0.75 - rect.top) / (rect.height + vh * 0.1), 0, 1);
    fill?.style.setProperty('--p', progress.toFixed(3));
    steps.forEach((step, i) => step.classList.toggle('is-active', progress >= i / steps.length + 0.04));
  });
}

/* ── Marquee : pistes dupliquées, vitesse modulée par la vitesse de scroll ── */
function initMarquee() {
  const rows = [...document.querySelectorAll('[data-marquee]')];
  if (!rows.length) return;

  rows.forEach((row) => {
    const track = row.querySelector('.marquee__track');
    if (!track) return;
    const original = track.innerHTML;
    // Au moins 2× la largeur de l’écran pour une boucle sans trou
    let guard = 0;
    while (track.scrollWidth < window.innerWidth * 2 && guard < 6) {
      track.insertAdjacentHTML('beforeend', original);
      guard += 1;
    }
    track.insertAdjacentHTML('beforeend', track.innerHTML);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.target.classList.toggle('is-paused', !entry.isIntersecting));
  });
  rows.forEach((row) => observer.observe(row));

  if (reducedMotion() || !mqDesktop.matches) return;

  const animations = () =>
    rows.flatMap((row) => row.querySelector('.marquee__track')?.getAnimations() ?? []);
  let lastY = window.scrollY;
  let boost = 0;
  let raf = 0;

  const settle = () => {
    boost *= 0.92;
    animations().forEach((anim) => {
      anim.playbackRate = 1 + boost;
    });
    if (boost > 0.01) raf = requestAnimationFrame(settle);
    else raf = 0;
  };

  onScrollFrame((y) => {
    const delta = Math.abs(y - lastY);
    lastY = y;
    boost = Math.min(3, boost + delta * 0.01);
    if (!raf) raf = requestAnimationFrame(settle);
  });
}

/* projects.js */

/*
 * Données des projets. Remplacez les valeurs entre crochets par vos vraies réalisations.
 * media (facultatif) remplace le visuel de présentation :
 *   { type: 'image', src: '/assets/img/projets/mon-projet.avif', alt: 'Description' }
 *   { type: 'video', src: '/assets/video/mon-projet.mp4', poster: '/assets/img/projets/poster.jpg' }
 * gallery (facultatif) : liste d’objets { src, alt } affichés sous la description.
 */
const PROJECTS = [
  {
    id: 'identite',
    category: 'Brand identity',
    title: '[Nom du projet]',
    year: '[Année]',
    client: '[Client]',
    summary: '[Présentation du projet : contexte, problématique du client et objectif de la mission.]',
    approach: '[Démarche : comment le studio a abordé le sujet, les choix créatifs et stratégiques.]',
    deliverables: ['Logo', 'Charte graphique', 'Déclinaisons'],
  },
  {
    id: 'web',
    category: 'Web design',
    title: '[Nom du projet]',
    year: '[Année]',
    client: '[Client]',
    summary: '[Présentation du projet : contexte, problématique du client et objectif de la mission.]',
    approach: '[Démarche : arborescence, parcours utilisateur, direction artistique, développement.]',
    deliverables: ['UI / UX', 'Design responsive', 'Intégration'],
  },
  {
    id: 'social',
    category: 'Social media',
    title: '[Nom du projet]',
    year: '[Année]',
    client: '[Client]',
    summary: '[Présentation du projet : contexte, problématique du client et objectif de la mission.]',
    approach: '[Démarche : ligne éditoriale, gabarits, rythme de publication.]',
    deliverables: ['Posts', 'Stories', 'Gabarits'],
  },
  {
    id: 'print',
    category: 'Print design',
    title: '[Nom du projet]',
    year: '[Année]',
    client: '[Client]',
    summary: '[Présentation du projet : contexte, problématique du client et objectif de la mission.]',
    approach: '[Démarche : hiérarchie de l’information, choix du papier et des finitions.]',
    deliverables: ['Flyer', 'Carte de visite', 'Fichiers d’impression'],
  },
];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function cloneArt(id) {
  const svg = document.querySelector(`[data-project="${id}"] .art`);
  if (!svg) return null;
  const copy = svg.cloneNode(true);
  // Les identifiants de dégradés doivent rester uniques dans le document
  copy.querySelectorAll('[id]').forEach((node) => {
    const oldId = node.id;
    const newId = `${oldId}-sheet`;
    node.id = newId;
    copy.querySelectorAll('*').forEach((el) => {
      ['fill', 'stroke'].forEach((attr) => {
        if (el.getAttribute(attr) === `url(#${oldId})`) el.setAttribute(attr, `url(#${newId})`);
      });
    });
  });
  return copy;
}

function renderMedia(project) {
  const wrap = document.createElement('div');
  wrap.className = 'sheet__media';
  const media = project.media;
  if (media?.type === 'image') {
    const img = document.createElement('img');
    img.src = media.src;
    img.alt = media.alt || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    wrap.appendChild(img);
  } else if (media?.type === 'video') {
    const video = document.createElement('video');
    Object.assign(video, { src: media.src, poster: media.poster || '', muted: true, loop: true, playsInline: true, controls: true });
    wrap.appendChild(video);
  } else {
    const art = cloneArt(project.id);
    if (art) wrap.appendChild(art);
  }
  return wrap;
}

function renderProject(project, index) {
  const total = PROJECTS.length;
  const prev = PROJECTS[(index - 1 + total) % total];
  const next = PROJECTS[(index + 1) % total];
  const gallery = (project.gallery || [])
    .map((g) => `<img src="${escapeHtml(g.src)}" alt="${escapeHtml(g.alt || '')}" loading="lazy" decoding="async">`)
    .join('');

  const fragment = document.createElement('article');
  fragment.className = 'case';
  fragment.innerHTML = `
    <header class="case__head">
      <p class="case__cat">${escapeHtml(project.category)}</p>
      <h2 class="case__title" id="sheet-title">${escapeHtml(project.title)}</h2>
      <dl class="case__facts">
        <div><dt>Client</dt><dd>${escapeHtml(project.client)}</dd></div>
        <div><dt>Année</dt><dd>${escapeHtml(project.year)}</dd></div>
        <div><dt>Livrables</dt><dd>${project.deliverables.map(escapeHtml).join(', ')}</dd></div>
      </dl>
    </header>
    <div class="case__media-slot"></div>
    <div class="case__body">
      <div><h3>Le projet</h3><p>${escapeHtml(project.summary)}</p></div>
      <div><h3>La démarche</h3><p>${escapeHtml(project.approach)}</p></div>
    </div>
    ${gallery ? `<div class="case__gallery">${gallery}</div>` : ''}
    <footer class="case__foot">
      <a class="btn btn--primary" href="#contact" data-sheet-cta><span class="btn__label" data-text="Démarrer un projet similaire">Démarrer un projet similaire</span></a>
      <div class="case__nav">
        <button class="u-link" type="button" data-project-go="${prev.id}">Projet précédent</button>
        <button class="u-link" type="button" data-project-go="${next.id}">Projet suivant</button>
      </div>
    </footer>`;
  fragment.querySelector('.case__media-slot').replaceWith(renderMedia(project));
  return fragment;
}

function initSheet() {
  const dialog = document.querySelector('[data-sheet]');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const content = dialog.querySelector('[data-sheet-content]');
  let closing = false;

  function show(node, label) {
    const heading = node.querySelector('h1[id], h2[id]');
    content.replaceChildren(node);
    dialog.setAttribute('aria-labelledby', heading ? heading.id : 'sheet-title');
    if (label) dialog.dataset.kind = label;
    dialog.querySelector('.sheet__inner').scrollTop = 0;
    if (!dialog.open) {
      dialog.showModal();
      document.documentElement.classList.add('sheet-open');
      requestAnimationFrame(() => dialog.classList.add('is-open'));
    }
    dialog.querySelector('[data-sheet-close]').focus();
  }

  function close() {
    if (!dialog.open || closing) return;
    closing = true;
    dialog.classList.remove('is-open');
    const finish = () => {
      dialog.close();
      closing = false;
      document.documentElement.classList.remove('sheet-open');
      if (window.location.hash.startsWith('#projet-')) history.replaceState(null, '', '#projets');
    };
    if (reducedMotion()) finish();
    else window.setTimeout(finish, 420);
  }

  function openProject(id) {
    const index = PROJECTS.findIndex((p) => p.id === id);
    if (index === -1) return;
    show(renderProject(PROJECTS[index], index), 'project');
    history.replaceState(null, '', `#projet-${id}`);
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-project]');
    if (trigger) {
      openProject(trigger.dataset.project);
      return;
    }
    const go = event.target.closest('[data-project-go]');
    if (go) {
      openProject(go.dataset.projectGo);
      return;
    }
    const legal = event.target.closest('[data-legal]');
    if (legal) {
      const tpl = document.getElementById(`tpl-legal-${legal.dataset.legal}`);
      if (tpl) {
        event.preventDefault();
        show(tpl.content.cloneNode(true), 'legal');
      }
    }
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog || event.target.closest('[data-sheet-close]')) close();
    const cta = event.target.closest('[data-sheet-cta]');
    if (cta) {
      event.preventDefault();
      close();
      window.setTimeout(() => {
        const target = document.getElementById('contact');
        history.replaceState(null, '', '#contact');
        target?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });
      }, reducedMotion() ? 0 : 440);
    }
  });

  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });

  const openFromHash = () => {
    const match = window.location.hash.match(/^#projet-([\w-]+)$/);
    if (match) openProject(match[1]);
    else if (dialog.open && dialog.dataset.kind === 'project') close();
  };
  window.addEventListener('hashchange', openFromHash);
  openFromHash();
}

/* social.js */

const NETWORKS = {
  instagram: { key: 'INSTAGRAM_URL', label: 'Instagram' },
  facebook: { key: 'FACEBOOK_URL', label: 'Facebook' },
  snapchat: { key: 'SNAPCHAT_URL', label: 'Snapchat' },
  whatsapp: { key: 'WHATSAPP_URL', label: 'WhatsApp' },
};

let toastTimer = 0;

function showToast(message) {
  const toast = document.querySelector('[data-toast]');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

function whatsappHref(base, message) {
  try {
    const url = new URL(base);
    if (message && !url.searchParams.has('text')) url.searchParams.set('text', message);
    return url.toString();
  } catch {
    return null;
  }
}

function initSocial() {
  const config = getConfig();

  document.querySelectorAll('[data-social]').forEach((link) => {
    const network = NETWORKS[link.dataset.social];
    if (!network) return;
    const raw = config[network.key];
    let href = isConfigured(raw) ? raw.trim() : null;
    if (href && link.dataset.social === 'whatsapp') href = whatsappHref(href, config.WHATSAPP_MESSAGE);
    if (href && !/^https:\/\//.test(href)) href = null;

    if (href) {
      link.href = href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.removeAttribute('data-unconfigured');
    } else {
      link.dataset.unconfigured = '';
      link.addEventListener('click', (event) => {
        event.preventDefault();
        showToast(`Le lien ${network.label} n’est pas encore configuré.`);
      });
    }
  });

  document.querySelectorAll('[data-contact]').forEach((link) => {
    const isEmail = link.dataset.contact === 'email';
    const value = isEmail ? config.EMAIL : config.TELEPHONE;
    if (!isConfigured(value)) return;
    link.textContent = value.trim();
    link.href = isEmail ? `mailto:${value.trim()}` : `tel:${value.replace(/[^\d+]/g, '')}`;
  });

  // Bouton WhatsApp flottant : visible une fois le hero dépassé
  const floatBtn = document.querySelector('[data-wa-float]');
  const hero = document.querySelector('.hero');
  if (floatBtn) {
    let footerVisible = false;
    const footer = document.querySelector('.footer');
    const update = (y) => {
      const threshold = hero ? hero.offsetHeight * 0.6 : 200;
      floatBtn.classList.toggle('is-visible', y > threshold && !footerVisible);
    };
    if (footer) {
      new IntersectionObserver(([entry]) => {
        footerVisible = entry.isIntersecting;
        update(window.scrollY);
      }).observe(footer);
    }
    onScrollFrame(update);
  }

  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
}

/* contact.js */

const MESSAGES = {
  nom: 'Indiquez votre nom.',
  prenom: 'Indiquez votre prénom.',
  email: 'Indiquez une adresse email valide, par exemple nom@domaine.fr.',
  telephone: 'Ce numéro ne semble pas valide. Utilisez uniquement des chiffres, espaces, + ou points.',
  type: 'Choisissez le type de projet.',
  message: 'Décrivez votre projet en quelques mots (10 caractères minimum).',
  rgpd: 'Cochez cette case pour que nous puissions vous recontacter.',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+\d][\d\s.()-]{7,}$/;

function setError(form, name, message) {
  const error = form.querySelector(`#e-${name === 'telephone' ? 'tel' : name}`);
  const fields = form.querySelectorAll(`[name="${name}"]`);
  fields.forEach((field) => {
    if (message) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
  });
  if (error) error.textContent = message || '';
}

function validate(form) {
  const data = new FormData(form);
  const errors = {};
  const value = (name) => String(data.get(name) || '').trim();

  if (!value('nom')) errors.nom = MESSAGES.nom;
  if (!value('prenom')) errors.prenom = MESSAGES.prenom;
  if (!EMAIL_RE.test(value('email'))) errors.email = MESSAGES.email;
  if (value('telephone') && !PHONE_RE.test(value('telephone'))) errors.telephone = MESSAGES.telephone;
  if (!value('type')) errors.type = MESSAGES.type;
  if (value('message').length < 10) errors.message = MESSAGES.message;
  if (!data.get('rgpd')) errors.rgpd = MESSAGES.rgpd;

  ['nom', 'prenom', 'email', 'telephone', 'type', 'message', 'rgpd'].forEach((name) => setError(form, name, errors[name]));
  return errors;
}

function buildMailto(email, data) {
  const lines = [
    `Nom : ${data.get('prenom')} ${data.get('nom')}`,
    `Entreprise : ${data.get('entreprise') || '-'}`,
    `Email : ${data.get('email')}`,
    `Téléphone : ${data.get('telephone') || '-'}`,
    `Type de projet : ${data.get('type')}`,
    `Budget : ${data.get('budget') || 'Non précisé'}`,
    '',
    String(data.get('message')),
  ];
  const subject = `Nouveau projet : ${data.get('type')}`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
}

function initContact() {
  const form = document.querySelector('[data-form]');
  if (!form) return;
  const config = getConfig();
  const status = form.querySelector('[data-form-status]');
  const submit = form.querySelector('[type="submit"]');

  const select = form.querySelector('[data-budget-select]');
  (config.BUDGET_OPTIONS || []).forEach((label) => {
    const option = document.createElement('option');
    option.value = label;
    option.textContent = label;
    select?.appendChild(option);
  });

  document.querySelectorAll('[data-focus-form]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      scrollToTarget(form);
      window.setTimeout(() => form.querySelector('input:not([tabindex="-1"])')?.focus({ preventScroll: true }), 450);
    });
  });

  // Validation en direct après la première erreur sur un champ
  form.addEventListener('input', (event) => {
    const name = event.target.name;
    if (!name || !form.querySelector(`[name="${name}"][aria-invalid="true"]`)) return;
    const errors = validate(form);
    Object.keys(MESSAGES).forEach((key) => {
      if (key !== name && !form.querySelector(`[name="${key}"][aria-invalid="true"]`)) setError(form, key, '');
    });
    setError(form, name, errors[name]);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = '';
    status.className = 'form__status';
    const data = new FormData(form);

    // Pot de miel anti-spam : un humain ne remplit pas ce champ invisible
    if (String(data.get('site_web') || '').trim()) return;

    const errors = validate(form);
    const firstError = Object.keys(errors)[0];
    if (firstError) {
      const field = form.querySelector(`[name="${firstError}"]`);
      field?.focus();
      status.textContent = `Le formulaire contient ${Object.keys(errors).length > 1 ? 'des erreurs' : 'une erreur'}. Corrigez les champs indiqués.`;
      status.classList.add('is-error');
      return;
    }

    if (isConfigured(config.FORM_ENDPOINT)) {
      submit.disabled = true;
      submit.classList.add('is-loading');
      try {
        const response = await fetch(config.FORM_ENDPOINT, {
          method: 'POST',
          body: data,
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error(String(response.status));
        form.reset();
        status.textContent = 'Merci ! Votre demande a bien été envoyée. Nous revenons vers vous très vite.';
        status.classList.add('is-success');
      } catch {
        status.textContent = 'L’envoi a échoué. Vérifiez votre connexion puis réessayez, ou écrivez-nous directement par email.';
        status.classList.add('is-error');
      } finally {
        submit.disabled = false;
        submit.classList.remove('is-loading');
      }
      return;
    }

    if (isConfigured(config.EMAIL)) {
      window.location.href = buildMailto(config.EMAIL.trim(), data);
      status.textContent = 'Votre messagerie s’ouvre avec votre demande pré-remplie. Il ne reste qu’à l’envoyer.';
      status.classList.add('is-success');
      return;
    }

    status.textContent = 'Votre demande est prête, mais l’envoi n’est pas encore activé sur ce site. Renseignez FORM_ENDPOINT ou EMAIL dans js/config.js.';
    status.classList.add('is-info');
  });
}

/* interactions.js */

const TEXT_FIELDS = 'input:not([type="checkbox"]):not([type="radio"]), textarea, select';

function initCursor() {
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

function initMagnetic() {
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
function initPageTransitions() {
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

/* main.js */









const root = document.documentElement;

initSocial();
initNav();
initMenu();
initSheet();
initAnchors();
initPageTransitions();
initContact();
initServices();
initProcess();
initMarquee();
initScrollWords();
initCursor();
initMagnetic();

const hero = initHero();

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

initLoader()
  .then(nextFrame)
  .then(() => {
    // Double rAF : garantit que l’état initial est peint avant de lancer les transitions d’entrée
    root.classList.add('is-ready');
    // Les reveals démarrent après l’entrée du hero pour ne pas se marcher dessus
    initReveal();
    window.setTimeout(() => hero.play(), 200);
  });

})();
