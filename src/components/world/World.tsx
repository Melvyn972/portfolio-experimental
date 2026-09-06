"use client";

import { Sea } from "./Sea";
import { Road } from "./Road";
import { Terrain } from "./Terrain";
import { Vegetation } from "./Vegetation";
import { Belvedere } from "./Belvedere";
import { CoastalZones } from "./Zones";
import { Atmosphere, RoadAccentProps } from "./Atmosphere";
import { DebugColliders } from "./DebugColliders";
import type { QualitySettings } from "@/lib/quality";
import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { getRoadCurve } from "@/lib/road";
import { enableShadows, groundClone } from "@/lib/gltfFit";

function ShoreRocks({ detailed }: { detailed: boolean }) {
  const { scene: coast } = useGLTF("/models/rock-coast-a.glb");
  const { scene: cliff } = useGLTF("/models/cliff-coast.glb");
  const { scene: dormin } = useGLTF("/models/rocks-dormin.glb");

  const rocks = useMemo(() => {
    const curve = getRoadCurve();
    const count = detailed ? 10 : 6;
    return Array.from({ length: count }, (_, i) => {
      const t = 0.12 + (i / Math.max(1, count - 1)) * 0.72;
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      // Sea-side only, well clear of the 7.2 m ribbon (half ≈ 3.6)
      const lateral = -11.5 - (i % 3) * 1.1;
      const pos = p.clone().addScaledVector(side, lateral);
      const clone = dormin.clone(true);
      enableShadows(clone);
      groundClone(clone);
      return {
        object: clone,
        position: [pos.x, 0, pos.z] as [number, number, number],
        scale: 1.35 + (i % 3) * 0.25,
        rot: i * 0.85,
      };
    });
  }, [dormin, detailed]);

  const beachClusters = useMemo(() => {
    if (!detailed) return [] as {
      object: THREE.Object3D;
      position: [number, number, number];
      yaw: number;
      scale: number;
    }[];
    const curve = getRoadCurve();
    return [0.38, 0.62].map((t, i) => {
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const pos = p.clone().addScaledVector(side, -20);
      const clone = coast.clone(true);
      enableShadows(clone);
      groundClone(clone);
      return {
        object: clone,
        position: [pos.x, -0.15, pos.z] as [number, number, number],
        yaw: i * 1.1,
        scale: 0.11 + i * 0.02,
      };
    });
  }, [coast, detailed]);

  const cliffs = useMemo(() => {
    if (!detailed) return [] as {
      object: THREE.Object3D;
      position: [number, number, number];
      yaw: number;
      scale: number;
    }[];
    const curve = getRoadCurve();
    return [0.28, 0.7].map((t, i) => {
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const pos = p.clone().addScaledVector(side, -30);
      const clone = cliff.clone(true);
      enableShadows(clone);
      groundClone(clone);
      return {
        object: clone,
        position: [pos.x, -0.4, pos.z] as [number, number, number],
        yaw: Math.atan2(side.x, side.z) + Math.PI,
        scale: 0.18 + i * 0.03,
      };
    });
  }, [cliff, detailed]);

  return (
    <group>
      {rocks.map((r, i) => (
        <group key={`r-${i}`} position={r.position} rotation={[0, r.rot, 0]} scale={r.scale}>
          <primitive object={r.object} />
        </group>
      ))}
      {beachClusters.map((c, i) => (
        <group key={`bc-${i}`} position={c.position} rotation={[0, c.yaw, 0]} scale={c.scale}>
          <primitive object={c.object} />
        </group>
      ))}
      {cliffs.map((c, i) => (
        <group key={`c-${i}`} position={c.position} rotation={[0, c.yaw, 0]} scale={c.scale}>
          <primitive object={c.object} />
        </group>
      ))}
    </group>
  );
}

useGLTF.preload("/models/rock-coast-a.glb");
useGLTF.preload("/models/cliff-coast.glb");
useGLTF.preload("/models/rocks-dormin.glb");

export function World({ quality }: { quality: QualitySettings }) {
  return (
    <group>
      <Atmosphere dust={quality.dust} shadows={quality.shadows} shadowMapSize={quality.shadowMapSize} />
      <Sea segments={quality.seaSegments} />
      <Terrain />
      <Road />
      <RoadAccentProps />
      <ShoreRocks detailed={quality.shadows} />
      <Vegetation count={quality.treeCount} />
      <Belvedere />
      <CoastalZones />
      <DebugColliders />
    </group>
  );
}
