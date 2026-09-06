"use client";

import { useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getBelvedereWorldAnchor } from "@/lib/road";
import { useGameStore } from "@/hooks/useGameStore";

export function Belvedere() {
  const anchor = useMemo(() => getBelvedereWorldAnchor(), []);
  const { terrace, yaw } = anchor;
  const { scene } = useGLTF("/models/belvedere.glb");
  const structure = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);

  return (
    <group position={[terrace.x, 0, terrace.z]} rotation={[0, yaw, 0]}>
      <primitive object={structure} />
      <BelvedereBench position={[2.2, 0.96, 2.0]} />
      <BougainvilleaCluster />
      <IdentityCarnetModel position={[0, 0.96, -0.55]} />
      <StopMarker position={[7.8, 0.02, 1.6]} />
    </group>
  );
}

function BelvedereBench({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF("/models/bench.glb");
  const model = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);
  return (
    <group position={position}>
      <primitive object={model} />
    </group>
  );
}

function BougainvilleaCluster() {
  const { scene } = useGLTF("/models/bougainvillea.glb");
  const models = useMemo(() => {
    return [-2.5, -0.5, 1.5].map((z, i) => {
      const c = scene.clone(true);
      c.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.castShadow = true;
          m.receiveShadow = true;
        }
      });
      c.scale.setScalar(0.85 + i * 0.08);
      c.rotation.y = i * 0.7;
      c.position.set(-4.5, 1.55, z);
      return c;
    });
  }, [scene]);

  return (
    <group>
      {models.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
    </group>
  );
}

function StopMarker({ position }: { position: [number, number, number] }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ring.current) return;
    const mat = ring.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.15 + Math.sin(clock.elapsedTime * 2) * 0.1;
  });
  return (
    <group position={position}>
      <mesh ref={ring} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
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

function IdentityCarnetModel({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF("/models/carnet.glb");
  const root = useRef<THREE.Group>(null);
  const glassMat = useRef<THREE.MeshStandardMaterial | null>(null);
  const { openChapter } = useGameStore();
  const open = openChapter === "identity";

  const model = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);

  useFrame(({ clock }) => {
    if (!glassMat.current && root.current) {
      root.current.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        const mat = m.material as THREE.MeshStandardMaterial;
        if (mat?.transparent) glassMat.current = mat;
      });
    }
    if (!glassMat.current) return;
    const pulse = 0.18 + Math.sin(clock.elapsedTime * 1.6) * 0.1;
    glassMat.current.emissiveIntensity = open ? 0.06 : pulse;
  });

  return (
    <group ref={root} position={position}>
      <primitive object={model} />
    </group>
  );
}

export function getBelvedereInteractPosition() {
  const { terrace } = getBelvedereWorldAnchor();
  return terrace.clone().setY(1.3);
}

export function getBelvedereStopPosition() {
  const { stop } = getBelvedereWorldAnchor();
  return stop.clone().setY(0.05);
}

useGLTF.preload("/models/belvedere.glb");
useGLTF.preload("/models/bench.glb");
useGLTF.preload("/models/bougainvillea.glb");
useGLTF.preload("/models/carnet.glb");
