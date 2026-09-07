"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { nearestRoadSample, ROAD_WIDTH } from "@/lib/road";
import { sampleGroundHeight } from "@/lib/ground";
import { enableShadows, groundClone } from "@/lib/gltfFit";
import { SEA_INLAND_X } from "@/lib/sea";

/**
 * Poly Haven coastal cliff — seaward only, never on the asphalt ribbon.
 */
export function CoastCliffs() {
  const { scene } = useGLTF("/models/cliff-coast.glb");
  const src = useMemo(() => {
    const c = scene.clone(true);
    enableShadows(c);
    groundClone(c);
    return c;
  }, [scene]);

  const items = useMemo(() => {
    const spots = [
      { x: -20.4, z: -78.6, s: 0.42, yaw: 0.35 },
      { x: -21.2, z: -118.4, s: 0.48, yaw: 1.1 },
      { x: -19.6, z: -158.2, s: 0.4, yaw: 2.2 },
    ];
    return spots
      .filter((s) => s.x < SEA_INLAND_X - 1.4)
      .filter((s) => Math.abs(nearestRoadSample(new THREE.Vector3(s.x, 0, s.z)).lateral) > ROAD_WIDTH * 0.5 + 6)
      .map((s) => ({
        ...s,
        y: Math.min(sampleGroundHeight(s.x, s.z), -0.35),
        object: src.clone(true),
      }));
  }, [src]);

  return (
    <group>
      {items.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} rotation={[0, c.yaw, 0]} scale={c.s}>
          <primitive object={c.object} />
        </group>
      ))}
    </group>
  );
}

useGLTF.preload("/models/cliff-coast.glb");
