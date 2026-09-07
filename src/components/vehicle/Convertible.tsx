"use client";

import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getSoftGL } from "@/lib/softgl";

type Props = {
  color?: string;
};

function toPhysical(src: THREE.MeshStandardMaterial, extras: Partial<THREE.MeshPhysicalMaterialParameters> = {}) {
  const m = new THREE.MeshPhysicalMaterial({
    name: src.name,
    color: src.color.clone(),
    map: src.map,
    roughness: src.roughness,
    metalness: src.metalness,
    emissive: src.emissive?.clone() ?? new THREE.Color(0),
    emissiveIntensity: src.emissiveIntensity,
    transparent: src.transparent,
    opacity: src.opacity,
    side: src.side,
    depthWrite: src.depthWrite,
    envMapIntensity: 1.15,
    ...extras,
  });
  return m;
}

/**
 * Hero vehicle: RGS Dev CC0 Roadster.
 * Physical paint / glass / chrome so it reads as a Mediterranean convertible,
 * not a matte toy. Wheel_* groups stay hub-centered for spin/steer.
 */
export function Convertible({ color = "#c45c3e" }: Props) {
  const { scene } = useGLTF("/models/roadster.glb");
  const root = useRef<THREE.Group>(null);
  const wheelSpin = useRef(0);
  const steer = useRef(0);
  const spinNodes = useRef<THREE.Object3D[]>([]);
  const steerNodes = useRef<THREE.Object3D[]>([]);
  const simple = getSoftGL();

  const model = useMemo(() => {
    const clone = scene.clone(true);
    const spins: THREE.Object3D[] = [];
    const steers: THREE.Object3D[] = [];
    const hubs: THREE.Object3D[] = [];

    clone.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = !simple;
        mesh.receiveShadow = !simple;
        if (simple) {
          const raw = mesh.material;
          const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
          list.forEach((mat) => {
            if (mat instanceof THREE.MeshPhysicalMaterial) {
              mat.transmission = 0;
              mat.thickness = 0;
              mat.clearcoat = 0;
            }
          });
        } else {
        const raw = mesh.material;
        const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
        list.forEach((mat, idx) => {
          if (!(mat instanceof THREE.MeshStandardMaterial) && !(mat instanceof THREE.MeshPhysicalMaterial)) return;
          const matName = `${mat.name} ${mesh.name}`.toLowerCase();
          let next: THREE.Material = mat;

          if (matName.includes("window")) {
            next = toPhysical(mat, {
              color: new THREE.Color("#9ad4de"),
              transparent: true,
              opacity: 0.26,
              roughness: 0.025,
              metalness: 0.04,
              transmission: 0.78,
              thickness: 0.42,
              ior: 1.5,
              depthWrite: false,
              side: THREE.DoubleSide,
              envMapIntensity: 1.85,
              clearcoat: 1,
              clearcoatRoughness: 0.03,
            });
          } else if (matName.includes("body blue") || mat.color.getHexString() === "c45c3e") {
            next = toPhysical(mat, {
              color: new THREE.Color(color).lerp(new THREE.Color("#b84430"), 0.08),
              metalness: 0.62,
              roughness: 0.09,
              clearcoat: 1,
              clearcoatRoughness: 0.022,
              envMapIntensity: 2.85,
              sheen: 0.28,
              sheenRoughness: 0.35,
              sheenColor: new THREE.Color("#f2c8a8"),
              reflectivity: 0.9,
            });
          } else if (matName.includes("tire")) {
            next = toPhysical(mat, {
              color: new THREE.Color("#141414"),
              roughness: 0.88,
              metalness: 0.02,
              envMapIntensity: 0.25,
            });
          } else if (matName.includes("wheel")) {
            next = toPhysical(mat, {
              color: new THREE.Color("#e4ddd0"),
              metalness: 0.92,
              roughness: 0.16,
              clearcoat: 0.55,
              clearcoatRoughness: 0.12,
              envMapIntensity: 1.55,
            });
          } else if (matName.includes("headlight")) {
            next = toPhysical(mat, {
              color: new THREE.Color("#fff6e4"),
              emissive: new THREE.Color("#ffe7b0"),
              emissiveIntensity: 0.85,
              roughness: 0.12,
              metalness: 0.35,
              transmission: 0.15,
              thickness: 0.2,
            });
          } else if (matName.includes("rear")) {
            next = toPhysical(mat, {
              color: new THREE.Color("#c02828"),
              emissive: new THREE.Color("#8a1212"),
              emissiveIntensity: 0.55,
              roughness: 0.28,
              metalness: 0.2,
            });
          } else if (matName.includes("body beige")) {
            next = toPhysical(mat, {
              color: new THREE.Color("#4a3226"),
              roughness: 0.62,
              metalness: 0.04,
              sheen: 0.4,
              sheenColor: new THREE.Color("#8a6048"),
            });
          } else if (matName.includes("body white")) {
            next = toPhysical(mat, {
              color: new THREE.Color("#f4eee4"),
              roughness: 0.38,
              metalness: 0.12,
              clearcoat: 0.25,
            });
          } else if (matName.includes("body black")) {
            next = toPhysical(mat, {
              color: new THREE.Color("#161210"),
              roughness: 0.42,
              metalness: 0.35,
              clearcoat: 0.4,
            });
          }

          if (Array.isArray(mesh.material)) mesh.material[idx] = next;
          else mesh.material = next;
        });
        }
      }

      const n = obj.name;
      if (/^Roadster_wheel_(front|rear)_(left|right)$/.test(n)) {
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
      steerG.add(spinG);
      spinG.add(obj);
      spins.push(spinG);
      if (obj.name.includes("front")) steers.push(steerG);
    }

    spinNodes.current = spins;
    steerNodes.current = steers;
    return clone;
  }, [scene, color, simple]);

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
      // Model faces +Z; +X spin rolls backward — invert so wheels roll with travel.
      w.rotation.x = -wheelSpin.current;
    });
    steerNodes.current.forEach((w) => {
      w.rotation.y = steer.current;
    });
  });

  return (
    <group ref={root} scale={1.1} position={[0, 0.015, 0]}>
      <primitive object={model} />
      {!simple && (
        <>
          <mesh position={[0, 0.92, 0.62]} rotation={[0.38, 0, 0]} castShadow>
            <boxGeometry args={[1.18, 0.42, 0.012]} />
            <meshPhysicalMaterial
              color="#8ecad6"
              transparent
              opacity={0.32}
              roughness={0.02}
              metalness={0.03}
              transmission={0.82}
              thickness={0.3}
              ior={1.5}
              envMapIntensity={1.85}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[0, 1.12, 0.5]} rotation={[0.38, 0, 0]}>
            <boxGeometry args={[1.22, 0.03, 0.03]} />
            <meshPhysicalMaterial color="#d8d2c6" metalness={0.88} roughness={0.18} clearcoat={0.4} />
          </mesh>
          <mesh position={[-0.58, 0.88, 0.58]} rotation={[0.15, 0, 0.08]}>
            <boxGeometry args={[0.035, 0.42, 0.035]} />
            <meshPhysicalMaterial color="#d8d2c6" metalness={0.88} roughness={0.18} />
          </mesh>
          <mesh position={[0.58, 0.88, 0.58]} rotation={[0.15, 0, -0.08]}>
            <boxGeometry args={[0.035, 0.42, 0.035]} />
            <meshPhysicalMaterial color="#d8d2c6" metalness={0.88} roughness={0.18} />
          </mesh>
          <mesh position={[0, 0.28, 2.12]} castShadow>
            <boxGeometry args={[1.55, 0.08, 0.1]} />
            <meshPhysicalMaterial color="#ece6da" metalness={0.9} roughness={0.14} clearcoat={0.5} />
          </mesh>
          <mesh position={[0, 0.3, -2.14]} castShadow>
            <boxGeometry args={[1.48, 0.08, 0.1]} />
            <meshPhysicalMaterial color="#ece6da" metalness={0.9} roughness={0.14} clearcoat={0.5} />
          </mesh>
          <pointLight position={[0.55, 0.42, 2.05]} intensity={0.55} color="#fff1c8" distance={4} />
          <pointLight position={[-0.55, 0.42, 2.05]} intensity={0.55} color="#fff1c8" distance={4} />
        </>
      )}
    </group>
  );
}

useGLTF.preload("/models/roadster.glb");
