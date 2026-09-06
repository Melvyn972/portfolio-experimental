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
      {/* Stone plinth */}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[11.2, 0.84, 8.7]} />
        <meshStandardMaterial color="#ddd1bd" roughness={0.9} />
      </mesh>
      {/* Deck with warm stone */}
      <mesh position={[0, 0.9, 0]} receiveShadow>
        <boxGeometry args={[10.6, 0.1, 8.1]} />
        <meshStandardMaterial color="#f2eadc" roughness={0.65} />
      </mesh>
      {/* Tile grid */}
      {[-3, -1, 1, 3].map((z) => (
        <mesh key={`sz-${z}`} position={[0, 0.96, z]} receiveShadow>
          <boxGeometry args={[10.2, 0.012, 0.035]} />
          <meshStandardMaterial color="#d4c6b0" roughness={0.8} />
        </mesh>
      ))}
      {[-3.5, -1.2, 1.2, 3.5].map((x) => (
        <mesh key={`sx-${x}`} position={[x, 0.96, 0]} receiveShadow>
          <boxGeometry args={[0.035, 0.012, 7.7]} />
          <meshStandardMaterial color="#d4c6b0" roughness={0.8} />
        </mesh>
      ))}

      {/* Cascading steps */}
      {[
        [4.6, 0.32, 1.5, 2.4, 0.5, 2.5],
        [6.3, 0.16, 1.5, 1.7, 0.28, 2.1],
        [7.4, 0.05, 1.5, 1.0, 0.12, 1.85],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={`step-${i}`} position={[x, y, z]} castShadow receiveShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={i === 0 ? "#ddd1bd" : i === 1 ? "#d5c8b4" : "#cfc0a8"} roughness={0.9} />
        </mesh>
      ))}

      {/* Sea parapet + brass-capped posts + glass */}
      <mesh position={[-4.95, 1.3, 0]} castShadow>
        <boxGeometry args={[0.38, 0.75, 7.8]} />
        <meshStandardMaterial color="#d8ccb8" roughness={0.88} />
      </mesh>
      {[-3.4, -1.15, 1.15, 3.4].map((z) => (
        <group key={`post-${z}`} position={[-4.95, 1.75, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.09, 0.1, 0.55, 8]} />
            <meshStandardMaterial color="#cfc6b6" metalness={0.2} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.32, 0]} castShadow>
            <cylinderGeometry args={[0.11, 0.11, 0.06, 8]} />
            <meshStandardMaterial color="#b08d57" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}
      <mesh position={[-4.78, 1.5, 0]}>
        <boxGeometry args={[0.05, 0.42, 6.4]} />
        <meshStandardMaterial color="#c5e0e8" metalness={0.35} roughness={0.08} transparent opacity={0.4} />
      </mesh>
      {/* Side rails */}
      <mesh position={[0, 1.2, -3.75]} castShadow>
        <boxGeometry args={[9.6, 0.55, 0.28]} />
        <meshStandardMaterial color="#d8ccb8" roughness={0.88} />
      </mesh>
      <mesh position={[0, 1.15, 3.75]} castShadow>
        <boxGeometry args={[9.6, 0.4, 0.26]} />
        <meshStandardMaterial color="#d8ccb8" roughness={0.88} />
      </mesh>
      {/* Handrail */}
      <mesh position={[-4.95, 1.85, 0]} castShadow>
        <boxGeometry args={[0.08, 0.06, 7.4]} />
        <meshStandardMaterial color="#b08d57" metalness={0.65} roughness={0.35} />
      </mesh>

      {/* Canopy — steel + timber */}
      {[3.15, 0.45].map((x) => (
        <mesh key={`col-${x}`} position={[x, 2.15, -1.75]} castShadow>
          <cylinderGeometry args={[0.07, 0.08, 2.5, 8]} />
          <meshStandardMaterial color="#c8c0b0" metalness={0.35} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[1.8, 3.42, -1.75]} castShadow>
        <boxGeometry args={[5.0, 0.12, 2.5]} />
        <meshStandardMaterial color="#a67c52" roughness={0.55} />
      </mesh>
      <mesh position={[1.8, 3.3, -1.75]}>
        <boxGeometry args={[4.6, 0.05, 2.15]} />
        <meshStandardMaterial color="#8a6540" roughness={0.65} />
      </mesh>

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
