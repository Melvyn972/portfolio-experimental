import * as THREE from "three";
import { sampleGroundHeight } from "@/lib/ground";
import { getBelvedereWorldAnchor } from "@/lib/road";

export type WalkSpawn = { x: number; y: number; z: number; yaw: number };

function finite(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

export function isFinitePos(p: { x?: unknown; y?: unknown; z?: unknown } | null | undefined): p is {
  x: number;
  y: number;
  z: number;
} {
  return Boolean(p && finite(p.x) && finite(p.y) && finite(p.z));
}

/** Clamp + ground-snap. Never returns NaN / Infinity. */
export function sanitizeWalkSpawn(raw: { x?: unknown; y?: unknown; z?: unknown; yaw?: unknown }): WalkSpawn | null {
  if (!finite(raw.x) || !finite(raw.z)) return null;
  const x = THREE.MathUtils.clamp(raw.x, -27, 31);
  const z = THREE.MathUtils.clamp(raw.z, -194, 49);
  let y = sampleGroundHeight(x, z);
  if (!finite(y)) y = 0.2;
  y = THREE.MathUtils.clamp(y, -0.2, 8);
  const yaw = finite(raw.yaw) ? raw.yaw : 0;
  return { x, y, z, yaw };
}

/** Porch in front of the maison — Menu → Parcours must land inside the interact radius. */
export const MAISON_PORCH = { x: 16.15, z: -36.2 };

export function zoneWalkSpawns(): Record<"belvedere" | "maison" | "studio" | "plage" | "phare", WalkSpawn> {
  const bel = getBelvedereWorldAnchor();
  const snap = (x: number, z: number, yaw: number): WalkSpawn => {
    const s = sanitizeWalkSpawn({ x, z, yaw });
    return s ?? { x, y: 0.2, z, yaw };
  };
  return {
    belvedere: snap(bel.terrace.x, bel.terrace.z, bel.yaw),
    maison: snap(MAISON_PORCH.x, MAISON_PORCH.z, Math.PI),
    studio: snap(18.1, -112.4, Math.PI),
    plage: snap(-8, -95, -Math.PI / 2),
    phare: snap(-14, -170, -2.4),
  };
}
