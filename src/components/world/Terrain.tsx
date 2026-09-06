"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { nearestRoadSample, getBelvedereWorldAnchor } from "@/lib/road";

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
    const terrace = getBelvedereWorldAnchor().terrace;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      let y = 0.02;

      const sample = nearestRoadSample(new THREE.Vector3(x, 0, z), 60);
      const lat = sample.lateral;
      const roadDist = Math.abs(lat);

      if (roadDist < 5) {
        y = sample.position.y;
      } else if (roadDist < 10) {
        const t = (roadDist - 5) / 5;
        y = THREE.MathUtils.lerp(sample.position.y, 0.15, t);
      } else {
        y = 0.2 + Math.sin(x * 0.04 + z * 0.02) * 0.15 + Math.cos(z * 0.03) * 0.08;
      }

      if (x < -6) {
        const lip = THREE.MathUtils.smoothstep(-6, -12, -x);
        y = THREE.MathUtils.lerp(y, -0.15, lip);
      }

      if (x > 5) {
        const rise = THREE.MathUtils.smoothstep(5, 28, x);
        const ridge =
          Math.sin(z * 0.045) * 1.4 +
          Math.cos(z * 0.09 + x * 0.05) * 0.9 +
          Math.sin(x * 0.12) * 0.6;
        y = Math.max(y, rise * (3.2 + ridge) + Math.pow(rise, 1.6) * 2.8);
        if (x > 6 && x < 14 && roadDist > 6) {
          y = Math.max(y, 1.2 + (x - 6) * 0.55 + Math.sin(z * 0.15) * 0.4);
        }
      }

      // Belvedere plateau pocket (synced to terrace)
      const dx = x - terrace.x;
      const dz = z - terrace.z;
      if (dx * dx + dz * dz < 120) {
        y = Math.max(y, 0.95);
      }

      // Future zone plateaus
      if (x > 12 && z < -30 && z > -55) y = Math.max(y, 1.6);
      if (x > 12 && z < -108 && z > -130) y = Math.max(y, 1.8);
      if (x > 2 && z < -175 && z > -195) y = Math.max(y, 3.8);
      // Phare rocky outcrop
      {
        const pdx = x - -8;
        const pdz = z - -168;
        if (pdx * pdx + pdz * pdz < 90) {
          const falloff = 1 - Math.sqrt(pdx * pdx + pdz * pdz) / 9.5;
          y = Math.max(y, 0.35 + falloff * 1.4);
        }
      }
      if (x < -14 && z < -85 && z > -110) y = Math.min(y, 0.2);

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
      <mesh geometry={land} receiveShadow castShadow>
        <meshStandardMaterial vertexColors roughness={0.92} metalness={0} flatShading={false} />
      </mesh>
    </group>
  );
}
