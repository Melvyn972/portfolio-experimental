import * as THREE from "three";
import { sampleGroundHeight } from "@/lib/ground";
import { START_POSE, nearestRoadSample } from "@/lib/road";

const SAFE = new THREE.Vector3();

/** True if player is in void / sea / under terrain — must respawn. */
export function isUnsafePosition(pos: THREE.Vector3): boolean {
  if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y) || !Number.isFinite(pos.z)) return true;
  if (pos.y < -1.2) return true;
  if (pos.x < -29 && pos.y < 0.35) return true;
  if (pos.x > 36 || pos.x < -36) return true;
  if (pos.z > 58 || pos.z < -205) return true;
  const ground = sampleGroundHeight(pos.x, pos.z);
  if (pos.y < ground - 0.85) return true;
  return false;
}

/** Nearest safe standing position — road shoulder or start. */
export function safeRespawnPosition(from: THREE.Vector3): THREE.Vector3 {
  const sample = nearestRoadSample(from, 100);
  if (sample.dist < 40) {
    SAFE.copy(sample.position);
    SAFE.y = sampleGroundHeight(SAFE.x, SAFE.z) + 0.05;
    return SAFE.clone();
  }
  SAFE.copy(START_POSE.position);
  SAFE.y = sampleGroundHeight(SAFE.x, SAFE.z) + 0.05;
  return SAFE.clone();
}
