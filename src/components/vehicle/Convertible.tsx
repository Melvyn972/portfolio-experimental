"use client";

import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  color?: string;
};

/**
 * Hero vehicle: RGS Dev CC0 Roadster (authored FBX → GLB).
 * Separate body + 4 wheel meshes. Windows are transparent glass.
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
    const wheelMeshes: THREE.Mesh[] = [];

    clone.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const name = mesh.name.toLowerCase();
      if (name.includes("wheel")) wheelMeshes.push(mesh);

      const raw = mesh.material;
      const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
      list.forEach((mat, idx) => {
        if (!(mat instanceof THREE.MeshStandardMaterial) && !(mat instanceof THREE.MeshPhysicalMaterial)) return;
        const cloned = mat.clone();
        const matName = `${cloned.name} ${name}`.toLowerCase();
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
    });

    for (const mesh of wheelMeshes) {
      const parent = mesh.parent;
      if (!parent) continue;
      const n = mesh.name.toLowerCase();
      const isFront = n.includes("front");
      const steerG = new THREE.Group();
      steerG.name = mesh.name + "_steer";
      steerG.position.copy(mesh.position);
      steerG.quaternion.copy(mesh.quaternion);
      steerG.scale.copy(mesh.scale);
      const spinG = new THREE.Group();
      spinG.name = mesh.name + "_spin";
      mesh.position.set(0, 0, 0);
      mesh.quaternion.identity();
      mesh.scale.set(1, 1, 1);
      parent.add(steerG);
      steerG.add(spinG);
      spinG.add(mesh);
      spins.push(spinG);
      if (isFront) steers.push(steerG);
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

  // RGS roadster ~4.35 m, nose +Z, wheels on y=0
  return (
    <group ref={root} scale={1.05} position={[0, 0, 0]}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload("/models/roadster.glb");
