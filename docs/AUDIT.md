# Audit — Côte Melvyn (finition production)

Date : 2026-09-06 · Branche `melvyn972/cote-melvyn-production-finish-3583`

## Verdict

Expérience 3D interactive **présentable** : route côtière jouable, belvédère → maison/atelier → studio → plage → phare, chapitres portfolio découvrables, HUD mobile compact + safe-area. Style low-poly art-dirigé cohérent (pas photoréaliste).

## Corrections livrées

### CRITICAL
- **C1 HUD mobile** — sticks 56px, Interagir uniquement si cible, hint déplacé en haut, safe-area, Muet/Menu compacts
- **C2 Architecture** — belvédère / maison / studio / phare / murets en GLB (`generate-assets.mjs`)
- **C3 Zones** — toutes playable avec points d’interaction
- **C4 Contrôleur pied** — sol, pentes, collisions AABB, look stick, course Shift, transitions lissées

### MAJOR
- Caméra distance constante + collision pull-in + clamp sol
- Véhicule accel/frein/reverse/steer/inertie/suspension/roues
- InteractionManager (prompt contextuel, pas de bouton permanent)
- Menu carte + checklist 9 chapitres
- Progressive load Boot→World→Vehicle→FX

### Contenu
Source `content/*.json` uniquement — Identity, Parcours, Expériences, Compétences, Projets, Passions, Activité, CV, Contact.

## QA (Playwright local)
- Drive → stop belvédère → Descendre → carnet → chapitre identity ✓
- Menu checklist 1/9 ✓
- 0 erreur console WebGL critique
- Mobile : isMobile, sticks, menu

## Limites restantes (honnêtes)
1. **Assets stylisés low-poly** — pipeline maison, pas photoréal / pas Draco-KTX2 runtime
2. **Collisions AABB** — pas de mesh collider précis
3. **Pas de LOD mesh multi-niveaux** ni downgrade FPS dynamique (presets Auto/Haute/Éco)
4. **Mer / terrain** restent procéduraux (volontaire)
5. **Avatar** basique (capsule stylisée GLB) — lisible, pas AAA
6. Panneaux chapitre occultent encore une partie du monde (volontaire pour lisibilité contenu) — translucides + max-height mobile

## Debug
`F3` = colliders wireframe (off par défaut / production).
