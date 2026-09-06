"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { getRoadCurve, ROAD_SURFACE_LIFT, ROAD_WIDTH } from "@/lib/road";

const ROAD_HALF = ROAD_WIDTH / 2 + 0.2;
const SLAB_DEPTH = 1.45;

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

function buildRoadPrism() {
  const curve = getRoadCurve();
  const frames = curve.computeFrenetFrames(96, false);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= 96; i++) {
    const t = i / 96;
    const p = curve.getPointAt(t);
    const side = new THREE.Vector3(-frames.tangents[i].z, 0, frames.tangents[i].x).normalize();
    const left = p.clone().addScaledVector(side, -ROAD_HALF);
    const right = p.clone().addScaledVector(side, ROAD_HALF);
    const yTop = p.y + ROAD_SURFACE_LIFT;
    const yBot = yTop - SLAB_DEPTH;
    // 0 LT, 1 RT, 2 LB, 3 RB
    positions.push(
      left.x, yTop, left.z,
      right.x, yTop, right.z,
      left.x, yBot, left.z,
      right.x, yBot, right.z,
    );
    uvs.push(0, t * 28, 1, t * 28, 0, t * 28, 1, t * 28);
    if (i < 96) {
      const a = i * 4;
      const b = a + 4;
      // top
      indices.push(a, a + 1, b, a + 1, b + 1, b);
      // bottom
      indices.push(a + 2, b + 2, a + 3, a + 3, b + 2, b + 3);
      // left wall
      indices.push(a, b, a + 2, b, b + 2, a + 2);
      // right wall
      indices.push(a + 1, a + 3, b + 1, b + 1, a + 3, b + 3);
    }
  }

  // end caps
  const last = 96 * 4;
  indices.push(0, 2, 1, 1, 2, 3);
  indices.push(last, last + 1, last + 2, last + 1, last + 3, last + 2);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function Shoulder({ side }: { side: 1 | -1 }) {
  const geo = useMemo(() => {
    const curve = getRoadCurve();
    const positions: number[] = [];
    const indices: number[] = [];
    const innerW = ROAD_HALF + 0.08;
    for (let i = 0; i <= 80; i++) {
      const t = i / 80;
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const lateral = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const inner = p.clone().addScaledVector(lateral, side * innerW);
      const outer = p.clone().addScaledVector(lateral, side * (innerW + 2.8));
      inner.y = p.y + ROAD_SURFACE_LIFT - 0.08;
      outer.y = p.y - 0.35;
      positions.push(inner.x, inner.y, inner.z, outer.x, outer.y, outer.z);
      if (i < 80) {
        const a = i * 2;
        if (side > 0) indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        else indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [side]);

  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial color="#6a6458" roughness={0.96} />
    </mesh>
  );
}

export function Road() {
  const prism = useMemo(() => buildRoadPrism(), []);
  const asphalt = useMemo(() => makeAsphaltTexture(), []);

  return (
    <group>
      <mesh geometry={prism} receiveShadow castShadow renderOrder={2}>
        <meshStandardMaterial
          color="#2a2a28"
          map={asphalt}
          roughness={0.9}
          metalness={0.04}
          polygonOffset
          polygonOffsetFactor={-3}
          polygonOffsetUnits={-3}
        />
      </mesh>
      <RoadMarkings />
      <RoadEdgeLines />
      <Shoulder side={1} />
      <Shoulder side={-1} />
    </group>
  );
}

function RoadEdgeLines() {
  const edges = useMemo(() => {
    const curve = getRoadCurve();
    const half = ROAD_WIDTH / 2 - 0.28;
    return [1, -1].flatMap((side) =>
      Array.from({ length: 52 }, (_, i) => {
        const t = (i + 0.5) / 52;
        const p = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t);
        const lateral = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        const pos = p.clone().addScaledVector(lateral, side * half);
        return {
          position: [pos.x, p.y + ROAD_SURFACE_LIFT + 0.014, pos.z] as [number, number, number],
          yaw: Math.atan2(tangent.x, tangent.z),
        };
      }),
    );
  }, []);

  return (
    <group>
      {edges.map((m, i) => (
        <mesh key={i} position={m.position} rotation={[0, m.yaw, 0]} receiveShadow renderOrder={3}>
          <boxGeometry args={[0.11, 0.012, 3.4]} />
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
      return { position: [p.x, p.y + ROAD_SURFACE_LIFT + 0.012, p.z] as [number, number, number], yaw };
    });
  }, []);

  return (
    <group>
      {marks.map((m, i) => (
        <mesh key={i} position={m.position} rotation={[0, m.yaw, 0]} receiveShadow renderOrder={3}>
          <boxGeometry args={[0.16, 0.012, 1.85]} />
          <meshStandardMaterial color="#efe6d0" roughness={0.68} polygonOffset polygonOffsetFactor={-4} />
        </mesh>
      ))}
    </group>
  );
}
