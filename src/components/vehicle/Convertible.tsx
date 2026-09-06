"use client";

import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  color?: string;
};

/**
 * Côte Melvyn roadster — generated Mediterranean convertible (body, glass,
 * cabin, wheels with steer→spin hierarchy). Kenney sedan-sports is kept as
 * a reference copy under public/models/kenney/ but is too crude (single
 * opaque colormap, no cabin, no glass) for the hero vehicle.
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
      const name = obj.name.toLowerCase();
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const raw = mesh.material;
        const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
        list.forEach((mat, idx) => {
          if (!(mat instanceof THREE.MeshStandardMaterial) && !(mat instanceof THREE.MeshPhysicalMaterial)) return;
          const cloned = mat.clone();
          const matName = `${name} ${cloned.name}`.toLowerCase();
          const isGlass = cloned.transparent || matName.includes("glass") || (cloned.opacity < 0.95 && cloned.opacity > 0);
          if (isGlass) {
            cloned.transparent = true;
            cloned.opacity = 0.62;
            cloned.depthWrite = false;
            cloned.metalness = 0.4;
            cloned.roughness = 0.06;
            cloned.color.set("#6aa8b8");
            cloned.emissive = new THREE.Color("#245060");
            cloned.emissiveIntensity = 0.22;
            cloned.side = THREE.DoubleSide;
          } else if (matName.includes("body") || matName.includes("terracotta") || cloned.color.getHexString() === "c45c3e") {
            cloned.color.lerp(new THREE.Color(color), 0.15);
            mats.push(cloned);
          }
          if (Array.isArray(mesh.material)) mesh.material[idx] = cloned;
          else mesh.material = cloned;
        });
      }
      if (name.endsWith("_spin") || (name.includes("wheel") && name.includes("spin"))) spins.push(obj);
      if (name.endsWith("_steer") || (name.includes("wheel") && name.includes("front") && name.includes("steer"))) {
        steers.push(obj);
      }
    });

    if (spins.length === 0) {
      clone.traverse((obj) => {
        if (obj.name.toLowerCase().includes("wheel")) spins.push(obj);
      });
    }

    spinNodes.current = spins;
    steerNodes.current = steers;
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
    spinNodes.current.forEach((w) => {
      w.rotation.x = wheelSpin.current;
    });
    steerNodes.current.forEach((w) => {
      w.rotation.y = steer.current;
    });
  });

  // Generated roadster is ~4.5 m, nose +Z, wheels on y=0 — no extra flip.
  return (
    <group ref={root} scale={1.08} position={[0, 0, 0]}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload("/models/roadster.glb");
