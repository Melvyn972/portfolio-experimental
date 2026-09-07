"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { content } from "@/lib/content";
import { sampleGroundHeight } from "@/lib/ground";

/** Idle life: clouds, birds, boats, foam, lighthouse beam, chimney smoke. */
export function LivingWorld({ rich = true }: { rich?: boolean }) {
  return (
    <group>
      <Clouds count={rich ? 9 : 5} />
      <BirdFlock count={rich ? 7 : 4} />
      <DistantBoats count={rich ? 3 : 2} />
      <ShoreFoam />
      <LighthouseBeam />
      {rich && <ChimneySmoke />}
    </group>
  );
}

function Clouds({ count }: { count: number }) {
  const ref = useRef<THREE.Group>(null);
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: -18 + (i % 4) * 16,
        y: 22 + (i % 3) * 3.2,
        z: 30 - i * 28,
        s: 6 + (i % 3) * 2.4,
      })),
    [count],
  );
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.position.x += dt * 0.22;
    if (ref.current.position.x > 18) ref.current.position.x = -8;
  });
  return (
    <group ref={ref}>
      {items.map((c, i) => (
        <mesh key={i} position={[c.x, c.y, c.z]} rotation={[0.1, 0.2, 0]}>
          <sphereGeometry args={[c.s, 7, 5]} />
          <meshStandardMaterial color="#e8e0d4" transparent opacity={0.42} roughness={1} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function BirdFlock({ count }: { count: number }) {
  const ref = useRef<THREE.Group>(null);
  const birds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        phase: i * 0.9,
        r: 14 + i * 2.2,
        y: 6 + (i % 3) * 1.4,
      })),
    [count],
  );
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.children.forEach((child, i) => {
      const b = birds[i];
      const a = t * 0.28 + b.phase;
      child.position.set(Math.cos(a) * b.r - 4, b.y + Math.sin(t * 1.4 + b.phase) * 0.4, Math.sin(a) * b.r - 70);
      child.rotation.y = a + Math.PI / 2;
    });
  });
  return (
    <group ref={ref}>
      {birds.map((_, i) => (
        <mesh key={i}>
          <coneGeometry args={[0.12, 0.42, 3]} />
          <meshStandardMaterial color="#2a2420" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function DistantBoats({ count }: { count: number }) {
  const ref = useRef<THREE.Group>(null);
  const boats = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: -32 - i * 3,
        z: -20 - i * 42,
        phase: i * 1.3,
      })),
    [count],
  );
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    ref.current?.children.forEach((c, i) => {
      const b = boats[i];
      c.position.y = -0.05 + Math.sin(t * 0.7 + b.phase) * 0.06;
      c.rotation.z = Math.sin(t * 0.5 + b.phase) * 0.04;
    });
  });
  return (
    <group ref={ref}>
      {boats.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]}>
          <mesh>
            <boxGeometry args={[2.4, 0.35, 0.85]} />
            <meshStandardMaterial color="#6a4a32" roughness={0.7} />
          </mesh>
          <mesh position={[0.2, 0.85, 0]}>
            <boxGeometry args={[0.08, 1.4, 0.08]} />
            <meshStandardMaterial color="#d8d0c4" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ShoreFoam() {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (mat.current) mat.current.opacity = 0.28 + Math.sin(clock.elapsedTime * 1.1) * 0.08;
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-17.15, -0.16, -60]} renderOrder={1}>
      <planeGeometry args={[1.6, 230]} />
      <meshStandardMaterial
        ref={mat}
        color="#e8e4dc"
        transparent
        opacity={0.3}
        roughness={1}
        depthWrite={false}
      />
    </mesh>
  );
}

function LighthouseBeam() {
  const ref = useRef<THREE.Group>(null);
  const phare = content.zones.zones.find((z) => z.id === "phare")?.marker;
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.35;
  });
  if (!phare) return null;
  const y = sampleGroundHeight(phare.x, phare.z) + 7.2;
  return (
    <group ref={ref} position={[phare.x, y, phare.z]}>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[6, 0, 0]}>
        <coneGeometry args={[1.6, 14, 8, 1, true]} />
        <meshBasicMaterial color="#ffe6b0" transparent opacity={0.09} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color="#ffd090" intensity={1.1} distance={28} />
    </group>
  );
}

function ChimneySmoke() {
  const ref = useRef<THREE.Points>(null);
  const n = 36;
  const positions = useMemo(() => {
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = 24.2 + (i % 3) * 0.15;
      arr[i * 3 + 1] = 5 + Math.random() * 3;
      arr[i * 3 + 2] = -64 + (i % 5) * 0.2;
    }
    return arr;
  }, []);
  useFrame((_, dt) => {
    const pos = ref.current?.geometry.attributes.position as THREE.BufferAttribute | undefined;
    if (!pos) return;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + dt * 0.35;
      if (y > 10) y = 5;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#c8c0b4" size={0.18} transparent opacity={0.28} depthWrite={false} />
    </points>
  );
}
