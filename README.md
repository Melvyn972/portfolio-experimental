# Côte Melvyn

Portfolio-jeu cinématique de **Melvyn Thierry-Bellefond** — Développeur Full-Stack & Expert IT.

Concept : une côte méditerranéenne stylisée à explorer. Vous conduisez un cabriolet le long d’une route côtière (~200 m), vous descendez, marchez jusqu’au belvédère, et consultez un carnet d’identité intégré au monde. Pas de landing « Bonjour je suis… » — le lieu parle.

## Lancer en local

```bash
npm install
npm run dev
```

Build production :

```bash
npm run build
npm start
```

Stack : Next.js (App Router) · React Three Fiber · Drei · postprocessing (subtil) · GSAP (optionnel) · Tailwind CSS · audio procédural Web Audio.

## Jouer la vertical slice

1. Plan large cinématique (mer, falaises, route, soleil bas)
2. Descente vers la voiture — moteur allumé — caméra oblique de suivi
3. Conduire (ZQSD / flèches, joystick tactile) jusqu’au belvédère
4. S’arrêter sur le marquage → **Descendre** → marcher → **consulter le carnet**
5. Remonter dans la voiture et continuer

Contrôles : **E** interagir / descendre / monter · **Menu** (recruteurs) · **Muet** · presets **Auto / Haute / Éco**.

## Contenu (source de vérité)

Tout le contenu réel de Melvyn vit dans `/content/` (JSON) :

| Fichier | Contenu |
|---------|---------|
| `identity.json` | Nom, titre, présentation |
| `experiences.json` | Parcours pro |
| `formations.json` | Formations |
| `competences.json` | Clusters de compétences |
| `projets.json` | Projets (+ zone future) |
| `passions.json` | Passions |
| `activite.json` | Auto-entreprise / services |
| `contact.json` | Email, GitHub, LinkedIn, Codeur, CV |
| `zones.json` | Carte des zones (playable + scaffold) |

Import central : `src/lib/content.ts`.  
Pas de SIRET ni téléphone sur l’UI publique. Pas de réseaux inventés.

## Zones futures (scaffold)

Route & Belvédère sont jouables. Marqueurs discrets pour : Maison/Atelier, Studio, Plage, Phare (CV/contact), WOW overlook — données dans `zones.json`, pas de buildings génériques remplisseurs.

## Qualité & mobile

- Presets **Auto / Haute / Éco**
- Ombres, mer, végétation et post-FX adaptés
- Joystick + bouton Interagir sur tactile
- L’objectif mobile : rester beau, pas seulement « tourner »

## Déploiement Vercel

Prêt pour le projet Vercel `portfolio-experimental`. Brancher ce repo et déployer depuis `main` (`vercel.json` inclus). `npm run build` doit passer.

## Crédits

Environnement, cabriolet et belvédère : géométrie procédurale art-dirigée (maison).  
Éclairage ciel : `@react-three/drei` Sky.  
Anciens assets garage abandonnés — voir `/public/licenses/ATTRIBUTIONS.md` pour historique éventuel.
