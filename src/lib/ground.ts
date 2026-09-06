import * as THREE from "three";
import { nearestRoadSample, getBelvedereWorldAnchor } from "@/lib/road";
import { content } from "@/lib/content";

/**
 * Approximate ground height for walk / camera — road sample + zone plateaus.
 * Not a full heightmap; good enough for the coastal slice.
 */
export function sampleGroundHeight(x: number, z: number): number {
  const sample = nearestRoadSample(new THREE.Vector3(x, 0, z), 80);
  const lat = Math.abs(sample.lateral);
  let y = sample.position.y;

  if (lat < 5) y = sample.position.y;
  else if (lat < 12) y = THREE.MathUtils.lerp(sample.position.y, 0.15, (lat - 5) / 7);
  else y = 0.2 + Math.sin(x * 0.04 + z * 0.02) * 0.12;

  const terrace = getBelvedereWorldAnchor().terrace;
  const dx = x - terrace.x;
  const dz = z - terrace.z;
  if (dx * dx + dz * dz < 90) y = Math.max(y, 1.0);

  // Zone plateaus from markers
  for (const zone of content.zones.zones) {
    const mx = zone.marker.x;
    const mz = zone.marker.z;
    const ddx = x - mx;
    const ddz = z - mz;
    const r = zone.id === "phare" ? 14 : zone.id === "plage" ? 18 : 12;
    if (ddx * ddx + ddz * ddz < r * r) {
      const base = zone.id === "plage" ? 0.15 : zone.marker.y;
      y = Math.max(y, base);
    }
  }

  // Sea drop
  if (x < -10) {
    const lip = THREE.MathUtils.smoothstep(-10, -18, -x);
    y = THREE.MathUtils.lerp(y, -0.2, lip);
  }

  return y;
}

export const MAX_SLOPE = 0.55; // ~29°
export const PLAYER_RADIUS = 0.35;
export const PLAYER_HEIGHT = 1.7;
