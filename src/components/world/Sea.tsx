"use client";

import * as THREE from "three";
import { SEA_INLAND_X, SEA_SURFACE_Y } from "@/lib/sea";

export { SEA_INLAND_X, SEA_SURFACE_Y };

/**
 * Flat Mediterranean sheet. Custom wave GLSL died silently on Soft-GL
 * (parent: water replaced by ochre). Standard material always draws.
 */
export function Sea({ segments = 8 }: { segments?: number }) {
  void segments;
  const width = 86;
  const depth = 270;
  const centerX = SEA_INLAND_X - width * 0.5;

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, SEA_SURFACE_Y, -55]}
        renderOrder={0}
        frustumCulled={false}
      >
        <planeGeometry args={[width, depth, 1, 1]} />
        <meshStandardMaterial
        color="#157a8a"
        roughness={0.32}
        metalness={0.06}
          envMapIntensity={0.7}
          depthWrite
          side={THREE.FrontSide}
        />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[SEA_INLAND_X - 9.2, SEA_SURFACE_Y + 0.01, -55]}
        renderOrder={1}
        frustumCulled={false}
      >
        <planeGeometry args={[18.4, depth]} />
        <meshStandardMaterial
        color="#2a9aa4"
        roughness={0.4}
          metalness={0.04}
          depthWrite
          side={THREE.FrontSide}
        />
      </mesh>
    </group>
  );
}
