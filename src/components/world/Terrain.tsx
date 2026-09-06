"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { computeTerrainHeight } from "@/lib/ground";

export function Terrain() {
  const land = useMemo(() => {
    const geo = new THREE.PlaneGeometry(95, 260, 80, 120);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i);
      const nx = ((lx + 47.5) / 95) * 82 - 12;
      pos.setX(i, nx);
      pos.setZ(i, pos.getZ(i) - 55);
    }

    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = computeTerrainHeight(x, z);

      pos.setY(i, y);

      if (x < -8) c.set("#e8dcc4");
      else if (y > 4.5) c.set("#c4b49e");
      else if (y > 2.2) c.set("#cfc0a8");
      else if (y > 0.9) c.set("#b7a888");
      else if (x < -2) c.set("#d4c4a4");
      else c.set("#8f9f68");

      if (y < 1.2 && x > -2) {
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
    <group>
      <mesh geometry={land} receiveShadow castShadow renderOrder={0}>
        <meshStandardMaterial
          vertexColors
          roughness={0.94}
          metalness={0}
          flatShading={false}
          polygonOffset
          polygonOffsetFactor={2}
          polygonOffsetUnits={2}
        />
      </mesh>
    </group>
  );
}
