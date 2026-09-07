"use client";

import { useMemo } from "react";
import { Sea } from "./Sea";
import { Road } from "./Road";
import { Terrain } from "./Terrain";
import { DebugColliders } from "./DebugColliders";
import { content } from "@/lib/content";
import { sampleGroundHeight } from "@/lib/ground";

/**
 * Soft-GL Éco world: unlit primitives only.
 * Never import Atmosphere (Sky/HDR/GLB), Belvedere, ZonesLite, or DiscoveryZones —
 * those modules preload meshes into SwiftShader and die with Chrome Error 9.
 */
export function WorldLite() {
  return (
    <group>
      <color attach="background" args={["#8aa8b4"]} />
      <Sea lite />
      <Terrain lite segmentsX={24} segmentsZ={36} />
      <Road simple />
      <SoftLandmarks />
      <DebugColliders />
    </group>
  );
}

function SoftLandmarks() {
  const items = useMemo(() => {
    const map: Record<string, { x: number; z: number }> = {};
    for (const z of content.zones.zones) map[z.id] = { x: z.marker.x, z: z.marker.z };
    const maison = map["maison-atelier"];
    const studio = map["studio"];
    const phare = map["phare"];
    const out: { pos: [number, number, number]; size: [number, number, number]; color: string }[] = [];
    if (maison) {
      const y = sampleGroundHeight(maison.x, maison.z);
      out.push({ pos: [maison.x, y + 1.15, maison.z], size: [5.6, 2.3, 3.8], color: "#e4d8c8" });
      out.push({ pos: [maison.x, y + 2.45, maison.z], size: [6.0, 0.55, 4.2], color: "#3d5a32" });
    }
    if (studio) {
      const y = sampleGroundHeight(studio.x, studio.z);
      out.push({ pos: [studio.x, y + 1.0, studio.z], size: [4.8, 2.0, 3.4], color: "#ddd2c4" });
      out.push({ pos: [studio.x, y + 2.2, studio.z], size: [5.1, 0.45, 3.7], color: "#4a6240" });
    }
    if (phare) {
      out.push({ pos: [phare.x, 6.2, phare.z], size: [1.35, 12, 1.35], color: "#d8c8b0" });
      out.push({ pos: [phare.x, 12.4, phare.z], size: [1.8, 0.7, 1.8], color: "#c45c3e" });
    }
    return out;
  }, []);

  return (
    <group>
      {items.map((it, i) => (
        <mesh key={i} position={it.pos}>
          <boxGeometry args={it.size} />
          <meshBasicMaterial color={it.color} />
        </mesh>
      ))}
    </group>
  );
}
