"use client";

import { forwardRef, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MutableRefObject } from "react";

type Props = {
  color?: string;
};

/** Fictional Mediterranean convertible — stylized premium proportions. */
export const Convertible = forwardRef<THREE.Group, Props>(function Convertible(
  { color = "#c45c3e" },
  ref,
) {
  const wheelSpin = useRef(0);
  const steer = useRef(0);
  const wheels = useRef<THREE.Group[]>([]);
  const frontWheels = useRef<THREE.Group[]>([]);

  useFrame(() => {
    wheels.current.forEach((w) => {
      if (w) w.rotation.x = wheelSpin.current;
    });
    frontWheels.current.forEach((w) => {
      if (w) w.rotation.y = steer.current;
    });
  });

  const onGroup = (node: THREE.Group | null) => {
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
    if (node) {
      node.userData.setWheelSpin = (d: number) => {
        wheelSpin.current += d;
      };
      node.userData.setSteer = (a: number) => {
        steer.current = THREE.MathUtils.lerp(steer.current, a, 0.2);
      };
    }
  };

  return (
    <group ref={onGroup}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.35, 24]} />
        <meshBasicMaterial color="#1a1510" transparent opacity={0.22} />
      </mesh>

      {/* Main hull — slightly tapered via stacked volumes */}
      <mesh position={[0, 0.38, 0.05]} castShadow>
        <boxGeometry args={[1.9, 0.32, 4.35]} />
        <meshStandardMaterial color={color} metalness={0.58} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.52, 0.15]} castShadow>
        <boxGeometry args={[1.78, 0.16, 3.9]} />
        <meshStandardMaterial color={color} metalness={0.55} roughness={0.32} />
      </mesh>

      {/* Nose */}
      <mesh position={[0, 0.46, 1.95]} castShadow>
        <boxGeometry args={[1.65, 0.26, 0.65]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.42, 2.28]} castShadow>
        <boxGeometry args={[1.35, 0.18, 0.28]} />
        <meshStandardMaterial color={color} metalness={0.62} roughness={0.26} />
      </mesh>

      {/* Character line / rocker */}
      <mesh position={[0.96, 0.34, 0]} castShadow>
        <boxGeometry args={[0.06, 0.14, 3.8]} />
        <meshStandardMaterial color="#9a3f2a" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[-0.96, 0.34, 0]} castShadow>
        <boxGeometry args={[0.06, 0.14, 3.8]} />
        <meshStandardMaterial color="#9a3f2a" metalness={0.4} roughness={0.4} />
      </mesh>

      {/* Cabin tub */}
      <mesh position={[0, 0.58, -0.25]} castShadow>
        <boxGeometry args={[1.68, 0.28, 1.65]} />
        <meshStandardMaterial color="#1c1815" roughness={0.82} />
      </mesh>

      {/* Door tops */}
      <mesh position={[0.9, 0.62, -0.1]} castShadow>
        <boxGeometry args={[0.1, 0.28, 1.9]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[-0.9, 0.62, -0.1]} castShadow>
        <boxGeometry args={[0.1, 0.28, 1.9]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.35} />
      </mesh>

      {/* Rear deck + folded soft top */}
      <mesh position={[0, 0.56, -1.7]} castShadow>
        <boxGeometry args={[1.72, 0.2, 1.0]} />
        <meshStandardMaterial color={color} metalness={0.55} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.78, -1.5]} castShadow>
        <boxGeometry args={[1.4, 0.24, 0.58]} />
        <meshStandardMaterial color="#2a221c" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.92, -1.42]} castShadow>
        <boxGeometry args={[1.28, 0.1, 0.4]} />
        <meshStandardMaterial color="#3a3028" roughness={0.8} />
      </mesh>

      {/* Windshield assembly */}
      <mesh position={[0, 0.98, 0.58]} rotation={[-0.38, 0, 0]} castShadow>
        <boxGeometry args={[1.52, 0.58, 0.05]} />
        <meshStandardMaterial
          color="#b9d6e0"
          metalness={0.35}
          roughness={0.06}
          transparent
          opacity={0.42}
        />
      </mesh>
      <mesh position={[0.74, 0.9, 0.58]} rotation={[-0.38, 0, 0]}>
        <boxGeometry args={[0.04, 0.58, 0.04]} />
        <meshStandardMaterial color="#d8d4cc" metalness={0.9} roughness={0.18} />
      </mesh>
      <mesh position={[-0.74, 0.9, 0.58]} rotation={[-0.38, 0, 0]}>
        <boxGeometry args={[0.04, 0.58, 0.04]} />
        <meshStandardMaterial color="#d8d4cc" metalness={0.9} roughness={0.18} />
      </mesh>
      <mesh position={[0, 1.2, 0.42]} rotation={[-0.38, 0, 0]}>
        <boxGeometry args={[1.52, 0.04, 0.04]} />
        <meshStandardMaterial color="#d8d4cc" metalness={0.9} roughness={0.18} />
      </mesh>

      {/* Seats */}
      <mesh position={[0.36, 0.7, -0.1]} castShadow>
        <boxGeometry args={[0.52, 0.16, 0.52]} />
        <meshStandardMaterial color="#2a2420" roughness={0.75} />
      </mesh>
      <mesh position={[-0.36, 0.7, -0.1]} castShadow>
        <boxGeometry args={[0.52, 0.16, 0.52]} />
        <meshStandardMaterial color="#2a2420" roughness={0.75} />
      </mesh>
      <mesh position={[0.36, 0.92, -0.32]} castShadow>
        <boxGeometry args={[0.52, 0.42, 0.1]} />
        <meshStandardMaterial color="#322b26" roughness={0.75} />
      </mesh>
      <mesh position={[-0.36, 0.92, -0.32]} castShadow>
        <boxGeometry args={[0.52, 0.42, 0.1]} />
        <meshStandardMaterial color="#322b26" roughness={0.75} />
      </mesh>

      {/* Wheel + dash */}
      <mesh position={[0.36, 0.92, 0.28]} rotation={[1.15, 0, 0]}>
        <torusGeometry args={[0.13, 0.018, 8, 18]} />
        <meshStandardMaterial color="#1a1614" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.78, 0.45]} castShadow>
        <boxGeometry args={[1.4, 0.08, 0.28]} />
        <meshStandardMaterial color="#1f1a16" roughness={0.6} />
      </mesh>

      {/* Lights */}
      <mesh position={[0.52, 0.5, 2.38]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <circleGeometry args={[0.13, 14]} />
        <meshStandardMaterial color="#f7f2e4" emissive="#fff0c8" emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[-0.52, 0.5, 2.38]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <circleGeometry args={[0.13, 14]} />
        <meshStandardMaterial color="#f7f2e4" emissive="#fff0c8" emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[0.58, 0.52, -2.18]} castShadow>
        <boxGeometry args={[0.38, 0.1, 0.05]} />
        <meshStandardMaterial color="#b03030" emissive="#801818" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[-0.58, 0.52, -2.18]} castShadow>
        <boxGeometry args={[0.38, 0.1, 0.05]} />
        <meshStandardMaterial color="#b03030" emissive="#801818" emissiveIntensity={0.3} />
      </mesh>

      {/* Chrome grille */}
      <mesh position={[0, 0.4, 2.38]}>
        <boxGeometry args={[0.65, 0.14, 0.04]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.4} />
      </mesh>
      {[ -0.18, -0.06, 0.06, 0.18 ].map((x) => (
        <mesh key={x} position={[x, 0.4, 2.4]}>
          <boxGeometry args={[0.03, 0.12, 0.02]} />
          <meshStandardMaterial color="#c9c2b4" metalness={0.85} roughness={0.25} />
        </mesh>
      ))}

      {/* Side mirrors */}
      <mesh position={[0.95, 0.78, 0.55]} castShadow>
        <boxGeometry args={[0.18, 0.08, 0.1]} />
        <meshStandardMaterial color="#d8d4cc" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[-0.95, 0.78, 0.55]} castShadow>
        <boxGeometry args={[0.18, 0.08, 0.1]} />
        <meshStandardMaterial color="#d8d4cc" metalness={0.8} roughness={0.25} />
      </mesh>

      <Wheel refAdd={wheels} frontRefAdd={frontWheels} position={[0.82, 0.32, 1.28]} />
      <Wheel refAdd={wheels} frontRefAdd={frontWheels} position={[-0.82, 0.32, 1.28]} />
      <Wheel refAdd={wheels} position={[0.82, 0.32, -1.38]} />
      <Wheel refAdd={wheels} position={[-0.82, 0.32, -1.38]} />
    </group>
  );
});

function Wheel({
  position,
  refAdd,
  frontRefAdd,
}: {
  position: [number, number, number];
  refAdd: MutableRefObject<THREE.Group[]>;
  frontRefAdd?: MutableRefObject<THREE.Group[]>;
}) {
  return (
    <group
      position={position}
      ref={(node) => {
        if (!node) return;
        if (!refAdd.current.includes(node)) refAdd.current.push(node);
        if (frontRefAdd && !frontRefAdd.current.includes(node)) frontRefAdd.current.push(node);
      }}
    >
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.33, 0.33, 0.26, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.72} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.17, 0.17, 0.28, 12]} />
        <meshStandardMaterial color="#c9c2b4" metalness={0.88} roughness={0.22} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} rotation={[0, (i * Math.PI) / 5, Math.PI / 2]} position={[0, 0, 0]}>
          <boxGeometry args={[0.04, 0.22, 0.05]} />
          <meshStandardMaterial color="#b0a898" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}
