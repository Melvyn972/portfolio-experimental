"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sky, Cloud, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { getRoadCurve } from "@/lib/road";

export function Atmosphere({ dust = true }: { dust?: boolean }) {
  return (
    <>
      <color attach="background" args={["#c8dde8"]} />
      <fog attach="fog" args={["#d7e6ef", 55, 190]} />
      <ambientLight intensity={0.42} color="#fff2df" />
      <hemisphereLight args={["#b8d7ea", "#c4a882", 0.55]} />
      <directionalLight
        castShadow
        position={[40, 55, 20]}
        intensity={2.1}
        color="#ffe2b5"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={180}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-30, 20, -40]} intensity={0.35} color="#9ec8e0" />
      <Sky
        distance={450000}
        sunPosition={[40, 18, 20]}
        inclination={0.48}
        azimuth={0.22}
        mieCoefficient={0.004}
        mieDirectionalG={0.85}
        rayleigh={0.65}
        turbidity={4.5}
      />
      <Cloud position={[-30, 28, -40]} opacity={0.35} speed={0.15} segments={12} bounds={[28, 4, 8]} />
      <Cloud position={[20, 32, -120]} opacity={0.28} speed={0.1} segments={10} bounds={[36, 5, 10]} />
      <ContactShadows position={[0, 0.01, -60]} opacity={0.35} scale={120} blur={2.5} far={20} color="#3a2e22" />
      {dust && <DustMotes />}
      <FutureZoneMarkers />
    </>
  );
}

function DustMotes() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(80 * 3);
    for (let i = 0; i < 80; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 60;
      arr[i * 3 + 1] = 0.4 + Math.random() * 4;
      arr[i * 3 + 2] = -Math.random() * 160 + 30;
    }
    return arr;
  }, []);

  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.02;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + Math.sin(i + performance.now() * 0.001) * 0.002;
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
  const markers = useMemo(() => {
    // Tasteful empty markers for scaffold zones — discreet stone plinths
    return [
      { pos: [18, 1.6, -40] as [number, number, number], label: "atelier" },
      { pos: [22, 1.8, -120] as [number, number, number], label: "studio" },
      { pos: [-12, 0.2, -160] as [number, number, number], label: "phare" },
    ];
  }, []);

  return (
    <group>
      {markers.map((m) => (
        <group key={m.label} position={m.pos}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.55, 0.7, 0.25, 8]} />
            <meshStandardMaterial color="#d5c7b0" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.5, 6]} />
            <meshStandardMaterial color="#b08d57" metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function RoadAccentProps() {
  const props = useMemo(() => {
    const curve = getRoadCurve();
    return [0.22, 0.38, 0.62, 0.78].map((t, i) => {
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const pos = p.clone().addScaledVector(side, 4.6);
      return {
        position: [pos.x, 0.6, pos.z] as [number, number, number],
        yaw: Math.atan2(tangent.x, tangent.z),
        tall: i % 2 === 0,
      };
    });
  }, []);

  return (
    <group>
      {props.map((p, i) => (
        <group key={i} position={p.position} rotation={[0, p.yaw, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.08, 0.1, p.tall ? 2.8 : 2.2, 8]} />
            <meshStandardMaterial color="#cfc6b6" metalness={0.2} roughness={0.55} />
          </mesh>
          <mesh position={[0.35, p.tall ? 1.1 : 0.85, 0]} castShadow>
            <boxGeometry args={[0.7, 0.08, 0.35]} />
            <meshStandardMaterial color="#e8dcc4" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
