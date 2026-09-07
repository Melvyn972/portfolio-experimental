"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Sky, Environment } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { getRoadCurve } from "@/lib/road";
import { sampleGroundHeight } from "@/lib/ground";

type AtmosphereProps = {
  dust?: boolean;
  shadows?: boolean;
  shadowMapSize?: number;
  lite?: boolean;
};

/** Late Mediterranean afternoon PBR lighting. */
export function Atmosphere({
  dust = true,
  shadows = true,
  shadowMapSize = 2048,
  lite = false,
}: AtmosphereProps) {
  return (
    <>
      <color attach="background" args={["#7e9aaa"]} />
      <fog attach="fog" args={lite ? ["#8ea8b0", 80, 210] : ["#8ea8b0", 150, 340]} />
      <ambientLight intensity={lite ? 0.62 : 0.38} color="#f0c8a0" />
      <hemisphereLight args={["#6e9cb4", "#b08850", lite ? 1.05 : 0.92]} />
      <directionalLight
        castShadow={shadows}
        position={[52, 22, 14]}
        intensity={lite ? 1.15 : 1.72}
        color="#ffb060"
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-camera-near={1}
        shadow-camera-far={200}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-bias={-0.00028}
        shadow-normalBias={0.035}
      />
      <directionalLight position={[-22, 14, -36]} intensity={lite ? 0.85 : 0.62} color="#8eb8d8" />
      {!lite && <directionalLight position={[8, 6, 30]} intensity={0.34} color="#ffb070" />}
      {/* Soft-GL: Sky shader + 1k HDR Environment = Chrome Error 9. Solid lights only. */}
      {!lite && (
        <Sky
          distance={450000}
          sunPosition={[52, 6.5, 14]}
          inclination={0.46}
          azimuth={0.18}
          mieCoefficient={0.007}
          mieDirectionalG={0.9}
          rayleigh={0.55}
          turbidity={9.2}
        />
      )}
      {!lite && <Environment files="/hdri/venice_sunset_1k.hdr" background={false} environmentIntensity={1.32} />}
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
    return [0.08, 0.16, 0.24, 0.32].map((t) => {
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const pos = p.clone().addScaledVector(side, 5.4);
      pos.y = sampleGroundHeight(pos.x, pos.z);
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
