"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { getInteractables } from "@/lib/interaction";
import { sampleGroundHeight } from "@/lib/ground";
import { enableShadows, groundClone } from "@/lib/gltfFit";

/**
 * Physical discovery rewards — objects you find, not UI icons.
 */
export function DiscoveryRelics() {
  const { scene: lantern } = useGLTF("/models/lantern.glb");
  const lamp = useMemo(() => dress(lantern), [lantern]);

  const items = useMemo(() => {
    return getInteractables().map((it) => {
      const y = sampleGroundHeight(it.position.x, it.position.z);
      return { ...it, y };
    });
  }, []);

  return (
    <group>
      {items.map((it) => (
        <group key={it.id} position={[it.position.x, it.y + 0.02, it.position.z]}>
          {it.chapter === "parcours" && <PlansRelic />}
          {it.chapter === "experiences" && <WatchRelic />}
          {it.chapter === "competences" && <LaptopRelic />}
          {it.chapter === "projets" && <SketchRelic />}
          {it.chapter === "passions" && it.id.includes("helmet") && <HelmetRelic />}
          {it.chapter === "passions" && !it.id.includes("helmet") && <CameraRelic />}
          {it.chapter === "activite" && <primitive object={lamp.clone(true)} scale={1.1} />}
          {it.chapter === "cv" && <EnvelopeRelic />}
          {it.chapter === "contact" && <BrassPlaque />}
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.42, 16]} />
            <meshStandardMaterial color="#8a6a38" emissive="#6a4a20" emissiveIntensity={0.22} roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function dress(scene: THREE.Group) {
  const c = scene.clone(true);
  enableShadows(c);
  groundClone(c);
  return c;
}

function PlansRelic() {
  return (
    <group rotation={[0.15, 0.4, 0]}>
      <mesh castShadow position={[0, 0.08, 0]}>
        <boxGeometry args={[0.55, 0.02, 0.38]} />
        <meshStandardMaterial color="#c4b089" roughness={0.88} />
      </mesh>
      <mesh castShadow position={[0.04, 0.1, 0.02]} rotation={[0, 0.2, 0.08]}>
        <boxGeometry args={[0.5, 0.015, 0.34]} />
        <meshStandardMaterial color="#d2c09a" roughness={0.86} />
      </mesh>
    </group>
  );
}

function WatchRelic() {
  return (
    <group>
      <mesh castShadow position={[0, 0.07, 0]} rotation={[0.4, 0.2, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.04, 16]} />
        <meshStandardMaterial color="#c9b07a" metalness={0.65} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.095, 0]} rotation={[0.4, 0.2, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.012, 16]} />
        <meshStandardMaterial color="#1a1610" roughness={0.4} />
      </mesh>
    </group>
  );
}

function LaptopRelic() {
  return (
    <group>
      <mesh castShadow position={[0, 0.04, 0]}>
        <boxGeometry args={[0.42, 0.03, 0.28]} />
        <meshStandardMaterial color="#2a2622" roughness={0.45} metalness={0.35} />
      </mesh>
      <mesh castShadow position={[0, 0.16, -0.1]} rotation={[1.05, 0, 0]}>
        <boxGeometry args={[0.42, 0.28, 0.02]} />
        <meshStandardMaterial color="#1c1a18" emissive="#3a6a7a" emissiveIntensity={0.35} roughness={0.3} />
      </mesh>
    </group>
  );
}

function SketchRelic() {
  return (
    <group rotation={[0, 0.3, 0]}>
      <mesh castShadow position={[0, 0.06, 0]}>
        <boxGeometry args={[0.28, 0.04, 0.36]} />
        <meshStandardMaterial color="#5c3a22" roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.085, 0]}>
        <boxGeometry args={[0.24, 0.02, 0.32]} />
        <meshStandardMaterial color="#d2c4a0" roughness={0.9} />
      </mesh>
    </group>
  );
}

function CameraRelic() {
  return (
    <group>
      <mesh castShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[0.22, 0.14, 0.12]} />
        <meshStandardMaterial color="#c0c4c8" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh castShadow position={[0.08, 0.12, 0.08]}>
        <cylinderGeometry args={[0.05, 0.055, 0.08, 12]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} />
      </mesh>
    </group>
  );
}

function HelmetRelic() {
  return (
    <group>
      <mesh castShadow position={[0, 0.14, 0]}>
        <sphereGeometry args={[0.16, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
        <meshStandardMaterial color="#2a1c12" roughness={0.35} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.1, 0.12]}>
        <boxGeometry args={[0.18, 0.07, 0.04]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.2} metalness={0.4} />
      </mesh>
    </group>
  );
}

function EnvelopeRelic() {
  return (
    <mesh castShadow position={[0, 0.04, 0]} rotation={[0, 0.4, 0]}>
      <boxGeometry args={[0.28, 0.02, 0.2]} />
      <meshStandardMaterial color="#c9b896" roughness={0.86} />
    </mesh>
  );
}

function BrassPlaque() {
  return (
    <group>
      <mesh castShadow position={[0, 0.32, 0]}>
        <boxGeometry args={[0.08, 0.55, 0.08]} />
        <meshStandardMaterial color="#6a5438" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.62, 0.02]} rotation={[-0.08, 0, 0]}>
        <boxGeometry args={[0.42, 0.22, 0.03]} />
        <meshStandardMaterial color="#b08d57" metalness={0.7} roughness={0.32} />
      </mesh>
    </group>
  );
}

useGLTF.preload("/models/lantern.glb");
