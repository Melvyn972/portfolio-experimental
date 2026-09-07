"use client";

import { useEffect, useRef } from "react";
import type { Group } from "three";

type Props = {
  color?: string;
};

/**
 * Soft-GL hero car: boxes only. Never import roadster.glb on this path —
 * useGLTF.preload in Convertible.tsx would fetch the mesh into SwiftShader.
 */
export function ConvertibleLite({ color = "#c45c3e" }: Props) {
  const root = useRef<Group>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const noop = () => undefined;
    node.userData.setWheelSpin = noop;
    node.userData.setSteer = noop;
    if (node.parent) {
      node.parent.userData.setWheelSpin = noop;
      node.parent.userData.setSteer = noop;
    }
  }, []);

  return (
    <group ref={root} position={[0, 0.02, 0]}>
      <mesh position={[0, 0.38, 0.05]}>
        <boxGeometry args={[1.55, 0.42, 3.35]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.62, -0.55]}>
        <boxGeometry args={[1.35, 0.22, 1.4]} />
        <meshBasicMaterial color="#2a2420" />
      </mesh>
      <mesh position={[0, 0.85, 0.55]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[1.2, 0.38, 0.04]} />
        <meshBasicMaterial color="#7eb8c4" />
      </mesh>
      {(
        [
          [-0.58, 0.22, 1.05],
          [0.58, 0.22, 1.05],
          [-0.58, 0.22, -1.15],
          [0.58, 0.22, -1.15],
        ] as const
      ).map((p, i) => (
        <mesh key={i} position={p} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.28, 0.28, 0.18, 6]} />
          <meshBasicMaterial color="#1a1816" />
        </mesh>
      ))}
    </group>
  );
}
