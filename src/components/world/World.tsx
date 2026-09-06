"use client";

import { Sea } from "./Sea";
import { Road } from "./Road";
import { Terrain } from "./Terrain";
import { Vegetation } from "./Vegetation";
import { Belvedere } from "./Belvedere";
import { Atmosphere, RoadAccentProps } from "./Atmosphere";
import type { QualitySettings } from "@/lib/quality";
import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { getRoadCurve } from "@/lib/road";

function ShoreRocks() {
  const rockA = useGLTF("/models/rock-a.glb").scene;
  const rockB = useGLTF("/models/rock-b.glb").scene;
  const rockC = useGLTF("/models/rock-c.glb").scene;

  const rocks = useMemo(() => {
    const curve = getRoadCurve();
    const scenes = [rockA, rockB, rockC];
    return Array.from({ length: 28 }, (_, i) => {
      const t = 0.08 + (i / 28) * 0.85;
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const pos = p.clone().addScaledVector(side, -11 - (i % 5) * 1.1);
      pos.y = -0.15 + (i % 3) * 0.12;
      const clone = scenes[i % 3].clone(true);
      clone.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.castShadow = true;
          m.receiveShadow = true;
        }
      });
      return {
        object: clone,
        position: [pos.x, pos.y, pos.z] as [number, number, number],
        scale: [0.6 + (i % 4) * 0.25, 0.35 + (i % 3) * 0.2, 0.5 + (i % 3) * 0.2] as [
          number,
          number,
          number,
        ],
        rot: i * 0.8,
      };
    });
  }, [rockA, rockB, rockC]);

  return (
    <group>
      {rocks.map((r, i) => (
        <group key={i} position={r.position} rotation={[0.2, r.rot, 0.1]} scale={r.scale}>
          <primitive object={r.object} />
        </group>
      ))}
    </group>
  );
}

export function World({ quality }: { quality: QualitySettings }) {
  return (
    <group>
      <Atmosphere dust={quality.dust} shadows={quality.shadows} shadowMapSize={quality.shadowMapSize} />
      <Sea segments={quality.seaSegments} />
      <Terrain />
      <Road />
      <RoadAccentProps />
      <ShoreRocks />
      <Vegetation count={quality.treeCount} />
      <Belvedere />
    </group>
  );
}

useGLTF.preload("/models/rock-a.glb");
useGLTF.preload("/models/rock-b.glb");
useGLTF.preload("/models/rock-c.glb");
