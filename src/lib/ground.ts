import * as THREE from "three";
import { nearestRoadSample, getBelvedereWorldAnchor, ROAD_WIDTH } from "@/lib/road";
import { content } from "@/lib/content";

/** Same bounds as the Terrain plane (x remapped −12…70, z shifted −55). */
export const TERRAIN_MIN_X = -12;
export const TERRAIN_MAX_X = 70;
export const TERRAIN_MIN_Z = -185;
export const TERRAIN_MAX_Z = 75;

/**
 * Trench ONLY under the asphalt prism (sea-side + ribbon).
 * The old +5.2 m drop carved an 8.8 m canyon that isolated Maison / Studio
 * (blue void, floating buildings). Inland verts must stay as a walkable shelf.
 */
const ROAD_PRISM_HALF = ROAD_WIDTH * 0.5 + 0.55;
const VISUAL_TRENCH = ROAD_PRISM_HALF + 0.28;
const TRENCH_DROP = 1.15;
/** Delete only faces under the asphalt prism — inland shelf stays meshed. */
export const ROAD_CUT_MARGIN = ROAD_WIDTH * 0.5 + 0.42;
/** Inland ramp from road edge up to the maison / studio plazas. */
export const INLAND_SHELF_WIDTH = 14;
export const PLAZA_HEIGHT = 1.64;

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

  if (x < -6) {
    const lip = THREE.MathUtils.smoothstep(-6, -12, -x);
    y = THREE.MathUtils.lerp(y, -0.15, lip);
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
  // Never lift the driving ribbon — that pushed sand onto asphalt.
  if (access != null && roadDist >= ROAD_WIDTH * 0.62) y = access;

  return { y, roadDist, roadY, onAccess: access != null && roadDist >= ROAD_WIDTH * 0.62 };
}

export function roadClearance(x: number, z: number) {
  const { y, roadDist, roadY } = scenicHeight(x, z);
  return { y, roadDist, roadY };
}

/**
 * Visual terrain. Sand is dropped only under the prism on the sea side so
 * interpolated faces cannot climb onto asphalt. Inland is a filled shelf.
 */
export function computeTerrainHeight(x: number, z: number): number {
  const sample = nearestRoadSample(new THREE.Vector3(x, 0, z), 160);
  const lat = sample.lateral;
  const { y, roadDist, roadY } = scenicHeight(x, z);
  // Sea / centerline only. Inland stays meshed at shelf height (below asphalt
  // near the edge) so Route → Maison has no blue hole.
  if (lat <= 0.55 && roadDist < VISUAL_TRENCH) {
    return Math.min(y, roadY - TRENCH_DROP);
  }
  // Inland under the prism: keep the face but never let sand reach asphalt.
  if (roadDist < ROAD_PRISM_HALF) {
    return Math.min(y, roadY - 0.22);
  }
  return y;
}

/** Smooth inland shelf: road shoulder → plaza height over INLAND_SHELF_WIDTH. */
export function inlandShelfY(lat: number, roadY: number): number | null {
  const edge = ROAD_WIDTH * 0.5 + 0.35;
  if (lat < edge * 0.12) return null;
  if (lat > edge + INLAND_SHELF_WIDTH + 10) return null;
  const t = THREE.MathUtils.clamp((lat - edge) / INLAND_SHELF_WIDTH, 0, 1);
  const e = t * t * (3 - 2 * t);
  return THREE.MathUtils.lerp(roadY + 0.045, PLAZA_HEIGHT, e);
}

/** True when a probe sits on / across the driving ribbon (used to cut triangles). */
export function isRoadCutProbe(x: number, z: number): boolean {
  const sample = nearestRoadSample(new THREE.Vector3(x, 0, z), 160);
  const lat = sample.lateral;
  const roadDist = Math.min(Math.abs(lat), sample.dist);
  // Keep inland triangles — cutting them opened the blue hole toward Maison.
  if (lat > 0.45) return false;
  return roadDist < ROAD_CUT_MARGIN;
}

/**
 * Walk / camera / heightfield — stand on the road, never in the visual trench.
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
