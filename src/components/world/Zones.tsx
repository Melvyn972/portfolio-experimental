"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { content } from "@/lib/content";
import { getRoadCurve } from "@/lib/road";
import { enableShadows, groundClone } from "@/lib/gltfFit";

function useShadowClone(path: string, ground = false) {
  const { scene } = useGLTF(path);
  return useMemo(() => {
    const c = scene.clone(true);
    enableShadows(c);
    if (ground) groundClone(c);
    return c;
  }, [scene, ground]);
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
  scale?: number | [number, number, number];
}) {
  const clone = useMemo(() => scene.clone(true), [scene]);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={clone} />
    </group>
  );
}

/**
 * Coastal architecture — Kenney City buildings + Daniel Dormin lighthouse + Quaternius pine.
 * Scales calibrated from GLB bounding boxes (Kenney ~2m tall → ×6; phare ~29u → ×0.32).
 */
export function CoastalZones() {
  const maison = useShadowClone("/models/maison.glb");
  const studio = useShadowClone("/models/studio.glb");
  const atelier = useShadowClone("/models/kenney/city/atelier.glb");
  const { scene: phareSrc } = useGLTF("/models/phare.glb");
  const phare = useMemo(() => {
    const c = phareSrc.clone(true);
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      const mat = m.material as THREE.MeshStandardMaterial;
      if (!mat?.color) return;
      const cloned = mat.clone();
      const n = (mat.name || m.name || "").toLowerCase();
      if (n.includes("detail")) {
        cloned.color.set("#d4542a");
        cloned.roughness = 0.55;
      } else if (n.includes("material")) {
        // lantern glass / light ring
        cloned.color.set("#ffe6a8");
        cloned.emissive = new THREE.Color("#ffb347");
        cloned.emissiveIntensity = 0.85;
        cloned.roughness = 0.35;
      } else {
        cloned.color.set("#f2efe8");
        cloned.roughness = 0.82;
      }
      m.material = cloned;
    });
    return c;
  }, [phareSrc]);
  const fence = useShadowClone("/models/kenney/city/fence.glb");
  const pine = useShadowClone("/models/pine.glb");
  const hedge = useShadowClone("/models/kenney/fantasy/hedge.glb");
  const pier = useShadowClone("/models/pier.glb");
  const stairs = useShadowClone("/models/kenney/fantasy/stairs-stone.glb");
  const lantern = useShadowClone("/models/lantern.glb");
  /** Dormin lighthouse sits on y=0 locally (≈29u tall) — do NOT double-lift. */
  const PHARE_SCALE = 0.34;
  const PHARE_Y = 0.55;

  const markers = useMemo(() => {
    const map: Record<string, { x: number; y: number; z: number }> = {};
    for (const z of content.zones.zones) map[z.id] = z.marker;
    return map;
  }, []);

  const fences = useMemo(() => {
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
          {/* Kenney City building-type-b — maison */}
          <Placed scene={maison} position={[m.x, 0, m.z]} rotation={[0, -0.35, 0]} scale={6.2} />
          {/* Wing / atelier */}
          <Placed scene={atelier} position={[m.x + 7.5, 0, m.z + 2]} rotation={[0, 0.2, 0]} scale={5.2} />
          <Placed scene={pine} position={[m.x - 6, 0, m.z + 4]} scale={0.5} />
          <Placed scene={pine} position={[m.x + 10, 0, m.z - 3]} scale={0.42} />
          <Placed scene={hedge} position={[m.x + 3, 0, m.z + 6]} rotation={[0, 0.4, 0]} scale={2.2} />
          <Placed scene={stairs} position={[m.x - 1, 0, m.z + 5.5]} rotation={[0, Math.PI, 0]} scale={1.8} />
        </group>
      )}

      {s && (
        <group>
          {/* Kenney City building-type-e — studio */}
          <Placed scene={studio} position={[s.x, 0, s.z]} rotation={[0, 0.4, 0]} scale={6.0} />
          <Placed scene={pine} position={[s.x - 5, 0, s.z + 3]} scale={0.48} />
          <Placed scene={hedge} position={[s.x + 4, 0, s.z + 4]} scale={2.0} />
          <Placed scene={pine} position={[s.x + 6, 0, s.z - 4]} scale={0.4} />
        </group>
      )}

      {p && (
        <group>
          {/* Daniel Dormin lighthouse — sit base on ground */}
          <Placed scene={phare} position={[p.x, PHARE_Y, p.z]} scale={PHARE_SCALE} />
          {/* Rocky skirt so the tower reads anchored */}
          {[
            [p.x + 2.4, 0.32, p.z - 1.4, 1.1],
            [p.x - 2.6, 0.3, p.z + 1.6, 0.95],
            [p.x + 0.8, 0.28, p.z + 3.0, 0.85],
            [p.x - 1.4, 0.34, p.z - 2.6, 1.05],
          ].map(([x, y, z, s], i) => (
            <mesh key={`pr-${i}`} position={[x, y, z]} scale={[s, s * 0.55, s * 0.9]} castShadow receiveShadow>
              <sphereGeometry args={[0.85, 7, 5]} />
              <meshStandardMaterial color={i % 2 ? "#c2b49a" : "#b4a488"} roughness={0.95} />
            </mesh>
          ))}
          <mesh position={[p.x, 0.2, p.z]} receiveShadow castShadow>
            <cylinderGeometry args={[4.6, 5.4, 0.55, 10]} />
            <meshStandardMaterial color="#b9a888" roughness={0.95} />
          </mesh>
          <Placed scene={pine} position={[p.x + 6, 0, p.z + 4]} scale={0.55} />
          <Placed scene={pine} position={[p.x - 5, 0, p.z - 3]} scale={0.45} />
          <Placed scene={lantern} position={[p.x + 3.2, 0.55, p.z + 2.4]} scale={1.4} />
          <pointLight
            position={[p.x, 0.55 + 28.95 * PHARE_SCALE * 0.92, p.z]}
            intensity={2.4}
            color="#ffd090"
            distance={52}
            castShadow={false}
          />
        </group>
      )}

      {plage && (
        <group position={[plage.x, 0, plage.z]}>
          <Placed scene={pier} position={[0, 0.9, -2]} rotation={[0, 0.3, 0]} scale={0.42} />
          <Placed scene={pine} position={[4, 0, 3]} scale={0.42} />
          <Placed scene={pine} position={[-3, 0, -1]} scale={0.38} />
          <Placed scene={hedge} position={[1, 0, 5]} scale={1.8} />
          <Placed scene={lantern} position={[-2, 0, 2]} scale={1.2} />
        </group>
      )}

      {wow && (
        <group position={[wow.x, Math.max(0, wow.y - 2), wow.z]}>
          <Placed scene={stairs} position={[0, 0, 0]} scale={2.4} />
          <Placed scene={fence} position={[0, 0, 2]} scale={3.5} />
          <Placed scene={pine} position={[3, 0, -2]} scale={0.48} />
        </group>
      )}

      {fences.map((w) => (
        <Placed key={w.key} scene={fence} position={w.position} rotation={[0, w.yaw, 0]} scale={3.2} />
      ))}
    </group>
  );
}

useGLTF.preload("/models/maison.glb");
useGLTF.preload("/models/studio.glb");
useGLTF.preload("/models/kenney/city/atelier.glb");
useGLTF.preload("/models/phare.glb");
useGLTF.preload("/models/pine.glb");
useGLTF.preload("/models/pier.glb");
useGLTF.preload("/models/lantern.glb");
useGLTF.preload("/models/kenney/city/fence.glb");
useGLTF.preload("/models/kenney/fantasy/hedge.glb");
useGLTF.preload("/models/kenney/fantasy/stairs-stone.glb");
