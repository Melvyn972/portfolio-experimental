"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { content } from "@/lib/content";
import { getRoadCurve } from "@/lib/road";

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

/** Playable coastal zones — architecture GLBs guiding exploration. */
export function CoastalZones() {
  const maison = useShadowClone("/models/maison.glb");
  const studio = useShadowClone("/models/studio.glb");
  const phare = useShadowClone("/models/phare.glb");
  const wall = useShadowClone("/models/stone-wall.glb");
  const pine = useShadowClone("/models/pine.glb");
  const olive = useShadowClone("/models/olive.glb");
  const cypress = useShadowClone("/models/cypress.glb");
  const bougainvillea = useShadowClone("/models/bougainvillea.glb");

  const markers = useMemo(() => {
    const map: Record<string, { x: number; y: number; z: number }> = {};
    for (const z of content.zones.zones) map[z.id] = z.marker;
    return map;
  }, []);

  const walls = useMemo(() => {
    const curve = getRoadCurve();
    return [0.28, 0.45, 0.72].map((t, i) => {
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const pos = p.clone().addScaledVector(side, 6.8);
      return {
        position: [pos.x, 0, pos.z] as [number, number, number],
        yaw: Math.atan2(tangent.x, tangent.z) + Math.PI / 2,
        key: i,
      };
    });
  }, []);

  const m = markers["maison-atelier"];
  const s = markers["studio"];
  const p = markers["phare"];
  const plage = markers["plage"];
  const wow = markers["wow"];

  return (
    <group>
      {m && (
        <group>
          <Placed scene={maison} position={[m.x, 0, m.z]} rotation={[0, -0.35, 0]} />
          <Placed scene={olive} position={[m.x - 5, 0, m.z + 3]} scale={1.1} />
          <Placed scene={cypress} position={[m.x + 8, 0, m.z - 2]} scale={1.05} />
          <Placed scene={pine} position={[m.x + 4, 0, m.z - 5]} scale={0.95} />
          <Placed scene={bougainvillea} position={[m.x + 6, 0, m.z + 3.5]} scale={1.15} />
        </group>
      )}

      {s && (
        <group>
          <Placed scene={studio} position={[s.x, 0, s.z]} rotation={[0, 0.4, 0]} />
          <Placed scene={cypress} position={[s.x - 4, 0, s.z + 2]} />
          <Placed scene={bougainvillea} position={[s.x + 3.5, 0, s.z + 3]} scale={1.1} />
          <Placed scene={pine} position={[s.x + 5, 0, s.z - 3]} scale={0.95} />
        </group>
      )}

      {p && (
        <group>
          <Placed scene={phare} position={[p.x, 0, p.z]} />
          <Placed scene={pine} position={[p.x + 5, 0, p.z + 3]} scale={1.15} />
          <Placed scene={pine} position={[p.x - 4, 0, p.z - 2]} scale={0.9} />
          <pointLight position={[p.x, 9, p.z]} intensity={1.4} color="#ffd090" distance={40} />
        </group>
      )}

      {plage && (
        <group position={[plage.x, 0, plage.z]}>
          <Placed scene={pine} position={[3, 0, 2]} scale={0.8} />
          <Placed scene={olive} position={[-2, 0, -1]} scale={0.9} />
          <Placed scene={olive} position={[1, 0, -3]} scale={0.75} />
          <Placed scene={wall} position={[0, -0.2, 4]} rotation={[0, 0.6, 0]} scale={0.7} />
          <Placed scene={bougainvillea} position={[-3, 0, 1]} scale={0.9} />
        </group>
      )}

      {wow && (
        <group position={[wow.x, Math.max(0, wow.y - 2), wow.z]}>
          <Placed scene={wall} position={[0, 0, 0]} scale={1.2} />
          <Placed scene={cypress} position={[2, 0, -1]} />
        </group>
      )}

      {walls.map((w) => (
        <Placed key={w.key} scene={wall} position={w.position} rotation={[0, w.yaw, 0]} />
      ))}
    </group>
  );
}

useGLTF.preload("/models/maison.glb");
useGLTF.preload("/models/studio.glb");
useGLTF.preload("/models/phare.glb");
useGLTF.preload("/models/stone-wall.glb");
useGLTF.preload("/models/bougainvillea.glb");
