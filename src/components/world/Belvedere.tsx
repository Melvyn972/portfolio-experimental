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
    const p = position.clone().addScaledVector(side, -9.5);
    p.y = 1.15;
    return p;
  }, [position, side]);
  const yaw = Math.atan2(side.x, side.z) + Math.PI;

  return (
    <group position={[anchor.x, 0, anchor.z]} rotation={[0, yaw, 0]}>
      {/* Stone terrace */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[9, 1.1, 7]} />
        <meshStandardMaterial color="#ddd2c0" roughness={0.88} />
      </mesh>
      <mesh position={[0, 1.12, 0]} receiveShadow>
        <boxGeometry args={[8.6, 0.08, 6.6]} />
        <meshStandardMaterial color="#ebe3d4" roughness={0.75} />
      </mesh>

      {/* Low parapet toward sea */}
      <mesh position={[-3.8, 1.55, 0]} castShadow>
        <boxGeometry args={[0.35, 0.75, 6.2]} />
        <meshStandardMaterial color="#d2c6b2" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.45, -3.1]} castShadow>
        <boxGeometry args={[7.6, 0.55, 0.3]} />
        <meshStandardMaterial color="#d2c6b2" roughness={0.9} />
      </mesh>

      {/* Contemporary wood bench */}
      <mesh position={[1.8, 1.45, 1.4]} castShadow>
        <boxGeometry args={[2.4, 0.12, 0.55]} />
        <meshStandardMaterial color="#8b5e3c" roughness={0.7} />
      </mesh>
      <mesh position={[1.0, 1.25, 1.4]} castShadow>
        <boxGeometry args={[0.12, 0.4, 0.5]} />
        <meshStandardMaterial color="#6e4a30" />
      </mesh>
      <mesh position={[2.6, 1.25, 1.4]} castShadow>
        <boxGeometry args={[0.12, 0.4, 0.5]} />
        <meshStandardMaterial color="#6e4a30" />
      </mesh>

      {/* Slim contemporary canopy post */}
      <mesh position={[2.8, 2.4, -1.5]} castShadow>
        <boxGeometry args={[0.12, 2.4, 0.12]} />
        <meshStandardMaterial color="#cfc6b6" metalness={0.2} roughness={0.5} />
      </mesh>
      <mesh position={[0.6, 3.55, -1.5]} castShadow>
        <boxGeometry args={[4.5, 0.08, 2.2]} />
        <meshStandardMaterial color="#b08968" roughness={0.65} />
      </mesh>

      <IdentityCarnet position={[0.2, 1.16, -0.4]} />
      <StopMarker position={[8.5, 0.05, 2.5]} />
      {/* Stone path from road stop to terrace */}
      <mesh position={[4.2, 0.08, 1.2]} receiveShadow>
        <boxGeometry args={[5.5, 0.08, 1.6]} />
        <meshStandardMaterial color="#ddd2c0" roughness={0.9} />
      </mesh>
      <mesh position={[1.5, 0.35, 0.4]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.55, 1.8]} />
        <meshStandardMaterial color="#d5c8b4" roughness={0.88} />
      </mesh>
    </group>
  );
}

function StopMarker({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[1.1, 1.45, 28]} />
        <meshStandardMaterial color="#c9a66b" emissive="#8a6a3a" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.35, 20]} />
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
    const pulse = 0.15 + Math.sin(clock.elapsedTime * 1.6) * 0.08;
    (glass.current.material as THREE.MeshStandardMaterial).emissiveIntensity = open ? 0.05 : pulse;
  });

  return (
    <group position={position}>
      {/* Brass lectern */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 1.1, 10]} />
        <meshStandardMaterial color="#b08d57" metalness={0.75} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.12, 0.05]} rotation={[-0.35, 0, 0]} castShadow>
        <boxGeometry args={[0.85, 0.05, 0.6]} />
        <meshStandardMaterial color="#9a7540" metalness={0.65} roughness={0.4} />
      </mesh>

      {/* Open carnet / glass plate */}
      <mesh ref={glass} position={[0, 1.2, 0.08]} rotation={[-0.35, 0, 0]} castShadow>
        <boxGeometry args={[0.72, 0.02, 0.5]} />
        <meshStandardMaterial
          color="#e8f2f0"
          metalness={0.15}
          roughness={0.15}
          transparent
          opacity={0.82}
          emissive="#d7ebe6"
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Paper sheet */}
      <mesh position={[0, 1.22, 0.08]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[0.58, 0.008, 0.4]} />
        <meshStandardMaterial color="#f7f1e4" roughness={0.85} />
      </mesh>

      {/* Brass corner clips */}
      <mesh position={[-0.28, 1.23, 0.22]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[0.08, 0.02, 0.08]} />
        <meshStandardMaterial color="#c4a35a" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.28, 1.23, 0.22]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[0.08, 0.02, 0.08]} />
        <meshStandardMaterial color="#c4a35a" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

export function getBelvedereInteractPosition() {
  const { position, tangent } = BELVEDERE;
  const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
  return position.clone().addScaledVector(side, -9.5).setY(1.2);
}

export function getBelvedereStopPosition() {
  const { position, tangent } = BELVEDERE;
  const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
  return position.clone().addScaledVector(side, -1.2).setY(0.05);
}
