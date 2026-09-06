"use client";

import { CuboidCollider, HeightfieldCollider, RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import * as THREE from "three";
import { content } from "@/lib/content";
import { getBelvedereWorldAnchor, getRoadCurve, ROAD_SURFACE_LIFT, ROAD_WIDTH } from "@/lib/road";
import {
  sampleGroundHeight,
  TERRAIN_MAX_X,
  TERRAIN_MAX_Z,
  TERRAIN_MIN_X,
  TERRAIN_MIN_Z,
} from "@/lib/ground";

/**
 * Static Rapier colliders for the coastal slice.
 * Visual meshes stay separate — these are invisible physics proxies.
 */
export function WorldColliders() {
  const bel = useMemo(() => getBelvedereWorldAnchor(), []);
  const roadBoxes = useMemo(() => buildRoadColliders(), []);
  const walkPaths = useMemo(() => buildWalkPaths(), []);
  const rockBoxes = useMemo(() => buildRockColliders(), []);

  const maison = content.zones.zones.find((z) => z.id === "maison-atelier")?.marker;
  const studio = content.zones.zones.find((z) => z.id === "studio")?.marker;
  const phare = content.zones.zones.find((z) => z.id === "phare")?.marker;
  const heightfield = useMemo(() => buildTerrainHeightfield(), []);

  return (
    <group>
      {/* Visual-matching heightfield so pied never walks through hills */}
      <RigidBody type="fixed" colliders={false} position={heightfield.pos}>
        <HeightfieldCollider
          args={[heightfield.ncols, heightfield.nrows, heightfield.heights, heightfield.scale]}
          friction={1.15}
          restitution={0}
        />
      </RigidBody>
      {/* Ground slabs — keep player from falling under map */}
      <RigidBody type="fixed" colliders={false} position={[0, -0.5, -70]}>
        <CuboidCollider args={[80, 0.5, 140]} friction={1.2} restitution={0} />
      </RigidBody>

      {/* Sea wall — beyond the beach (plage marker x ≈ −22) */}
      <RigidBody type="fixed" colliders={false} position={[-30, 2, -70]}>
        <CuboidCollider args={[1.2, 6, 140]} friction={0.4} />
      </RigidBody>
      <RigidBody type="fixed" colliders={false} position={[-36, -2, -70]}>
        <CuboidCollider args={[4, 8, 140]} />
      </RigidBody>

      {/* Map bounds */}
      <RigidBody type="fixed" colliders={false} position={[34, 4, -70]}>
        <CuboidCollider args={[1, 10, 140]} />
      </RigidBody>
      <RigidBody type="fixed" colliders={false} position={[0, 4, 55]}>
        <CuboidCollider args={[50, 10, 1]} />
      </RigidBody>
      <RigidBody type="fixed" colliders={false} position={[0, 4, -200]}>
        <CuboidCollider args={[50, 10, 1]} />
      </RigidBody>

      {/* Road ribbon — driveable / walkable surface with grip */}
      {roadBoxes.map((b, i) => (
        <RigidBody key={`road-${i}`} type="fixed" colliders={false} position={b.pos} rotation={[0, b.yaw, 0]}>
          <CuboidCollider args={b.half} friction={1.4} restitution={0} />
        </RigidBody>
      ))}
      {/* Inland shoulder + beach corridor so Belvédère → maison / studio / plage stay open */}
      {walkPaths.map((b, i) => (
        <RigidBody key={`path-${i}`} type="fixed" colliders={false} position={b.pos} rotation={[0, b.yaw, 0]}>
          <CuboidCollider args={b.half} friction={1.2} restitution={0} />
        </RigidBody>
      ))}

      {/* Belvedere terrace + sea parapet + stair slab */}
      <RigidBody type="fixed" colliders={false} position={[bel.terrace.x, 0.92, bel.terrace.z]} rotation={[0, bel.yaw, 0]}>
        <CuboidCollider args={[4.2, 0.2, 3.6]} friction={1.35} />
      </RigidBody>
      <RigidBody
        type="fixed"
        colliders={false}
        position={[
          bel.terrace.x - bel.side.x * 3.35,
          1.42,
          bel.terrace.z - bel.side.z * 3.35,
        ]}
        rotation={[0, bel.yaw, 0]}
      >
        <CuboidCollider args={[4.1, 0.36, 0.22]} />
      </RigidBody>
      <RigidBody
        type="fixed"
        colliders={false}
        position={[
          bel.terrace.x + bel.side.x * 3.8,
          0.45,
          bel.terrace.z + bel.side.z * 3.8,
        ]}
        rotation={[0, bel.yaw, 0]}
      >
        <CuboidCollider args={[1.4, 0.2, 1.8]} friction={1.3} />
      </RigidBody>

      {/* Buildings — Kenney City ×6.x footprints + Dormin phare ×0.34 */}
      {maison && (
        <>
          {/* Tight footprints — leave the +Z plaza open for parcours / XP */}
          <RigidBody type="fixed" colliders={false} position={[maison.x, 3.2, maison.z - 0.4]} rotation={[0, -0.35, 0]}>
            <CuboidCollider args={[4.4, 3.2, 2.6]} />
          </RigidBody>
          <RigidBody type="fixed" colliders={false} position={[maison.x + 7.5, 2.9, maison.z + 1.4]} rotation={[0, 0.2, 0]}>
            <CuboidCollider args={[3.4, 2.9, 2.0]} />
          </RigidBody>
        </>
      )}
      {studio && (
        <RigidBody type="fixed" colliders={false} position={[studio.x, 3.1, studio.z - 0.35]} rotation={[0, 0.4, 0]}>
          <CuboidCollider args={[3.2, 3.1, 2.3]} />
        </RigidBody>
      )}
      {phare && (
        <>
          <RigidBody type="fixed" colliders={false} position={[phare.x, 5.5, phare.z]}>
            <CuboidCollider args={[1.6, 4.95, 1.6]} />
          </RigidBody>
          <RigidBody type="fixed" colliders={false} position={[phare.x, 0.4, phare.z]}>
            <CuboidCollider args={[2.6, 0.4, 2.5]} friction={0.95} />
          </RigidBody>
        </>
      )}

      {/* Shore / cliff rock proxies */}
      {rockBoxes.map((r, i) => (
        <RigidBody key={`rock-${i}`} type="fixed" colliders={false} position={r.pos}>
          <CuboidCollider args={r.half} friction={0.9} />
        </RigidBody>
      ))}
    </group>
  );
}

function buildTerrainHeightfield() {
  const ncols = 48;
  const nrows = 80;
  const sizeX = TERRAIN_MAX_X - TERRAIN_MIN_X;
  const sizeZ = TERRAIN_MAX_Z - TERRAIN_MIN_Z;
  const heights: number[] = [];
  // Rapier column-major: i * (nrows + 1) + j
  for (let ix = 0; ix <= ncols; ix++) {
    for (let iz = 0; iz <= nrows; iz++) {
      const x = TERRAIN_MIN_X + (ix / ncols) * sizeX;
      const z = TERRAIN_MIN_Z + (iz / nrows) * sizeZ;
      heights.push(sampleGroundHeight(x, z));
    }
  }
  return {
    ncols,
    nrows,
    heights,
    scale: { x: sizeX, y: 1, z: sizeZ },
    pos: [(TERRAIN_MIN_X + TERRAIN_MAX_X) / 2, 0, (TERRAIN_MIN_Z + TERRAIN_MAX_Z) / 2] as [number, number, number],
  };
}

function buildRoadColliders() {
  const curve = getRoadCurve();
  const boxes: { pos: [number, number, number]; yaw: number; half: [number, number, number] }[] = [];
  const n = 48;
  for (let i = 0; i < n; i++) {
    const t0 = i / n;
    const t1 = (i + 1) / n;
    const a = curve.getPointAt(t0);
    const b = curve.getPointAt(t1);
    const mid = a.clone().lerp(b, 0.5);
    const tangent = b.clone().sub(a);
    const len = Math.max(0.5, tangent.length() * 0.55);
    const yaw = Math.atan2(tangent.x, tangent.z);
    boxes.push({
      pos: [mid.x, mid.y + ROAD_SURFACE_LIFT, mid.z],
      yaw,
      half: [ROAD_WIDTH * 0.52, 0.1, len],
    });
  }
  return boxes;
}

function buildWalkPaths() {
  const curve = getRoadCurve();
  const boxes: { pos: [number, number, number]; yaw: number; half: [number, number, number] }[] = [];
  const n = 36;
  for (let i = 0; i < n; i++) {
    const t0 = i / n;
    const t1 = (i + 1) / n;
    const a = curve.getPointAt(t0);
    const b = curve.getPointAt(t1);
    const mid = a.clone().lerp(b, 0.5);
    const tangent = b.clone().sub(a);
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const inland = mid.clone().addScaledVector(side, 5.6);
    boxes.push({
      pos: [inland.x, mid.y + 0.04, inland.z],
      yaw: Math.atan2(tangent.x, tangent.z),
      half: [2.6, 0.1, Math.max(0.5, tangent.length() * 0.55)],
    });
  }
  const bel = getBelvedereWorldAnchor();
  const midStairs = bel.terrace.clone().addScaledVector(bel.side, 4.2);
  boxes.push({
    pos: [midStairs.x, 0.55, midStairs.z],
    yaw: bel.yaw,
    half: [1.6, 0.18, 2.4],
  });

  // Beach access near plage marker (−11, −95)
  boxes.push({ pos: [-12, sampleGroundHeight(-12, -95) + 0.06, -95], yaw: 0.15, half: [8.5, 0.1, 7] });
  // Maison plaza (in front of the building, +Z)
  boxes.push({ pos: [16, sampleGroundHeight(16, -37) + 0.06, -37], yaw: 0, half: [6, 0.1, 5] });
  // Studio plaza
  boxes.push({ pos: [18, sampleGroundHeight(18, -113) + 0.06, -113], yaw: 0, half: [5, 0.1, 5] });
  return boxes;
}

function buildRockColliders() {
  const curve = getRoadCurve();
  const rocks: { pos: [number, number, number]; half: [number, number, number] }[] = [];
  // Sparse sea-side pebbles — must NOT form a wall to the beach
  for (let i = 0; i < 8; i++) {
    const t = 0.14 + (i / 8) * 0.68;
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const pos = p.clone().addScaledVector(side, -12.2 - (i % 2) * 0.8);
    rocks.push({
      pos: [pos.x, 0.45, pos.z],
      half: [0.7, 0.55, 0.65],
    });
  }
  return rocks;
}
