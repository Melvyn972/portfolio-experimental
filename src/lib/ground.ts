import * as THREE from "three";
import { nearestRoadSample, getBelvedereWorldAnchor, ROAD_WIDTH } from "@/lib/road";
import { content } from "@/lib/content";

/** Same bounds as the Terrain plane (x remapped −12…70, z shifted −55). */
export const TERRAIN_MIN_X = -12;
export const TERRAIN_MAX_X = 70;
export const TERRAIN_MIN_Z = -185;
export const TERRAIN_MAX_Z = 75;

/**
 * Authoritative visual + gameplay height. Terrain mesh, camera clearance,
 * walk snap and the Rapier heightfield all call this — no more hidden hills.
 */
export function computeTerrainHeight(x: number, z: number): number {
  const sample = nearestRoadSample(new THREE.Vector3(x, 0, z), 60);
  const lat = sample.lateral;
  const roadDist = Math.abs(lat);
  let y = 0.02;

  if (roadDist < 5) {
    y = sample.position.y;
  } else if (roadDist < 10) {
    const t = (roadDist - 5) / 5;
    y = THREE.MathUtils.lerp(sample.position.y, 0.15, t);
  } else {
    y = 0.2 + Math.sin(x * 0.04 + z * 0.02) * 0.15 + Math.cos(z * 0.03) * 0.08;
  }

  if (x < -6) {
    const lip = THREE.MathUtils.smoothstep(-6, -12, -x);
    y = THREE.MathUtils.lerp(y, -0.15, lip);
  }

  if (x > 5) {
    const rise = THREE.MathUtils.smoothstep(5, 28, x);
    const ridge =
      Math.sin(z * 0.045) * 1.4 + Math.cos(z * 0.09 + x * 0.05) * 0.9 + Math.sin(x * 0.12) * 0.6;
    y = Math.max(y, rise * (3.2 + ridge) + Math.pow(rise, 1.6) * 2.8);
    if (x > 6 && x < 14 && roadDist > 6) {
      y = Math.max(y, 1.2 + (x - 6) * 0.55 + Math.sin(z * 0.15) * 0.4);
    }
  }

  const terrace = getBelvedereWorldAnchor().terrace;
  const dx = x - terrace.x;
  const dz = z - terrace.z;
  if (dx * dx + dz * dz < 120) {
    y = Math.max(y, 0.95);
  }

  if (x > 12 && z < -30 && z > -55) y = Math.max(y, 1.6);
  if (x > 12 && z < -108 && z > -130) y = Math.max(y, 1.8);
  if (x > 2 && z < -175 && z > -195) y = Math.max(y, 3.8);

  {
    const pdx = x - -8;
    const pdz = z - -168;
    if (pdx * pdx + pdz * pdz < 90) {
      const falloff = 1 - Math.sqrt(pdx * pdx + pdz * pdz) / 9.5;
      y = Math.max(y, 0.35 + falloff * 1.4);
    }
  }
  if (x < -14 && z < -85 && z > -110) y = Math.min(y, 0.2);

  for (const zone of content.zones.zones) {
    const ddx = x - zone.marker.x;
    const ddz = z - zone.marker.z;
    const r = zone.id === "phare" ? 14 : zone.id === "plage" ? 18 : 12;
    if (ddx * ddx + ddz * ddz < r * r) {
      const base = zone.id === "plage" ? 0.15 : zone.marker.y;
      y = Math.max(y, base);
    }
  }

  // LAST: excavate a corridor under the asphalt. Plateaus / hills must never
  // poke through the road (iPhone QA: beige z-fighting on every shot).
  const half = ROAD_WIDTH * 0.52;
  const apron = 2.4;
  if (roadDist < half) {
    y = Math.min(y, sample.position.y - 0.32);
  } else if (roadDist < half + apron) {
    const k = (roadDist - half) / apron;
    const trench = sample.position.y - 0.32;
    y = Math.min(y, THREE.MathUtils.lerp(trench, y, k));
  }

  return y;
}

/**
 * Approximate ground height for walk / camera — identical to the Terrain mesh.
 */
export function sampleGroundHeight(x: number, z: number): number {
  return computeTerrainHeight(x, z);
}

export const MAX_SLOPE = 0.55; // ~29°
export const PLAYER_RADIUS = 0.35;
export const PLAYER_HEIGHT = 1.7;
