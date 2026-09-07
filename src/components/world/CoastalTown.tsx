"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { enableShadows, groundClone } from "@/lib/gltfFit";
import { sampleGroundHeight } from "@/lib/ground";
import { getRoadCurve, nearestRoadSample, ROAD_WIDTH } from "@/lib/road";
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

/**
 * Fill the inland hamlet with existing CC0 Kenney / Quaternius / house props.
 * No new heavy downloads — mobile-safe instance count.
 */
export function CoastalTown({ rich = true }: { rich?: boolean }) {
  const maison = useGrounded("/models/maison.glb");
  const studio = useGrounded("/models/studio.glb");
  const atelier = useGrounded("/models/kenney/city/atelier.glb");
  const windmill = useGrounded("/models/kenney/windmill.glb");
  const sedan = useGrounded("/models/kenney/sedan-sports.glb");
  const bench = useGrounded("/models/bench.glb");
  const lamp = useGrounded("/models/lamp.glb");
  const wall = useGrounded("/models/stone-wall.glb");
  const hedge = useGrounded("/models/kenney/fantasy/hedge.glb");
  const pine = useGrounded("/models/pine.glb");
  const fence = useGrounded("/models/kenney/city/fence.glb");

  const lots = useMemo(
    () =>
      TOWN_LOTS.map((lot) => ({
        ...lot,
        building: (lot.kind === "maison" ? maison : lot.kind === "studio" ? studio : atelier).clone(true),
        hedgeObj: hedge.clone(true),
        pineObj: pine.clone(true),
      })),
    [maison, studio, atelier, hedge, pine],
  );

  const street = useMemo(() => {
    const items: { pos: [number, number, number]; yaw: number }[] = [];
    for (let z = -18; z > -140; z -= 7) {
      const x = 19.2;
      const road = nearestRoadSample(new THREE.Vector3(x, 0, z));
      if (Math.abs(road.lateral) < ROAD_WIDTH * 0.65) continue;
      items.push({
        pos: [x, sampleGroundHeight(x, z) + 0.015, z],
        yaw: 0,
      });
    }
    return items;
  }, []);

  const lamps = useMemo(() => {
    const curve = getRoadCurve();
    return [0.12, 0.26, 0.4, 0.58, 0.76, 0.9].map((t) => {
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const pos = p.clone().addScaledVector(side, 5.8);
      return {
        position: [pos.x, sampleGroundHeight(pos.x, pos.z), pos.z] as [number, number, number],
        yaw: Math.atan2(tangent.x, tangent.z),
      };
    });
  }, []);

  const parked = useMemo(() => {
    const curve = getRoadCurve();
    return [0.22, 0.48, 0.68].map((t, i) => {
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const pos = p.clone().addScaledVector(side, 5.1);
      return {
        position: [pos.x, sampleGroundHeight(pos.x, pos.z), pos.z] as [number, number, number],
        yaw: Math.atan2(tangent.x, tangent.z) + (i === 1 ? 0.12 : 0),
      };
    });
  }, []);

  return (
    <group>
      {street.map((s, i) => (
        <mesh key={`st-${i}`} position={s.pos} receiveShadow>
          <boxGeometry args={[2.4, 0.03, 6.4]} />
          <meshStandardMaterial color={i % 2 ? "#c4ae86" : "#b89a72"} roughness={0.9} />
        </mesh>
      ))}

      {lots.map((lot) => (
        <group key={lot.id} position={[lot.x, sampleGroundHeight(lot.x, lot.z), lot.z]} rotation={[0, lot.yaw, 0]}>
          <primitive object={lot.building} scale={lot.kind === "atelier" ? 5.0 : 5.8} />
          <primitive object={lot.hedgeObj} position={[3.4, 0, 1.2]} scale={1.8} />
          <primitive object={lot.pineObj} position={[-3.6, 0, 2.0]} scale={0.34} />
        </group>
      ))}

      {rich && (
        <group position={[27.2, sampleGroundHeight(27.2, -63.5), -63.5]} rotation={[0, 0.4, 0]}>
          <primitive object={windmill.clone(true)} scale={4.4} />
        </group>
      )}

      {parked.map((c, i) => (
        <group key={`car-${i}`} position={c.position} rotation={[0, c.yaw, 0]}>
          <primitive object={sedan.clone(true)} scale={1.15} />
        </group>
      ))}

      {lamps.map((l, i) => (
        <group key={`lp-${i}`} position={l.position} rotation={[0, l.yaw, 0]}>
          <primitive object={lamp.clone(true)} scale={1.4} />
        </group>
      ))}

      {[
        [20.4, -30, 1.2],
        [20.8, -58, 0.4],
        [20.2, -88, -0.2],
        [20.6, -118, 0.6],
      ].map(([x, z, yaw], i) => (
        <group key={`bn-${i}`} position={[x, sampleGroundHeight(x, z), z]} rotation={[0, yaw, 0]}>
          <primitive object={bench.clone(true)} scale={1.35} />
        </group>
      ))}

      {[
        [21.2, -40],
        [21.6, -80],
        [21.0, -110],
      ].map(([x, z], i) => (
        <group key={`wl-${i}`} position={[x, sampleGroundHeight(x, z), z]} rotation={[0, 1.55, 0]}>
          <primitive object={wall.clone(true)} scale={2.4} />
          <primitive object={fence.clone(true)} position={[0, 0, 2.2]} scale={2.6} />
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
useGLTF.preload("/models/bench.glb");
useGLTF.preload("/models/lamp.glb");
useGLTF.preload("/models/stone-wall.glb");
useGLTF.preload("/models/kenney/fantasy/hedge.glb");
useGLTF.preload("/models/pine.glb");
useGLTF.preload("/models/kenney/city/fence.glb");
