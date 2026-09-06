import * as THREE from "three";
import { getBelvedereWorldAnchor } from "@/lib/road";
import { content } from "@/lib/content";

export type Collider = {
  id: string;
  min: THREE.Vector3;
  max: THREE.Vector3;
  /** Soft push out rather than hard block */
  soft?: boolean;
};

const _center = new THREE.Vector3();
const _half = new THREE.Vector3();
const _closest = new THREE.Vector3();
const _push = new THREE.Vector3();

function box(id: string, cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, soft = false): Collider {
  return {
    id,
    soft,
    min: new THREE.Vector3(cx - sx / 2, cy - sy / 2, cz - sz / 2),
    max: new THREE.Vector3(cx + sx / 2, cy + sy / 2, cz + sz / 2),
  };
}

/** Static world colliders — rebuilt from zone anchors. */
export function buildWorldColliders(): Collider[] {
  const list: Collider[] = [];
  const bel = getBelvedereWorldAnchor();

  // Belvedere parapet (sea side) — local −X of terrace
  const yaw = bel.yaw;
  const side = bel.side;
  const along = bel.tangent;
  const t = bel.terrace;

  // Parapet wall
  {
    const p = t.clone().addScaledVector(side, -4.95);
    list.push(box("bel-parapet", p.x, 1.3, p.z, 1.2, 1.6, 7.5));
  }
  // Side rails
  {
    const p1 = t.clone().addScaledVector(along, -3.75);
    const p2 = t.clone().addScaledVector(along, 3.75);
    list.push(box("bel-rail-n", p1.x, 1.2, p1.z, 9, 1.2, 0.6));
    list.push(box("bel-rail-s", p2.x, 1.15, p2.z, 9, 1.0, 0.6));
  }

  for (const zone of content.zones.zones) {
    const { x, z } = zone.marker;
    if (zone.id === "maison-atelier") {
      // Kenney City building-type-b @ ×6.2 + atelier wing @ ×5.2
      list.push(box("maison", x, 3.55, z, 11.4, 7.1, 7.2));
      list.push(box("maison-wing", x + 7.5, 3.25, z + 2, 9.2, 6.5, 5.4));
    }
    if (zone.id === "studio") {
      // Kenney City building-type-e @ ×6.0
      list.push(box("studio", x, 3.45, z, 8.0, 6.9, 6.3));
    }
    if (zone.id === "phare") {
      // Daniel Dormin lighthouse @ ×0.34 — mesh already grounded at local y=0
      list.push(box("phare", x, 5.5, z, 3.8, 9.9, 3.8));
      list.push(box("phare-base", x, 0.55, z, 8.4, 1.1, 8.0));
    }
  }

  void yaw;
  return list;
}

let cached: Collider[] | null = null;

export function getColliders() {
  if (!cached) cached = buildWorldColliders();
  return cached;
}

export function resetColliders() {
  cached = null;
}

/**
 * Resolve capsule (xz circle + height) against AABB colliders.
 * Mutates `pos` (feet position). Returns whether a hit occurred.
 */
export function resolveCollisions(pos: THREE.Vector3, radius: number, height: number): boolean {
  const colliders = getColliders();
  let hit = false;
  const bodyMinY = pos.y + 0.2;
  const bodyMaxY = pos.y + height;

  for (const c of colliders) {
    if (bodyMaxY < c.min.y || bodyMinY > c.max.y) continue;

    _center.set((c.min.x + c.max.x) * 0.5, 0, (c.min.z + c.max.z) * 0.5);
    _half.set((c.max.x - c.min.x) * 0.5 + radius, 0, (c.max.z - c.min.z) * 0.5 + radius);

    _closest.x = THREE.MathUtils.clamp(pos.x, _center.x - _half.x + radius, _center.x + _half.x - radius);
    _closest.z = THREE.MathUtils.clamp(pos.z, _center.z - _half.z + radius, _center.z + _half.z - radius);

    // Inside expanded AABB?
    const insideX = pos.x > c.min.x - radius && pos.x < c.max.x + radius;
    const insideZ = pos.z > c.min.z - radius && pos.z < c.max.z + radius;
    if (!insideX || !insideZ) continue;

    // Push out along smallest penetration
    const penL = pos.x - (c.min.x - radius);
    const penR = c.max.x + radius - pos.x;
    const penN = pos.z - (c.min.z - radius);
    const penS = c.max.z + radius - pos.z;
    const minPen = Math.min(penL, penR, penN, penS);
    if (minPen < 0) continue;

    _push.set(0, 0, 0);
    if (minPen === penL) _push.x = -penL;
    else if (minPen === penR) _push.x = penR;
    else if (minPen === penN) _push.z = -penN;
    else _push.z = penS;

    if (c.soft) {
      pos.x += _push.x * 0.35;
      pos.z += _push.z * 0.35;
    } else {
      pos.x += _push.x;
      pos.z += _push.z;
    }
    hit = true;
  }

  return hit;
}
