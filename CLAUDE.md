# Evera — Simulateurs

Ce repo contient les simulateurs Evera (AEN, TCO, et futurs) conçus pour être intégrés en embed dans des pages Webflow.

## Architecture

```
main                  ← Base commune (design system, template, consignes)
├── simulateur-aen    ← Branche : simulateur Avantage en Nature
├── simulateur-tco    ← Branche : simulateur Total Cost of Ownership
└── simulateur-xxx    ← Futures branches pour d'autres simulateurs
```

Chaque simulateur vit sur sa propre branche, héritant de la base commune sur `main`.

## Stack technique

- **HTML/CSS/JS vanilla** — pas de framework, pas de build
- **Intégration Webflow** — chaque simulateur est un embed HTML dans une page Webflow
- **CDN** — les fichiers CSS/JS sont servis via jsDelivr depuis ce repo GitHub
- **Leads** — formulaire modal avec validation anti-spam, envoi vers Zapier webhook
- **PDF** — génération côté client via jsPDF (CDN)

## Design system

### Fonts (Google Fonts)
- **Manrope** (300–800) : titres, boutons, labels importants
- **Inter** (400–700) : corps de texte, labels, inputs
- **JetBrains Mono** (500–700) : valeurs numériques, résultats, sliders

### Palette de couleurs (variables CSS)
```css
--noir: #131B1D          /* Texte principal, fonds dark */
--blanc: #FFFFFF
--bleu: #EDF5FA          /* Fonds légers */
--bleu-fonce: #63768D    /* Texte secondaire, accents */
--vert-eau: #D0EDED      /* Succès, sélection active */
--vert-pastel: #E2F3F2   /* Fonds succès léger */
--beige: #F7F5F3         /* Fond alternatif (ex: TCO) */
--text: #131B1D
--text-2: #63768D
--text-3: #9AACB8
--border: #E0E7EB
--surface: #FFFFFF
--surface-alt: #F7F9FB
--danger: #D44444
```

### Composants réutilisables (classes CSS)
- `.sim` — wrapper principal, contient le reset Webflow
- `.evc` — carte (évite collision avec `.card` Webflow), `.evc-sm`, `.evc-np`
- `.sec-title` — titre de section avec icône
- `.moto-card` — carte de sélection (motorisation, catégorie)
- `.toggle-row` / `.toggle` — interrupteur on/off
- `.grid` / `.g2` / `.g3` — grille responsive
- `.label` / `.input` / `.select` / `.unit` — champs de formulaire
- `.tip` — tooltip au hover (attribut `data-t`)
- `.slider` / `.slider-header` / `.slider-ticks` — curseurs
- `.fleet-presets` / `.fp` — boutons preset (pills)
- `.btn-calc` — bouton CTA principal
- `.modal-overlay` / `.modal` — modal lead capture (layout split 2fr 3fr)
- `.result-hero` — carte résultat dark
- `.detail-card` / `.dc-reco` / `.dc-base` — cartes détaillées
- `.fleet-cta` — bandeau CTA Evera Fleet
- `.ftable` — tableau récapitulatif
- `.btn-new` — bouton "Nouvelle simulation"

### Icônes SVG (sprite inline)
Sprite SVG inline en début de HTML, symboles réutilisés via `<use href="#ico-xxx">` :
`ico-car`, `ico-fuel`, `ico-bolt`, `ico-doc`, `ico-bank`, `ico-card`, `ico-euro`, `ico-wrench`, `ico-shield`, `ico-circle`, `ico-users`, `ico-pin`, `ico-percent`, `ico-scales`, `ico-arrow`, `ico-calendar`, `ico-chart`, `ico-check`, `ico-key`, `ico-battery`, `ico-battery-charge`, `ico-home`, `ico-leaf`, `ico-truck`

## Conventions de code

### Nommage des fichiers
- `simulateur-{nom}.html` — point d'entrée HTML (embed Webflow)
- `simulateur-{nom}.css` — styles spécifiques au simulateur
- `simulateur-{nom}.js` — logique métier et interactions

### Classes CSS
- Préfixe `.sim` sur tous les sélecteurs (isolation Webflow)
- Classes courtes : `.evc` (card), `.dr` (data row), `.dl` (data label), `.dv` (data value)
- Pas de BEM — on privilégie des classes simples et descriptives
- `!important` sur les propriétés critiques (nécessaire pour l'override Webflow)

### JavaScript
- Vanilla JS uniquement, pas de dépendances
- Helpers communs : `$()` (getElementById), `V()` (parseFloat value), `fmt()` (format monétaire), `fK()` (format km), `qA()` (querySelectorAll)
- Anti-spam : validation email (blocklist domaines jetables + perso), honeypot, délai minimum
- Webhook Zapier pour la capture de leads
- Mode debug pour les emails @evera.co

### Structure HTML d'un simulateur
```
<link fonts>
<link CSS CDN>
<style> overrides critiques inline </style>
<svg sprite>
<div class="sim">
  <!-- Sections de saisie (chacune dans .evc) -->
  <!-- Bouton CTA .btn-calc -->
  <!-- Modal lead capture -->
  <!-- Résultats (.results) -->
  <!-- CTA Evera Fleet -->
  <!-- Footer -->
</div>
<script src="CDN/simulateur-xxx.js"></script>
```

## Créer un nouveau simulateur

1. Créer une nouvelle branche depuis `main` : `git checkout -b simulateur-{nom} main`
2. Copier `base.css` et adapter les variables si besoin
3. Créer `simulateur-{nom}.html` en suivant la structure ci-dessus
4. Créer `simulateur-{nom}.css` avec les styles spécifiques
5. Créer `simulateur-{nom}.js` avec la logique métier
6. Le HTML doit inclure :
   - Le lien Google Fonts (Manrope, Inter, JetBrains Mono)
   - Le lien vers le CSS via CDN jsDelivr
   - Les overrides Webflow inline critiques (copier depuis un simulateur existant)
   - Le sprite SVG avec les icônes nécessaires
   - Le wrapper `.sim` contenant tout le contenu
   - Le script JS en fin de fichier

## Intégration Webflow

Les simulateurs sont intégrés via un bloc embed HTML dans Webflow. Le CSS et JS sont servis depuis jsDelivr :
```
https://cdn.jsdelivr.net/gh/qfabre/evera-simulateur-aen@{commit}/simulateur-{nom}.css
https://cdn.jsdelivr.net/gh/qfabre/evera-simulateur-aen@{commit}/simulateur-{nom}.js
```

Le HTML embed inclut aussi des `<style>` inline critiques (reset Webflow) pour garantir le rendu même si le CDN est lent.

## Validation des leads

Chaque simulateur inclut un formulaire modal de capture de leads avec :
- Champs : prénom, nom, email pro, entreprise, téléphone (optionnel)
- Honeypot anti-bot (`hp-field`)
- Délai minimum (2s) entre ouverture et soumission
- Blocklist emails jetables (mailinator, yopmail, etc.)
- Blocklist emails personnels (gmail, hotmail, etc.) — email pro requis
- Patterns anti-test (test@, fake@, toto, etc.)
- Envoi vers Zapier webhook
- Bypass pour @evera.co (affiche directement les résultats + debug)
