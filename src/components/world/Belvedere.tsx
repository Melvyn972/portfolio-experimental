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

  return (
    <group position={[terrace.x, 0.02, terrace.z]} rotation={[0, yaw, 0]}>
      {/* Pale stone terrace — multi-volume architecture */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[11, 0.9, 8.5]} />
        <meshStandardMaterial color="#e4d9c6" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.92, 0]} receiveShadow>
        <boxGeometry args={[10.4, 0.08, 7.9]} />
        <meshStandardMaterial color="#f0e8d8" roughness={0.7} />
      </mesh>
      {/* Subtle tile seams */}
      {[-2.5, 0, 2.5].map((z) => (
        <mesh key={`seam-z-${z}`} position={[0, 0.97, z]} receiveShadow>
          <boxGeometry args={[10, 0.01, 0.04]} />
          <meshStandardMaterial color="#d8ccb8" roughness={0.85} />
        </mesh>
      ))}
      {[-3, 0, 3].map((x) => (
        <mesh key={`seam-x-${x}`} position={[x, 0.97, 0]} receiveShadow>
          <boxGeometry args={[0.04, 0.01, 7.5]} />
          <meshStandardMaterial color="#d8ccb8" roughness={0.85} />
        </mesh>
      ))}

      {/* Steps toward road */}
      <mesh position={[4.8, 0.28, 1.5]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.55, 2.4]} />
        <meshStandardMaterial color="#ddd1bd" roughness={0.9} />
      </mesh>
      <mesh position={[6.6, 0.12, 1.5]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.28, 2.0]} />
        <meshStandardMaterial color="#d5c8b4" roughness={0.9} />
      </mesh>
      <mesh position={[7.5, 0.04, 1.5]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.12, 1.8]} />
        <meshStandardMaterial color="#cfc0a8" roughness={0.92} />
      </mesh>

      {/* Sea-facing parapet with posts */}
      <mesh position={[-4.9, 1.35, 0]} castShadow>
        <boxGeometry args={[0.4, 0.85, 7.6]} />
        <meshStandardMaterial color="#d8ccb8" roughness={0.9} />
      </mesh>
      {[-3.2, -1.1, 1.1, 3.2].map((z) => (
        <mesh key={`post-${z}`} position={[-4.9, 1.95, z]} castShadow>
          <boxGeometry args={[0.22, 0.35, 0.22]} />
          <meshStandardMaterial color="#cfc6b6" metalness={0.15} roughness={0.55} />
        </mesh>
      ))}
      <mesh position={[0, 1.25, -3.7]} castShadow>
        <boxGeometry args={[9.5, 0.6, 0.35]} />
        <meshStandardMaterial color="#d8ccb8" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.25, 3.7]} castShadow>
        <boxGeometry args={[9.5, 0.45, 0.3]} />
        <meshStandardMaterial color="#d8ccb8" roughness={0.9} />
      </mesh>
      {/* Glass insert in sea parapet */}
      <mesh position={[-4.72, 1.55, 0]} castShadow>
        <boxGeometry args={[0.06, 0.45, 6.2]} />
        <meshStandardMaterial color="#c5e0e8" metalness={0.3} roughness={0.1} transparent opacity={0.35} />
      </mesh>

      {/* Contemporary canopy */}
      <mesh position={[3.2, 2.2, -1.8]} castShadow>
        <boxGeometry args={[0.12, 2.4, 0.12]} />
        <meshStandardMaterial color="#cfc6b6" metalness={0.25} roughness={0.45} />
      </mesh>
      <mesh position={[0.4, 2.2, -1.8]} castShadow>
        <boxGeometry args={[0.12, 2.4, 0.12]} />
        <meshStandardMaterial color="#cfc6b6" metalness={0.25} roughness={0.45} />
      </mesh>
      <mesh position={[1.8, 3.45, -1.8]} castShadow>
        <boxGeometry args={[5.2, 0.1, 2.6]} />
        <meshStandardMaterial color="#a67c52" roughness={0.6} />
      </mesh>
      <mesh position={[1.8, 3.35, -1.8]} castShadow>
        <boxGeometry args={[4.8, 0.06, 2.2]} />
        <meshStandardMaterial color="#8a6540" roughness={0.7} />
      </mesh>

      <BelvedereBench position={[2.2, 0.96, 2.0]} />
      <BougainvilleaCluster />
      <IdentityCarnetModel position={[0, 0.96, -0.6]} />
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
  const { identityOpen: open } = useGameStore();

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

useGLTF.preload("/models/bench.glb");
useGLTF.preload("/models/bougainvillea.glb");
useGLTF.preload("/models/carnet.glb");
