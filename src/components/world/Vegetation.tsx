"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getRoadCurve } from "@/lib/road";

/** Mediterranean stone pine — umbrella canopy */
function StonePine({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.22, 2.2, 6]} />
        <meshStandardMaterial color="#5a4030" roughness={0.9} />
      </mesh>
      <mesh position={[0.15, 1.6, 0]} rotation={[0, 0, 0.25]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 1.0, 5]} />
        <meshStandardMaterial color="#5a4030" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.55, 0]} castShadow>
        <sphereGeometry args={[1.15, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color="#3a6b42" roughness={0.85} />
      </mesh>
      <mesh position={[0.35, 2.45, 0.2]} castShadow>
        <sphereGeometry args={[0.7, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color="#4a7c52" roughness={0.85} />
      </mesh>
      <mesh position={[-0.4, 2.4, -0.15]} castShadow>
        <sphereGeometry args={[0.65, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color="#2f5c38" roughness={0.85} />
      </mesh>
    </group>
  );
}

function Cypress({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.14, 0.5, 6]} />
        <meshStandardMaterial color="#4a3828" />
      </mesh>
      <mesh position={[0, 3.2, 0]} castShadow>
        <coneGeometry args={[0.55, 4.2, 7]} />
        <meshStandardMaterial color="#1f4a32" roughness={0.88} />
      </mesh>
    </group>
  );
}

function Bougainvillea({ seed = 0 }: { seed?: number }) {
  const blossoms = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => {
      const a = seed + i * 0.55;
      return {
        position: [
          Math.sin(a) * (0.4 + (i % 4) * 0.1),
          0.35 + (i % 6) * 0.2,
          Math.cos(a * 1.2) * (0.3 + (i % 3) * 0.12),
        ] as [number, number, number],
        scale: 0.1 + (i % 4) * 0.035,
        color: i % 3 === 0 ? "#c43d6e" : i % 3 === 1 ? "#e8789a" : "#d4537e",
      };
    });
  }, [seed]);

  return (
    <group>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 1.4, 5]} />
        <meshStandardMaterial color="#3d5c32" />
      </mesh>
      <mesh position={[0.2, 1.0, 0]} rotation={[0, 0, 0.6]} castShadow>
        <cylinderGeometry args={[0.03, 0.04, 0.9, 4]} />
        <meshStandardMaterial color="#3d5c32" />
      </mesh>
      {blossoms.map((b, i) => (
        <mesh key={i} position={b.position} castShadow>
          <sphereGeometry args={[b.scale, 5, 5]} />
          <meshStandardMaterial color={b.color} roughness={0.65} />
        </mesh>
      ))}
      {/* Leaf clusters */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={`l${i}`} position={[Math.sin(i) * 0.3, 0.6 + i * 0.2, Math.cos(i) * 0.25]} castShadow>
          <sphereGeometry args={[0.18, 5, 5]} />
          <meshStandardMaterial color="#4a7a3a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Olive({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.2, 1.4, 6]} />
        <meshStandardMaterial color="#6a5340" />
      </mesh>
      <mesh position={[0, 1.85, 0]} castShadow>
        <sphereGeometry args={[0.95, 8, 8]} />
        <meshStandardMaterial color="#7a9260" roughness={0.9} />
      </mesh>
      <mesh position={[0.4, 2.0, 0.25]} castShadow>
        <sphereGeometry args={[0.5, 7, 7]} />
        <meshStandardMaterial color="#8aa570" roughness={0.9} />
      </mesh>
      <mesh position={[-0.35, 1.95, -0.2]} castShadow>
        <sphereGeometry args={[0.45, 7, 7]} />
        <meshStandardMaterial color="#6f8a55" roughness={0.9} />
      </mesh>
    </group>
  );
}

export function Vegetation({ count = 60 }: { count?: number }) {
  const group = useRef<THREE.Group>(null);
  const placements = useMemo(() => {
    const curve = getRoadCurve();
    const items: {
      type: "pine" | "olive" | "bougainvillea" | "cypress";
      position: [number, number, number];
      scale: number;
      rot: number;
      seed: number;
    }[] = [];

    for (let i = 0; i < count; i++) {
      const t = 0.04 + (i / count) * 0.92;
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const cliffSide = i % 5 !== 1;
      const dist = cliffSide ? 8 + (i % 6) * 1.6 + (i % 3) * 0.4 : -9 - (i % 4) * 1.5;
      const pos = p.clone().addScaledVector(side, dist);
      pos.y = cliffSide ? 0.05 + (i % 5) * 0.12 : 0.02;
      let type: (typeof items)[0]["type"] = "pine";
      if (!cliffSide) type = i % 3 === 0 ? "bougainvillea" : "pine";
      else if (i % 7 === 0) type = "cypress";
      else if (i % 5 === 0) type = "olive";
      else type = "pine";
      items.push({
        type,
        position: [pos.x, pos.y, pos.z],
        scale: type === "cypress" ? 0.9 + (i % 3) * 0.15 : 0.85 + (i % 5) * 0.14,
        rot: i * 0.7,
        seed: i,
      });
    }

    for (let i = 0; i < 10; i++) {
      items.push({
        type: i % 3 === 0 ? "bougainvillea" : i % 3 === 1 ? "cypress" : "pine",
        position: [-11 + i * 1.1, 0.95, -80 - (i % 4) * 1.2],
        scale: 1 + (i % 3) * 0.12,
        rot: i * 0.9,
        seed: 200 + i,
      });
    }
    return items;
  }, [count]);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    group.current.children.forEach((child, i) => {
      child.rotation.z = Math.sin(t * 0.65 + i * 0.4) * 0.03;
      child.rotation.x = Math.cos(t * 0.5 + i * 0.3) * 0.018;
    });
  });

  return (
    <group ref={group}>
      {placements.map((p, i) => (
        <group key={i} position={p.position} rotation={[0, p.rot, 0]}>
          {p.type === "pine" && <StonePine scale={p.scale} />}
          {p.type === "olive" && <Olive scale={p.scale} />}
          {p.type === "bougainvillea" && <Bougainvillea seed={p.seed} />}
          {p.type === "cypress" && <Cypress scale={p.scale} />}
        </group>
      ))}
    </group>
  );
}
