export type SectionId =
  | "entree"
  | "profil"
  | "diagnostic"
  | "competences"
  | "projets"
  | "passions"
  | "cv"
  | "contact";

export interface SectionMeta {
  id: SectionId;
  label: string;
  short: string;
}

export const SECTIONS: SectionMeta[] = [
  { id: "entree", label: "Entrée", short: "01" },
  { id: "profil", label: "Profil", short: "02" },
  { id: "diagnostic", label: "Parcours", short: "03" },
  { id: "competences", label: "Compétences", short: "04" },
  { id: "projets", label: "Projets", short: "05" },
  { id: "passions", label: "Passions", short: "06" },
  { id: "cv", label: "CV", short: "07" },
  { id: "contact", label: "Contact", short: "08" },
];

export const PROFILE = {
  name: "Melvyn Thierry-Bellefond",
  firstName: "Melvyn",
  title: "Développeur Full-Stack & Expert IT",
  tagline:
    "Concepteur, déployeur et pilote de solutions numériques sur-mesure pour PME, commerces et équipes multisites.",
  ambition: "Ambition : devenir le couteau suisse IT des PME.",
  credo:
    "Double culture tech + mécanique — démonter, diagnostiquer, optimiser, remonter plus propre.",
  location: "Gennevilliers · Île-de-France",
  age: "~22 ans",
  permits: "Permis A et B, véhiculé",
  email: "melvyn.thierrybellefond@gmail.com",
  links: {
    github: "https://github.com/Melvyn972",
    linkedin: "https://www.linkedin.com/in/melvyn-thierry-bellefond-9b135520b/",
    codeur: "https://www.codeur.com/-melvyntiyf5",
    site: "https://melvynthierrybellefond.xyz/",
    coldCall: "https://www.coldcallagency.com/",
  },
};

export const EXPERIENCES = [
  {
    period: "2024 → 2027",
    role: "Développeur Web & Chargé de Missions Informatique",
    company: "Passion Beauté",
    detail: "Alternance · ~100 magasins · Fontenay-sous-Bois",
    highlights: [
      "E-ResaPB & VDAPB — Symfony, API Platform, React, MySQL, Redis",
      "Pilotage budget IT & support TeamViewer multisite",
      "Migration Free Pro B2B sur 12 PDV (−66 %, ~19 000 €/an)",
    ],
  },
  {
    period: "2023 → 2024",
    role: "Développeur PHP",
    company: "Prisma Media",
    detail: "Alternance",
    highlights: [
      "Développement PHP sur l’écosystème média",
      "Intégration et maintenance d’applications métier",
    ],
  },
  {
    period: "2022 → 2023",
    role: "Webmaster",
    company: "Search Artisan",
    detail: "Alternance · WP / Webflow / Wix / Duda",
    highlights: [
      "Création et optimisation de sites vitrines",
      "SEO Ads & Google Search Console",
    ],
  },
];

export const PROJECTS = [
  {
    id: "vdapb",
    name: "VDAPB",
    stack: "Symfony 7 · React 18",
    blurb: "App métier nationale — BDC, DN, factures. Go-live prévu sept. 2026.",
    tag: "Métier",
  },
  {
    id: "eresapb",
    name: "E-ResaPB",
    stack: "Symfony · React · MySQL",
    blurb: "Click & Collect interne — 93 magasins, ~11 000 références.",
    tag: "Retail",
  },
  {
    id: "freepro",
    name: "Migration Free Pro",
    stack: "Infra · B2B fibre",
    blurb: "12 points de vente migrés — −66 % de coûts, ~19 000 €/an économisés.",
    tag: "Infra",
  },
  {
    id: "hubanimal",
    name: "HubAnimal",
    stack: "TypeScript",
    blurb: "Plateforme métier pensée pour la fluidité et la maintenabilité.",
    tag: "Web",
  },
  {
    id: "artwise",
    name: "ArtWise",
    stack: "Twig · PHP",
    blurb: "Expérience web artisanale, templates Twig soignés.",
    tag: "Web",
  },
  {
    id: "cynastore",
    name: "CynaStoreWeb",
    stack: "Next.js 14 · Prisma · Stripe",
    blurb: "E-commerce moderne avec paiement Stripe et data Prisma.",
    tag: "Commerce",
  },
  {
    id: "intranet",
    name: "Planning & Intranet",
    stack: "RH · Apps internes",
    blurb: "Pilotage RH et intranet pour équipes multisites.",
    tag: "Ops",
  },
  {
    id: "coldcall",
    name: "Cold Call Agency",
    stack: "Freelance client",
    blurb: "Mission freelance — présence web d’une agence de cold calling.",
    tag: "Client",
    href: "https://www.coldcallagency.com/",
  },
];

export const SKILL_CLUSTERS = [
  {
    id: "front",
    title: "Front",
    items: ["HTML/CSS", "JS/TS", "React", "Vue", "Vite", "Tailwind", "TanStack", "Twig"],
  },
  {
    id: "back",
    title: "Back",
    items: ["PHP", "Symfony", "Express", "Nest", "API Platform", "Doctrine", "JWT", "REST"],
  },
  {
    id: "data",
    title: "Data",
    items: ["MySQL", "SQLite", "Redis", "Supabase", "Neon"],
  },
  {
    id: "outils",
    title: "Outils",
    items: ["Figma", "DataGrip", "Power BI", "GitHub", "Docker"],
  },
  {
    id: "infra",
    title: "Infra",
    items: ["O2switch/cPanel", "CORS", "VLAN", "Fibre/4G/5G", "TPE/caisses"],
  },
  {
    id: "pilotage",
    title: "Pilotage",
    items: ["Support IT", "Budget IT", "Multisite", "SEO/CMS", "Ads", "Search Console"],
  },
];

export const PASSIONS = [
  {
    id: "auto",
    title: "Automobile",
    beat: "Comprendre un châssis, c’est comprendre un système.",
    craft: "Diagnostic, écoute des signaux faibles, optimisation sous contrainte.",
  },
  {
    id: "moto",
    title: "Moto",
    beat: "Équilibre, réaction, précision du geste.",
    craft: "Décisions rapides, feedback immédiat — comme en prod.",
  },
  {
    id: "horlogerie",
    title: "Horlogerie",
    beat: "Chaque pièce a une tolérance. L’ensemble doit tenir le temps.",
    craft: "Architecture propre, assemblage soigné, zéro jeu inutile.",
  },
  {
    id: "jeux",
    title: "Jeux vidéo",
    beat: "Systèmes, boucles, UX — un jeu est une app sous pression.",
    craft: "Perf, feedback, parcours utilisateur pensés pour l’engagement.",
  },
  {
    id: "pc",
    title: "Ordinateurs",
    beat: "Monter, flasher, tuner — le hardware comme terrain de jeu.",
    craft: "Infra locale, builds custom, culture du « faire soi-même ».",
  },
];

export const FORMATION = [
  {
    period: "2025 → 2027",
    title: "Mastère Lead Développeur Full-Stack",
    school: "IIM",
    detail: "RNCP 38590",
  },
  {
    period: "Bachelor",
    title: "Coordinateur de Projets Informatiques",
    school: "",
    detail: "",
  },
  {
    period: "BTS",
    title: "SIO SLAM",
    school: "",
    detail: "Solutions Logicielles et Applications Métiers",
  },
];

export const SERVICES = [
  "Sites vitrines & e-commerce",
  "Applications métier",
  "TMA & maintenance évolutive",
  "SEO & CMS",
  "Infra & réseaux PME",
  "Support & pilotage IT multisite",
];

/** Camera waypoints along the atelier path (world units). */
export const CAMERA_PATH: { id: SectionId; position: [number, number, number]; lookAt: [number, number, number] }[] = [
  { id: "entree", position: [0, 2.4, 13.5], lookAt: [0, 1.3, 2] },
  { id: "profil", position: [0.2, 1.85, 4.8], lookAt: [0.2, 1.15, 0.2] },
  { id: "diagnostic", position: [4.8, 2.1, 2.8], lookAt: [8.0, 1.15, -0.6] },
  { id: "competences", position: [-4.8, 2.35, 1.2], lookAt: [-8.0, 1.5, -1.8] },
  { id: "projets", position: [0.8, 1.7, -4.2], lookAt: [0.4, 0.85, -8] },
  { id: "passions", position: [-2.2, 2.15, -9.2], lookAt: [-5.2, 1.05, -12.2] },
  { id: "cv", position: [3.8, 1.95, -10.5], lookAt: [6.5, 1.25, -12.8] },
  { id: "contact", position: [0.3, 2.55, -15.5], lookAt: [0, 1.35, -20] },
];
