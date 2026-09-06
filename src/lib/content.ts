import identity from "../../content/identity.json";
import contact from "../../content/contact.json";
import experiences from "../../content/experiences.json";
import formations from "../../content/formations.json";
import competences from "../../content/competences.json";
import projets from "../../content/projets.json";
import activite from "../../content/activite.json";
import zones from "../../content/zones.json";
import passions from "../../content/passions.json";

export const content = {
  identity,
  contact,
  experiences,
  formations,
  competences,
  projets,
  activite,
  zones,
  passions,
} as const;

export type Content = typeof content;
