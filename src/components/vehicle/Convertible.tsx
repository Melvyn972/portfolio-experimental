"use client";

import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  color?: string;
};

/**
 * Hero vehicle: RGS Dev CC0 Roadster (authored FBX → named GLB).
 * Wheel_* groups are hub-centered. Windows are transparent glass.
 * No procedural ExtrudeGeometry fallback on this path.
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

    const hubs: THREE.Object3D[] = [];
    clone.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const raw = mesh.material;
        const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
        list.forEach((mat, idx) => {
          if (!(mat instanceof THREE.MeshStandardMaterial) && !(mat instanceof THREE.MeshPhysicalMaterial)) return;
          const cloned = mat.clone();
          const matName = `${cloned.name} ${mesh.name}`.toLowerCase();
          if (matName.includes("window") || cloned.transparent) {
            cloned.transparent = true;
            cloned.opacity = Math.min(cloned.opacity || 1, 0.4);
            cloned.depthWrite = false;
            cloned.metalness = 0.35;
            cloned.roughness = 0.06;
            cloned.side = THREE.DoubleSide;
          } else if (matName.includes("body blue") || cloned.color.getHexString() === "c45c3e") {
            cloned.color.lerp(new THREE.Color(color), 0.2);
            mats.push(cloned);
          }
          if (Array.isArray(mesh.material)) mesh.material[idx] = cloned;
          else mesh.material = cloned;
        });
      }

      const n = obj.name.toLowerCase();
      if (n.includes("wheel") && obj.children.length > 0 && !n.includes("steer") && !n.includes("spin")) {
        hubs.push(obj);
      }
    });

    for (const obj of hubs) {
      const parent = obj.parent;
      if (!parent) continue;
      const steerG = new THREE.Group();
      steerG.name = obj.name + "_steer";
      steerG.position.copy(obj.position);
      parent.add(steerG);
      const spinG = new THREE.Group();
      spinG.name = obj.name + "_spin";
      obj.position.set(0, 0, 0);
      obj.rotation.set(0, 0, 0);
      steerG.add(spinG);
      spinG.add(obj);
      spins.push(spinG);
      if (obj.name.toLowerCase().includes("front")) steers.push(steerG);
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

  // RGS roadster ~4.35 m, nose +Z, tires on y=0
  return (
    <group ref={root} scale={1.05} position={[0, 0.02, 0]}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload("/models/roadster.glb");
