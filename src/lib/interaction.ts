import * as THREE from "three";
import type { ChapterId } from "@/lib/gameStore";
import { getBelvedereWorldAnchor } from "@/lib/road";
import { content } from "@/lib/content";
import { MAISON_PORCH } from "@/lib/spawn";

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
      label: "Ouvrir le carnet",
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
        label: "Plans de carrière",
        position: new THREE.Vector3(MAISON_PORCH.x, maison.y + 0.15, MAISON_PORCH.z),
        radius: 7.2,
        walkingOnly: true,
      },
      {
        id: "maison-xp",
        chapter: "experiences",
        label: "Montre — le temps",
        position: new THREE.Vector3(maison.x - 2, maison.y + 1, maison.z + 4.0),
        radius: 3.0,
        walkingOnly: true,
      },
      {
        id: "maison-skills",
        chapter: "competences",
        label: "Ouvrir l’ordinateur",
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
      label: "Feuilleter le carnet de croquis",
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
      label: "Appareil photo",
      position: new THREE.Vector3(plage.x, 0.4, plage.z),
      radius: 4.2,
      walkingOnly: true,
    });
    list.push({
      id: "plage-helmet",
      chapter: "passions",
      label: "Casque moto",
      position: new THREE.Vector3(plage.x + 2.4, 0.35, plage.z + 1.6),
      radius: 3.4,
      walkingOnly: true,
    });
  }

  const phare = zones["phare"];
  if (phare) {
    list.push(
      {
        id: "phare-activite",
        chapter: "activite",
        label: "Lanternes — freelance",
        position: new THREE.Vector3(phare.x + 2.5, phare.y + 0.5, phare.z + 2),
        radius: 3.5,
        walkingOnly: true,
      },
      {
        id: "phare-cv",
        chapter: "cv",
        label: "Enveloppe du CV",
        position: new THREE.Vector3(phare.x, phare.y + 0.5, phare.z + 2.2),
        radius: 3.2,
        walkingOnly: true,
      },
      {
        id: "phare-contact",
        chapter: "contact",
        label: "Lire la plaque",
        position: new THREE.Vector3(phare.x - 2.2, phare.y + 0.5, phare.z + 1.8),
        radius: 3.2,
        walkingOnly: true,
      },
    );
  }

  return list;
}

function xzDistance(pos: THREE.Vector3, target: THREE.Vector3) {
  return Math.hypot(pos.x - target.x, pos.z - target.z);
}

export function interactableForChapter(chapter: ChapterId): Interactable | null {
  return getInteractables().find((it) => it.chapter === chapter) ?? null;
}

export function chapterForInteractableId(id: string | null | undefined): ChapterId | null {
  if (!id) return null;
  return getInteractables().find((it) => it.id === id)?.chapter ?? null;
}

export function findNearestInteractable(
  pos: THREE.Vector3,
  mode: "driving" | "walking",
  preferChapter?: ChapterId | null,
): Interactable | null {
  if (preferChapter) {
    const preferred = interactableForChapter(preferChapter);
    if (preferred && (!preferred.walkingOnly || mode === "walking")) {
      if (xzDistance(pos, preferred.position) <= preferred.radius) return preferred;
    }
  }
  let best: Interactable | null = null;
  let bestD = Infinity;
  for (const it of getInteractables()) {
    if (it.walkingOnly && mode !== "walking") continue;
    const d = xzDistance(pos, it.position);
    if (d <= it.radius && d < bestD) {
      best = it;
      bestD = d;
    }
  }
  return best;
}
