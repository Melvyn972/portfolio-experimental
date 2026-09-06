"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { computeTerrainHeight, isRoadCutProbe, ROAD_CUT_MARGIN, roadClearance } from "@/lib/ground";

/**
 * Coastal heightfield with a hard hole under the asphalt.
 * Vertices in the corridor are dropped; triangles that still cross the ribbon
 * are deleted so iPhone Metal cannot z-fight sand through the road.
 */
export function Terrain() {
  const land = useMemo(() => {
    const geo = new THREE.PlaneGeometry(95, 260, 100, 160);
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
    const dist = new Float32Array(pos.count);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const { y, roadDist } = roadClearance(x, z);
      pos.setY(i, computeTerrainHeight(x, z));
      dist[i] = roadDist;
      if (x < -8) c.set("#e8dcc4");
      else if (y > 4.5) c.set("#c4b49e");
      else if (y > 2.2) c.set("#cfc0a8");
      else if (y > 0.9) c.set("#b7a888");
      else if (x < -2) c.set("#d4c4a4");
      else c.set("#8f9f68");

      if (y < 1.2 && x > -2) {
        c.offsetHSL(0, -0.05, Math.sin(x * 2.1 + z * 1.7) * 0.04);
      }

      // Only the prism shoulder is soil — inland shelf stays sand, not a dark canyon.
      if (roadDist < ROAD_CUT_MARGIN + 0.55) {
        c.set("#5a5448");
        c.offsetHSL(0, 0, Math.sin(x * 3.1 + z * 2.4) * 0.03);
      }

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    pos.needsUpdate = true;
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    cutRoadTriangles(geo, dist);
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
          polygonOffsetFactor={4}
          polygonOffsetUnits={4}
        />
      </mesh>
    </group>
  );
}

function cutRoadTriangles(geo: THREE.BufferGeometry, dist: Float32Array) {
  const index = geo.index;
  const pos = geo.attributes.position as THREE.BufferAttribute;
  if (!index) return;

  const kept: number[] = [];
  const ax = new THREE.Vector3();
  const bx = new THREE.Vector3();
  const cx = new THREE.Vector3();

  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i);
    const b = index.getX(i + 1);
    const c = index.getX(i + 2);
    ax.set(pos.getX(a), 0, pos.getZ(a));
    bx.set(pos.getX(b), 0, pos.getZ(b));
    cx.set(pos.getX(c), 0, pos.getZ(c));
    const mx = (ax.x + bx.x + cx.x) / 3;
    const mz = (ax.z + bx.z + cx.z) / 3;
    const minD = Math.min(dist[a], dist[b], dist[c]);
    if (minD > ROAD_CUT_MARGIN + 10) {
      kept.push(a, b, c);
      continue;
    }
    if (isRoadCutProbe(mx, mz)) continue;
    if (isRoadCutProbe((ax.x + bx.x) * 0.5, (ax.z + bx.z) * 0.5)) continue;
    if (isRoadCutProbe((bx.x + cx.x) * 0.5, (bx.z + cx.z) * 0.5)) continue;
    if (isRoadCutProbe((cx.x + ax.x) * 0.5, (cx.z + ax.z) * 0.5)) continue;
    if (isRoadCutProbe(pos.getX(a), pos.getZ(a))) continue;
    if (isRoadCutProbe(pos.getX(b), pos.getZ(b))) continue;
    if (isRoadCutProbe(pos.getX(c), pos.getZ(c))) continue;

    kept.push(a, b, c);
  }

  geo.setIndex(kept);
}
