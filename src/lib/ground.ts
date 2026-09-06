import * as THREE from "three";
import { nearestRoadSample, getBelvedereWorldAnchor, ROAD_WIDTH, ROAD_SURFACE_LIFT } from "@/lib/road";
import { content } from "@/lib/content";

/** Visual + heightfield bounds. Extends past the beach so sand meets the sea. */
export const TERRAIN_MIN_X = -24;
export const TERRAIN_MAX_X = 70;
export const TERRAIN_MIN_Z = -185;
export const TERRAIN_MAX_Z = 75;

/** Flat sand under the asphalt and past the lip — no trench, no vertical cut. */
export const ROAD_SAND_APRON = ROAD_WIDTH * 0.5 + 1.85;
/** Inland ramp from road edge up to the maison / studio plazas. */
export const INLAND_SHELF_WIDTH = 14;
export const PLAZA_HEIGHT = 1.64;

function sandBedY(roadY: number) {
  return roadY + ROAD_SURFACE_LIFT - 0.05;
}

function scenicHeight(x: number, z: number): { y: number; roadDist: number; roadY: number; onAccess: boolean } {
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

  // Continuous sand bed under the ribbon + a wide apron past both lips.
  // Asphalt is a thin overlay a few cm above this bed — never a hole.
  if (roadDist < ROAD_SAND_APRON) {
    y = sandBedY(roadY);
  }

  const seaRamp = seaShoulderY(lat, roadY);
  if (seaRamp != null) y = seaRamp;

  // Beach drop only well past the apron — never at the driving lip.
  if (x < -12 && roadDist > ROAD_SAND_APRON + 2.2) {
    const lip = THREE.MathUtils.smoothstep(-12, -20, -x);
    y = THREE.MathUtils.lerp(y, -0.14, lip);
  }

  const shelf = inlandShelfY(lat, roadY);
  if (shelf != null) {
    // Continuous walkable ground Route → Maison → Studio. No cliff, no trench.
    y = shelf;
  } else if (x > 18 && lat > INLAND_SHELF_WIDTH + ROAD_WIDTH) {
    const rise = THREE.MathUtils.smoothstep(18, 36, x);
    const ridge =
      Math.sin(z * 0.045) * 0.7 + Math.cos(z * 0.09 + x * 0.05) * 0.45 + Math.sin(x * 0.12) * 0.3;
    y = Math.max(y, PLAZA_HEIGHT + rise * (1.4 + ridge));
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
    const pdx = x - -16;
    const pdz = z - -172;
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

  const access = walkAccessHeight(x, z);
  // Inland ramps may rise. Never lower the sea-side apron (that opened the cyan trench).
  if (access != null && roadDist >= ROAD_WIDTH * 0.62) {
    y = lat < 0 ? Math.max(y, access) : access;
  }

  // Final lock under the asphalt — terrace / zone lifts must not poke through,
  // and no later sculpt can open a trench at the driving lip.
  if (roadDist < ROAD_WIDTH * 0.5 + 0.28) {
    y = sandBedY(roadY);
  }

  return { y, roadDist, roadY, onAccess: access != null && roadDist >= ROAD_WIDTH * 0.62 };
}

export function roadClearance(x: number, z: number) {
  const { y, roadDist, roadY } = scenicHeight(x, z);
  return { y, roadDist, roadY };
}

/** Visual = scenic. No trench, no hole. */
export function computeTerrainHeight(x: number, z: number): number {
  return scenicHeight(x, z).y;
}

/** Sea-side sand: flat apron past the lip, then a long slope to the beach. */
export function seaShoulderY(lat: number, roadY: number): number | null {
  const lip = ROAD_WIDTH * 0.5;
  if (lat > -lip) return null;
  const bed = sandBedY(roadY);
  if (lat >= -ROAD_SAND_APRON) return bed;
  if (lat < -ROAD_SAND_APRON - 10) return null;
  const t = THREE.MathUtils.clamp((-lat - ROAD_SAND_APRON) / 8.5, 0, 1);
  const e = t * t * (3 - 2 * t);
  return THREE.MathUtils.lerp(bed, -0.12, e);
}

/** Smooth inland shelf: road shoulder → plaza height over INLAND_SHELF_WIDTH. */
export function inlandShelfY(lat: number, roadY: number): number | null {
  const edge = ROAD_WIDTH * 0.5 + 0.35;
  if (lat < edge * 0.12) return null;
  if (lat > edge + INLAND_SHELF_WIDTH + 10) return null;
  const t = THREE.MathUtils.clamp((lat - edge) / INLAND_SHELF_WIDTH, 0, 1);
  const e = t * t * (3 - 2 * t);
  return THREE.MathUtils.lerp(sandBedY(roadY), PLAZA_HEIGHT, e);
}

/**
 * Walk / camera / heightfield — stand on the road, never in a visual trench.
 */
export function sampleGroundHeight(x: number, z: number): number {
  const { y, roadDist, roadY, onAccess } = scenicHeight(x, z);
  if (roadDist < ROAD_WIDTH * 0.55) return roadY;
  if (onAccess) return y;
  return y;
}

export const MAX_SLOPE = 0.55;
export const PLAYER_RADIUS = 0.35;
export const PLAYER_HEIGHT = 1.7;

/** Wide inland ramps — backup if the shelf sample is missed. */
export function accessCorridors(): { width: number; pts: { x: number; z: number; y: number }[] }[] {
  const bel = getBelvedereWorldAnchor();
  return [
    {
      width: 11,
      pts: [
        { x: 5.2, z: -36, y: 0.42 },
        { x: 10.5, z: -37, y: 1.15 },
        { x: 16, z: -37, y: 1.62 },
        { x: 16, z: -46, y: 1.62 },
      ],
    },
    {
      width: 11,
      pts: [
        { x: 5.4, z: -114, y: 0.55 },
        { x: 11, z: -114, y: 1.2 },
        { x: 18, z: -113, y: 1.82 },
        { x: 18, z: -122, y: 1.82 },
      ],
    },
    {
      width: 10,
      pts: [
        { x: 14, z: -40, y: 1.62 },
        { x: 15.5, z: -76, y: 1.68 },
        { x: 16.5, z: -112, y: 1.8 },
      ],
    },
    {
      width: 5.6,
      pts: [
        { x: -4.2, z: -95, y: 0.22 },
        { x: -11, z: -95, y: 0.18 },
      ],
    },
    {
      width: 4.2,
      pts: [
        { x: -5.8, z: -165, y: 0.36 },
        { x: -11.5, z: -170, y: 0.32 },
        { x: -16, z: -172, y: 0.36 },
      ],
    },
    {
      width: 3.4,
      pts: [
        { x: bel.stop.x, z: bel.stop.z, y: bel.position.y + 0.04 },
        {
          x: bel.terrace.x + bel.side.x * 3.6,
          z: bel.terrace.z + bel.side.z * 3.6,
          y: 0.55,
        },
        { x: bel.terrace.x, z: bel.terrace.z, y: 1.0 },
      ],
    },
  ];
}

export function walkAccessHeight(x: number, z: number): number | null {
  let bestY: number | null = null;
  let bestD = Infinity;
  for (const c of accessCorridors()) {
    const hit = projectOnPolyline(x, z, c.pts);
    if (hit.dist < c.width && hit.dist < bestD) {
      bestD = hit.dist;
      bestY = hit.y;
    }
  }
  return bestY;
}

function projectOnPolyline(x: number, z: number, pts: { x: number; z: number; y: number }[]) {
  let dist = Infinity;
  let y = pts[0]?.y ?? 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const len2 = abx * abx + abz * abz || 1;
    let t = ((x - a.x) * abx + (z - a.z) * abz) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = a.x + abx * t;
    const pz = a.z + abz * t;
    const d = Math.hypot(x - px, z - pz);
    if (d < dist) {
      dist = d;
      y = a.y + (b.y - a.y) * t;
    }
  }
  return { dist, y };
}
