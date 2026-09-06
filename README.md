# Côte Melvyn

Portfolio-jeu cinématique de **Melvyn Thierry-Bellefond** — Développeur Full-Stack & Expert IT.

Concept : une côte méditerranéenne stylisée à explorer. Conduire un roadster, descendre, marcher, découvrir le portfolio dans le monde (pas de landing « Bonjour je suis… »).

## Lancer en local

```bash
npm install
npm run assets   # régénère props stylisés (PAS le roadster Kenney)
npm run dev
```

Build : `npm run build && npm start`

## Stack

Next.js 15 · React Three Fiber · Drei · **@react-three/rapier** · postprocessing · Tailwind · Web Audio

## Jouer

1. Intro cinématique
2. Conduire (ZQSD / flèches, stick tactile) jusqu’au belvédère
3. **Descendre** → marcher → découvrir chapitres (carnet, maison, studio, plage, phare)
4. Mobile : stick gauche = move, stick droit = look, **Courir**, Interagir contextuel

## Contenu

Source de vérité : `/content/*.json` — voir `docs/CONTENT_MAP.md`.  
Licences assets : `ASSET_LICENSES.md`.

## Zones jouables

Route · Belvédère · Maison/Atelier · Studio · Plage · Phare · WOW overlook

## Physique

Rapier : capsule personnage + CharacterController, colliders monde (route, bâtiments, rochers, mer, bornes), respawn sûr. Véhicule cinématique arcade sur ruban de route + collider.
