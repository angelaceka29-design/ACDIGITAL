# AC DIGITAL STUDIO — Site web

Site vitrine du studio : HTML, CSS et JavaScript modulaires, **aucune dépendance au runtime** (pas de framework, pas de librairie d’animation : moteur de motion maison, plus léger que GSAP).

---

## 1. Démarrage rapide

**Juste regarder le site ?** Double-cliquez sur **`OUVRIR-LE-SITE.html`** : c’est une version autonome qui fonctionne sans rien installer (le fond du hero y est généré en direct à la place de la vidéo, et les pages légales s’ouvrent en panneau).

**Travailler sur le site** — prérequis : [Node.js 18+](https://nodejs.org) (installez la version « LTS »).

Ouvrez un terminal **dans ce dossier**, puis :

```bash
npm run dev
```

Ouvrez ensuite **http://localhost:4173** dans votre navigateur. C’est tout.

> Sous Windows : clic droit dans le dossier → « Ouvrir dans le terminal ». Sur Mac : glissez le dossier sur l’icône Terminal.

| Commande | Rôle |
|---|---|
| `npm run dev` | Construit le site puis le sert sur http://localhost:4173 |
| `npm run build` | Génère la version GitHub Pages dans `dist/` (fait automatiquement par GitHub) |
| `npm run lint` | Vérifie le code (syntaxe, console, imports, accessibilité HTML, CSS) |
| `npm test` | Lance les 31 tests automatiques (nécessite Playwright, voir §6) |
| `npm run check` | lint + build + tests, à lancer avant chaque mise en ligne |

---

## 2. Ce que vous devez personnaliser

### a) Vos liens et coordonnées → `src/js/config.js`
C’est **le seul fichier à modifier** pour brancher le site :

```js
EMAIL: 'bonjour@votre-domaine.fr',
TELEPHONE: '+33 6 00 00 00 00',
INSTAGRAM_URL: 'https://www.instagram.com/votrecompte',
FACEBOOK_URL: 'https://www.facebook.com/votrepage',
SNAPCHAT_URL: 'https://www.snapchat.com/add/votrecompte',
WHATSAPP_URL: 'https://wa.me/33600000000',   // indicatif pays, sans + ni espaces
FORM_ENDPOINT: 'https://formspree.io/f/xxxxxx',
```

Tant qu’une valeur reste entre crochets (`[INSTAGRAM_URL]`…), le lien est inactif et affiche un message discret : **aucun lien cassé**. Le numéro WhatsApp n’apparaît nulle part dans le HTML.

**Formulaire** : créez un formulaire gratuit sur [formspree.io](https://formspree.io) (ou Getform, Basin…) et collez son URL dans `FORM_ENDPOINT`. Sans cela, le formulaire ouvre la messagerie du visiteur vers votre `EMAIL`.

### b) Adresse du site → `site.config.json`
Déjà réglé pour GitHub Pages : `SITE_URL` = `https://angelaceka29-design.github.io/ACDIGITAL` et `BASE_PATH` = `/ACDIGITAL`. Si vous passez plus tard sur votre propre nom de domaine (ex. `acdigitalstudio.fr`), mettez `SITE_URL` à cette adresse et `BASE_PATH` à `""`.

### c) Vos projets → `src/js/projects.js` + `src/index.html`
Remplacez `[Nom du projet]`, `[Année]`, `[Client]` et les textes entre crochets. Pour afficher une vraie image ou vidéo dans la fiche projet :

```js
media: { type: 'image', src: '/assets/img/projets/mon-projet.avif', alt: 'Description' },
gallery: [{ src: '/assets/img/projets/detail-1.webp', alt: '…' }],
```

Les visuels de la grille sont des illustrations SVG de présentation, à remplacer par vos réalisations (`<img>` avec `width`/`height`).

### d) Pages légales → `src/partials/legal-mentions.html` et `legal-confidentialite.html`
Complétez les champs `[RAISON SOCIALE]`, `[SIRET]`, `[ADRESSE]`, `[HÉBERGEUR]`, `[DURÉE DE CONSERVATION]`… Faites valider ces textes par un professionnel si besoin.

**Rien n’a été inventé** : aucun client, chiffre, prix, témoignage ou coordonnée fictive. Pour retrouver tout ce qui reste à compléter : cherchez `[` dans le dossier `src/`.

---

## 3. La vidéo du hero

Le site est livré avec une **vidéo de marque générée pour le studio** (cubes isométriques aux couleurs AC, boucle parfaite de 8 s) :

| Fichier | Poids |
|---|---|
| `hero-1080.webm` (desktop) | ~0,7 Mo |
| `hero-720.webm` (mobile) | ~0,4 Mo |
| `.mp4` équivalents (Safari ancien) | fallback |
| `hero-poster.avif` | ~9 Ko |

**Pour utiliser la vidéo Pexels à la place** (ffmpeg requis) :
1. Téléchargez-la (version HD 1920×1080) depuis la page Pexels.
2. `bash scripts/encode-hero.sh ~/Downloads/nom-de-la-video.mp4` (sous Windows : depuis « Git Bash »)
3. `npm run build`

Le script compresse en WebM + MP4, crée les versions desktop/mobile et le poster. Pour régénérer la vidéo de marque : `npm run media`.

Optimisations en place : chargement **après** l’intro (ne concurrence pas l’affichage), version légère sur mobile, désactivée en mode économie de données et en `prefers-reduced-motion` (poster fixe), mise en pause hors écran, fond génératif de secours si le fichier échoue.

---

## 4. Mettre en ligne (GitHub Pages)

Le site se déploie **automatiquement** sur **https://angelaceka29-design.github.io/ACDIGITAL/** à chaque modification du dépôt, grâce au fichier `.github/workflows/deploy.yml` (vérification du code → construction → publication). Rien à installer sur votre ordinateur.

**Réglage unique, à faire une seule fois :** dans le dépôt GitHub → **Settings** → **Pages** → *Build and deployment* → **Source : GitHub Actions**.

**Modifier le site ensuite** (ex. ajouter votre lien Instagram) : ouvrez `src/js/config.js` sur GitHub → icône crayon → modifiez → **Commit changes**. Le site est à jour 1 à 2 minutes plus tard (suivi dans l’onglet **Actions**).

**Autres hébergeurs** (Netlify, OVH, o2switch…) : mettez `BASE_PATH` à `""` dans `site.config.json`, lancez `npm run build` et envoyez le contenu de `dist/`.

**Performance max (optionnel)** : auto-hébergez les polices. Téléchargez Bricolage Grotesque et Manrope en WOFF2 via [gwfh.mranftl.com](https://gwfh.mranftl.com), placez-les dans `src/assets/fonts/`, remplacez le `<link>` Google Fonts de `src/partials/head-common.html` par des `@font-face`, puis supprimez le paragraphe Google Fonts de la politique de confidentialité.

---

## 5. Architecture

```
src/
├── index.html                      page d’accueil
├── mentions-legales.html · politique-confidentialite.html · 404.html
├── partials/                       blocs partagés (header, footer, icônes, textes légaux)
├── css/
│   ├── base.css                    tokens (couleurs, typo, espacements), reset, reveals
│   ├── components.css              boutons, réseaux, curseur, toast, fiche projet
│   ├── layout.css                  loader, navbar, menu mobile
│   ├── hero.css · sections.css · contact-footer.css
├── js/
│   ├── config.js                   ← VOS LIENS
│   ├── main.js                     orchestration
│   ├── loader.js · nav.js · hero.js · cubes.js (fond génératif)
│   ├── reveal.js · sections.js (services, processus, marquee)
│   ├── projects.js · social.js · contact.js · interactions.js (curseur, magnétisme)
│   └── utils.js                    boucle de scroll unique, media queries
└── assets/                         images, vidéos, icônes
scripts/                            build, lint, tests, serveur, médias
```

**Direction artistique** — fond `#080808` / `#111111`, texte `#FFFFFF` / `#A6A6A6`, accent violet électrique `#6C5CFF` (version texte `#A99FFF`), dégradé bleu → violet réservé aux interactions. Titres : Bricolage Grotesque (axe de largeur condensé), texte : Manrope. Signature : le « pixel » violet qui remplace les points.

**Accessibilité** — HTML sémantique, lien d’évitement, focus visible partout, menu et fiches projet avec piège de focus + Échap, formulaire avec erreurs annoncées (`aria-invalid`, `aria-live`), contrastes WCAG AA vérifiés, `prefers-reduced-motion` respecté (ni loader, ni vidéo, ni animation).

---

## 6. Tests

```bash
npm install          # installe Playwright (outil de test uniquement)
npx playwright install chromium
npm run check
```

Les 31 tests couvrent : loader (durée, session, reduced-motion), vidéo (source desktop/mobile, lecture, pause hors écran, fallback), 8 tailles d’écran de 1920 à 375 px (débordement, éléments coupés, titres cassés, texte trop petit), navbar et ancres, menu mobile au clavier, fiches projet, formulaire (erreurs, validation, envoi), réseaux sociaux configurés/non configurés, WhatsApp, navigation clavier, contrastes, liens internes et 404, images, CLS/LCP/poids, fluidité, version mono-fichier. Captures d’écran dans `test-results/`.

**À vérifier vous-même** : les tests automatiques tournent sous Chromium (Chrome, Edge, Opera, Brave). Faites un contrôle visuel rapide sur **Safari (iPhone et Mac)** et **Firefox** avant la mise en ligne. Le code n’utilise que des fonctionnalités standard supportées par ces navigateurs.
