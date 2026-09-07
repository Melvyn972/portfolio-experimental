"use client";

import { useMemo } from "react";
import { useGameStore } from "@/hooks/useGameStore";
import { getColliders } from "@/lib/colliders";

/** Visualize AABB colliders — OFF in production unless debugColliders. */
export function DebugColliders() {
  const debugColliders = useGameStore((s) => s.debugColliders);
  const boxes = useMemo(() => getColliders(), []);

  if (!debugColliders) return null;

  return (
    <group>
      {boxes.map((c) => {
        const cx = (c.min.x + c.max.x) / 2;
        const cy = (c.min.y + c.max.y) / 2;
        const cz = (c.min.z + c.max.z) / 2;
        const sx = c.max.x - c.min.x;
        const sy = c.max.y - c.min.y;
        const sz = c.max.z - c.min.z;
        return (
          <mesh key={c.id} position={[cx, cy, cz]}>
            <boxGeometry args={[sx, sy, sz]} />
            <meshBasicMaterial color="#ff6b4a" wireframe transparent opacity={0.55} />
          </mesh>
        );
      })}
    </group>
  );
}
