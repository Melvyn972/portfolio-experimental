"use client";

import { useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getBelvedereWorldAnchor } from "@/lib/road";
import { getGameState } from "@/lib/gameStore";
import { content } from "@/lib/content";
import { enableShadows, groundClone } from "@/lib/gltfFit";
import { MuseumPlaque } from "./MuseumPlaque";

const STONE = "#d2c4a6";
const STONE_DARK = "#b4a488";
const LIME = "#cfc3a4";

/**
 * Solid Mediterranean lookout — authored stone, not scaled Kenney shards.
 * Local +Z = toward the road, −Z = sea.
 */
export function Belvedere() {
  const anchor = useMemo(() => getBelvedereWorldAnchor(), []);
  const { terrace, yaw } = anchor;

  return (
    <group>
      <group position={[terrace.x, 0, terrace.z]} rotation={[0, yaw, 0]}>
        {/* Deck + plinth */}
        <mesh position={[0, 0.92, 0.2]} receiveShadow castShadow>
          <boxGeometry args={[8.4, 0.26, 7.2]} />
          <meshStandardMaterial color={STONE} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.76, 0.2]} receiveShadow castShadow>
          <boxGeometry args={[9.0, 0.16, 7.8]} />
          <meshStandardMaterial color={STONE_DARK} roughness={0.94} />
        </mesh>
        <mesh position={[0, 0.64, 0.2]} receiveShadow>
          <boxGeometry args={[9.4, 0.12, 8.2]} />
          <meshStandardMaterial color="#9a8c70" roughness={0.96} />
        </mesh>
        {[-2.4, 0, 2.4].map((x) =>
          [-1.8, 0.2, 2.2].map((z) => (
            <mesh key={`tile-${x}-${z}`} position={[x, 1.06, z]} receiveShadow>
              <boxGeometry args={[2.2, 0.04, 1.7]} />
              <meshStandardMaterial color={STONE_DARK} roughness={0.92} />
            </mesh>
          )),
        )}

        {/* Sea parapet (−Z) + corner posts */}
        <mesh position={[0, 1.42, -3.35]} castShadow receiveShadow>
          <boxGeometry args={[8.2, 0.72, 0.38]} />
          <meshStandardMaterial color={LIME} roughness={0.88} />
        </mesh>
        <mesh position={[-4.05, 1.42, -0.4]} castShadow receiveShadow>
          <boxGeometry args={[0.38, 0.72, 6.2]} />
          <meshStandardMaterial color={LIME} roughness={0.88} />
        </mesh>
        <mesh position={[4.05, 1.42, -1.1]} castShadow receiveShadow>
          <boxGeometry args={[0.38, 0.72, 4.6]} />
          <meshStandardMaterial color={LIME} roughness={0.88} />
        </mesh>
        {[
          [-4.05, -3.35],
          [4.05, -3.35],
          [-4.05, 2.4],
          [4.05, 1.1],
        ].map(([x, z], i) => (
          <mesh key={`cap-${i}`} position={[x, 1.88, z]} castShadow>
            <boxGeometry args={[0.5, 0.22, 0.5]} />
            <meshStandardMaterial color="#c9b896" roughness={0.82} />
          </mesh>
        ))}

        {/* Shelter — four posts + terracotta roof */}
        {[
          [-2.6, -1.6],
          [2.6, -1.6],
          [-2.6, 0.6],
          [2.6, 0.6],
        ].map(([x, z], i) => (
          <mesh key={`post-${i}`} position={[x, 2.45, z]} castShadow>
            <boxGeometry args={[0.28, 1.55, 0.28]} />
            <meshStandardMaterial color="#7a6a52" roughness={0.78} />
          </mesh>
        ))}
        <mesh position={[0, 3.28, -0.5]} rotation={[0.08, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[6.2, 0.16, 3.8]} />
          <meshStandardMaterial color="#c45c3e" roughness={0.7} />
        </mesh>
        <mesh position={[0, 3.42, -0.65]} rotation={[0.08, 0, 0]} castShadow>
          <boxGeometry args={[6.5, 0.08, 4.05]} />
          <meshStandardMaterial color="#a44c32" roughness={0.68} />
        </mesh>
        <mesh position={[0, 3.18, 1.2]} castShadow>
          <boxGeometry args={[6.4, 0.1, 0.28]} />
          <meshStandardMaterial color="#a44c32" roughness={0.68} />
        </mesh>

        {/* Stairs toward the road (+Z) + cheek walls */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <mesh key={i} position={[0, 0.06 + i * 0.11, 3.15 + i * 0.5]} receiveShadow castShadow>
            <boxGeometry args={[2.75, 0.13, 0.54]} />
            <meshStandardMaterial color={i % 2 ? STONE : STONE_DARK} roughness={0.92} />
          </mesh>
        ))}
        {[1, -1].map((side) => (
          <mesh key={`cheek-${side}`} position={[side * 1.52, 0.58, 5.45]} receiveShadow castShadow>
            <boxGeometry args={[0.24, 0.92, 4.6]} />
            <meshStandardMaterial color={LIME} roughness={0.9} />
          </mesh>
        ))}
        <mesh position={[0, 0.06, 8.05]} receiveShadow>
          <boxGeometry args={[3.2, 0.1, 1.05]} />
          <meshStandardMaterial color={STONE_DARK} roughness={0.94} />
        </mesh>

        <IdentityCarnetModel position={[0, 1.08, -0.4]} />
        <IdentityPlinth position={[0, 1.05, -0.4]} />
        <MuseumPlaque
          title={content.identity.name}
          lines={[content.identity.title, content.identity.credo]}
          width={1.28}
          height={0.62}
          position={[0, 1.42, -2.55]}
          rotation={[-0.18, 0, 0]}
        />
        <CarnetHighlight />
        <IdentityPot position={[2.15, 1.05, 1.35]} />
        <pointLight position={[0, 2.6, -0.6]} intensity={0.45} color="#ffc878" distance={9} />
      </group>
      <StopMarker position={[anchor.stop.x, anchor.stop.y + 0.02, anchor.stop.z]} />
    </group>
  );
}

function StopMarker({ position }: { position: [number, number, number] }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ring.current) return;
    const mat = ring.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.22 + Math.sin(clock.elapsedTime * 2) * 0.12;
  });
  return (
    <group position={position}>
      <mesh ref={ring} position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[1.35, 1.85, 32]} />
        <meshStandardMaterial color="#c9a66b" emissive="#8a6a3a" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 24]} />
        <meshStandardMaterial color="#f0e6d2" />
      </mesh>
    </group>
  );
}

function IdentityPot({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF("/models/ph/ceramic_pot/ceramic_pot_1k.gltf");
  const model = useMemo(() => {
    const c = scene.clone(true);
    enableShadows(c);
    groundClone(c);
    return c;
  }, [scene]);
  return (
    <group position={position} scale={0.52}>
      <primitive object={model} />
    </group>
  );
}

function IdentityPlinth({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF("/models/plinth.glb");
  const model = useMemo(() => {
    const c = scene.clone(true);
    enableShadows(c);
    groundClone(c);
    return c;
  }, [scene]);
  return (
    <group position={position} scale={1.05}>
      <primitive object={model} />
    </group>
  );
}

function CarnetHighlight() {
  const ring = useRef<THREE.MeshStandardMaterial>(null);
  const disc = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const s = getGameState();
    const near = s.interactTarget === "carnet" || s.nearBelvedere;
    const found = Boolean(s.discovered.identity);
    const open = s.openChapter === "identity";
    const pulse = 0.2 + Math.sin(clock.elapsedTime * (near ? 3.6 : 1.7)) * (near ? 0.22 : 0.1);
    if (ring.current) {
      ring.current.emissiveIntensity = open ? 0.12 : found ? 0.48 + pulse * 0.2 : pulse;
      ring.current.emissive.set(near || found ? "#d4a24a" : "#6a4a20");
    }
    if (disc.current) {
      const k = near ? 1.18 : found ? 1.06 : 1;
      disc.current.scale.setScalar(k);
    }
  });
  return (
    <group position={[0, 1.07, -0.4]}>
      <mesh ref={disc} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.62, 0.92, 28]} />
        <meshStandardMaterial
          ref={ring}
          color="#c9a66b"
          emissive="#8a6a3a"
          emissiveIntensity={0.24}
          roughness={0.55}
        />
      </mesh>
    </group>
  );
}

function IdentityCarnetModel({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF("/models/carnet.glb");
  const root = useRef<THREE.Group>(null);
  const glassMat = useRef<THREE.MeshStandardMaterial | null>(null);

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
    const s = getGameState();
    const near = s.interactTarget === "carnet";
    const open = s.openChapter === "identity";
    const pulse = 0.18 + Math.sin(clock.elapsedTime * (near ? 2.8 : 1.6)) * (near ? 0.2 : 0.1);
    glassMat.current.emissiveIntensity = open ? 0.06 : pulse;
    if (root.current) {
      root.current.position.y = position[1] + (near ? Math.sin(clock.elapsedTime * 1.8) * 0.025 : 0);
    }
  });

  return (
    <group ref={root} position={position}>
      <primitive object={model} />
    </group>
  );
}

export function getBelvedereInteractPosition() {
  const { terrace } = getBelvedereWorldAnchor();
  return terrace.clone().setY(1.25);
}

export function getBelvedereStopPosition() {
  const { stop } = getBelvedereWorldAnchor();
  return stop.clone();
}

useGLTF.preload("/models/carnet.glb");
useGLTF.preload("/models/plinth.glb");
useGLTF.preload("/models/ph/ceramic_pot/ceramic_pot_1k.gltf");
