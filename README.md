# Côte Melvyn

Portfolio-jeu interactif 3D de **Melvyn Thierry-Bellefond** — Développeur Full-Stack & Expert IT.

Concept : une côte méditerranéenne stylisée à explorer. Conduire un roadster, descendre, marcher, découvrir le portfolio dans le monde (pas de landing « Bonjour je suis… »).

## Lancer

```bash
npm install
npm run assets   # régénère props stylisés (PAS le roadster Kenney / assets CC0)
npm run dev
```

Build : `npm run build && npm start`

## Boucle de jeu

1. Intro cinématique (mer, falaises, soleil bas)
2. Conduire (ZQSD / flèches, joystick) jusqu’au belvédère → **Descendre**
3. Marcher : identité (carnet) → Maison (parcours) → Studio (projets) → Plage → Phare (CV / contact)
4. Remonter dans la voiture, continuer vers le phare

**Desktop** : ZQSD + Shift (courir) + E · **Mobile** : stick gauche (déplacer), stick droit (regard), Interagir contextuel, Courir.

Menu = carte + checklist découverte ; fermer restaure l’état monde. Debug colliders : **F3** (off en prod).

## Stack

Next.js 15 · React Three Fiber · Drei · **@react-three/rapier** · postprocessing · Tailwind · Web Audio

## Contenu

Source de vérité : `/content/*.json` — voir `docs/CONTENT_MAP.md`. Pas de SIRET ni téléphone publics.  
Licences assets : `ASSET_LICENSES.md` · attributions : `public/licenses/ATTRIBUTIONS.md`

## Zones jouables

Route · Belvédère · Maison/Atelier · Studio · Plage · Phare · WOW overlook

## Physique

Rapier : capsule personnage + CharacterController, colliders monde (route, bâtiments, rochers, mer, bornes), respawn sûr. Véhicule cinématique arcade sur ruban de route + collider.

## Crédits assets

Kenney (voiture / city / fantasy) · Quaternius (avatar / pins) · Daniel Dormin (phare) · Poly Haven (rochers / jetée / HDRI) — détail dans `ASSET_LICENSES.md`.
