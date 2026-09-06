"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sky, ContactShadows, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { getRoadCurve } from "@/lib/road";
import { content } from "@/lib/content";

type AtmosphereProps = {
  dust?: boolean;
  shadows?: boolean;
  shadowMapSize?: number;
};

export function Atmosphere({ dust = true, shadows = true, shadowMapSize = 2048 }: AtmosphereProps) {
  return (
    <>
      <color attach="background" args={["#b9d4e4"]} />
      <fog attach="fog" args={["#c5dceb", 45, 170]} />
      <ambientLight intensity={0.48} color="#fff4e4" />
      <hemisphereLight args={["#a8cfe6", "#c9a882", 0.62]} />
      <directionalLight
        castShadow={shadows}
        position={[48, 42, 18]}
        intensity={2.35}
        color="#ffd9a8"
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-camera-near={1}
        shadow-camera-far={180}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
        shadow-bias={-0.00025}
      />
      <directionalLight position={[-25, 18, -35]} intensity={0.4} color="#8ebdd8" />
      <Sky
        distance={450000}
        sunPosition={[48, 14, 18]}
        inclination={0.52}
        azimuth={0.2}
        mieCoefficient={0.005}
        mieDirectionalG={0.82}
        rayleigh={0.8}
        turbidity={5.2}
      />
      {shadows && (
        <ContactShadows position={[0, 0.01, -60]} opacity={0.32} scale={120} blur={2.5} far={20} color="#3a2e22" />
      )}
      {dust && <DustMotes />}
      <FutureZoneMarkers />
    </>
  );
}

function DustMotes() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(60 * 3);
    for (let i = 0; i < 60; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 60;
      arr[i * 3 + 1] = 0.4 + Math.random() * 4;
      arr[i * 3 + 2] = -Math.random() * 160 + 30;
    }
    return arr;
  }, []);
  const phase = useMemo(() => Float32Array.from({ length: 60 }, (_, i) => i), []);

  useFrame((state, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.02;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + Math.sin(phase[i] + t) * 0.002;
      if (y > 5) y = 0.3;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#f0e6d0" size={0.08} transparent opacity={0.35} depthWrite={false} />
    </points>
  );
}

function FutureZoneMarkers() {
  const { scene } = useGLTF("/models/plinth.glb");
  const markers = useMemo(() => {
    return content.zones.zones
      .filter((z) => z.status === "scaffold")
      .map((z) => {
        const clone = scene.clone(true);
        clone.traverse((o) => {
          const m = o as THREE.Mesh;
          if (m.isMesh) {
            m.castShadow = true;
            m.receiveShadow = true;
          }
        });
        return {
          id: z.id,
          name: z.name,
          object: clone,
          pos: [z.marker.x, z.marker.y, z.marker.z] as [number, number, number],
        };
      });
  }, [scene]);

  // WOW overlook: slight elevated platform hint
  return (
    <group>
      {markers.map((m) => (
        <group key={m.id} position={m.pos}>
          <primitive object={m.object} />
          {m.id === "wow" && (
            <mesh position={[0, -0.4, 0]} receiveShadow>
              <cylinderGeometry args={[2.2, 2.5, 0.35, 10]} />
              <meshStandardMaterial color="#d5c7b0" roughness={0.9} />
            </mesh>
          )}
          {m.id === "phare" && (
            <mesh position={[0, 1.2, 0]} castShadow>
              <cylinderGeometry args={[0.35, 0.45, 2.4, 8]} />
              <meshStandardMaterial color="#e8dfd0" roughness={0.85} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

export function RoadAccentProps() {
  const { scene } = useGLTF("/models/lamp.glb");
  const props = useMemo(() => {
    const curve = getRoadCurve();
    return [0.22, 0.38, 0.62, 0.78].map((t) => {
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const pos = p.clone().addScaledVector(side, 4.6);
      const clone = scene.clone(true);
      clone.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.castShadow = true;
          m.receiveShadow = true;
        }
      });
      return {
        object: clone,
        position: [pos.x, 0, pos.z] as [number, number, number],
        yaw: Math.atan2(tangent.x, tangent.z),
      };
    });
  }, [scene]);

  return (
    <group>
      {props.map((p, i) => (
        <group key={i} position={p.position} rotation={[0, p.yaw, 0]}>
          <primitive object={p.object} />
        </group>
      ))}
    </group>
  );
}

useGLTF.preload("/models/plinth.glb");
useGLTF.preload("/models/lamp.glb");
