"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { getRoadCurve, ROAD_SURFACE_LIFT, ROAD_WIDTH } from "@/lib/road";

/** Top-face overlay only — sits on the sand bed. No slab, no walls, no berms. */
const ASPHALT_HALF = ROAD_WIDTH / 2 + 0.04;
const SEGMENTS = 220;

function makeAsphaltTexture() {
  const s = 64;
  const data = new Uint8Array(s * s * 4);
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const i = (y * s + x) * 4;
      const n = 36 + ((x * 13 + y * 7) % 17);
      data[i] = n;
      data[i + 1] = n;
      data[i + 2] = n - 3;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, s, s);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function buildOverlay() {
  const curve = getRoadCurve();
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const y = p.y + ROAD_SURFACE_LIFT;
    const left = p.clone().addScaledVector(side, -ASPHALT_HALF);
    const right = p.clone().addScaledVector(side, ASPHALT_HALF);
    positions.push(left.x, y, left.z, right.x, y, right.z);
    uvs.push(0, t * 36, 1, t * 36);
    if (i < SEGMENTS) {
      const a = i * 2;
      // left0, right0, left1 / right0, right1, left1 — upward normal from above
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function Road() {
  const overlay = useMemo(() => buildOverlay(), []);
  const asphalt = useMemo(() => makeAsphaltTexture(), []);

  return (
    <group>
      <mesh geometry={overlay} receiveShadow renderOrder={2}>
        <meshStandardMaterial
          color="#1c1b18"
          map={asphalt}
          roughness={0.9}
          metalness={0.02}
          envMapIntensity={0.18}
          depthWrite
          polygonOffset
          polygonOffsetFactor={-3}
          polygonOffsetUnits={-3}
        />
      </mesh>
      <RoadMarkings />
      <RoadEdgeLines />
    </group>
  );
}

function RoadEdgeLines() {
  const edges = useMemo(() => {
    const curve = getRoadCurve();
    const half = ROAD_WIDTH / 2 - 0.42;
    return [1, -1].flatMap((side) =>
      Array.from({ length: 56 }, (_, i) => {
        const t = (i + 0.5) / 56;
        const p = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t);
        const lateral = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        const pos = p.clone().addScaledVector(lateral, side * half);
        return {
          position: [pos.x, p.y + ROAD_SURFACE_LIFT + 0.012, pos.z] as [number, number, number],
          yaw: Math.atan2(tangent.x, tangent.z),
        };
      }),
    );
  }, []);

  return (
    <group>
      {edges.map((m, i) => (
        <mesh key={i} position={m.position} rotation={[0, m.yaw, 0]} receiveShadow renderOrder={3}>
          <boxGeometry args={[0.1, 0.01, 3.2]} />
          <meshStandardMaterial color="#e6deca" roughness={0.7} polygonOffset polygonOffsetFactor={-4} />
        </mesh>
      ))}
    </group>
  );
}

function RoadMarkings() {
  const marks = useMemo(() => {
    const curve = getRoadCurve();
    return Array.from({ length: 40 }, (_, i) => {
      const t = (i + 0.5) / 40;
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const yaw = Math.atan2(tangent.x, tangent.z);
      return { position: [p.x, p.y + ROAD_SURFACE_LIFT + 0.01, p.z] as [number, number, number], yaw };
    });
  }, []);

  return (
    <group>
      {marks.map((m, i) => (
        <mesh key={i} position={m.position} rotation={[0, m.yaw, 0]} receiveShadow renderOrder={3}>
          <boxGeometry args={[0.16, 0.01, 1.85]} />
          <meshStandardMaterial color="#efe6d0" roughness={0.68} polygonOffset polygonOffsetFactor={-4} />
        </mesh>
      ))}
    </group>
  );
}
