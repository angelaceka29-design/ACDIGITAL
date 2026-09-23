import { clamp, mqDesktop, onScrollFrame, reducedMotion } from './utils.js';

/* ── Services : la ligne qui traverse le centre de l’écran devient active ── */
export function initServices() {
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
export function initProcess() {
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
export function initMarquee() {
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
