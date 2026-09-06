import * as THREE from "three";
import { nearestRoadSample, getBelvedereWorldAnchor, ROAD_WIDTH } from "@/lib/road";
import { content } from "@/lib/content";

/** Same bounds as the Terrain plane (x remapped −12…70, z shifted −55). */
export const TERRAIN_MIN_X = -12;
export const TERRAIN_MAX_X = 70;
export const TERRAIN_MIN_Z = -185;
export const TERRAIN_MAX_Z = 75;

/** How far from the centerline every terrain vertex must stay below the ribbon. */
const VISUAL_TRENCH = ROAD_WIDTH * 0.5 + 3.6;

function scenicHeight(x: number, z: number): { y: number; roadDist: number; roadY: number } {
  const sample = nearestRoadSample(new THREE.Vector3(x, 0, z), 160);
  const lat = sample.lateral;
  const roadDist = Math.min(Math.abs(lat), sample.dist);
  const roadY = sample.position.y;
  let y = 0.02;

  if (roadDist < 5) {
    y = roadY;
  } else if (roadDist < 10) {
    const t = (roadDist - 5) / 5;
    y = THREE.MathUtils.lerp(roadY, 0.15, t);
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

  return { y, roadDist, roadY };
}

/**
 * Visual terrain — always carved under the asphalt so interpolated faces
 * cannot slice through the ribbon (iPhone z-fight).
 */
export function computeTerrainHeight(x: number, z: number): number {
  const { y, roadDist, roadY } = scenicHeight(x, z);
  if (roadDist < VISUAL_TRENCH) {
    return Math.min(y, roadY - 0.5);
  }
  return y;
}

/**
 * Walk / camera / heightfield — stand on the road, never in the visual trench.
 */
export function sampleGroundHeight(x: number, z: number): number {
  const { y, roadDist, roadY } = scenicHeight(x, z);
  if (roadDist < ROAD_WIDTH * 0.55) return roadY;
  return y;
}

export const MAX_SLOPE = 0.55;
export const PLAYER_RADIUS = 0.35;
export const PLAYER_HEIGHT = 1.7;
