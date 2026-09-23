import { reducedMotion } from './utils.js';

/*
 * Données des projets. Remplacez les valeurs entre crochets par vos vraies réalisations.
 * media (facultatif) remplace le visuel de présentation :
 *   { type: 'image', src: '/assets/img/projets/mon-projet.avif', alt: 'Description' }
 *   { type: 'video', src: '/assets/video/mon-projet.mp4', poster: '/assets/img/projets/poster.jpg' }
 * gallery (facultatif) : liste d’objets { src, alt } affichés sous la description.
 */
export const PROJECTS = [
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

export function initSheet() {
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
