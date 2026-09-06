# Côte Melvyn

Portfolio-jeu interactif 3D de **Melvyn Thierry-Bellefond** — Développeur Full-Stack & Expert IT.

Concept : une côte méditerranéenne à explorer. Conduire un cabriolet, descendre, marcher de zone en zone — le monde *est* le portfolio. Pas de landing classique.

## Lancer

```bash
npm install
npm run dev
```

Build : `npm run build` · Assets GLB : `node scripts/generate-assets.mjs`

## Boucle de jeu

1. Intro cinématique (mer, falaises, soleil bas)
2. Conduire (ZQSD / flèches, joystick) jusqu’au belvédère → **Descendre**
3. Marcher : identité (carnet) → Maison (parcours) → Studio (projets) → Plage → Phare (CV / contact)
4. Remonter dans la voiture, continuer vers le phare

**Desktop** : ZQSD + Shift (courir) + E · **Mobile** : stick gauche (déplacer), stick droit (regard), Interagir uniquement si disponible, Courir.

Menu = carte + checklist découverte ; fermer restaure l’état monde. Debug colliders : **F3** (off en prod).

## Contenu

Source de vérité `/content/*.json` — voir `docs/CONTENT_MAP.md`. Pas de SIRET ni téléphone publics.

## Stack

Next.js App Router · React Three Fiber · Drei · postprocessing · Tailwind · Web Audio procédural.

## Crédits

`public/licenses/ATTRIBUTIONS.md` — modèles GLB maison (pipeline `generate-assets.mjs`).
