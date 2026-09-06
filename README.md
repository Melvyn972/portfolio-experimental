# Côte Melvyn

Portfolio-jeu cinématique de **Melvyn Thierry-Bellefond** — Développeur Full-Stack & Expert IT.

Concept : une côte méditerranéenne stylisée à explorer. Vous conduisez un cabriolet le long d’une route côtière (~200 m), vous descendez, marchez jusqu’au belvédère, et consultez un carnet d’identité intégré au monde. Pas de landing « Bonjour je suis… » — le lieu parle.

## Lancer en local

```bash
npm install
npm run assets   # régénère les GLB stylisés (optionnel si déjà dans public/models)
npm run dev
```

Build production :

```bash
npm run build
npm start
```

Stack : Next.js (App Router) · React Three Fiber · Drei · postprocessing (subtil) · Tailwind CSS · audio procédural Web Audio · assets GLB maison.

## Jouer

1. Plan large cinématique (mer, falaises, route, soleil bas)
2. Descente vers la voiture — caméra oblique de suivi
3. Conduire (ZQSD / flèches, joystick tactile) jusqu’au belvédère
4. S’arrêter sur le marquage → **Descendre** → marcher → **consulter le carnet**
5. Remonter dans la voiture et continuer

Contrôles : **E** interagir / descendre / monter · **Échap** fermer panneaux · **Menu** (recruteurs) · **Muet** · presets **Auto / Haute / Éco**.

## Contenu

Source de vérité : `/content/*.json` — voir `docs/CONTENT_MAP.md`.

| Fichier | Contenu |
|---------|---------|
| `identity.json` | Nom, titre, présentation |
| `experiences.json` | Parcours pro |
| `formations.json` | Formations |
| `competences.json` | Clusters de compétences |
| `projets.json` | Projets |
| `passions.json` | Passions |
| `activite.json` | Auto-entreprise / services |
| `contact.json` | Email, GitHub, LinkedIn, Codeur, CV |
| `zones.json` | Carte des zones (playable + scaffold) |

Pas de SIRET ni téléphone sur l’UI publique. CV lisible sur `/cv` + PDF téléchargeable.

## Docs

- `docs/AUDIT.md` — audit qualité / dette
- `docs/CONTENT_MAP.md` — mapping contenu → zones
- `public/licenses/ATTRIBUTIONS.md` — crédits assets

## Zones

Route & Belvédère sont jouables. Scaffolds art-dirigés pour Maison/Atelier, Studio, Plage, Phare, WOW overlook.

## Déploiement

Projet Vercel `portfolio-experimental` — déployer depuis `main`.
