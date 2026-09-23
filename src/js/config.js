/*
 * ─────────────────────────────────────────────────────────────
 *  AC DIGITAL STUDIO — CONFIGURATION DU SITE
 *  C’est le SEUL fichier à modifier pour brancher vos liens.
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
