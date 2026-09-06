"use client";

import { Sea } from "./Sea";
import { Road } from "./Road";
import { Terrain } from "./Terrain";
import { Vegetation } from "./Vegetation";
import { Belvedere } from "./Belvedere";
import { Atmosphere, RoadAccentProps } from "./Atmosphere";
import type { QualitySettings } from "@/lib/quality";
import { useMemo } from "react";
import * as THREE from "three";
import { getRoadCurve } from "@/lib/road";

function ShoreRocks() {
  const rocks = useMemo(() => {
    const curve = getRoadCurve();
    return Array.from({ length: 28 }, (_, i) => {
      const t = 0.08 + (i / 28) * 0.85;
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const pos = p.clone().addScaledVector(side, -11 - (i % 5) * 1.1);
      pos.y = -0.15 + (i % 3) * 0.12;
      return {
        position: [pos.x, pos.y, pos.z] as [number, number, number],
        scale: [0.6 + (i % 4) * 0.25, 0.35 + (i % 3) * 0.2, 0.5 + (i % 3) * 0.2] as [number, number, number],
        rot: i * 0.8,
      };
    });
  }, []);

  return (
    <group>
      {rocks.map((r, i) => (
        <mesh key={i} position={r.position} rotation={[0.2, r.rot, 0.1]} scale={r.scale} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#b9aa92" : "#cfc0a8"} roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  );
}

export function World({ quality }: { quality: QualitySettings }) {
  return (
    <group>
      <Atmosphere dust={quality.dust} />
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
