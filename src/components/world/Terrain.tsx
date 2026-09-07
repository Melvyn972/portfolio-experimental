"use client";

import { useMemo } from "react";
import * as THREE from "three";
import {
  computeTerrainHeight,
  ROAD_SAND_APRON,
  TERRAIN_MAX_X,
  TERRAIN_MAX_Z,
  TERRAIN_MIN_X,
  TERRAIN_MIN_Z,
  roadClearance,
} from "@/lib/ground";

const SAND = new THREE.Color("#d2bc96");
const WET = new THREE.Color("#b8a888");
const APRON = new THREE.Color("#d4be9a");
const DIRT = new THREE.Color("#c2a478");
const GRASS = new THREE.Color("#6a7a44");
const ROCK = new THREE.Color("#b6a888");

/**
 * Continuous coastal heightfield. Sand stays above the water sheet.
 * Colors lerp — no hard white / cyan biome seams.
 */
export function Terrain() {
  const land = useMemo(() => {
    const sizeX = TERRAIN_MAX_X - TERRAIN_MIN_X;
    const sizeZ = TERRAIN_MAX_Z - TERRAIN_MIN_Z;
    const midX = (TERRAIN_MIN_X + TERRAIN_MAX_X) / 2;
    const midZ = (TERRAIN_MIN_Z + TERRAIN_MAX_Z) / 2;
    const geo = new THREE.PlaneGeometry(sizeX, sizeZ, 124, 196);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;

    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + midX;
      const z = pos.getZ(i) + midZ;
      pos.setX(i, x);
      pos.setZ(i, z);
      const { y, roadDist } = roadClearance(x, z);
      pos.setY(i, computeTerrainHeight(x, z));

      const sandMix = THREE.MathUtils.smoothstep(-2, -10, -x);
      const wetMix = THREE.MathUtils.smoothstep(-13.5, -18.2, -x);
      const apronMix = THREE.MathUtils.clamp(1 - (roadDist - ROAD_SAND_APRON) / 3.2, 0, 1);
      const grassMix = THREE.MathUtils.smoothstep(0.7, 2.4, y) * (1 - sandMix);
      const rockMix = THREE.MathUtils.smoothstep(3.2, 5.2, y);

      c.copy(DIRT);
      c.lerp(SAND, Math.max(sandMix, apronMix * 0.85));
      c.lerp(WET, wetMix * 0.62);
      c.lerp(APRON, apronMix * (1 - sandMix) * 0.55);
      c.lerp(GRASS, grassMix * 0.72);
      c.lerp(ROCK, rockMix);
      c.offsetHSL(0, -0.03, Math.sin(x * 1.4 + z * 1.1) * 0.012);

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    pos.needsUpdate = true;
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  const midZ = (TERRAIN_MIN_Z + TERRAIN_MAX_Z) / 2;
  const sizeZ = TERRAIN_MAX_Z - TERRAIN_MIN_Z;

  return (
    <group>
      <mesh geometry={land} receiveShadow renderOrder={0} frustumCulled={false}>
        <meshStandardMaterial
          vertexColors
          roughness={0.96}
          metalness={0}
          flatShading={false}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      {/* Vertical lip so the paper-thin sand edge never reads as a floating slab. */}
      <mesh position={[TERRAIN_MIN_X, -0.16, midZ]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[sizeZ, 0.28]} />
        <meshStandardMaterial color="#b0a488" roughness={0.97} metalness={0} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
