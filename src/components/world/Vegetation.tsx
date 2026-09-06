"use client";

import { useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getRoadCurve, getBelvedereWorldAnchor, nearestRoadSample, ROAD_WIDTH } from "@/lib/road";
import { sampleGroundHeight } from "@/lib/ground";

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
      if (Math.abs(nearestRoadSample(pos).lateral) < ROAD_WIDTH * 0.5 + 6.2) continue;
      pos.y = sampleGroundHeight(pos.x, pos.z);
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

    // Belvedere cluster — seaward of the terrace, never on the ribbon
    const bel = getBelvedereWorldAnchor();
    for (let i = 0; i < 5; i++) {
      const pos = terrace
        .clone()
        .addScaledVector(bel.side, -4.2 - (i % 2) * 1.1)
        .addScaledVector(bel.tangent, (i - 2) * 1.8);
      if (pos.x < -9.5) continue;
      if (Math.abs(nearestRoadSample(pos).lateral) < ROAD_WIDTH * 0.5 + 6.2) continue;
      items.push({
        type: i % 2 === 0 ? "bougainvillea" : "pine",
        position: [pos.x, sampleGroundHeight(pos.x, pos.z), pos.z],
        scale: i % 2 === 0 ? 0.9 : 0.32,
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
