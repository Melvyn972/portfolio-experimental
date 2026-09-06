# Audit — Côte Melvyn (finition production)

Date : 2026-09-06 · Branche `melvyn972/cote-melvyn-production-finish-3583`

## Verdict

Vertical slice jouable (route → belvédère → carnet → remonter). **Pas encore un portfolio-expérience 3D présentable** : HUD mobile trop grand, interactions permanentes, architecture encore en boîtes, zones scaffold, contrôleur pied rudimentaire, pas de checklist découverte.

## Architecture actuelle

```
content/*.json → src/lib/content.ts
src/lib/road.ts · gameStore.ts · quality.ts

CoteMelvynApp
  ├─ ExperienceCanvas (R3F)
  │    GameCamera · World · VehicleController · PostFX
  ├─ GameHUD · AmbientAudio · IntroDirector
  └─ boot splash
```

## Classification (état avant finition)

### CRITICAL
| # | Problème | Impact |
|---|----------|--------|
| C1 | HUD mobile oversized + bouton Interagir permanent + joystick qui masque le monde | QA Melvyn — monde invisible |
| C2 | Belvédère / architecture = `boxGeometry` visibles (pas GLB structure) | « Three.js scene », pas expérience |
| C3 | Zones Maison/Studio/Plage/Phare = plinths scaffold, contenu hors monde | Portfolio incomplet |
| C4 | Contrôleur pied : pas de look caméra, pas de course, hauteur hackée, pas de collisions murs | Float / clipping / QA |

### MAJOR
| # | Problème | Action |
|---|----------|--------|
| M1 | Caméra sans collision avoid, distance variable, trop basse au sol parfois | Spring + ray + minY |
| M2 | Véhicule : pas de suspension / inertie soignée ; sortie téléportée | Smooth exit + feel |
| M3 | Interaction : prompt permanent + bouton Interagir toujours visible | InteractionManager |
| M4 | Safe-area Safari absentes | `env(safe-area-inset-*)` |
| M5 | Menu = dump texte, pas carte + checklist découverte | Menu carte / chapitres |
| M6 | Pas de progressive load / LOD runtime | Boot→Core→… |

### IMPORTANT
Viewport 3D clip possible (`100dvh` sans safe) · Shift run absent · dual stick mobile absent · debug colliders absent · attributions GLB maison à clarifier · Road Accent cylinders WOW encore primitifs.

### POLISH
Dust CPU · sway naïf · OG image · FPS auto-downgrade.

## Placeholders à remplacer (priorité héros)
1. Structure belvédère (pierre/bois/verre) → GLB
2. Maison / Atelier, Studio projets, Phare → GLB
3. Avatar / roadster déjà GLB (améliorer si besoin)
4. Rochers / végétation déjà GLB
5. Terrain / mer / route restent procéduraux soignés (OK)

## Contenu (source de vérité)
`content/*.json` uniquement — inventer rien. Mapping :
- Belvédère → Identité
- Maison/Atelier → Parcours · Expériences · Compétences
- Studio → Projets
- Plage → Passions
- Phare → Activité · CV · Contact

## Plan d’exécution (10 passes)
1. Audit + critiques HUD/safe-area/store
2. Rebuild Input→Movement→Physics→Character→Anim→Camera + véhicule
3. Pipeline assets architecture GLB
4. Level : Route→Belvédère→Maison→Studio→Plage→Phare
5. Chapitres portfolio + checklist menu
6. Mobile layout (monde visible)
7. Perf LOD / progressive
8. Lighting / audio / InteractionManager
9. QA path complet + debug colliders
10. Build + push

## Corrections appliquées (cette branche)
Voir commits successifs — ce document est mis à jour en fin de passe 10.
