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
import * as THREE from "three";
import { getRoadCurve } from "@/lib/road";
import { sampleGroundHeight } from "@/lib/ground";

/** Rounded coastal boulders — not dodecahedron shards, not uncentered GLBs. */
function ShoreRocks({ count }: { count: number }) {
  const items = useMemo(() => {
    const curve = getRoadCurve();
    const n = Math.max(4, Math.min(7, count));
    return Array.from({ length: n }, (_, i) => {
      const t = 0.18 + (i / Math.max(1, n - 1)) * 0.58;
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const pos = p.clone().addScaledVector(side, -11.4 - (i % 2) * 0.45);
      pos.x = Math.max(pos.x, -9.2);
      return {
        position: [pos.x, sampleGroundHeight(pos.x, pos.z) + 0.32, pos.z] as [number, number, number],
        scale: [1.1 + (i % 3) * 0.15, 0.55 + (i % 2) * 0.08, 0.95 + (i % 3) * 0.12] as [number, number, number],
        rot: i * 0.7,
        color: i % 2 === 0 ? "#c2b49a" : "#b4a488",
      };
    });
  }, [count]);

  return (
    <group>
      {items.map((r, i) => (
        <mesh key={i} position={r.position} rotation={[0, r.rot, 0]} scale={r.scale} castShadow receiveShadow>
          <sphereGeometry args={[0.7, 7, 5]} />
          <meshStandardMaterial color={r.color} roughness={0.94} flatShading={false} />
        </mesh>
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
      <ShoreRocks count={quality.shadows ? 7 : 5} />
      <Vegetation count={quality.treeCount} />
      <Belvedere />
      <CoastalZones />
      <DebugColliders />
    </group>
  );
}
