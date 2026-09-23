import { getConfig, isConfigured, onScrollFrame } from './utils.js';

const NETWORKS = {
  instagram: { key: 'INSTAGRAM_URL', label: 'Instagram' },
  facebook: { key: 'FACEBOOK_URL', label: 'Facebook' },
  snapchat: { key: 'SNAPCHAT_URL', label: 'Snapchat' },
  whatsapp: { key: 'WHATSAPP_URL', label: 'WhatsApp' },
};

let toastTimer = 0;

export function showToast(message) {
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

export function initSocial() {
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
