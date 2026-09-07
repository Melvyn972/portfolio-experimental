"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { content } from "@/lib/content";
import { sampleGroundHeight } from "@/lib/ground";
import { getGameState } from "@/lib/gameStore";

/** Idle life — readable on Éco: foam, beam, birds, dust, boats. */
export function LivingWorld() {
  return (
    <group>
      <Clouds count={7} />
      <BirdFlock count={8} />
      <DistantBoats count={2} />
      <ShoreFoam />
      <LighthouseBeam />
      <RoadDust count={28} />
      <ChimneySmoke />
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

/** V-wings that read on Éco / soft-GL — not tiny dark cones. */
function BirdFlock({ count }: { count: number }) {
  const ref = useRef<THREE.Group>(null);
  const birds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        phase: i * 0.85,
        r: 16 + (i % 4) * 3.4,
        y: 8.5 + (i % 3) * 1.8,
        z0: -62 - (i % 3) * 14,
        speed: 0.32 + (i % 3) * 0.04,
      })),
    [count],
  );
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.children.forEach((child, i) => {
      const b = birds[i];
      const a = t * b.speed + b.phase;
      child.position.set(Math.cos(a) * b.r - 2, b.y + Math.sin(t * 1.6 + b.phase) * 0.55, Math.sin(a) * b.r + b.z0);
      child.rotation.y = a + Math.PI / 2;
      child.rotation.z = Math.sin(t * 8 + b.phase) * 0.18;
    });
  });
  return (
    <group ref={ref}>
      {birds.map((_, i) => (
        <group key={i}>
          <mesh position={[-0.34, 0, 0]} rotation={[0, 0, 0.48]}>
            <boxGeometry args={[0.78, 0.05, 0.16]} />
            <meshStandardMaterial color="#3a3228" emissive="#1c1812" emissiveIntensity={0.28} roughness={0.7} />
          </mesh>
          <mesh position={[0.34, 0, 0]} rotation={[0, 0, -0.48]}>
            <boxGeometry args={[0.78, 0.05, 0.16]} />
            <meshStandardMaterial color="#4a4034" emissive="#1c1812" emissiveIntensity={0.28} roughness={0.7} />
          </mesh>
        </group>
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
  const a = useRef<THREE.MeshStandardMaterial>(null);
  const b = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (a.current) a.current.opacity = 0.52 + Math.sin(t * 1.35) * 0.16;
    if (b.current) b.current.opacity = 0.32 + Math.cos(t * 1.05) * 0.12;
  });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-17.15, -0.155, -60]} renderOrder={1}>
        <planeGeometry args={[3.05, 230]} />
        <meshStandardMaterial
          ref={a}
          color="#f4eee4"
          transparent
          opacity={0.52}
          roughness={1}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-16.45, -0.12, -60]} renderOrder={1}>
        <planeGeometry args={[1.45, 230]} />
        <meshStandardMaterial
          ref={b}
          color="#e4d8c8"
          transparent
          opacity={0.32}
          roughness={1}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function LighthouseBeam() {
  const ref = useRef<THREE.Group>(null);
  const cone = useRef<THREE.MeshBasicMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const phare = content.zones.zones.find((z) => z.id === "phare")?.marker;
  useFrame(({ clock }, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.38;
    const pulse = 0.55 + 0.45 * Math.sin(clock.elapsedTime * 1.85);
    if (cone.current) cone.current.opacity = 0.18 + pulse * 0.22;
    if (light.current) light.current.intensity = 1.15 + pulse * 1.85;
  });
  if (!phare) return null;
  const y = sampleGroundHeight(phare.x, phare.z) + 7.2;
  return (
    <group ref={ref} position={[phare.x, y, phare.z]}>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[7.2, 0, 0]}>
        <coneGeometry args={[1.85, 16, 8, 1, true]} />
        <meshBasicMaterial ref={cone} color="#ffe6b0" transparent opacity={0.28} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <pointLight ref={light} color="#ffd090" intensity={1.4} distance={34} />
    </group>
  );
}

function RoadDust({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const ages = useRef(new Float32Array(count));
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) arr[i * 3 + 1] = -4;
    return arr;
  }, [count]);
  useFrame((_, dt) => {
    const pts = ref.current;
    const pos = pts?.geometry.attributes.position as THREE.BufferAttribute | undefined;
    if (!pts || !pos) return;
    const s = getGameState();
    const driving = s.mode === "driving" && s.phase === "playing";
    const emit = driving && s.speed > 1.35;
    const yaw = s.carYaw;
    const backX = -Math.sin(yaw);
    const backZ = -Math.cos(yaw);
    for (let i = 0; i < count; i++) {
      ages.current[i] += dt;
      if (emit && (ages.current[i] > 0.55 || pos.getY(i) < 0.05)) {
        const spread = (i % 7) * 0.09 - 0.27;
        pos.setXYZ(
          i,
          s.carPos.x + backX * 1.8 + Math.cos(yaw) * spread,
          s.carPos.y + 0.12,
          s.carPos.z + backZ * 1.8 + Math.sin(yaw) * spread,
        );
        ages.current[i] = (i % 5) * 0.04;
      } else {
        pos.setY(i, pos.getY(i) + dt * 0.55);
        pos.setX(i, pos.getX(i) + backX * dt * 0.4);
        pos.setZ(i, pos.getZ(i) + backZ * dt * 0.4);
        if (ages.current[i] > 1.1) pos.setY(i, -4);
      }
    }
    pos.needsUpdate = true;
    const mat = pts.material as THREE.PointsMaterial;
    mat.opacity = emit ? 0.55 : 0.14;
  });
  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#c4a878" size={0.28} transparent opacity={0.18} depthWrite={false} sizeAttenuation />
    </points>
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
