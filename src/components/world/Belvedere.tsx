"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BELVEDERE } from "@/lib/road";
import { useGameStore } from "@/hooks/useGameStore";

export function Belvedere() {
  const { position, tangent } = BELVEDERE;
  const side = useMemo(() => new THREE.Vector3(-tangent.z, 0, tangent.x).normalize(), [tangent]);
  const anchor = useMemo(() => {
    const p = position.clone().addScaledVector(side, -8.5);
    return p;
  }, [position, side]);
  const yaw = Math.atan2(-side.x, -side.z);

  return (
    <group position={[anchor.x, 0.02, anchor.z]} rotation={[0, yaw, 0]}>
      {/* Wide pale stone terrace */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[11, 0.9, 8.5]} />
        <meshStandardMaterial color="#e4d9c6" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.92, 0]} receiveShadow>
        <boxGeometry args={[10.4, 0.08, 7.9]} />
        <meshStandardMaterial color="#f0e8d8" roughness={0.7} />
      </mesh>

      {/* Steps down toward road */}
      <mesh position={[4.8, 0.28, 1.5]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.55, 2.4]} />
        <meshStandardMaterial color="#ddd1bd" roughness={0.9} />
      </mesh>
      <mesh position={[6.6, 0.12, 1.5]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.28, 2.0]} />
        <meshStandardMaterial color="#d5c8b4" roughness={0.9} />
      </mesh>

      {/* Sea-facing parapet */}
      <mesh position={[-4.9, 1.35, 0]} castShadow>
        <boxGeometry args={[0.4, 0.85, 7.6]} />
        <meshStandardMaterial color="#d8ccb8" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.25, -3.7]} castShadow>
        <boxGeometry args={[9.5, 0.6, 0.35]} />
        <meshStandardMaterial color="#d8ccb8" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.25, 3.7]} castShadow>
        <boxGeometry args={[9.5, 0.45, 0.3]} />
        <meshStandardMaterial color="#d8ccb8" roughness={0.9} />
      </mesh>

      {/* Wood bench */}
      <mesh position={[2.2, 1.2, 2.0]} castShadow>
        <boxGeometry args={[2.6, 0.12, 0.55]} />
        <meshStandardMaterial color="#8b5e3c" roughness={0.65} />
      </mesh>
      <mesh position={[1.3, 1.0, 2.0]} castShadow>
        <boxGeometry args={[0.12, 0.4, 0.5]} />
        <meshStandardMaterial color="#6e4a30" />
      </mesh>
      <mesh position={[3.1, 1.0, 2.0]} castShadow>
        <boxGeometry args={[0.12, 0.4, 0.5]} />
        <meshStandardMaterial color="#6e4a30" />
      </mesh>

      {/* Contemporary canopy */}
      <mesh position={[3.2, 2.2, -1.8]} castShadow>
        <boxGeometry args={[0.12, 2.4, 0.12]} />
        <meshStandardMaterial color="#cfc6b6" metalness={0.25} roughness={0.45} />
      </mesh>
      <mesh position={[0.4, 2.2, -1.8]} castShadow>
        <boxGeometry args={[0.12, 2.4, 0.12]} />
        <meshStandardMaterial color="#cfc6b6" metalness={0.25} roughness={0.45} />
      </mesh>
      <mesh position={[1.8, 3.45, -1.8]} castShadow>
        <boxGeometry args={[5.2, 0.1, 2.6]} />
        <meshStandardMaterial color="#a67c52" roughness={0.6} />
      </mesh>

      {/* Bougainvillea on parapet */}
      {[-2.5, -0.5, 1.5].map((z, i) => (
        <group key={i} position={[-4.5, 1.7, z]}>
          <mesh castShadow>
            <sphereGeometry args={[0.35, 6, 6]} />
            <meshStandardMaterial color="#d4537e" roughness={0.7} />
          </mesh>
          <mesh position={[0.2, 0.1, 0.1]} castShadow>
            <sphereGeometry args={[0.22, 5, 5]} />
            <meshStandardMaterial color="#3d6b35" roughness={0.85} />
          </mesh>
        </group>
      ))}

      <IdentityCarnet position={[0, 0.96, -0.6]} />
      <StopMarker position={[7.8, 0.02, 1.6]} />
    </group>
  );
}

function StopMarker({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[1.3, 1.7, 32]} />
        <meshStandardMaterial color="#c9a66b" emissive="#8a6a3a" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4, 24]} />
        <meshStandardMaterial color="#f0e6d2" />
      </mesh>
    </group>
  );
}

function IdentityCarnet({ position }: { position: [number, number, number] }) {
  const glass = useRef<THREE.Mesh>(null);
  const { identityOpen: open } = useGameStore();

  useFrame(({ clock }) => {
    if (!glass.current) return;
    const pulse = 0.18 + Math.sin(clock.elapsedTime * 1.6) * 0.1;
    (glass.current.material as THREE.MeshStandardMaterial).emissiveIntensity = open ? 0.06 : pulse;
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.14, 1.1, 12]} />
        <meshStandardMaterial color="#b08d57" metalness={0.78} roughness={0.32} />
      </mesh>
      <mesh position={[0, 1.12, 0.06]} rotation={[-0.35, 0, 0]} castShadow>
        <boxGeometry args={[0.95, 0.06, 0.68]} />
        <meshStandardMaterial color="#9a7540" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh ref={glass} position={[0, 1.2, 0.1]} rotation={[-0.35, 0, 0]} castShadow>
        <boxGeometry args={[0.8, 0.025, 0.55]} />
        <meshStandardMaterial
          color="#e8f2f0"
          metalness={0.2}
          roughness={0.12}
          transparent
          opacity={0.85}
          emissive="#d7ebe6"
          emissiveIntensity={0.18}
        />
      </mesh>
      <mesh position={[0, 1.22, 0.1]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[0.65, 0.01, 0.45]} />
        <meshStandardMaterial color="#f7f1e4" roughness={0.85} />
      </mesh>
      <mesh position={[-0.3, 1.24, 0.25]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[0.1, 0.02, 0.1]} />
        <meshStandardMaterial color="#c4a35a" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0.3, 1.24, 0.25]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[0.1, 0.02, 0.1]} />
        <meshStandardMaterial color="#c4a35a" metalness={0.85} roughness={0.25} />
      </mesh>
    </group>
  );
}

export function getBelvedereInteractPosition() {
  const { position, tangent } = BELVEDERE;
  const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
  return position.clone().addScaledVector(side, -8.5).setY(1.3);
}

export function getBelvedereStopPosition() {
  const { position, tangent } = BELVEDERE;
  const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
  return position.clone().addScaledVector(side, -1.0).setY(0.05);
}
