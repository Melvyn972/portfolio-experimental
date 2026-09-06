"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Sky, ContactShadows, Environment } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { getRoadCurve } from "@/lib/road";

type AtmosphereProps = {
  dust?: boolean;
  shadows?: boolean;
  shadowMapSize?: number;
};

/** Late Mediterranean afternoon PBR lighting. */
export function Atmosphere({ dust = true, shadows = true, shadowMapSize = 2048 }: AtmosphereProps) {
  return (
    <>
      <color attach="background" args={["#b5d0e2"]} />
      <fog attach="fog" args={["#c2dae8", 55, 190]} />
      <ambientLight intensity={0.42} color="#fff1e0" />
      <hemisphereLight args={["#9ec8e0", "#c4a078", 0.58]} />
      <directionalLight
        castShadow={shadows}
        position={[52, 38, 22]}
        intensity={2.2}
        color="#ffd4a0"
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-camera-near={1}
        shadow-camera-far={200}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-bias={-0.00035}
        shadow-normalBias={0.04}
      />
      <directionalLight position={[-28, 16, -40]} intensity={0.38} color="#8eb8d4" />
      <Sky
        distance={450000}
        sunPosition={[52, 12, 22]}
        inclination={0.54}
        azimuth={0.22}
        mieCoefficient={0.005}
        mieDirectionalG={0.84}
        rayleigh={0.75}
        turbidity={6}
      />
      <Environment files="/hdri/venice_sunset_1k.hdr" background={false} environmentIntensity={0.55} />
      {shadows && (
        <ContactShadows position={[0, 0.01, -70]} opacity={0.28} scale={140} blur={2.6} far={22} color="#3a2e22" />
      )}
      {dust && <DustMotes />}
    </>
  );
}

function DustMotes() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(48 * 3);
    for (let i = 0; i < 48; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 70;
      arr[i * 3 + 1] = 0.4 + Math.random() * 4;
      arr[i * 3 + 2] = -Math.random() * 180 + 30;
    }
    return arr;
  }, []);
  const phase = useMemo(() => Float32Array.from({ length: 48 }, (_, i) => i), []);

  useFrame((state, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.015;
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
      <pointsMaterial color="#f0e6d0" size={0.08} transparent opacity={0.3} depthWrite={false} />
    </points>
  );
}

export function RoadAccentProps() {
  const { scene } = useGLTF("/models/lamp.glb");
  const props = useMemo(() => {
    const curve = getRoadCurve();
    return [0.18, 0.35, 0.55, 0.7, 0.85].map((t) => {
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

useGLTF.preload("/models/lamp.glb");
