"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { getBelvedereWorldAnchor, nearestRoadSample, ROAD_WIDTH } from "@/lib/road";
import { sampleGroundHeight } from "@/lib/ground";
import { enableShadows, groundClone } from "@/lib/gltfFit";
import { TOWN_LOTS } from "@/lib/town";

function useGrounded(path: string) {
  const { scene } = useGLTF(path);
  return useMemo(() => {
    const c = scene.clone(true);
    enableShadows(c);
    groundClone(c);
    return c;
  }, [scene]);
}

function offRibbon(x: number, z: number, extra = 8.2) {
  return Math.abs(nearestRoadSample(new THREE.Vector3(x, 0, z)).lateral) >= ROAD_WIDTH * 0.5 + extra;
}

/**
 * One memorable stretch: village → belvedere → jetty pines.
 * Off the asphalt ribbon. Stylized Realistic Mediterranean Indie.
 */
export function HeroCoast({ rich = true }: { rich?: boolean }) {
  const pine = useGrounded("/models/pine.glb");
  const olive = useGrounded("/models/olive.glb");
  const cypress = useGrounded("/models/cypress.glb");
  const bougain = useGrounded("/models/bougainvillea.glb");
  const bench = useGrounded("/models/ph/painted_wooden_bench/painted_wooden_bench_1k.gltf");
  const lamp = useGrounded("/models/lamp.glb");
  const stairs = useGrounded("/models/kenney/fantasy/stairs-stone.glb");

  const grove = useMemo(() => {
    const spots: { kind: "pine" | "olive" | "cypress" | "bougain"; x: number; z: number; s: number; yaw: number }[] = [
      { kind: "pine", x: 9.4, z: -70.8, s: 0.4, yaw: 0.05 },
      { kind: "pine", x: 10.2, z: -75.6, s: 0.46, yaw: 0.9 },
      { kind: "olive", x: 9.8, z: -84.2, s: 0.96, yaw: 1.3 },
      { kind: "pine", x: 10.6, z: -92.8, s: 0.42, yaw: 0.55 },
      { kind: "pine", x: 9.6, z: -100.4, s: 0.38, yaw: 2.0 },
      { kind: "pine", x: 11.4, z: -71.5, s: 0.44, yaw: 0.2 },
      { kind: "olive", x: 13.2, z: -76.8, s: 1.05, yaw: 0.8 },
      { kind: "pine", x: 12.1, z: -82.4, s: 0.5, yaw: 1.4 },
      { kind: "cypress", x: 14.6, z: -86.2, s: 1.12, yaw: 0.3 },
      { kind: "olive", x: 11.8, z: -91.5, s: 0.98, yaw: 1.9 },
      { kind: "pine", x: 13.8, z: -97.2, s: 0.46, yaw: 0.6 },
      { kind: "pine", x: 12.4, z: -103.6, s: 0.4, yaw: 2.1 },
      { kind: "olive", x: 15.2, z: -108.4, s: 1.02, yaw: 0.15 },
      { kind: "cypress", x: 29.4, z: -80.2, s: 1.18, yaw: 0.4 },
      { kind: "pine", x: 30.2, z: -94.5, s: 0.38, yaw: 1.1 },
      { kind: "bougain", x: 21.4, z: -79.2, s: 1.05, yaw: -0.4 },
      { kind: "bougain", x: 22.0, z: -96.8, s: 0.95, yaw: 0.2 },
      { kind: "bougain", x: 21.6, z: -108.2, s: 1.0, yaw: -0.15 },
    ];
    return spots.filter((s) => s.x > -8 && offRibbon(s.x, s.z));
  }, []);

  const steps = useMemo(() => {
    const bel = getBelvedereWorldAnchor();
    const items: { pos: [number, number, number]; yaw: number }[] = [];
    for (let i = 0; i < 8; i++) {
      const t = 0.32 + i * 0.08;
      const x = THREE.MathUtils.lerp(bel.stop.x, bel.terrace.x, t);
      const z = THREE.MathUtils.lerp(bel.stop.z, bel.terrace.z, t);
      if (Math.abs(nearestRoadSample(new THREE.Vector3(x, 0, z)).lateral) < ROAD_WIDTH * 0.5 + 0.45) continue;
      items.push({
        pos: [x, sampleGroundHeight(x, z) + 0.03 + i * 0.045, z],
        yaw: bel.yaw,
      });
    }
    return items;
  }, []);

  const pullOffs = useMemo(
    () =>
      [
        [3.7, -36.4],
        [3.8, -88.8],
        [3.5, -153.6],
      ]
        .filter(([x, z]) => Math.abs(nearestRoadSample(new THREE.Vector3(x, 0, z)).lateral) > ROAD_WIDTH * 0.5 + 0.35)
        .map(([x, z]) => ({
          pos: [x, sampleGroundHeight(x, z) + 0.03, z] as [number, number, number],
        })),
    [],
  );

  const lamps = useMemo(
    () =>
      [
        [5.4, -74.2],
        [5.6, -90.4],
        [5.3, -106.8],
      ]
        .filter(([x, z]) => offRibbon(x, z, 4.2))
        .map(([x, z]) => ({
          pos: [x, sampleGroundHeight(x, z), z] as [number, number, number],
        })),
    [],
  );

  const benches = useMemo(
    () =>
      [
        [6.2, -80.5, 0.2],
        [6.0, -98.2, -0.15],
      ]
        .filter(([x, z]) => offRibbon(x, z, 4.6))
        .map(([x, z, yaw]) => ({
          pos: [x, sampleGroundHeight(x, z), z] as [number, number, number],
          yaw,
        })),
    [],
  );

  const heroLots = useMemo(() => TOWN_LOTS.filter((lot) => lot.z < -68 && lot.z > -112), []);

  const lowerFlight = useMemo(() => {
    const bel = getBelvedereWorldAnchor();
    const local = new THREE.Vector3(0, 0, 5.5).applyAxisAngle(new THREE.Vector3(0, 1, 0), bel.yaw);
    const x = bel.terrace.x + local.x;
    const z = bel.terrace.z + local.z;
    if (Math.abs(nearestRoadSample(new THREE.Vector3(x, 0, z)).lateral) < ROAD_WIDTH * 0.5 + 0.4) return null;
    return {
      pos: [x, sampleGroundHeight(x, z), z] as [number, number, number],
      yaw: bel.yaw,
    };
  }, []);

  const shownGrove = rich ? grove : grove.slice(0, 8);

  return (
    <group>
      {shownGrove.map((g, i) => (
        <group key={`hg-${i}`} position={[g.x, sampleGroundHeight(g.x, g.z), g.z]} rotation={[0, g.yaw, 0]}>
          <primitive
            object={(g.kind === "olive" ? olive : g.kind === "cypress" ? cypress : g.kind === "bougain" ? bougain : pine).clone(true)}
            scale={g.s}
          />
        </group>
      ))}

      {steps.map((s, i) => (
        <mesh key={`st-${i}`} position={s.pos} rotation={[0, s.yaw, 0]} receiveShadow castShadow>
          <boxGeometry args={[1.85, 0.14, 0.52]} />
          <meshStandardMaterial color={i % 2 ? "#c8b898" : "#b4a488"} roughness={0.92} />
        </mesh>
      ))}

      {lowerFlight && (
        <group position={lowerFlight.pos} rotation={[0, lowerFlight.yaw, 0]}>
          <primitive object={stairs.clone(true)} scale={1.65} />
        </group>
      )}

      {pullOffs.map((p, i) => (
        <mesh key={`po-${i}`} position={p.pos} receiveShadow>
          <boxGeometry args={[3.15, 0.055, 2.35]} />
          <meshStandardMaterial color="#9a8460" roughness={0.9} />
        </mesh>
      ))}

      {lamps.map((l, i) => (
        <group key={`hl-${i}`} position={l.pos}>
          <primitive object={lamp.clone(true)} scale={1.32} />
          <pointLight position={[0, 2.1, 0]} intensity={0.38} color="#ffc888" distance={6.5} />
        </group>
      ))}

      {benches.map((b, i) => (
        <group key={`hb-${i}`} position={b.pos} rotation={[0, b.yaw, 0]}>
          <primitive object={bench.clone(true)} scale={1.02} />
        </group>
      ))}

      {heroLots.map((lot) => (
        <HeroFacade
          key={`hf-${lot.id}`}
          x={lot.x}
          z={lot.z}
          yaw={lot.yaw}
          bougain={rich ? bougain : null}
        />
      ))}
    </group>
  );
}

function HeroFacade({
  x,
  z,
  yaw,
  bougain,
}: {
  x: number;
  z: number;
  yaw: number;
  bougain: THREE.Object3D | null;
}) {
  const y = sampleGroundHeight(x, z);
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      {[-0.95, 0.95].map((sx) => (
        <group key={sx} position={[sx, 1.62, 1.58]}>
          <mesh>
            <boxGeometry args={[0.62, 0.78, 0.06]} />
            <meshStandardMaterial color="#3a2c22" roughness={0.4} metalness={0.08} />
          </mesh>
          <mesh position={[-0.28, 0, 0.04]}>
            <boxGeometry args={[0.2, 0.74, 0.04]} />
            <meshStandardMaterial color="#6a3a2a" roughness={0.72} />
          </mesh>
          <mesh position={[0.28, 0, 0.04]}>
            <boxGeometry args={[0.2, 0.74, 0.04]} />
            <meshStandardMaterial color="#6a3a2a" roughness={0.72} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.05, 1.72]} castShadow>
        <boxGeometry args={[0.72, 1.55, 0.08]} />
        <meshStandardMaterial color="#4a3224" roughness={0.78} />
      </mesh>
      <mesh position={[0, 2.92, 0.15]} receiveShadow>
        <boxGeometry args={[4.35, 0.1, 2.55]} />
        <meshStandardMaterial color="#c45c3e" roughness={0.62} />
      </mesh>
      {bougain && <primitive object={bougain.clone(true)} position={[1.75, 0, 1.85]} scale={0.88} />}
    </group>
  );
}

useGLTF.preload("/models/pine.glb");
useGLTF.preload("/models/olive.glb");
useGLTF.preload("/models/cypress.glb");
useGLTF.preload("/models/bougainvillea.glb");
useGLTF.preload("/models/lamp.glb");
useGLTF.preload("/models/kenney/fantasy/stairs-stone.glb");
useGLTF.preload("/models/ph/painted_wooden_bench/painted_wooden_bench_1k.gltf");
