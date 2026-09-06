"use client";

import { useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getRoadCurve, getBelvedereWorldAnchor } from "@/lib/road";
import { computeTerrainHeight } from "@/lib/ground";

type TreeType = "pine" | "olive" | "bougainvillea" | "cypress";

function useClonedScene(path: string) {
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

function PlacedModel({
  scene,
  position,
  scale,
  rot,
  sway,
}: {
  scene: THREE.Object3D;
  position: [number, number, number];
  scale: number;
  rot: number;
  sway: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const clone = useMemo(() => scene.clone(true), [scene]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.rotation.z = Math.sin(t * 0.65 + sway) * 0.03;
    ref.current.rotation.x = Math.cos(t * 0.5 + sway * 0.7) * 0.018;
  });

  return (
    <group ref={ref} position={position} rotation={[0, rot, 0]} scale={scale}>
      <primitive object={clone} />
    </group>
  );
}

export function Vegetation({ count = 60 }: { count?: number }) {
  const pine = useClonedScene("/models/pine.glb");
  const olive = useClonedScene("/models/olive.glb");
  const cypress = useClonedScene("/models/cypress.glb");
  const bougainvillea = useClonedScene("/models/bougainvillea.glb");

  const placements = useMemo(() => {
    const curve = getRoadCurve();
    const terrace = getBelvedereWorldAnchor().terrace;
    const items: {
      type: TreeType;
      position: [number, number, number];
      scale: number;
      rot: number;
      sway: number;
    }[] = [];

    for (let i = 0; i < count; i++) {
      const t = 0.04 + (i / count) * 0.92;
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const cliffSide = i % 5 !== 1;
      const dist = cliffSide ? 8 + (i % 6) * 1.6 + (i % 3) * 0.4 : -7.2 - (i % 3) * 0.8;
      const pos = p.clone().addScaledVector(side, dist);
      // Never plant in the sea ( Melvyn QA: floating pink shards over water )
      if (pos.x < -8.5) continue;
      pos.y = computeTerrainHeight(pos.x, pos.z);
      let type: TreeType = "pine";
      if (!cliffSide) type = i % 3 === 0 ? "bougainvillea" : "pine";
      else if (i % 7 === 0) type = "cypress";
      else if (i % 5 === 0) type = "olive";
      items.push({
        type,
        position: [pos.x, pos.y, pos.z],
        // Quaternius pine ≈ 7.4u tall — keep coastal canopy ~3–4m
        scale:
          type === "pine"
            ? 0.38 + (i % 5) * 0.06
            : type === "cypress"
              ? 0.9 + (i % 3) * 0.15
              : 0.85 + (i % 5) * 0.14,
        rot: i * 0.7,
        sway: i * 0.4,
      });
    }

    // Belvedere cluster — follows terrace anchor
    for (let i = 0; i < 10; i++) {
      items.push({
        type: i % 3 === 0 ? "bougainvillea" : i % 3 === 1 ? "cypress" : "pine",
        position: [
          terrace.x - 3 + i * 0.9,
          computeTerrainHeight(terrace.x - 3 + i * 0.9, terrace.z - 2 - (i % 4) * 1.1),
          terrace.z - 2 - (i % 4) * 1.1,
        ],
        scale: i % 3 === 2 ? 0.32 + (i % 3) * 0.04 : 1 + (i % 3) * 0.12,
        rot: i * 0.9,
        sway: 200 + i,
      });
    }
    return items;
  }, [count]);

  const scenes: Record<TreeType, THREE.Object3D> = {
    pine,
    olive,
    cypress,
    bougainvillea,
  };

  return (
    <group>
      {placements.map((p, i) => (
        <PlacedModel
          key={i}
          scene={scenes[p.type]}
          position={p.position}
          scale={p.scale}
          rot={p.rot}
          sway={p.sway}
        />
      ))}
    </group>
  );
}

useGLTF.preload("/models/pine.glb");
useGLTF.preload("/models/olive.glb");
useGLTF.preload("/models/cypress.glb");
useGLTF.preload("/models/bougainvillea.glb");
