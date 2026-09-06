# Rapport final — Côte Melvyn (Rapier + CC0 art finish)

Date : 2026-09-06 · Branche `melvyn972/cote-melvyn-rapier-finish-a7f2` · PR #4

## Verdict

**Oui pour merge de la verticale** — physique Rapier, assets CC0 réels (Kenney / Quaternius / Dormin / Poly Haven), découverte portfolio complète. Monde compact méditerranéen stylisé premium, pas un open-world photoréal.

## Checklist Melvyn

| Critère | Statut |
|---------|--------|
| Physique (plus AABB seul) | **Oui** — `@react-three/rapier` + CharacterController capsule |
| Pas clip rochers/bâtiments/mer/void | **Oui** — colliders recalés Kenney×6 / phare×0.34 + respawn |
| Character / car / phare / maisons pro | **Oui** — Quaternius Rogue animé, Kenney roadster + City buildings, Dormin lighthouse, Kenney Fantasy belvédère |
| Route / mer / terrain propres | **Oui** — marquages flush, mer shader, HDRI Venice Sunset, shadow bias |
| Mobile jouable | **Oui** — stick move/look, Courir, Interagir, safe-area |
| Portfolio accessible in-world | **Oui** — 9 chapitres via zones + menu |
| Caméra 3e personne | **Oui** — pied ≠ voiture + raycast Rapier |

## Assets hero (plus de primitives générées)

| Élément | Source |
|---------|--------|
| Voiture | Kenney Car Kit `sedan-sports` |
| Maison / Studio / Atelier | Kenney City Kit |
| Belvédère | Kenney Fantasy Town Kit (murs, haie, escaliers) |
| Phare | Daniel Dormin Land & Lighthouse |
| Avatar | Quaternius Animated Rogue (Idle/Walk/Run) |
| Pins | Quaternius Nature |
| Rochers / falaise / jetée / lanterne / HDRI | Poly Haven CC0 |

Licences : `ASSET_LICENSES.md`

## QA locale

- Conduite W : carPos avance
- Menu + panneau identité : OK
- HUD mobile 390×844 : joystick + safe layout
- Helper QA : `window.__coteMelvyn.teleportBelvedere()`
- Stop belvédère : ruban `BELVEDERE_T=0.52`

## Limites honnêtes

1. Direction artistique = low-poly stylisé cohérent (Kenney/Quaternius), pas scans photoréal
2. Véhicule = arcade sur ruban + collider kinématique (pas suspension 4 roues)
3. Monde volontairement compact (~220 m) — qualité > taille
4. Alias terrain/ombres atténué (bias + ContactShadows) mais pas éliminé à 100 %
