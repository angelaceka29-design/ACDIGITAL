import { getConfig, isConfigured, scrollToTarget } from './utils.js';

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

export function initContact() {
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
