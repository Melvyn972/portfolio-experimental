"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { sampleGroundHeight } from "@/lib/ground";
import { nearestRoadSample, ROAD_WIDTH } from "@/lib/road";
import { enableShadows, groundClone } from "@/lib/gltfFit";
import { useCoastalPbr } from "@/lib/pbrTextures";

/**
 * Place du village — one readable quarter, not Kenney scatter.
 * Fountain, campanile, café terrace. Always drawn on Éco.
 */
export function VillageHeart() {
  const pbr = useCoastalPbr(3);
  const { scene: benchSrc } = useGLTF("/models/ph/painted_wooden_bench/painted_wooden_bench_1k.gltf");
  const { scene: potSrc } = useGLTF("/models/ph/planter_pot_clay/planter_pot_clay_1k.gltf");
  const bench = useMemo(() => {
    const c = benchSrc.clone(true);
    enableShadows(c);
    groundClone(c);
    return c;
  }, [benchSrc]);
  const pot = useMemo(() => {
    const c = potSrc.clone(true);
    enableShadows(c);
    groundClone(c);
    return c;
  }, [potSrc]);

  const origin = useMemo(() => {
    const x = 24.4;
    const z = -65.2;
    return { x, z, y: sampleGroundHeight(x, z), yaw: 0.08 };
  }, []);

  if (Math.abs(nearestRoadSample(new THREE.Vector3(origin.x, 0, origin.z)).lateral) < ROAD_WIDTH * 0.7) {
    return null;
  }

  return (
    <group position={[origin.x, origin.y, origin.z]} rotation={[0, origin.yaw, 0]}>
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[4.2, 4.4, 0.06, 16]} />
        <meshStandardMaterial
          color="#c4a078"
          map={pbr.terra.map}
          roughnessMap={pbr.terra.roughnessMap}
          roughness={0.86}
        />
      </mesh>

      {/* Fountain */}
      <mesh position={[0, 0.22, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.15, 1.25, 0.28, 14]} />
        <meshStandardMaterial color="#c8b898" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.82, 0.88, 0.16, 14]} />
        <meshStandardMaterial color="#9ab0b4" roughness={0.18} metalness={0.12} />
      </mesh>
      <mesh position={[0, 0.78, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.55, 8]} />
        <meshStandardMaterial color="#b8a888" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.08, 0]}>
        <sphereGeometry args={[0.16, 10, 8]} />
        <meshStandardMaterial color="#d8e4e6" roughness={0.15} metalness={0.08} />
      </mesh>

      {/* Campanile — small chapel tower */}
      <group position={[2.85, 0, -1.4]}>
        <mesh position={[0, 1.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.35, 2.7, 1.25]} />
          <meshStandardMaterial color="#efe4d2" map={pbr.stucco.map} roughness={0.86} />
        </mesh>
        <mesh position={[0, 2.95, 0]} castShadow>
          <boxGeometry args={[1.55, 0.55, 1.45]} />
          <meshStandardMaterial color="#c45c3e" map={pbr.roof.map} roughness={0.62} />
        </mesh>
        <mesh position={[0, 3.55, 0]} castShadow>
          <boxGeometry args={[0.42, 0.85, 0.42]} />
          <meshStandardMaterial color="#efe4d2" roughness={0.84} />
        </mesh>
        <mesh position={[0, 4.15, 0]} castShadow>
          <coneGeometry args={[0.38, 0.55, 4]} />
          <meshStandardMaterial color="#a44c32" roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.7, 0.64]}>
          <boxGeometry args={[0.38, 0.55, 0.06]} />
          <meshStandardMaterial color="#2c221c" roughness={0.4} />
        </mesh>
      </group>

      {/* Café awning + tables */}
      <group position={[-2.6, 0, 1.15]}>
        <mesh position={[0, 2.15, 0.15]} rotation={[0.12, 0, 0]} castShadow>
          <boxGeometry args={[2.6, 0.06, 1.35]} />
          <meshStandardMaterial color="#c45c3e" map={pbr.roof.map} roughness={0.65} />
        </mesh>
        {[-0.7, 0.7].map((x) => (
          <mesh key={x} position={[x, 0.72, 0.2]} castShadow>
            <cylinderGeometry args={[0.28, 0.3, 0.06, 10]} />
            <meshStandardMaterial color="#d8c4a0" roughness={0.7} />
          </mesh>
        ))}
      </group>

      <primitive object={bench.clone(true)} position={[1.6, 0, 2.15]} rotation={[0, -0.4, 0]} scale={1.02} />
      <primitive object={pot.clone(true)} position={[-1.8, 0, 2.35]} scale={0.95} />
      <primitive object={pot.clone(true)} position={[3.2, 0, 1.1]} scale={0.8} />

      {/* Laundry line */}
      <mesh position={[-0.2, 2.05, 2.55]}>
        <boxGeometry args={[3.4, 0.02, 0.02]} />
        <meshStandardMaterial color="#d8d0c4" roughness={0.55} />
      </mesh>
      {[-1.1, 0.15, 1.2].map((x, i) => (
        <mesh key={x} position={[x, 1.72, 2.55]} rotation={[0, 0, i === 1 ? 0.08 : -0.06]}>
          <boxGeometry args={[0.42, 0.55, 0.02]} />
          <meshStandardMaterial color={i === 1 ? "#c8b070" : "#d8d0c4"} roughness={0.78} />
        </mesh>
      ))}
    </group>
  );
}

useGLTF.preload("/models/ph/painted_wooden_bench/painted_wooden_bench_1k.gltf");
useGLTF.preload("/models/ph/planter_pot_clay/planter_pot_clay_1k.gltf");
