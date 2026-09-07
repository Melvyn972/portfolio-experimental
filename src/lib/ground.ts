import * as THREE from "three";
import { nearestRoadSample, getBelvedereWorldAnchor, ROAD_WIDTH, ROAD_SURFACE_LIFT } from "@/lib/road";
import { content } from "@/lib/content";
import { VILLAGE_SQUARE } from "@/lib/town";
import { SEA_BED_Y, SEA_INLAND_X, SEA_SURFACE_Y } from "@/lib/sea";
import { walkPlatformHeight } from "@/lib/lighthouseClimb";

/** Visual bounds — seaward cells drop under the sea sheet (never cover it). */
export const TERRAIN_MIN_X = -28;
export const TERRAIN_MAX_X = 70;
export const TERRAIN_MIN_Z = -220;
export const TERRAIN_MAX_Z = 90;

/** Flat sand under the asphalt and past the lip — no trench, no vertical cut. */
export const ROAD_SAND_APRON = ROAD_WIDTH * 0.5 + 1.85;
/** Inland ramp from road edge up to the maison / studio plazas. */
export const INLAND_SHELF_WIDTH = 14;
export const PLAZA_HEIGHT = 1.64;

function sandBedY(roadY: number) {
  // Asphalt overlay is at roadY + ROAD_SURFACE_LIFT (20 cm). A 1.8 cm gap
  // let the coarse heightfield interpolate above the ribbon (Melvyn: dirt blanket).
  return roadY;
}

function scenicHeight(x: number, z: number): { y: number; roadDist: number; roadY: number; onAccess: boolean } {
  const sample = nearestRoadSample(new THREE.Vector3(x, 0, z), 280);
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

  // Beach slopes to the waterline. Seaward of SEA_INLAND_X the bed drops
  // under the Mediterranean — never a dirt sheet over the water.
  if (x < -11 && roadDist > ROAD_SAND_APRON + 1.2) {
    if (x >= SEA_INLAND_X) {
      // Seaward x: −11 → −17.4. Three.smoothstep(x,min,max) needs min<max,
      // so we use −x. Old (−x) in a decreasing range never sloped the beach.
      const lip = THREE.MathUtils.clamp((-11 - x) / (-11 - SEA_INLAND_X), 0, 1);
      const ease = lip * lip * (3 - 2 * lip);
      y = THREE.MathUtils.lerp(y, SEA_SURFACE_Y + 0.045, ease);
    } else {
      y = Math.min(y, SEA_BED_Y);
    }
  }

  const shelf = inlandShelfY(lat, roadY);
  if (shelf != null) {
    // Continuous walkable ground Route → Maison → Studio. No cliff, no trench.
    y = shelf;
  } else if (x > 22 && lat > INLAND_SHELF_WIDTH + ROAD_WIDTH + 4) {
    const rise = THREE.MathUtils.smoothstep(22, 40, x);
    const ridge =
      Math.sin(z * 0.045) * 0.55 + Math.cos(z * 0.09 + x * 0.05) * 0.35 + Math.sin(x * 0.12) * 0.22;
    y = Math.max(y, PLAZA_HEIGHT + rise * (1.15 + ridge));
  }

  const terrace = getBelvedereWorldAnchor().terrace;
  const dx = x - terrace.x;
  const dz = z - terrace.z;
  const terraceR2 = dx * dx + dz * dz;
  // Soft mound under the deck only — a hard 11 m disc was a floating sand slab over the beach.
  if (terraceR2 < 40) {
    const fall = 1 - Math.sqrt(terraceR2) / 6.4;
    y = Math.max(y, 0.14 + fall * fall * 0.8);
  }

  if (x > 16 && z < -30 && z > -55) y = Math.max(y, 1.55);
  if (x > 16 && z < -108 && z > -130) y = Math.max(y, 1.7);
  // Overlook ridge stays inland of the drive ribbon (was x>6 → dirt wall).
  if (x > 16 && z < -178 && z > -198) y = Math.max(y, 2.4);

  {
    const pdx = x - -16;
    const pdz = z - -172;
    // Mound only on the sea rock — never in the drive windshield.
    if (x < -11 && pdx * pdx + pdz * pdz < 64) {
      const falloff = 1 - Math.sqrt(pdx * pdx + pdz * pdz) / 8;
      y = Math.max(y, 0.28 + falloff * 0.9);
    }
  }
  if (x < -14 && z < -85 && z > -110) y = Math.min(y, 0.2);

  for (const zone of content.zones.zones) {
    const ddx = x - zone.marker.x;
    const ddz = z - zone.marker.z;
    const r = zone.id === "phare" ? 8 : zone.id === "plage" ? 16 : 12;
    if (ddx * ddx + ddz * ddz >= r * r) continue;
    // Belvedere marker.y = 1.2 over a 12 m disc lifted the beach into a floating mesa.
    if (zone.id === "belvedere") continue;
    // WOW mesa at x=6 / y=4.5 sat in the windshield as a dirt wall.
    if (zone.id === "wow") continue;
    if (zone.id === "plage") {
      if (x < -14.6) continue;
      y = Math.max(y, 0.1);
      continue;
    }
    if (zone.id === "phare" && (x > -11 || roadDist < 12)) continue;
    if (lat < -1.2 && zone.id !== "phare") continue;
    y = Math.max(y, zone.marker.y);
  }

  const access = walkAccessHeight(x, z);
  // Inland ramps may rise. Never lower the sea-side apron (that opened the cyan trench).
  if (access != null && roadDist >= ROAD_WIDTH * 0.62) {
    y = lat < 0 ? Math.max(y, access) : access;
  }

  // Drive corridor: nothing taller than a low shoulder. Zone / plaza lifts
  // were building a dirt wall in the windshield (Melvyn HARD FAIL).
  const driveFlat = ROAD_WIDTH * 0.5 + 9.2;
  if (roadDist < driveFlat) {
    const t = THREE.MathUtils.clamp((roadDist - ROAD_WIDTH * 0.5 - 0.2) / 8.8, 0, 1);
    const cap = sandBedY(roadY) + t * t * 0.14;
    if (y > cap) y = cap;
  }
  // Hard: sand/dirt never reaches the asphalt plane on the ribbon.
  if (roadDist < ROAD_WIDTH * 0.5 + 0.95) {
    y = Math.min(y, sandBedY(roadY));
  }
  if (roadDist < ROAD_WIDTH * 0.5 + 0.4) {
    y = sandBedY(roadY);
  }

  // Absolute last: heightfield must not cover the sea sheet.
  if (x < SEA_INLAND_X) {
    y = Math.min(y, SEA_BED_Y);
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
  return THREE.MathUtils.lerp(bed, SEA_SURFACE_Y + 0.04, e);
}

/** Smooth inland shelf: road shoulder → plaza height over INLAND_SHELF_WIDTH. */
export function inlandShelfY(lat: number, roadY: number): number | null {
  const edge = ROAD_WIDTH * 0.5 + 6.2;
  if (lat < edge) return null;
  if (lat > edge + INLAND_SHELF_WIDTH + 10) return null;
  const t = THREE.MathUtils.clamp((lat - edge) / INLAND_SHELF_WIDTH, 0, 1);
  const e = t * t * (3 - 2 * t);
  return THREE.MathUtils.lerp(sandBedY(roadY) + 0.18, PLAZA_HEIGHT, e);
}

/**
 * Walk / camera / heightfield — stand on the road, never in a visual trench.
 */
export function sampleGroundHeight(x: number, z: number): number {
  const { y, roadDist, roadY, onAccess } = scenicHeight(x, z);
  // Stand on the asphalt overlay, not 20 cm under the road cuboid / ribbon.
  if (roadDist < ROAD_WIDTH * 0.55) return roadY + ROAD_SURFACE_LIFT;
  if (onAccess) return y;
  return y;
}

/** Walking only — lighthouse treads. Drive / heightfield stay on sampleGroundHeight. */
export function sampleWalkHeight(x: number, z: number): number {
  const base = sampleGroundHeight(x, z);
  const plat = walkPlatformHeight(x, z);
  if (plat == null) return base;
  return Math.max(base, plat);
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
        { x: 13.2, z: -36, y: 0.85 },
        { x: 15.2, z: -37, y: 1.35 },
        { x: 16, z: -37, y: 1.62 },
        { x: 16, z: -46, y: 1.62 },
      ],
    },
    {
      width: 11,
      pts: [
        { x: 13.4, z: -114, y: 0.9 },
        { x: 15.4, z: -114, y: 1.4 },
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
      width: 3.8,
      pts: [
        { x: 4.2, z: VILLAGE_SQUARE.z, y: 0.22 },
        { x: 7.6, z: VILLAGE_SQUARE.z, y: 0.38 },
        { x: VILLAGE_SQUARE.x, z: VILLAGE_SQUARE.z, y: 0.55 },
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
