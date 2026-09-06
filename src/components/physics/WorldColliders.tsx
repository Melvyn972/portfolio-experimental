"use client";

import { CuboidCollider, HeightfieldCollider, RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import { content } from "@/lib/content";
import { getBelvedereWorldAnchor } from "@/lib/road";
import {
  sampleGroundHeight,
  TERRAIN_MAX_X,
  TERRAIN_MAX_Z,
  TERRAIN_MIN_X,
  TERRAIN_MIN_Z,
} from "@/lib/ground";

/**
 * Physics = heightfield that matches the visible ground, plus tight building
 * footprints. Extra road / path / rock cuboids were invisible walls.
 */
export function WorldColliders() {
  const bel = useMemo(() => getBelvedereWorldAnchor(), []);
  const maison = content.zones.zones.find((z) => z.id === "maison-atelier")?.marker;
  const studio = content.zones.zones.find((z) => z.id === "studio")?.marker;
  const phare = content.zones.zones.find((z) => z.id === "phare")?.marker;
  const heightfield = useMemo(() => buildTerrainHeightfield(), []);
  const maisonY = maison ? sampleGroundHeight(maison.x, maison.z) : 1.6;
  const studioY = studio ? sampleGroundHeight(studio.x, studio.z) : 1.8;

  return (
    <group>
      <RigidBody type="fixed" colliders={false} position={heightfield.pos}>
        <HeightfieldCollider
          args={[heightfield.ncols, heightfield.nrows, heightfield.heights, heightfield.scale]}
          friction={1.2}
          restitution={0}
        />
      </RigidBody>

      {/* Catch-all far below the mesh — never intersects walking */}
      <RigidBody type="fixed" colliders={false} position={[0, -2.2, -70]}>
        <CuboidCollider args={[90, 0.4, 150]} friction={1.1} restitution={0} />
      </RigidBody>

      {/* Sea / map bounds — well outside playable beach and plazas */}
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
            position={[maison.x, maisonY + 2.4, maison.z - 0.9]}
            rotation={[0, -0.35, 0]}
          >
            <CuboidCollider args={[2.6, 2.4, 1.7]} />
          </RigidBody>
          <RigidBody
            type="fixed"
            colliders={false}
            position={[maison.x + 7.5, maisonY + 2.1, maison.z + 1.6]}
            rotation={[0, 0.2, 0]}
          >
            <CuboidCollider args={[2.0, 2.1, 1.35]} />
          </RigidBody>
        </>
      )}
      {studio && (
        <RigidBody
          type="fixed"
          colliders={false}
          position={[studio.x, studioY + 2.3, studio.z - 0.7]}
          rotation={[0, 0.4, 0]}
        >
          <CuboidCollider args={[2.15, 2.3, 1.55]} />
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

function buildTerrainHeightfield() {
  const ncols = 72;
  const nrows = 120;
  const sizeX = TERRAIN_MAX_X - TERRAIN_MIN_X;
  const sizeZ = TERRAIN_MAX_Z - TERRAIN_MIN_Z;
  const heights: number[] = [];
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
