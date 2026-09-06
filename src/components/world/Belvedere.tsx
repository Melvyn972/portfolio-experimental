"use client";

import { useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getBelvedereWorldAnchor } from "@/lib/road";
import { useGameStore } from "@/hooks/useGameStore";

function useShadowClone(path: string) {
  const { scene } = useGLTF(path);
  return useMemo(() => {
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
}

function Placed({
  scene,
  position,
  rotation = [0, 0, 0],
  scale = 1,
}: {
  scene: THREE.Object3D;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}) {
  const clone = useMemo(() => scene.clone(true), [scene]);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={clone} />
    </group>
  );
}

/**
 * Belvedere overlook — Kenney Fantasy stone walls + hedge + lantern (no procedural shelter).
 */
export function Belvedere() {
  const anchor = useMemo(() => getBelvedereWorldAnchor(), []);
  const { terrace, yaw } = anchor;
  const wall = useShadowClone("/models/kenney/fantasy/wall-block.glb");
  const wallWin = useShadowClone("/models/kenney/fantasy/wall-window-stone.glb");
  const balcony = useShadowClone("/models/kenney/fantasy/balcony-wall.glb");
  const hedge = useShadowClone("/models/kenney/fantasy/hedge.glb");
  const stairs = useShadowClone("/models/kenney/fantasy/stairs-stone.glb");
  const lantern = useShadowClone("/models/lantern.glb");
  const pine = useShadowClone("/models/pine.glb");
  const bench = useShadowClone("/models/bench.glb");

  return (
    <group>
      <group position={[terrace.x, 0, terrace.z]} rotation={[0, yaw, 0]}>
        {/* Stone terrace deck */}
        <mesh position={[0, 0.92, 0]} receiveShadow castShadow>
          <boxGeometry args={[9.6, 0.28, 7.8]} />
          <meshStandardMaterial color="#d4c4a8" roughness={0.92} />
        </mesh>
        <mesh position={[0, 0.78, 0]} receiveShadow>
          <boxGeometry args={[10.2, 0.18, 8.4]} />
          <meshStandardMaterial color="#b8a88c" roughness={0.95} />
        </mesh>

        {/* Sea-side parapet */}
        <Placed scene={balcony} position={[-4.6, 1.05, 0]} rotation={[0, Math.PI / 2, 0]} scale={2.4} />
        <Placed scene={wall} position={[-4.5, 1.05, -2.4]} rotation={[0, Math.PI / 2, 0]} scale={2.1} />
        <Placed scene={wall} position={[-4.5, 1.05, 2.4]} rotation={[0, Math.PI / 2, 0]} scale={2.1} />

        {/* Side shelter walls */}
        <Placed scene={wallWin} position={[0.4, 1.05, -3.5]} scale={2.3} />
        <Placed scene={wall} position={[2.6, 1.05, -3.5]} scale={2.3} />
        <Placed scene={wall} position={[-1.8, 1.05, 3.5]} rotation={[0, Math.PI, 0]} scale={2.3} />

        {/* Approach stairs */}
        <Placed scene={stairs} position={[3.8, 0.05, 0]} rotation={[0, -Math.PI / 2, 0]} scale={1.9} />

        {/* Greenery */}
        <Placed scene={hedge} position={[-2.8, 1.05, 2.8]} scale={1.6} />
        <Placed scene={hedge} position={[1.2, 1.05, 3.2]} rotation={[0, 0.4, 0]} scale={1.4} />
        <Placed scene={pine} position={[-3.2, 1.05, -2.6]} scale={0.28} />
        <Placed scene={pine} position={[3.4, 1.05, -2.2]} scale={0.24} />

        <Placed scene={bench} position={[2.2, 1.05, 2.0]} />
        <Placed scene={lantern} position={[-3.6, 1.05, -1.2]} scale={1.15} />
        <Placed scene={lantern} position={[3.2, 1.05, 2.4]} scale={1.05} />

        <IdentityCarnetModel position={[0, 1.05, -0.55]} />
        <pointLight position={[-3.6, 2.4, -1.2]} intensity={0.55} color="#ffc878" distance={10} />
      </group>
      <StopMarker position={[anchor.stop.x, 0.03, anchor.stop.z]} />
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

useGLTF.preload("/models/kenney/fantasy/wall-block.glb");
useGLTF.preload("/models/kenney/fantasy/wall-window-stone.glb");
useGLTF.preload("/models/kenney/fantasy/balcony-wall.glb");
useGLTF.preload("/models/kenney/fantasy/hedge.glb");
useGLTF.preload("/models/kenney/fantasy/stairs-stone.glb");
useGLTF.preload("/models/lantern.glb");
useGLTF.preload("/models/pine.glb");
useGLTF.preload("/models/bench.glb");
useGLTF.preload("/models/carnet.glb");
