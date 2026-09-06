"use client";

import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  color?: string;
};

/**
 * Kenney sedan-sports roadster (CC0) — wheel spin / steer by mesh name.
 * Scale/pivot normalized for the coastal road.
 */
export function Convertible({ color = "#c45c3e" }: Props) {
  const { scene } = useGLTF("/models/roadster.glb");
  const root = useRef<THREE.Group>(null);
  const wheelSpin = useRef(0);
  const steer = useRef(0);
  const frontWheels = useRef<THREE.Object3D[]>([]);
  const allWheels = useRef<THREE.Object3D[]>([]);
  const bodyMats = useRef<THREE.MeshStandardMaterial[]>([]);

  const model = useMemo(() => {
    const clone = scene.clone(true);
    const fronts: THREE.Object3D[] = [];
    const wheels: THREE.Object3D[] = [];
    const mats: THREE.MeshStandardMaterial[] = [];

    clone.traverse((obj) => {
      const name = obj.name.toLowerCase();
      if (name.includes("wheel")) {
        wheels.push(obj);
        if (name.includes("front")) fronts.push(obj);
      }
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat && "color" in mat && (name.includes("body") || name.includes("spoiler"))) {
          const cloned = mat.clone();
          // Light terracotta wash — keep Kenney colormap readable
          cloned.color.lerp(new THREE.Color(color), 0.35);
          cloned.metalness = Math.max(cloned.metalness ?? 0, 0.2);
          cloned.roughness = Math.min(cloned.roughness ?? 1, 0.6);
          mats.push(cloned);
          mesh.material = cloned;
        }
      }
    });

    frontWheels.current = fronts;
    allWheels.current = wheels;
    bodyMats.current = mats;
    return clone;
  }, [scene, color]);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const api = {
      setWheelSpin: (d: number) => {
        wheelSpin.current += d;
      },
      setSteer: (a: number) => {
        steer.current = THREE.MathUtils.lerp(steer.current, a, 0.28);
      },
    };
    node.userData.setWheelSpin = api.setWheelSpin;
    node.userData.setSteer = api.setSteer;
    if (node.parent) {
      node.parent.userData.setWheelSpin = api.setWheelSpin;
      node.parent.userData.setSteer = api.setSteer;
    }
  }, [model]);

  useFrame(() => {
    const node = root.current;
    if (node?.parent && !node.parent.userData.setWheelSpin) {
      node.parent.userData.setWheelSpin = node.userData.setWheelSpin;
      node.parent.userData.setSteer = node.userData.setSteer;
    }
    allWheels.current.forEach((w) => {
      w.rotation.x = wheelSpin.current;
    });
    frontWheels.current.forEach((w) => {
      w.rotation.y = steer.current;
    });
  });

  // Kenney cars are ~2.5m long, sit on y=0 — scale up slightly for presence
  return (
    <group ref={root} scale={1.35} position={[0, 0, 0]} rotation={[0, Math.PI, 0]}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload("/models/roadster.glb");
