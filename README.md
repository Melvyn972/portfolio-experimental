# Atelier Mécanique Digitale

Portfolio immersif 3D de **Melvyn Thierry-Bellefond** — Développeur Full-Stack & Expert IT.

Concept : un atelier privé (garage × établi d’horloger × cockpit gaming) navigable en 3D. Le visiteur traverse des zones spatiales : entrée → profil → parcours → compétences → projets → passions → CV → contact.

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

Stack : Next.js (App Router) · React Three Fiber · Drei · postprocessing (Bloom, N8AO, vignette, chromatic aberration) · HDRI PBR · Tailwind CSS.

## Qualité & mobile

- Presets **Auto / Haute / Éco** (barre supérieure)
- DPR plafonné, AO désactivé en mode éco, particles réduites
- Assets GLB compressés **meshopt**, textures ≤ 512 px
- Chargement différé des zones après l’entrée
- `prefers-reduced-motion` → fallback 2D premium

## Contenu

- CV : [/cv](/cv) (impression) + téléchargement [`/cv-melvyn-thierry-bellefond.pdf`](/cv-melvyn-thierry-bellefond.pdf)
- Contact : formulaire mailto → melvyn.thierrybellefond@gmail.com
- Réseaux : GitHub, LinkedIn, Codeur.com

## Crédits assets (CC0 / libres)

| Source | Licence | Usage |
|--------|---------|--------|
| [Kenney](https://kenney.nl) — Factory Kit, Car Kit, Furniture Kit, City Kit Industrial, Racing Kit | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | Props atelier, véhicules abstraits, desk/cockpit, lumières, structures |
| [Poly Haven](https://polyhaven.com) — HDRI `workshop` (1K) | [CC0](https://polyhaven.com/license) | Éclairage d’environnement PBR |

Attribution appréciée mais non obligatoire (CC0). Les modèles sont **vendus dans** `/public/models` (compressés meshopt) et `/public/hdri` — aucun CDN externe requis au runtime.

## Déploiement

Prêt pour Vercel (`vercel.json` inclus). Brancher le repo sur Vercel et déployer depuis `main`.
