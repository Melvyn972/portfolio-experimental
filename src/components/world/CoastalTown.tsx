"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { enableShadows, groundClone } from "@/lib/gltfFit";
import { dressCoastalBuilding } from "@/lib/coastalDress";
import { useCoastalPbr } from "@/lib/pbrTextures";
import { sampleGroundHeight } from "@/lib/ground";
import { getRoadCurve, nearestRoadSample, ROAD_WIDTH } from "@/lib/road";
import { TOWN_LANE_X, TOWN_LOTS } from "@/lib/town";

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
 * Inland hamlet — Kenney kits dressed with Poly Haven PBR (stucco / clay roof)
 * plus CC0 pots & bench. Lane stays east of the asphalt; porch stays open.
 */
export function CoastalTown({ rich = true }: { rich?: boolean }) {
  const pbr = useCoastalPbr(rich ? 6 : 2);
  const maison = useGrounded("/models/maison.glb");
  const studio = useGrounded("/models/studio.glb");
  const atelier = useGrounded("/models/kenney/city/atelier.glb");
  const windmill = useGrounded("/models/kenney/windmill.glb");
  const sedan = useGrounded("/models/kenney/sedan-sports.glb");
  const hatch = useGrounded("/models/kenney/hatchback-sports.glb");
  const bench = useGrounded("/models/bench.glb");
  const phBench = useGrounded("/models/ph/painted_wooden_bench/painted_wooden_bench_1k.gltf");
  const pot = useGrounded("/models/ph/planter_pot_clay/planter_pot_clay_1k.gltf");
  const ceramic = useGrounded("/models/ph/ceramic_pot/ceramic_pot_1k.gltf");
  const lamp = useGrounded("/models/lamp.glb");
  const wall = useGrounded("/models/stone-wall.glb");
  const hedge = useGrounded("/models/kenney/fantasy/hedge.glb");
  const pine = useGrounded("/models/pine.glb");
  const olive = useGrounded("/models/olive.glb");
  const cypress = useGrounded("/models/cypress.glb");
  const bougain = useGrounded("/models/bougainvillea.glb");
  const fence = useGrounded("/models/kenney/city/fence.glb");
  const lantern = useGrounded("/models/lantern.glb");
  const stairs = useGrounded("/models/kenney/fantasy/stairs-stone.glb");

  const lots = useMemo(
    () =>
      TOWN_LOTS.map((lot) => {
        const src = lot.kind === "maison" ? maison : lot.kind === "studio" ? studio : atelier;
        const building = src.clone(true);
        dressCoastalBuilding(building, pbr, lot.tint);
        return { ...lot, building };
      }),
    [maison, studio, atelier, pbr],
  );

  const lane = useMemo(() => {
    const items: { pos: [number, number, number]; yaw: number }[] = [];
    for (let z = -6; z > -148; z -= 4.4) {
      const x = TOWN_LANE_X;
      const road = nearestRoadSample(new THREE.Vector3(x, 0, z));
      if (Math.abs(road.lateral) < ROAD_WIDTH * 0.62) continue;
      items.push({
        pos: [x, sampleGroundHeight(x, z) + 0.014, z],
        yaw: 0.015 * Math.sin(z * 0.07),
      });
    }
    return items;
  }, []);

  const lamps = useMemo(() => {
    const curve = getRoadCurve();
    return [0.07, 0.14, 0.21, 0.28].map((t) => {
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const pos = p.clone().addScaledVector(side, 5.7);
      return {
        position: [pos.x, sampleGroundHeight(pos.x, pos.z), pos.z] as [number, number, number],
        yaw: Math.atan2(tangent.x, tangent.z),
      };
    });
  }, []);

  const parked = useMemo(() => {
    const curve = getRoadCurve();
    return [0.1, 0.18, 0.26].map((t, i) => {
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const pos = p.clone().addScaledVector(side, 5.15);
      return {
        position: [pos.x, sampleGroundHeight(pos.x, pos.z), pos.z] as [number, number, number],
        yaw: Math.atan2(tangent.x, tangent.z) + (i % 2 ? 0.08 : -0.06),
        hatch: i % 2 === 1,
      };
    });
  }, []);

  const gardens = useMemo(() => {
    return TOWN_LOTS.flatMap((lot, i) => {
      const y = sampleGroundHeight(lot.x, lot.z);
      return [
        { kind: "olive" as const, x: lot.x - 3.5, z: lot.z + 2.1, y, s: 0.92, yaw: i * 0.4 },
        { kind: "cypress" as const, x: lot.x + 3.8, z: lot.z - 1.4, y, s: 1.05, yaw: i * 0.7 },
        { kind: i % 2 ? ("bougain" as const) : ("hedge" as const), x: lot.x + 2.6, z: lot.z + 2.4, y, s: i % 2 ? 0.95 : 1.7, yaw: lot.yaw },
      ];
    });
  }, []);

  return (
    <group>
      {lane.map((s, i) => (
        <mesh key={`ln-${i}`} position={s.pos} rotation={[0, s.yaw, 0]} receiveShadow>
          <boxGeometry args={[2.7, 0.04, 4.5]} />
          <meshStandardMaterial
            color="#c8b090"
            map={pbr.cobble.map}
            normalMap={pbr.cobble.normalMap}
            roughnessMap={pbr.cobble.roughnessMap}
            roughness={0.88}
            metalness={0.03}
            envMapIntensity={0.35}
          />
        </mesh>
      ))}

      {lots.map((lot) => (
        <group key={lot.id} position={[lot.x, sampleGroundHeight(lot.x, lot.z), lot.z]} rotation={[0, lot.yaw, 0]}>
          <primitive object={lot.building} scale={lot.kind === "atelier" ? 5.05 : 5.7} />
          <mesh position={[0, 0.018, 1.85]} receiveShadow>
            <boxGeometry args={[4.4, 0.035, 2.6]} />
            <meshStandardMaterial
              color="#c4a078"
              map={pbr.terra.map}
              roughnessMap={pbr.terra.roughnessMap}
              roughness={0.84}
              metalness={0.04}
            />
          </mesh>
          <primitive
            object={(lot.id.charCodeAt(4) % 2 ? pot : ceramic).clone(true)}
            position={[1.55, 0, 2.05]}
            scale={1.15}
          />
        </group>
      ))}

      <group position={[27.6, sampleGroundHeight(27.6, -64.2), -64.2]} rotation={[0, 0.35, 0]}>
        <primitive object={windmill.clone(true)} scale={4.5} />
      </group>
      <mesh position={[24.4, sampleGroundHeight(24.4, -65.2) + 0.02, -65.2]} receiveShadow>
        <cylinderGeometry args={[3.4, 3.6, 0.05, 12]} />
        <meshStandardMaterial
          color="#c8a070"
          map={pbr.terra.map}
          roughnessMap={pbr.terra.roughnessMap}
          roughness={0.8}
        />
      </mesh>
      <group position={[21.6, sampleGroundHeight(21.6, -64.8), -64.8]} rotation={[0, 1.2, 0]}>
        <primitive object={stairs.clone(true)} scale={1.9} />
      </group>
      <group position={[24.8, sampleGroundHeight(24.8, -66.4), -66.4]}>
        <primitive object={lantern.clone(true)} scale={1.25} />
        {rich && <pointLight position={[0, 1.8, 0]} intensity={0.45} color="#ffc888" distance={7} />}
      </group>
      <group position={[23.4, sampleGroundHeight(23.4, -63.6), -63.6]} rotation={[0, 0.4, 0]}>
        <primitive object={phBench.clone(true)} scale={1.05} />
      </group>

      {parked.map((c, i) => (
        <group key={`car-${i}`} position={c.position} rotation={[0, c.yaw, 0]}>
          <primitive object={(c.hatch ? hatch : sedan).clone(true)} scale={1.12} />
        </group>
      ))}

      {lamps.map((l, i) => (
        <group key={`lp-${i}`} position={l.position} rotation={[0, l.yaw, 0]}>
          <primitive object={lamp.clone(true)} scale={1.38} />
        </group>
      ))}

      {gardens.map((g, i) => (
        <group key={`gd-${i}`} position={[g.x, g.y, g.z]} rotation={[0, g.yaw, 0]}>
          <primitive
            object={(g.kind === "olive" ? olive : g.kind === "cypress" ? cypress : g.kind === "bougain" ? bougain : hedge).clone(true)}
            scale={g.s}
          />
        </group>
      ))}

      {[
        [20.6, -16, 1.15],
        [20.8, -36, 0.35],
        [20.4, -58, 0.5],
        [20.7, -88, -0.15],
        [20.5, -112, 0.55],
        [20.6, -136, 0.2],
      ].map(([x, z, yaw], i) => (
        <group key={`bn-${i}`} position={[x, sampleGroundHeight(x, z), z]} rotation={[0, yaw, 0]}>
          <primitive object={(rich && i % 2 === 0 ? phBench : bench).clone(true)} scale={rich && i % 2 === 0 ? 1.0 : 1.32} />
        </group>
      ))}

      {[
        [21.4, -28],
        [21.6, -52],
        [21.3, -84],
        [21.5, -108],
        [21.2, -130],
      ].map(([x, z], i) => (
        <group key={`wl-${i}`} position={[x, sampleGroundHeight(x, z), z]} rotation={[0, 1.56, 0]}>
          <primitive object={wall.clone(true)} scale={2.35} />
          {rich && <primitive object={fence.clone(true)} position={[0, 0, 2.15]} scale={2.55} />}
        </group>
      ))}

      {rich &&
        [
          [22.2, -14],
          [22.4, -72],
          [22.0, -124],
          [27.8, -88],
        ].map(([x, z], i) => (
          <group key={`cy-${i}`} position={[x, sampleGroundHeight(x, z), z]}>
            <primitive object={cypress.clone(true)} scale={1.15} />
            <primitive object={pine.clone(true)} position={[1.8, 0, 0.6]} scale={0.32} />
          </group>
        ))}
    </group>
  );
}

useGLTF.preload("/models/maison.glb");
useGLTF.preload("/models/studio.glb");
useGLTF.preload("/models/kenney/city/atelier.glb");
useGLTF.preload("/models/kenney/windmill.glb");
useGLTF.preload("/models/kenney/sedan-sports.glb");
useGLTF.preload("/models/kenney/hatchback-sports.glb");
useGLTF.preload("/models/bench.glb");
useGLTF.preload("/models/lamp.glb");
useGLTF.preload("/models/stone-wall.glb");
useGLTF.preload("/models/kenney/fantasy/hedge.glb");
useGLTF.preload("/models/pine.glb");
useGLTF.preload("/models/olive.glb");
useGLTF.preload("/models/cypress.glb");
useGLTF.preload("/models/bougainvillea.glb");
useGLTF.preload("/models/kenney/city/fence.glb");
useGLTF.preload("/models/lantern.glb");
useGLTF.preload("/models/kenney/fantasy/stairs-stone.glb");
useGLTF.preload("/models/ph/planter_pot_clay/planter_pot_clay_1k.gltf");
useGLTF.preload("/models/ph/ceramic_pot/ceramic_pot_1k.gltf");
useGLTF.preload("/models/ph/painted_wooden_bench/painted_wooden_bench_1k.gltf");
