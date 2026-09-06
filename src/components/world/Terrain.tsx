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

/**
 * Continuous coastal heightfield. No triangle cuts, no trench under the road.
 * Sand stays flush under a thin asphalt overlay (polygonOffset keeps it below).
 */
export function Terrain() {
  const land = useMemo(() => {
    const sizeX = TERRAIN_MAX_X - TERRAIN_MIN_X;
    const sizeZ = TERRAIN_MAX_Z - TERRAIN_MIN_Z;
    const midX = (TERRAIN_MIN_X + TERRAIN_MAX_X) / 2;
    const midZ = (TERRAIN_MIN_Z + TERRAIN_MAX_Z) / 2;
    const geo = new THREE.PlaneGeometry(sizeX, sizeZ, 118, 188);
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

      if (x < -6 || roadDist < ROAD_SAND_APRON + 1.2) c.set("#d7c09a");
      else if (y > 4.5) c.set("#c2b094");
      else if (y > 2.2) c.set("#cbb89a");
      else if (y > 0.9) c.set("#b8a47e");
      else if (x < 2) c.set("#d0b890");
      else c.set("#7f9660");

      if (y < 1.2 && x > 2) {
        c.offsetHSL(0, -0.05, Math.sin(x * 2.1 + z * 1.7) * 0.04);
      }

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    pos.needsUpdate = true;
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={land} receiveShadow castShadow renderOrder={0} frustumCulled={false}>
      <meshStandardMaterial
        vertexColors
        roughness={0.94}
        metalness={0}
        flatShading={false}
        polygonOffset
        polygonOffsetFactor={8}
        polygonOffsetUnits={8}
      />
    </mesh>
  );
}
