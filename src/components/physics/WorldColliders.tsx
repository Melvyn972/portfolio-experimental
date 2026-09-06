"use client";

import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import { content } from "@/lib/content";
import { getBelvedereWorldAnchor } from "@/lib/road";
import { sampleGroundHeight } from "@/lib/ground";

/**
 * Physics = heightfield that matches the visible ground, plus tight building
 * footprints. Extra road / path / rock cuboids were invisible walls.
 */
export function WorldColliders() {
  const bel = useMemo(() => getBelvedereWorldAnchor(), []);
  const maison = content.zones.zones.find((z) => z.id === "maison-atelier")?.marker;
  const studio = content.zones.zones.find((z) => z.id === "studio")?.marker;
  const phare = content.zones.zones.find((z) => z.id === "phare")?.marker;
  const maisonY = maison ? sampleGroundHeight(maison.x, maison.z) : 1.6;
  const studioY = studio ? sampleGroundHeight(studio.x, studio.z) : 1.8;

  return (
    <group>
      {/* Catch-all far below the mesh — never intersects walking */}
      <RigidBody type="fixed" colliders={false} position={[0, -2.2, -70]}>
        <CuboidCollider args={[90, 0.4, 150]} friction={1.1} restitution={0} />
      </RigidBody>

      {/* Sea wall at the water sheet — no swim-off. Beach (x ≳ −16.5) stays open. */}
      <RigidBody type="fixed" colliders={false} position={[-18.15, 2.2, -70]}>
        <CuboidCollider args={[0.55, 6, 140]} friction={0.35} />
      </RigidBody>
      <RigidBody type="fixed" colliders={false} position={[-34, 2, -70]}>
        <CuboidCollider args={[1, 8, 140]} friction={0.4} />
      </RigidBody>
      <RigidBody type="fixed" colliders={false} position={[38, 4, -70]}>
        <CuboidCollider args={[1, 10, 140]} />
      </RigidBody>
      <RigidBody type="fixed" colliders={false} position={[0, 4, 58]}>
        <CuboidCollider args={[50, 10, 1]} />
      </RigidBody>
      <RigidBody type="fixed" colliders={false} position={[0, 4, -204]}>
        <CuboidCollider args={[50, 10, 1]} />
      </RigidBody>

      {/* Belvedere floor + sea parapet only — stairs stay open toward the road */}
      <RigidBody type="fixed" colliders={false} position={[bel.terrace.x, 0.88, bel.terrace.z]} rotation={[0, bel.yaw, 0]}>
        <CuboidCollider args={[3.6, 0.16, 3.1]} friction={1.35} />
      </RigidBody>
      <RigidBody
        type="fixed"
        colliders={false}
        position={[bel.terrace.x - bel.side.x * 3.4, 1.35, bel.terrace.z - bel.side.z * 3.4]}
        rotation={[0, bel.yaw, 0]}
      >
        <CuboidCollider args={[3.5, 0.32, 0.16]} />
      </RigidBody>

      {maison && (
        <>
          {/* Walls only — porch at +Z (z ≈ −37) stays open */}
          <RigidBody
            type="fixed"
            colliders={false}
            position={[maison.x, maisonY + 5.2, maison.z - 1.4]}
            rotation={[0, -0.35, 0]}
          >
            <CuboidCollider args={[2.4, 5.2, 1.45]} />
          </RigidBody>
          <RigidBody
            type="fixed"
            colliders={false}
            position={[maison.x + 7.5, maisonY + 4.6, maison.z + 1.6]}
            rotation={[0, 0.2, 0]}
          >
            <CuboidCollider args={[2.15, 4.6, 1.5]} />
          </RigidBody>
        </>
      )}
      {studio && (
        <RigidBody
          type="fixed"
          colliders={false}
          position={[studio.x, studioY + 5.0, studio.z - 1.0]}
          rotation={[0, 0.4, 0]}
        >
          <CuboidCollider args={[2.0, 5.0, 1.4]} />
        </RigidBody>
      )}
      {phare && (
        <>
          <RigidBody type="fixed" colliders={false} position={[phare.x, 5.2, phare.z]}>
            <CuboidCollider args={[1.15, 4.6, 1.15]} />
          </RigidBody>
          <RigidBody type="fixed" colliders={false} position={[phare.x, 0.28, phare.z]}>
            <CuboidCollider args={[2.1, 0.28, 2.0]} friction={0.95} />
          </RigidBody>
        </>
      )}
    </group>
  );
}
