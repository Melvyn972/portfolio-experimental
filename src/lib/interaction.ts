import * as THREE from "three";
import type { ChapterId } from "@/lib/gameStore";
import { getBelvedereWorldAnchor } from "@/lib/road";
import { content } from "@/lib/content";

export type Interactable = {
  id: string;
  chapter: ChapterId;
  label: string;
  position: THREE.Vector3;
  radius: number;
  /** Prefer approaching from walking mode */
  walkingOnly?: boolean;
};

export function getInteractables(): Interactable[] {
  const bel = getBelvedereWorldAnchor();
  const zones = Object.fromEntries(content.zones.zones.map((z) => [z.id, z.marker]));

  const list: Interactable[] = [
    {
      id: "carnet",
      chapter: "identity",
      label: "Consulter le carnet",
      position: bel.terrace.clone().setY(1.2),
      radius: 3.8,
      walkingOnly: true,
    },
  ];

  const maison = zones["maison-atelier"];
  if (maison) {
    list.push(
      {
        id: "maison-parcours",
        chapter: "parcours",
        label: "Parcours",
        position: new THREE.Vector3(maison.x + 0.5, maison.y + 1, maison.z + 4.2),
        radius: 4.6,
        walkingOnly: true,
      },
      {
        id: "maison-xp",
        chapter: "experiences",
        label: "Expériences",
        position: new THREE.Vector3(maison.x - 2, maison.y + 1, maison.z + 4.0),
        radius: 3.0,
        walkingOnly: true,
      },
      {
        id: "maison-skills",
        chapter: "competences",
        label: "Compétences",
        position: new THREE.Vector3(maison.x + 5, maison.y + 1, maison.z + 3.5),
        radius: 3.0,
        walkingOnly: true,
      },
    );
  }

  const studio = zones["studio"];
  if (studio) {
    list.push({
      id: "studio-projets",
      chapter: "projets",
      label: "Voir les projets",
      position: new THREE.Vector3(studio.x, studio.y + 1, studio.z + 3.8),
      radius: 3.5,
      walkingOnly: true,
    });
  }

  const plage = zones["plage"];
  if (plage) {
    list.push({
      id: "plage-passions",
      chapter: "passions",
      label: "Passions",
      position: new THREE.Vector3(plage.x, 0.4, plage.z),
      radius: 5,
      walkingOnly: true,
    });
  }

  const phare = zones["phare"];
  if (phare) {
    list.push(
      {
        id: "phare-activite",
        chapter: "activite",
        label: "Activité",
        position: new THREE.Vector3(phare.x + 2.5, phare.y + 0.5, phare.z + 2),
        radius: 3.5,
        walkingOnly: true,
      },
      {
        id: "phare-cv",
        chapter: "cv",
        label: "CV",
        position: new THREE.Vector3(phare.x, phare.y + 0.5, phare.z + 2.2),
        radius: 3.2,
        walkingOnly: true,
      },
      {
        id: "phare-contact",
        chapter: "contact",
        label: "Contact",
        position: new THREE.Vector3(phare.x - 2.2, phare.y + 0.5, phare.z + 1.8),
        radius: 3.2,
        walkingOnly: true,
      },
    );
  }

  return list;
}

export function findNearestInteractable(
  pos: THREE.Vector3,
  mode: "driving" | "walking",
): Interactable | null {
  let best: Interactable | null = null;
  let bestD = Infinity;
  for (const it of getInteractables()) {
    if (it.walkingOnly && mode !== "walking") continue;
    const d = pos.distanceTo(it.position);
    if (d <= it.radius && d < bestD) {
      best = it;
      bestD = d;
    }
  }
  return best;
}
