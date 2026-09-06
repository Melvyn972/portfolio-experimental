# Audit — Côte Melvyn (vertical slice → présentable)

Date : 2026-09-06 · Branche de finition

## Architecture

```
content/*.json → src/lib/content.ts
src/lib/road.ts · gameStore.ts · quality.ts

CoteMelvynApp
  ├─ ExperienceCanvas (R3F)
  │    GameCamera · World · VehicleController · PostFX
  ├─ GameHUD · AmbientAudio · IntroDirector
  └─ boot splash
```

Séparation correcte (world / vehicle / camera / UI / audio). Lacunes : pas de couche assets/loader, collisions soft, store notifié chaque frame, zones scaffold hardcodées.

## Verdict

Prototype jouable avec bonne direction artistique (ciel, mer shader, palette, loop drive→exit→walk→carnet). **Pas prêt portfolio** sans : coords belvédère unifiées, store throttlé, assets GLB (plus de boîtes), personnage, CV scrollable, qualité honorée.

## Classification

### CRITICAL
| # | Problème | Action |
|---|----------|--------|
| C1 | Belvédère désync (`BELVEDERE_T=0.52` vs plateau/zones `z≈-85`) | Une source de vérité `t` + sync terrain/végétation/zones |
| C2 | `/cv` scroll cassé (`body { overflow: hidden }` global) | Overflow scoped à la route jeu |
| C3 | Zéro GLB — tout en primitives | Pipeline assets + cabriolet / végétation / belvédère / avatar |

### MAJOR
| # | Problème | Action |
|---|----------|--------|
| M1 | `setGameState` chaque frame → thrash React/audio | Dirty-check / push UI throttlé |
| M2 | Sortie voiture ≠ marqueur stop | Détection distance au stop |
| M3 | Marche : hauteur terrasse + caméra figée sur `carYaw` | Facing walk + hauteur terrain |
| M4 | Menus n’interrompent pas les inputs | Gate + Escape |
| M5 | Qualité partielle (ombres 2048 hardcodées, ContactShadows en Éco) | Honorer presets |
| M6 | Contenu JSON sous-exploité in-world | Menu + scaffolds liés à Content Map |

### IMPORTANT
Roues steer/spin sur même groupe · pas de pitch châssis · intro timer-only · joystick sans `pointercancel` · Escape manquant · `gsap` inutilisé · marqueurs zones incomplets · GC Vector3 chaque frame · lien `/cv` absent du HUD.

### POLISH
Hooks QA window · dust CPU · sway végétation naïf · attributions legacy · OG image manquante.

## Placeholders à remplacer
Cabriolet, avatar, belvédère (pierre/bois/verre), carnet, arbres, rochers, lampadaires, plinths zones. Mer/terrain/route restent procéduraux mais soignés (pas « plane bleue seule »).

## Contenu
Identity + contact + 3 expériences dans le jeu ; formations/compétences/projets sur `/cv` seulement ; passions/activité importés mais non rendus ; `zones.json` non lu au runtime.

## Corrections appliquées (finition 2026-09-06)

- C1 belvédère unifié (`t=0.58`) · C2 scroll `/cv` · C3 GLB maison
- M1 store dirty-check · M2 stop distance · M3 walkYaw · M4 menus/Escape
- M5 qualité ombres · M6 content map menu
- Strict Mode : boot→intro + keyboard listeners (garde `started`/`ready` retirées)
- Marche arrière : plus de flip yaw chaque frame
- Boucle playtestée : drive → stop → exit → carnet → identity → re-enter

## Limites restantes
- Terrasse/falaises/route encore partiellement procédurales (boîtes de soutènement)
- Maison/Studio/Phare/Plage/WOW = scaffolds, pas AAA
- Pas de LOD mesh / Draco runtime (GLB déjà légers)
- Auto quality = snapshot mobile/desktop, pas downgrade FPS dynamique
- Cabriolet stylisé low-poly (cohérent) — pas photoréaliste