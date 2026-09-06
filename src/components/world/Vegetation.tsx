"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getRoadCurve } from "@/lib/road";

function Pine({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 1.1, 6]} />
        <meshStandardMaterial color="#5c4030" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <coneGeometry args={[1.05, 1.7, 7]} />
        <meshStandardMaterial color="#2f5c3a" roughness={0.85} />
      </mesh>
      <mesh position={[0, 2.45, 0]} castShadow>
        <coneGeometry args={[0.75, 1.3, 7]} />
        <meshStandardMaterial color="#3a6e45" roughness={0.85} />
      </mesh>
      <mesh position={[0, 3.15, 0]} castShadow>
        <coneGeometry args={[0.42, 0.9, 7]} />
        <meshStandardMaterial color="#4a8054" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Bougainvillea({ seed = 0 }: { seed?: number }) {
  const blossoms = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const a = seed + i * 0.7;
      return {
        position: [
          Math.sin(a) * (0.35 + (i % 3) * 0.12),
          0.4 + (i % 5) * 0.22,
          Math.cos(a * 1.3) * (0.25 + (i % 4) * 0.1),
        ] as [number, number, number],
        scale: 0.12 + (i % 3) * 0.04,
        color: i % 2 === 0 ? "#d4537e" : "#e8789a",
      };
    });
  }, [seed]);

  return (
    <group>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 1.2, 5]} />
        <meshStandardMaterial color="#3d5c32" />
      </mesh>
      {blossoms.map((b, i) => (
        <mesh key={i} position={b.position} castShadow>
          <sphereGeometry args={[b.scale, 5, 5]} />
          <meshStandardMaterial color={b.color} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Olive({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.16, 1.2, 6]} />
        <meshStandardMaterial color="#6a5340" />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <sphereGeometry args={[0.85, 8, 8]} />
        <meshStandardMaterial color="#6f8f55" roughness={0.9} />
      </mesh>
      <mesh position={[0.35, 1.85, 0.2]} castShadow>
        <sphereGeometry args={[0.45, 7, 7]} />
        <meshStandardMaterial color="#7fa066" roughness={0.9} />
      </mesh>
    </group>
  );
}

export function Vegetation({ count = 60 }: { count?: number }) {
  const group = useRef<THREE.Group>(null);
  const placements = useMemo(() => {
    const curve = getRoadCurve();
    const items: {
      type: "pine" | "olive" | "bougainvillea";
      position: [number, number, number];
      scale: number;
      rot: number;
      seed: number;
    }[] = [];

    for (let i = 0; i < count; i++) {
      const t = 0.05 + (i / count) * 0.9;
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const cliffSide = i % 3 !== 0;
      const dist = cliffSide ? 7 + (i % 5) * 1.8 : -8 - (i % 4) * 1.4;
      const pos = p.clone().addScaledVector(side, dist);
      pos.y = cliffSide ? 0.1 + (i % 4) * 0.15 : 0.02;
      const type = cliffSide ? (i % 4 === 0 ? "olive" : "pine") : i % 5 === 0 ? "bougainvillea" : "pine";
      items.push({
        type,
        position: [pos.x, pos.y, pos.z],
        scale: type === "pine" ? 0.85 + (i % 5) * 0.12 : 0.9 + (i % 3) * 0.1,
        rot: i * 0.7,
        seed: i,
      });
    }

    // Extra grove near belvedere
    for (let i = 0; i < 8; i++) {
      items.push({
        type: i % 2 === 0 ? "pine" : "bougainvillea",
        position: [-10 + i * 1.2, 0.15, -82 - (i % 3)],
        scale: 1 + (i % 3) * 0.1,
        rot: i,
        seed: 100 + i,
      });
    }
    return items;
  }, [count]);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    group.current.children.forEach((child, i) => {
      child.rotation.z = Math.sin(t * 0.7 + i) * 0.025;
      child.rotation.x = Math.cos(t * 0.55 + i * 0.4) * 0.015;
    });
  });

  return (
    <group ref={group}>
      {placements.map((p, i) => (
        <group key={i} position={p.position} rotation={[0, p.rot, 0]}>
          {p.type === "pine" && <Pine scale={p.scale} />}
          {p.type === "olive" && <Olive scale={p.scale} />}
          {p.type === "bougainvillea" && <Bougainvillea seed={p.seed} />}
        </group>
      ))}
    </group>
  );
}
