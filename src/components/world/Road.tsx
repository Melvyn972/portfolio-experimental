"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { getRoadCurve, ROAD_SURFACE_LIFT, ROAD_WIDTH } from "@/lib/road";

function buildRoadGeometry() {
  const curve = getRoadCurve();
  const frames = curve.computeFrenetFrames(96, false);
  const half = ROAD_WIDTH / 2;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= 96; i++) {
    const t = i / 96;
    const p = curve.getPointAt(t);
    const side = new THREE.Vector3(-frames.tangents[i].z, 0, frames.tangents[i].x).normalize();
    const left = p.clone().addScaledVector(side, -half);
    const right = p.clone().addScaledVector(side, half);
    left.y = p.y + ROAD_SURFACE_LIFT;
    right.y = p.y + ROAD_SURFACE_LIFT;
    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
    uvs.push(0, t * 32, 1, t * 32);
    if (i < 96) {
      const a = i * 2;
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

function Shoulder({ side }: { side: 1 | -1 }) {
  const geo = useMemo(() => {
    const curve = getRoadCurve();
    const positions: number[] = [];
    const indices: number[] = [];
    const half = ROAD_WIDTH / 2;
    for (let i = 0; i <= 80; i++) {
      const t = i / 80;
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const lateral = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const inner = p.clone().addScaledVector(lateral, side * (half + 0.12));
      const outer = p.clone().addScaledVector(lateral, side * (half + 3.2));
      inner.y = p.y + ROAD_SURFACE_LIFT - 0.06;
      outer.y = p.y - 0.22;
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
      <meshStandardMaterial color="#6e685c" roughness={0.96} />
    </mesh>
  );
}

function buildRoadSlab() {
  const curve = getRoadCurve();
  const frames = curve.computeFrenetFrames(64, false);
  const half = ROAD_WIDTH / 2;
  const positions: number[] = [];
  const indices: number[] = [];
  const depth = 0.22;
  for (let i = 0; i <= 64; i++) {
    const t = i / 64;
    const p = curve.getPointAt(t);
    const side = new THREE.Vector3(-frames.tangents[i].z, 0, frames.tangents[i].x).normalize();
    const left = p.clone().addScaledVector(side, -half);
    const right = p.clone().addScaledVector(side, half);
    const yTop = p.y + ROAD_SURFACE_LIFT;
    const yBot = yTop - depth;
    positions.push(left.x, yTop, left.z, right.x, yTop, right.z, left.x, yBot, left.z, right.x, yBot, right.z);
    if (i < 64) {
      const a = i * 4;
      const b = a + 4;
      // sides so a thin ribbon never lets sand show through
      indices.push(a, b, a + 2, b, b + 2, a + 2);
      indices.push(a + 1, a + 3, b + 1, b + 1, a + 3, b + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function Road() {
  const geo = useMemo(() => buildRoadGeometry(), []);
  const slab = useMemo(() => buildRoadSlab(), []);

  return (
    <group>
      <mesh geometry={slab} renderOrder={1}>
        <meshStandardMaterial color="#1f1f1d" roughness={1} />
      </mesh>
      <mesh geometry={geo} receiveShadow castShadow renderOrder={2}>
        <meshStandardMaterial
          color="#2c2c2a"
          roughness={0.88}
          metalness={0.06}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
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
    const half = ROAD_WIDTH / 2 - 0.22;
    return [1, -1].flatMap((side) =>
      Array.from({ length: 52 }, (_, i) => {
        const t = (i + 0.5) / 52;
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
          <boxGeometry args={[0.11, 0.01, 3.4]} />
          <meshStandardMaterial color="#e6deca" roughness={0.7} polygonOffset polygonOffsetFactor={-3} />
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
          <meshStandardMaterial color="#efe6d0" roughness={0.68} polygonOffset polygonOffsetFactor={-3} />
        </mesh>
      ))}
    </group>
  );
}
