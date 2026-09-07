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

/** Warm earth — pale beige + ACES read as a white slab in Melvyn's FAIL shot. */
const SAND = new THREE.Color("#b08954");
const WET = new THREE.Color("#8a7654");
const APRON = new THREE.Color("#b8945c");
const DIRT = new THREE.Color("#8f6e42");
const GRASS = new THREE.Color("#4e5c32");
const ROCK = new THREE.Color("#7a6a52");

function makeSandTexture() {
  const s = 128;
  const data = new Uint8Array(s * s * 4);
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const i = (y * s + x) * 4;
      const n = ((x * 17 + y * 11) % 23) + ((x * 3 + y * 5) % 9);
      data[i] = 168 + n;
      data[i + 1] = 132 + (n >> 1);
      data[i + 2] = 82 + (n >> 2);
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, s, s);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Continuous coastal heightfield. Sand stays above the water sheet.
 * Colors lerp — no hard white / cyan biome seams.
 */
export function Terrain() {
  const sandFallback = useMemo(() => makeSandTexture(), []);
  const underlayTex = useMemo(() => {
    const t = sandFallback.clone();
    t.repeat.set(22, 36);
    t.needsUpdate = true;
    return t;
  }, [sandFallback]);
  const land = useMemo(() => {
    const sizeX = TERRAIN_MAX_X - TERRAIN_MIN_X;
    const sizeZ = TERRAIN_MAX_Z - TERRAIN_MIN_Z;
    const midX = (TERRAIN_MIN_X + TERRAIN_MAX_X) / 2;
    const midZ = (TERRAIN_MIN_Z + TERRAIN_MAX_Z) / 2;
    const geo = new THREE.PlaneGeometry(sizeX, sizeZ, 140, 220);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const uv = geo.attributes.uv as THREE.BufferAttribute;

    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + midX;
      const z = pos.getZ(i) + midZ;
      pos.setX(i, x);
      pos.setZ(i, z);
      const { roadDist } = roadClearance(x, z);
      pos.setY(i, computeTerrainHeight(x, z));
      uv.setXY(i, (x - TERRAIN_MIN_X) / 7.5, (z - TERRAIN_MIN_Z) / 7.5);

      const sandMix = THREE.MathUtils.smoothstep(-2, -10, -x);
      const wetMix = THREE.MathUtils.smoothstep(-13.5, -18.2, -x);
      const apronMix = THREE.MathUtils.clamp(1 - (roadDist - ROAD_SAND_APRON) / 3.2, 0, 1);
      const y = pos.getY(i);
      const grassMix = THREE.MathUtils.smoothstep(0.85, 2.6, y) * (1 - sandMix);
      const rockMix = THREE.MathUtils.smoothstep(3.2, 5.2, y);

      c.copy(DIRT);
      c.lerp(SAND, Math.max(sandMix, apronMix * 0.85));
      c.lerp(WET, wetMix * 0.62);
      c.lerp(APRON, apronMix * (1 - sandMix) * 0.55);
      c.lerp(GRASS, grassMix * 0.72);
      c.lerp(ROCK, rockMix);
      c.offsetHSL(0, -0.02, Math.sin(x * 1.4 + z * 1.1) * 0.01);

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    pos.needsUpdate = true;
    uv.needsUpdate = true;
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  const midZ = (TERRAIN_MIN_Z + TERRAIN_MAX_Z) / 2;
  const sizeZ = TERRAIN_MAX_Z - TERRAIN_MIN_Z;
  const sizeX = TERRAIN_MAX_X - TERRAIN_MIN_X;
  const midX = (TERRAIN_MIN_X + TERRAIN_MAX_X) / 2;

  return (
    <group>
      {/* Safety sand — if the heightfield misses a cell, driving view never shows a white void. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[midX, -0.12, midZ]} receiveShadow frustumCulled={false}>
        <planeGeometry args={[sizeX + 36, sizeZ + 40]} />
        <meshStandardMaterial
          color="#a07c48"
          map={underlayTex}
          roughness={0.97}
          metalness={0}
        />
      </mesh>
      <mesh geometry={land} receiveShadow renderOrder={0} frustumCulled={false}>
        <meshStandardMaterial
          vertexColors
          map={sandFallback}
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
        <meshStandardMaterial color="#8a7048" roughness={0.97} metalness={0} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
