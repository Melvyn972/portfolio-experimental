# Rapport final — Côte Melvyn (Rapier finish)

Date : 2026-09-06 · Branche `melvyn972/cote-melvyn-rapier-finish-a7f2` · PR #4

## Verdict

**Oui, pour une verticale premium jouable** — physique réelle, assets CC0 hero, découverte portfolio complète, mobile utilisable. Pas un AAA open-world ; petit monde cohérent méditerranéen.

## Checklist Melvyn

| Critère | Statut |
|---------|--------|
| Physique (plus AABB seul) | **Oui** — `@react-three/rapier` + CharacterController capsule |
| Pas clip rochers/bâtiments/mer/void | **Oui** — colliders + respawn (`respawn.ts`) |
| Character / car / phare pro | **Oui** — Kenney roadster, explorer/phare enrichis, Poly Haven rocks |
| Route / mer / terrain propres | **Oui** — marquages flush, mer shader, HDRI Venice Sunset |
| Mobile jouable | **Oui** — stick move/look, Courir, Interagir, safe-area |
| Portfolio accessible in-world | **Oui** — 9 chapitres via zones + menu |
| Caméra 3e personne | **Oui** — pied ≠ voiture + raycast Rapier |

## QA locale (Chrome)

- Conduite W : carPos avance confirmé
- Menu + panneau identité : OK
- HUD mobile 390×844 : joystick + safe layout OK
- Pas d’erreurs Rapier critiques
- Sortie Descendre : trigger sur ruban `BELVEDERE_T=0.52`, rayon 7.5 + freinage assisté ; helper QA `window.__coteMelvyn.teleportBelvedere()`

## Limites honnêtes

1. Maison / studio / végétation = stylisé maison (cohérent), pas scans photoréal
2. Véhicule = arcade sur ruban + collider (pas suspension Rapier 4 roues)
3. Anims walk/run = procédurales sur membres (pas Mixamo)
4. Monde volontairement compact (~220 m) — qualité > taille

## Assets

Voir `ASSET_LICENSES.md` (Kenney CC0, Poly Haven CC0, house CC0).
