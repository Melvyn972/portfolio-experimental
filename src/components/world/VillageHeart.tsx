"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { sampleGroundHeight } from "@/lib/ground";
import { nearestRoadSample, ROAD_WIDTH } from "@/lib/road";
import { enableShadows, groundClone } from "@/lib/gltfFit";
import { useCoastalPbr } from "@/lib/pbrTextures";
import { VILLAGE_SQUARE } from "@/lib/town";

function useGrounded(path: string) {
  const { scene } = useGLTF(path);
  return useMemo(() => {
    const c = scene.clone(true);
    enableShadows(c);
    groundClone(c);
    return c;
  }, [scene]);
}

/**
 * Place du village — readable from the southbound chase cam.
 * Campanile + café face the road; promenade from the pull-off. Always on Éco.
 */
export function VillageHeart() {
  const pbr = useCoastalPbr(3);
  const bench = useGrounded("/models/ph/painted_wooden_bench/painted_wooden_bench_1k.gltf");
  const pot = useGrounded("/models/ph/planter_pot_clay/planter_pot_clay_1k.gltf");
  const ceramic = useGrounded("/models/ph/ceramic_pot/ceramic_pot_1k.gltf");
  const cypress = useGrounded("/models/cypress.glb");
  const olive = useGrounded("/models/olive.glb");
  const lamp = useGrounded("/models/lamp.glb");

  const origin = useMemo(() => {
    const { x, z } = VILLAGE_SQUARE;
    const road = nearestRoadSample(new THREE.Vector3(x, 0, z));
    if (Math.abs(road.lateral) < ROAD_WIDTH * 0.5 + 5.4) return null;
    return { x, z, y: sampleGroundHeight(x, z), yaw: 0 };
  }, []);

  const promenade = useMemo(() => {
    if (!origin) return [];
    const items: { pos: [number, number, number]; yaw: number }[] = [];
    const x0 = 4.35;
    const z0 = origin.z + 0.15;
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      const x = THREE.MathUtils.lerp(x0, origin.x - 3.35, t);
      const z = THREE.MathUtils.lerp(z0, origin.z + 0.2, t);
      if (Math.abs(nearestRoadSample(new THREE.Vector3(x, 0, z)).lateral) < ROAD_WIDTH * 0.5 + 0.4) continue;
      items.push({
        pos: [x, sampleGroundHeight(x, z) + 0.025, z],
        yaw: 0.02,
      });
    }
    return items;
  }, [origin]);

  if (!origin) return null;

  return (
    <group>
      {promenade.map((s, i) => (
        <mesh key={`pr-${i}`} position={s.pos} rotation={[0, s.yaw, 0]} receiveShadow>
          <boxGeometry args={[1.85, 0.05, 2.05]} />
          <meshStandardMaterial
            color="#c4a078"
            map={pbr.cobble.map}
            roughnessMap={pbr.cobble.roughnessMap}
            roughness={0.88}
          />
        </mesh>
      ))}

      <group position={[origin.x, origin.y, origin.z]} rotation={[0, origin.yaw, 0]}>
        <mesh position={[0, 0.035, 0]} receiveShadow>
          <cylinderGeometry args={[5.15, 5.35, 0.07, 18]} />
          <meshStandardMaterial
            color="#c8b090"
            map={pbr.cobble.map}
            roughnessMap={pbr.cobble.roughnessMap}
            roughness={0.86}
          />
        </mesh>

        <Fountain pbr={pbr} />
        <Campanile pbr={pbr} />
        <Cafe pbr={pbr} />

        <primitive object={bench.clone(true)} position={[-1.55, 0, 2.05]} rotation={[0, 0.55, 0]} scale={1.04} />
        <primitive object={bench.clone(true)} position={[1.85, 0, 1.85]} rotation={[0, -0.7, 0]} scale={1.0} />
        <primitive object={pot.clone(true)} position={[-2.55, 0, -1.15]} scale={1.05} />
        <primitive object={ceramic.clone(true)} position={[2.35, 0, 2.55]} scale={0.92} />
        <primitive object={lamp.clone(true)} position={[-3.55, 0, 0.15]} scale={1.28} />
        <primitive object={cypress.clone(true)} position={[-3.85, 0, -2.35]} scale={1.22} />
        <primitive object={cypress.clone(true)} position={[-3.65, 0, 2.55]} scale={1.15} />
        <primitive object={olive.clone(true)} position={[3.85, 0, 0.35]} scale={0.92} />

        {[-1.35, 0.15, 1.45].map((x, i) => (
          <mesh key={`ln-${x}`} position={[x, 1.78, 3.15]} rotation={[0, 0, i === 1 ? 0.1 : -0.07]}>
            <boxGeometry args={[0.46, 0.62, 0.02]} />
            <meshStandardMaterial color={i === 1 ? "#c8b070" : "#d8d0c4"} roughness={0.78} />
          </mesh>
        ))}
        <mesh position={[0.1, 2.12, 3.15]}>
          <boxGeometry args={[3.6, 0.02, 0.02]} />
          <meshStandardMaterial color="#d8d0c4" roughness={0.55} />
        </mesh>
      </group>
    </group>
  );
}

function Fountain({ pbr }: { pbr: ReturnType<typeof useCoastalPbr> }) {
  return (
    <group>
      <mesh position={[0, 0.16, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.45, 1.58, 0.32, 16]} />
        <meshStandardMaterial color="#c8b898" map={pbr.terra.map} roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[1.05, 1.12, 0.18, 16]} />
        <meshStandardMaterial color="#8eb0b4" roughness={0.16} metalness={0.14} />
      </mesh>
      <mesh position={[0, 0.92, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.2, 0.85, 8]} />
        <meshStandardMaterial color="#b8a888" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.38, 0]}>
        <sphereGeometry args={[0.22, 10, 8]} />
        <meshStandardMaterial color="#d8e4e6" roughness={0.12} metalness={0.1} />
      </mesh>
    </group>
  );
}

function Campanile({ pbr }: { pbr: ReturnType<typeof useCoastalPbr> }) {
  return (
    <group position={[3.15, 0, -2.05]}>
      <mesh position={[0, 0.18, 0]} receiveShadow>
        <boxGeometry args={[1.85, 0.36, 1.75]} />
        <meshStandardMaterial color="#9a8c74" roughness={0.94} />
      </mesh>
      <mesh position={[0, 2.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.55, 3.7, 1.45]} />
        <meshStandardMaterial color="#efe4d2" map={pbr.stucco.map} roughness={0.86} />
      </mesh>
      <mesh position={[0, 2.35, 0.74]}>
        <boxGeometry args={[0.42, 0.72, 0.06]} />
        <meshStandardMaterial color="#2c221c" roughness={0.4} />
      </mesh>
      <mesh position={[0, 4.25, 0]} castShadow>
        <boxGeometry args={[1.85, 0.72, 1.75]} />
        <meshStandardMaterial color="#c45c3e" map={pbr.roof.map} roughness={0.62} />
      </mesh>
      <mesh position={[0, 5.05, 0]} castShadow>
        <boxGeometry args={[0.55, 1.15, 0.55]} />
        <meshStandardMaterial color="#efe4d2" roughness={0.84} />
      </mesh>
      <mesh position={[0, 5.85, 0]} castShadow>
        <coneGeometry args={[0.48, 0.72, 4]} />
        <meshStandardMaterial color="#a44c32" roughness={0.58} />
      </mesh>
    </group>
  );
}

function Cafe({ pbr }: { pbr: ReturnType<typeof useCoastalPbr> }) {
  return (
    <group position={[-2.85, 0, 1.55]}>
      <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.85, 2.3, 2.05]} />
        <meshStandardMaterial color="#ead8c4" map={pbr.stucco.map} roughness={0.86} />
      </mesh>
      <mesh position={[0, 2.45, 1.15]} rotation={[0.14, 0, 0]} castShadow>
        <boxGeometry args={[3.15, 0.08, 1.55]} />
        <meshStandardMaterial color="#c45c3e" map={pbr.roof.map} roughness={0.64} />
      </mesh>
      <mesh position={[0, 2.55, 0]} receiveShadow>
        <boxGeometry args={[3.05, 0.12, 2.25]} />
        <meshStandardMaterial color="#c45c3e" map={pbr.roof.map} roughness={0.62} />
      </mesh>
      {[-0.7, 0.7].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.78, 1.15]} castShadow>
            <cylinderGeometry args={[0.32, 0.34, 0.06, 10]} />
            <meshStandardMaterial color="#d8c4a0" roughness={0.7} />
          </mesh>
          <mesh position={[x, 0.48, 1.15]}>
            <cylinderGeometry args={[0.05, 0.06, 0.55, 6]} />
            <meshStandardMaterial color="#6a4a30" roughness={0.8} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.35, 1.06]}>
        <boxGeometry args={[0.72, 1.15, 0.06]} />
        <meshStandardMaterial color="#4a3224" roughness={0.72} />
      </mesh>
    </group>
  );
}

useGLTF.preload("/models/ph/painted_wooden_bench/painted_wooden_bench_1k.gltf");
useGLTF.preload("/models/ph/planter_pot_clay/planter_pot_clay_1k.gltf");
useGLTF.preload("/models/ph/ceramic_pot/ceramic_pot_1k.gltf");
useGLTF.preload("/models/cypress.glb");
useGLTF.preload("/models/olive.glb");
useGLTF.preload("/models/lamp.glb");
