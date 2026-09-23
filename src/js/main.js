import { initLoader } from './loader.js';
import { initAnchors, initMenu, initNav } from './nav.js';
import { initHero } from './hero.js';
import { initReveal, initScrollWords } from './reveal.js';
import { initMarquee, initProcess, initServices } from './sections.js';
import { initSheet } from './projects.js';
import { initSocial } from './social.js';
import { initContact } from './contact.js';
import { initCursor, initMagnetic, initPageTransitions } from './interactions.js';

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
