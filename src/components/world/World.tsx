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

function ShoreRocks({ detailed }: { detailed: boolean }) {
  const { scene: coast } = useGLTF("/models/rock-coast-a.glb");
  const { scene: cliff } = useGLTF("/models/cliff-coast.glb");
  const { scene: rockA } = useGLTF("/models/rock-a.glb");
  const { scene: rockB } = useGLTF("/models/rock-b.glb");
  const { scene: rockC } = useGLTF("/models/rock-c.glb");

  const rocks = useMemo(() => {
    const curve = getRoadCurve();
    const sources = detailed ? [coast, cliff, rockA, rockB, rockC] : [rockA, rockB, rockC];
    return Array.from({ length: detailed ? 20 : 14 }, (_, i) => {
      const t = 0.08 + (i / 20) * 0.85;
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const pos = p.clone().addScaledVector(side, -10.5 - (i % 5) * 1.15);
      pos.y = -0.05 + (i % 3) * 0.08;
      const src = sources[i % sources.length];
      const clone = src.clone(true);
      clone.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.castShadow = true;
          m.receiveShadow = true;
          const mat = m.material as THREE.MeshStandardMaterial;
          if (mat?.color) {
            const c = mat.clone();
            c.color.lerp(new THREE.Color("#c4b49a"), 0.18);
            m.material = c;
          }
        }
      });
      const isPh = src === coast || src === cliff;
      return {
        object: clone,
        position: [pos.x, pos.y, pos.z] as [number, number, number],
        scale: isPh ? 0.45 + (i % 4) * 0.12 : 0.75 + (i % 4) * 0.35,
        rot: i * 0.7,
      };
    });
  }, [coast, cliff, rockA, rockB, rockC, detailed]);

  const cliffs = useMemo(() => {
    if (!detailed) return [] as {
      object: THREE.Object3D;
      position: [number, number, number];
      yaw: number;
      scale: number;
    }[];
    const curve = getRoadCurve();
    return [0.2, 0.45, 0.7].map((t, i) => {
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const pos = p.clone().addScaledVector(side, -18);
      const clone = cliff.clone(true);
      clone.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.castShadow = true;
          m.receiveShadow = true;
        }
      });
      return {
        object: clone,
        position: [pos.x, -0.4, pos.z] as [number, number, number],
        yaw: Math.atan2(side.x, side.z) + Math.PI,
        scale: 1.1 + i * 0.15,
      };
    });
  }, [cliff, detailed]);

  return (
    <group>
      {rocks.map((r, i) => (
        <group key={`r-${i}`} position={r.position} rotation={[0.1, r.rot, 0.05]} scale={r.scale}>
          <primitive object={r.object} />
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
