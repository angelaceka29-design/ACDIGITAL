import { createCubeField } from './cubes.js';
import { mqFinePointer, onScrollFrame, reducedMotion } from './utils.js';

function canUseVideo() {
  if (reducedMotion()) return false;
  const connection = navigator.connection;
  if (connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || ''))) return false;
  return true;
}

export function initHero() {
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
