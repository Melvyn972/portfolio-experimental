"use client";

import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import * as THREE from "three";
import { content } from "@/lib/content";
import { getBelvedereWorldAnchor, getRoadCurve, ROAD_WIDTH } from "@/lib/road";

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

  return (
    <group>
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

      {/* Belvedere terrace + parapets */}
      <RigidBody type="fixed" colliders={false} position={[bel.terrace.x, 0.55, bel.terrace.z]} rotation={[0, bel.yaw, 0]}>
        <CuboidCollider args={[5.2, 0.55, 4.2]} friction={1.3} />
      </RigidBody>
      <RigidBody
        type="fixed"
        colliders={false}
        position={[
          bel.terrace.x + bel.side.x * -4.9,
          1.35,
          bel.terrace.z + bel.side.z * -4.9,
        ]}
        rotation={[0, bel.yaw, 0]}
      >
        <CuboidCollider args={[0.45, 0.85, 4.0]} />
      </RigidBody>
      <RigidBody
        type="fixed"
        colliders={false}
        position={[
          bel.terrace.x + bel.tangent.x * -3.7,
          1.2,
          bel.terrace.z + bel.tangent.z * -3.7,
        ]}
        rotation={[0, bel.yaw, 0]}
      >
        <CuboidCollider args={[4.8, 0.7, 0.35]} />
      </RigidBody>
      <RigidBody
        type="fixed"
        colliders={false}
        position={[
          bel.terrace.x + bel.tangent.x * 3.7,
          1.2,
          bel.terrace.z + bel.tangent.z * 3.7,
        ]}
        rotation={[0, bel.yaw, 0]}
      >
        <CuboidCollider args={[4.8, 0.7, 0.35]} />
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
            <CuboidCollider args={[1.9, 4.95, 1.9]} />
          </RigidBody>
          {/* Rock skirt around lighthouse base */}
          <RigidBody type="fixed" colliders={false} position={[phare.x, 0.55, phare.z]}>
            <CuboidCollider args={[4.2, 0.55, 4.0]} friction={0.95} />
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
      pos: [mid.x, mid.y + 0.08, mid.z],
      yaw,
      half: [ROAD_WIDTH * 0.52, 0.12, len],
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
  // Beach access near plage marker (−22, −95)
  boxes.push({ pos: [-14, 0.06, -95], yaw: 0.15, half: [8.5, 0.1, 7] });
  // Maison plaza (in front of the building, +Z)
  boxes.push({ pos: [16, 0.08, -37], yaw: 0, half: [6, 0.1, 5] });
  // Studio plaza
  boxes.push({ pos: [18, 0.08, -113], yaw: 0, half: [5, 0.1, 5] });
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
