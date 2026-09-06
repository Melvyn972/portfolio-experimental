"use client";

import { Sea } from "./Sea";
import { Road } from "./Road";
import { Terrain } from "./Terrain";
import { Vegetation } from "./Vegetation";
import { Belvedere } from "./Belvedere";
import { Atmosphere, RoadAccentProps } from "./Atmosphere";
import type { QualitySettings } from "@/lib/quality";

export function World({ quality }: { quality: QualitySettings }) {
  return (
    <group>
      <Atmosphere dust={quality.dust} />
      <Sea segments={quality.seaSegments} />
      <Terrain />
      <Road />
      <RoadAccentProps />
      <Vegetation count={quality.treeCount} />
      <Belvedere />
      {/* Nearshore water foam band */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-18, -0.1, -60]} receiveShadow>
        <planeGeometry args={[18, 220]} />
        <meshStandardMaterial color="#9fd4cf" transparent opacity={0.35} roughness={0.3} />
      </mesh>
    </group>
  );
}
