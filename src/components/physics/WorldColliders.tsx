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

      {/* Sea wall — cannot walk into the water */}
      <RigidBody type="fixed" colliders={false} position={[-26, 2, -70]}>
        <CuboidCollider args={[1.2, 6, 140]} friction={0.4} />
      </RigidBody>
      {/* Deep sea kill volume sensor handled in character; soft barrier further out */}
      <RigidBody type="fixed" colliders={false} position={[-32, -2, -70]}>
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

      {/* Buildings */}
      {maison && (
        <>
          <RigidBody type="fixed" colliders={false} position={[maison.x, 1.7, maison.z]}>
            <CuboidCollider args={[4.6, 1.7, 3.4]} />
          </RigidBody>
          <RigidBody type="fixed" colliders={false} position={[maison.x + 5.2, 1.2, maison.z + 1.2]}>
            <CuboidCollider args={[2.0, 1.2, 2.1]} />
          </RigidBody>
        </>
      )}
      {studio && (
        <RigidBody type="fixed" colliders={false} position={[studio.x, 1.4, studio.z]}>
          <CuboidCollider args={[3.6, 1.4, 2.6]} />
        </RigidBody>
      )}
      {phare && (
        <RigidBody type="fixed" colliders={false} position={[phare.x, 4.2, phare.z]}>
          <CuboidCollider args={[1.6, 4.2, 1.6]} />
        </RigidBody>
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

function buildRockColliders() {
  const curve = getRoadCurve();
  const rocks: { pos: [number, number, number]; half: [number, number, number] }[] = [];
  for (let i = 0; i < 22; i++) {
    const t = 0.08 + (i / 22) * 0.85;
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const pos = p.clone().addScaledVector(side, -11 - (i % 5) * 1.1);
    const s = 0.7 + (i % 4) * 0.35;
    rocks.push({
      pos: [pos.x, 0.4 * s, pos.z],
      half: [1.1 * s, 0.9 * s, 1.0 * s],
    });
  }
  // Extra cliff blockers on sea side
  for (let i = 0; i < 12; i++) {
    const t = 0.1 + (i / 12) * 0.8;
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const pos = p.clone().addScaledVector(side, -16);
    rocks.push({
      pos: [pos.x, 1.2, pos.z],
      half: [2.2, 2.0, 2.5],
    });
  }
  return rocks;
}
