"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { getBelvedereWorldAnchor, nearestRoadSample, ROAD_WIDTH } from "@/lib/road";
import { sampleGroundHeight } from "@/lib/ground";
import { enableShadows, groundClone } from "@/lib/gltfFit";
import { useCoastalPbr } from "@/lib/pbrTextures";
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
 * Memorable stretch village → belvedere → crique.
 * Always readable on Éco. Props stay off the asphalt. No heightfield lifts.
 */
export function HeroCoast({ lit = true }: { lit?: boolean }) {
  const pine = useGrounded("/models/pine.glb");
  const olive = useGrounded("/models/olive.glb");
  const cypress = useGrounded("/models/cypress.glb");
  const bougain = useGrounded("/models/bougainvillea.glb");
  const bench = useGrounded("/models/ph/painted_wooden_bench/painted_wooden_bench_1k.gltf");
  const lamp = useGrounded("/models/lamp.glb");
  const stairs = useGrounded("/models/kenney/fantasy/stairs-stone.glb");
  const pot = useGrounded("/models/ph/planter_pot_clay/planter_pot_clay_1k.gltf");
  const wall = useGrounded("/models/stone-wall.glb");
  const rock = useGrounded("/models/rock-coast-a.glb");
  const hedge = useGrounded("/models/kenney/fantasy/hedge.glb");
  const pbr = useCoastalPbr(lit ? 5 : 2);

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
      { kind: "pine", x: 8.9, z: -66.4, s: 0.36, yaw: 0.7 },
      { kind: "olive", x: 14.4, z: -72.2, s: 1.0, yaw: 1.1 },
      { kind: "pine", x: 10.8, z: -87.6, s: 0.44, yaw: 2.4 },
      { kind: "cypress", x: 16.8, z: -101.2, s: 1.08, yaw: 0.5 },
      { kind: "pine", x: 9.2, z: -112.6, s: 0.4, yaw: 0.15 },
      { kind: "bougain", x: 20.2, z: -88.4, s: 0.92, yaw: 0.6 },
    ];
    return spots.filter((s) => s.x > 8.4 && offRibbon(s.x, s.z, 4.6));
  }, []);

  const seaPines = useMemo(() => {
    const spots: { x: number; z: number; s: number; yaw: number }[] = [
      { x: -11.4, z: -72.6, s: 0.34, yaw: 0.4 },
      { x: -12.2, z: -80.8, s: 0.4, yaw: 1.1 },
      { x: -11.8, z: -88.4, s: 0.36, yaw: 2.0 },
      { x: -12.6, z: -96.2, s: 0.42, yaw: 0.2 },
      { x: -11.6, z: -104.8, s: 0.33, yaw: 1.6 },
    ];
    return spots.filter((s) => s.x > -14.6 && s.x < -8 && offRibbon(s.x, s.z, 3.8));
  }, []);

  const crique = useMemo(() => {
    const spots: { x: number; z: number; s: number; yaw: number }[] = [
      { x: -13.6, z: -82.4, s: 1.15, yaw: 0.4 },
      { x: -14.1, z: -90.8, s: 1.35, yaw: 1.2 },
      { x: -13.2, z: -98.6, s: 1.05, yaw: 2.1 },
    ];
    return spots.filter((s) => s.x > -15.2 && offRibbon(s.x, s.z, 4.0));
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
        [5.5, -82.0],
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
        [6.4, -74.8, 0.35],
      ]
        .filter(([x, z]) => offRibbon(x, z, 4.6))
        .map(([x, z, yaw]) => ({
          pos: [x, sampleGroundHeight(x, z), z] as [number, number, number],
          yaw,
        })),
    [],
  );

  const terraceWalls = useMemo(
    () =>
      [
        [8.6, -76.4, 0.2],
        [8.8, -92.2, -0.1],
        [8.5, -104.6, 0.15],
      ]
        .filter(([x, z]) => offRibbon(x, z, 4.8))
        .map(([x, z, yaw]) => ({
          pos: [x, sampleGroundHeight(x, z), z] as [number, number, number],
          yaw,
        })),
    [],
  );

  const heroLots = useMemo(() => TOWN_LOTS.filter((lot) => lot.z < -64 && lot.z > -116), []);

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

  return (
    <group>
      {grove.map((g, i) => (
        <group key={`hg-${i}`} position={[g.x, sampleGroundHeight(g.x, g.z), g.z]} rotation={[0, g.yaw, 0]}>
          <primitive
            object={(g.kind === "olive" ? olive : g.kind === "cypress" ? cypress : g.kind === "bougain" ? bougain : pine).clone(true)}
            scale={g.s}
          />
        </group>
      ))}

      {seaPines.map((g, i) => (
        <group key={`sp-${i}`} position={[g.x, sampleGroundHeight(g.x, g.z), g.z]} rotation={[0, g.yaw, 0]}>
          <primitive object={pine.clone(true)} scale={g.s} />
        </group>
      ))}

      {crique.map((r, i) => (
        <group key={`cq-${i}`} position={[r.x, sampleGroundHeight(r.x, r.z), r.z]} rotation={[0, r.yaw, 0]} scale={r.s}>
          <primitive object={rock.clone(true)} />
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
          <meshStandardMaterial
            color="#9a8460"
            map={pbr.terra.map}
            roughnessMap={pbr.terra.roughnessMap}
            roughness={0.9}
          />
        </mesh>
      ))}

      {lamps.map((l, i) => (
        <group key={`hl-${i}`} position={l.pos}>
          <primitive object={lamp.clone(true)} scale={1.32} />
          {lit && <pointLight position={[0, 2.1, 0]} intensity={0.38} color="#ffc888" distance={6.5} />}
        </group>
      ))}

      {benches.map((b, i) => (
        <group key={`hb-${i}`} position={b.pos} rotation={[0, b.yaw, 0]}>
          <primitive object={bench.clone(true)} scale={1.02} />
          <primitive object={pot.clone(true)} position={[0.85, 0, 0.15]} scale={0.85} />
        </group>
      ))}

      {terraceWalls.map((w, i) => (
        <group key={`tw-${i}`} position={w.pos} rotation={[0, w.yaw, 0]}>
          <primitive object={wall.clone(true)} scale={2.05} />
          {i % 2 === 0 && <primitive object={hedge.clone(true)} position={[0.2, 0, 1.4]} scale={1.55} />}
        </group>
      ))}

      {heroLots.map((lot) => (
        <HeroFacade
          key={`hf-${lot.id}`}
          x={lot.x}
          z={lot.z}
          yaw={lot.yaw}
          tint={lot.tint}
          pbr={pbr}
          bougain={bougain}
        />
      ))}
    </group>
  );
}

function HeroFacade({
  x,
  z,
  yaw,
  tint,
  pbr,
  bougain,
}: {
  x: number;
  z: number;
  yaw: number;
  tint: string;
  pbr: ReturnType<typeof useCoastalPbr>;
  bougain: THREE.Object3D;
}) {
  const y = sampleGroundHeight(x, z);
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      {[-1.05, 0, 1.05].map((sx) => (
        <group key={sx} position={[sx, 1.68, 1.58]}>
          <mesh>
            <boxGeometry args={[0.58, 0.82, 0.05]} />
            <meshStandardMaterial color="#2c221c" roughness={0.38} metalness={0.1} />
          </mesh>
          <mesh position={[-0.26, 0, 0.035]}>
            <boxGeometry args={[0.18, 0.76, 0.035]} />
            <meshStandardMaterial color="#6a3a2a" roughness={0.72} />
          </mesh>
          <mesh position={[0.26, 0, 0.035]}>
            <boxGeometry args={[0.18, 0.76, 0.035]} />
            <meshStandardMaterial color="#6a3a2a" roughness={0.72} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.08, 1.74]} castShadow>
        <boxGeometry args={[0.68, 1.58, 0.07]} />
        <meshStandardMaterial
          color="#4a3224"
          map={pbr.stucco.map}
          roughnessMap={pbr.stucco.roughnessMap}
          roughness={0.8}
        />
      </mesh>
      <mesh position={[0, 2.42, 1.62]} castShadow>
        <boxGeometry args={[3.35, 0.08, 0.55]} />
        <meshStandardMaterial color="#c45c3e" map={pbr.roof.map} roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.96, 0.12]} receiveShadow>
        <boxGeometry args={[4.45, 0.1, 2.6]} />
        <meshStandardMaterial color={tint} map={pbr.roof.map} roughnessMap={pbr.roof.roughnessMap} roughness={0.62} />
      </mesh>
      {[-1.15, 1.15].map((sx) => (
        <mesh key={`box-${sx}`} position={[sx, 1.18, 1.68]}>
          <boxGeometry args={[0.55, 0.14, 0.2]} />
          <meshStandardMaterial color="#6a4a32" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[-0.85, 2.55, 1.55]} rotation={[0, 0, 0.04]}>
        <boxGeometry args={[0.04, 0.55, 0.04]} />
        <meshStandardMaterial color="#d8d0c4" roughness={0.55} />
      </mesh>
      <mesh position={[0.05, 2.42, 1.55]} rotation={[0, 0, -0.12]}>
        <boxGeometry args={[0.36, 0.42, 0.02]} />
        <meshStandardMaterial color="#c8b070" roughness={0.78} />
      </mesh>
      <primitive object={bougain.clone(true)} position={[1.75, 0, 1.85]} scale={0.88} />
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
useGLTF.preload("/models/ph/planter_pot_clay/planter_pot_clay_1k.gltf");
useGLTF.preload("/models/stone-wall.glb");
useGLTF.preload("/models/rock-coast-a.glb");
useGLTF.preload("/models/kenney/fantasy/hedge.glb");
