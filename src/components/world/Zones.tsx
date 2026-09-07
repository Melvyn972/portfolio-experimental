"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { content } from "@/lib/content";
import { getRoadCurve } from "@/lib/road";
import { enableShadows, groundClone } from "@/lib/gltfFit";
import { dressCoastalBuilding } from "@/lib/coastalDress";
import { useCoastalPbr } from "@/lib/pbrTextures";
import { sampleGroundHeight } from "@/lib/ground";

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
  const pbr = useCoastalPbr(4);
  const maisonSrc = useShadowClone("/models/maison.glb");
  const studioSrc = useShadowClone("/models/studio.glb");
  const atelierSrc = useShadowClone("/models/kenney/city/atelier.glb");
  const maison = useMemo(() => {
    const c = maisonSrc.clone(true);
    dressCoastalBuilding(c, pbr, "#f3eee4");
    return c;
  }, [maisonSrc, pbr]);
  const studio = useMemo(() => {
    const c = studioSrc.clone(true);
    dressCoastalBuilding(c, pbr, "#efe4d2");
    return c;
  }, [studioSrc, pbr]);
  const atelier = useMemo(() => {
    const c = atelierSrc.clone(true);
    dressCoastalBuilding(c, pbr, "#ead4c6");
    return c;
  }, [atelierSrc, pbr]);
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
    return [0.12, 0.2, 0.28].map((t, i) => {
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const pos = p.clone().addScaledVector(side, 6.8);
      return {
        position: [pos.x, sampleGroundHeight(pos.x, pos.z), pos.z] as [number, number, number],
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
          {/* Kenney City building-type-b — sit on the plaza, not buried at y=0 */}
          <Placed
            scene={maison}
            position={[m.x, sampleGroundHeight(m.x, m.z), m.z]}
            rotation={[0, -0.35, 0]}
            scale={6.2}
          />
          <Placed
            scene={atelier}
            position={[m.x + 7.5, sampleGroundHeight(m.x + 7.5, m.z + 2), m.z + 2]}
            rotation={[0, 0.2, 0]}
            scale={5.2}
          />
          <Placed scene={pine} position={[m.x - 6, sampleGroundHeight(m.x - 6, m.z + 4), m.z + 4]} scale={0.5} />
          <Placed scene={pine} position={[m.x + 10, sampleGroundHeight(m.x + 10, m.z - 3), m.z - 3]} scale={0.42} />
          <Placed
            scene={hedge}
            position={[m.x + 4.2, sampleGroundHeight(m.x + 4.2, m.z + 3.4), m.z + 3.4]}
            rotation={[0, 0.4, 0]}
            scale={2.2}
          />
          <Placed
            scene={stairs}
            position={[m.x - 3.6, sampleGroundHeight(m.x - 3.6, m.z + 3.8), m.z + 3.8]}
            rotation={[0, Math.PI, 0]}
            scale={1.8}
          />
        </group>
      )}

      {s && (
        <group>
          {/* Kenney City building-type-e — studio */}
          <Placed
            scene={studio}
            position={[s.x, sampleGroundHeight(s.x, s.z), s.z]}
            rotation={[0, 0.4, 0]}
            scale={6.0}
          />
          <Placed scene={pine} position={[s.x - 7.5, sampleGroundHeight(s.x - 7.5, s.z + 5), s.z + 5]} scale={0.48} />
          <Placed scene={hedge} position={[s.x + 4, sampleGroundHeight(s.x + 4, s.z + 4), s.z + 4]} scale={2.0} />
          <Placed scene={pine} position={[s.x + 6, sampleGroundHeight(s.x + 6, s.z - 4), s.z - 4]} scale={0.4} />
        </group>
      )}

      {p && (
        <group>
          {/* Daniel Dormin lighthouse — sit base on ground */}
          <Placed scene={phare} position={[p.x, PHARE_Y, p.z]} scale={PHARE_SCALE} />
          {/* Rocky skirt so the tower reads anchored */}
          {[
            [p.x + 1.6, 0.32, p.z - 1.8, 0.85],
            [p.x - 1.8, 0.3, p.z + 1.2, 0.8],
            [p.x + 0.4, 0.28, p.z + 2.2, 0.7],
            [p.x - 1.0, 0.34, p.z - 2.2, 0.78],
          ].map(([x, y, z, s], i) => (
            <mesh key={`pr-${i}`} position={[x, y, z]} scale={[s, s * 0.55, s * 0.9]} castShadow receiveShadow>
              <sphereGeometry args={[0.85, 7, 5]} />
              <meshStandardMaterial color={i % 2 ? "#c2b49a" : "#b4a488"} roughness={0.95} />
            </mesh>
          ))}
          <mesh position={[p.x, 0.18, p.z]} receiveShadow castShadow>
            <cylinderGeometry args={[2.8, 3.2, 0.45, 10]} />
            <meshStandardMaterial color="#b9a888" roughness={0.95} />
          </mesh>
          <Placed scene={pine} position={[p.x + 5.5, sampleGroundHeight(p.x + 5.5, p.z + 6), p.z + 6]} scale={0.5} />
          <Placed scene={pine} position={[p.x - 4.5, sampleGroundHeight(p.x - 4.5, p.z - 5), p.z - 5]} scale={0.42} />
          <Placed
            scene={lantern}
            position={[p.x + 2.4, sampleGroundHeight(p.x + 2.4, p.z + 3.2), p.z + 3.2]}
            scale={1.3}
          />
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
        <group>
          <WoodenPier position={[plage.x - 2.6, 0.12, plage.z]} yaw={-Math.PI / 2 + 0.08} />
          <Placed
            scene={lantern}
            position={[plage.x - 3.4, 0.52, plage.z + 0.2]}
            scale={1.05}
          />
          <Placed
            scene={pine}
            position={[plage.x + 0.8, sampleGroundHeight(plage.x + 0.8, plage.z + 5.4), plage.z + 5.4]}
            scale={0.36}
          />
          <Placed
            scene={pine}
            position={[plage.x - 0.4, sampleGroundHeight(plage.x - 0.4, plage.z - 5.8), plage.z - 5.8]}
            scale={0.3}
          />
          <Placed
            scene={hedge}
            position={[plage.x + 2.8, sampleGroundHeight(plage.x + 2.8, plage.z + 6.2), plage.z + 6.2]}
            scale={1.7}
          />
          <Placed
            scene={lantern}
            position={[plage.x - 0.8, sampleGroundHeight(plage.x - 0.8, plage.z + 2.2), plage.z + 2.2]}
            scale={1.15}
          />
        </group>
      )}

      {wow && (
        <group position={[wow.x, sampleGroundHeight(wow.x, wow.z), wow.z]}>
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

/** Authored jetty — the modular pier GLB is a kit with planks at y=2.6 and loose poles. */
function WoodenPier({ position, yaw }: { position: [number, number, number]; yaw: number }) {
  const piles = [-3.2, -1.6, 0, 1.6, 3.2];
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {piles.map((z, i) =>
        [-0.85, 0.85].map((x) => (
          <mesh key={`p-${i}-${x}`} position={[x, -0.35, z]} castShadow receiveShadow>
            <cylinderGeometry args={[0.1, 0.12, 1.35, 7]} />
            <meshStandardMaterial color={i % 2 ? "#6b4a30" : "#5c3f28"} roughness={0.88} />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.34, 0]} receiveShadow castShadow>
        <boxGeometry args={[2.15, 0.1, 7.4]} />
        <meshStandardMaterial color="#7a5234" roughness={0.82} metalness={0.04} />
      </mesh>
      {[-0.55, 0, 0.55].map((x) => (
        <mesh key={`plank-${x}`} position={[x, 0.4, 0]} receiveShadow>
          <boxGeometry args={[0.48, 0.04, 7.2]} />
          <meshStandardMaterial color="#a06e46" roughness={0.74} />
        </mesh>
      ))}
      <mesh position={[0, 0.86, 3.45]} castShadow>
        <boxGeometry args={[1.6, 0.06, 0.06]} />
        <meshStandardMaterial color="#5c3f28" roughness={0.8} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={`rail-${side}`}>
          <mesh position={[side * 1.02, 0.72, 0]}>
            <boxGeometry args={[0.06, 0.06, 7.1]} />
            <meshStandardMaterial color="#6e4a30" roughness={0.8} />
          </mesh>
          {piles.map((z) => (
            <mesh key={`rp-${side}-${z}`} position={[side * 1.02, 0.5, z]}>
              <boxGeometry args={[0.07, 0.55, 0.07]} />
              <meshStandardMaterial color="#5c3f28" roughness={0.85} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

useGLTF.preload("/models/maison.glb");
useGLTF.preload("/models/studio.glb");
useGLTF.preload("/models/kenney/city/atelier.glb");
useGLTF.preload("/models/phare.glb");
useGLTF.preload("/models/pine.glb");
useGLTF.preload("/models/lantern.glb");
useGLTF.preload("/models/kenney/city/fence.glb");
useGLTF.preload("/models/kenney/fantasy/hedge.glb");
useGLTF.preload("/models/kenney/fantasy/stairs-stone.glb");
