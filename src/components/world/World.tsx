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
import { getRoadCurve, nearestRoadSample, ROAD_WIDTH } from "@/lib/road";
import { accessCorridors, sampleGroundHeight } from "@/lib/ground";

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

function AccessPaths() {
  const slabs = useMemo(() => {
    const items: { pos: [number, number, number]; yaw: number; size: [number, number, number] }[] = [];
    for (const c of accessCorridors()) {
      for (let i = 0; i < c.pts.length - 1; i++) {
        const a = c.pts[i];
        const b = c.pts[i + 1];
        const steps = 5;
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const x = a.x + (b.x - a.x) * t;
          const z = a.z + (b.z - a.z) * t;
          const road = nearestRoadSample(new THREE.Vector3(x, 0, z));
          if (Math.abs(road.lateral) < ROAD_WIDTH * 0.62) continue;
          const y = sampleGroundHeight(x, z);
          items.push({
            pos: [x, y + 0.02, z],
            yaw: Math.atan2(b.x - a.x, b.z - a.z),
            size: [1.6, 0.04, 1.5],
          });
        }
      }
    }
    return items;
  }, []);

  const plazas = useMemo(() => {
    return [
      { x: 16, z: -37, s: [5.2, 0.05, 4.6] as [number, number, number] },
      { x: 18, z: -113, s: [5.0, 0.05, 4.4] as [number, number, number] },
      { x: 10.5, z: -37, s: [3.6, 0.04, 3.2] as [number, number, number] },
      { x: 11.5, z: -114, s: [3.6, 0.04, 3.2] as [number, number, number] },
    ].map((p) => ({
      pos: [p.x, sampleGroundHeight(p.x, p.z) + 0.02, p.z] as [number, number, number],
      size: p.s,
    }));
  }, []);

  return (
    <group>
      {plazas.map((p, i) => (
        <mesh key={`plaza-${i}`} position={p.pos} receiveShadow>
          <boxGeometry args={p.size} />
          <meshStandardMaterial color="#c8b89a" roughness={0.93} />
        </mesh>
      ))}
      {slabs.map((s, i) => (
        <mesh key={i} position={s.pos} rotation={[0, s.yaw, 0]} receiveShadow>
          <boxGeometry args={s.size} />
          <meshStandardMaterial color={i % 2 ? "#c4b49a" : "#b7a888"} roughness={0.92} />
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
      <AccessPaths />
      <Belvedere />
      <CoastalZones />
      <DebugColliders />
    </group>
  );
}
