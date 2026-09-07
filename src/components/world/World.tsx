"use client";

import { Sea } from "./Sea";
import { Road } from "./Road";
import { Terrain } from "./Terrain";
import { Vegetation } from "./Vegetation";
import { Belvedere } from "./Belvedere";
import { CoastalZones } from "./Zones";
import { CoastalTown } from "./CoastalTown";
import { Atmosphere, RoadAccentProps } from "./Atmosphere";
import { DebugColliders } from "./DebugColliders";
import { LivingWorld } from "./LivingWorld";
import { DiscoveryRelics } from "./DiscoveryRelics";
import type { QualitySettings } from "@/lib/quality";
import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { getRoadCurve, nearestRoadSample, ROAD_WIDTH } from "@/lib/road";
import { accessCorridors, sampleGroundHeight } from "@/lib/ground";
import { enableShadows, groundClone } from "@/lib/gltfFit";

/** Poly Haven coast rocks — grounded, not procedural spheres. */
function ShoreRocks({ count }: { count: number }) {
  const { scene } = useGLTF("/models/rock-coast-a.glb");
  const src = useMemo(() => {
    const c = scene.clone(true);
    enableShadows(c);
    groundClone(c);
    return c;
  }, [scene]);

  const items = useMemo(() => {
    const curve = getRoadCurve();
    const n = Math.max(4, Math.min(6, count));
    return Array.from({ length: n }, (_, i) => {
      const t = 0.06 + (i / Math.max(1, n - 1)) * 0.28;
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const pos = p.clone().addScaledVector(side, -15.6 - (i % 2) * 0.4);
      pos.x = Math.min(pos.x, -16.2);
      pos.y = sampleGroundHeight(pos.x, pos.z);
      return {
        position: [pos.x, pos.y, pos.z] as [number, number, number],
        scale: 1.35 + (i % 3) * 0.18,
        rot: i * 0.85,
        object: src.clone(true),
      };
    });
  }, [count, src]);

  return (
    <group>
      {items.map((r, i) => (
        <group key={i} position={r.position} rotation={[0, r.rot, 0]} scale={r.scale}>
          <primitive object={r.object} />
        </group>
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
          if (Math.abs(road.lateral) < ROAD_WIDTH * 0.7) continue;
          if (x < -2.5) continue;
          const y = sampleGroundHeight(x, z);
          items.push({
            pos: [x, y + 0.02, z],
            yaw: Math.atan2(b.x - a.x, b.z - a.z),
            size: [1.35, 0.025, 1.25],
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
          <meshStandardMaterial color="#9a8058" roughness={0.9} metalness={0.04} />
        </mesh>
      ))}
      {slabs.map((s, i) => (
        <mesh key={i} position={s.pos} rotation={[0, s.yaw, 0]} receiveShadow>
          <boxGeometry args={s.size} />
          <meshStandardMaterial color={i % 2 ? "#9a8058" : "#8a7048"} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function BeachScatter() {
  const { scene } = useGLTF("/models/rocks-dormin.glb");
  const src = useMemo(() => {
    const c = scene.clone(true);
    enableShadows(c);
    groundClone(c);
    return c;
  }, [scene]);
  const items = useMemo(() => {
    return [
      [-16.4, -28],
      [-16.8, -72],
      [-16.2, -120],
      [-16.6, -168],
    ].map(([x, z], i) => ({
      position: [x, sampleGroundHeight(x, z), z] as [number, number, number],
      scale: 1.8 + (i % 3) * 0.25,
      rot: i * 0.7,
      object: src.clone(true),
    }));
  }, [src]);
  return (
    <group>
      {items.map((r, i) => (
        <group key={`dr-${i}`} position={r.position} rotation={[0, r.rot, 0]} scale={r.scale}>
          <primitive object={r.object} />
        </group>
      ))}
    </group>
  );
}

useGLTF.preload("/models/rock-coast-a.glb");
useGLTF.preload("/models/rocks-dormin.glb");

export function World({ quality }: { quality: QualitySettings }) {
  return (
    <group>
      <Atmosphere dust={quality.dust} shadows={quality.shadows} shadowMapSize={quality.shadowMapSize} />
      <Sea segments={quality.seaSegments} />
      <Terrain />
      <Road />
      <RoadAccentProps />
      <ShoreRocks count={quality.shadows ? 7 : 5} />
      {quality.shadows && <BeachScatter />}
      <Vegetation count={quality.treeCount} />
      <AccessPaths />
      <CoastalTown rich={quality.shadows} />
      <Belvedere />
      <CoastalZones />
      <DiscoveryRelics />
      <LivingWorld rich={quality.dust} />
      <DebugColliders />
    </group>
  );
}
