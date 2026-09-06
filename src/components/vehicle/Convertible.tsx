"use client";

import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  color?: string;
};

/**
 * Fictional Mediterranean convertible — GLB stylized roadster
 * with nested steer → spin wheel hierarchy.
 */
export function Convertible({ color = "#c45c3e" }: Props) {
  const { scene } = useGLTF("/models/roadster.glb");
  const root = useRef<THREE.Group>(null);
  const wheelSpin = useRef(0);
  const steer = useRef(0);
  const spinNodes = useRef<THREE.Object3D[]>([]);
  const steerNodes = useRef<THREE.Object3D[]>([]);
  const bodyMats = useRef<THREE.MeshStandardMaterial[]>([]);

  const model = useMemo(() => {
    const clone = scene.clone(true);
    const spins: THREE.Object3D[] = [];
    const steers: THREE.Object3D[] = [];
    const mats: THREE.MeshStandardMaterial[] = [];

    clone.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat?.color) {
          const hex = `#${mat.color.getHexString()}`;
          if (hex === "#c45c3e" || hex === "#9a3f2a") {
            const cloned = mat.clone();
            mats.push(cloned);
            mesh.material = cloned;
          }
        }
      }
      if (obj.name.endsWith("_spin") || obj.name.includes("wheel") && obj.name.endsWith("_spin")) {
        spins.push(obj);
      }
      if (obj.name.endsWith("_steer")) {
        steers.push(obj);
      }
    });

    // Fallback: find spin groups by naming convention from exporter
    if (spins.length === 0) {
      clone.traverse((obj) => {
        if (obj.name.includes("_spin")) spins.push(obj);
      });
    }

    spinNodes.current = spins;
    steerNodes.current = steers;
    bodyMats.current = mats;
    return clone;
  }, [scene]);

  useEffect(() => {
    bodyMats.current.forEach((m) => m.color.set(color));
  }, [color]);

  useFrame(() => {
    spinNodes.current.forEach((w) => {
      w.rotation.x = wheelSpin.current;
    });
    steerNodes.current.forEach((w) => {
      w.rotation.y = steer.current;
    });
  });

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    node.userData.setWheelSpin = (d: number) => {
      wheelSpin.current += d;
    };
    node.userData.setSteer = (a: number) => {
      steer.current = THREE.MathUtils.lerp(steer.current, a, 0.2);
    };
  }, [model]);

  return (
    <group ref={root}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload("/models/roadster.glb");
