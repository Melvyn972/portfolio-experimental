"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { getRoadCurve, ROAD_WIDTH } from "@/lib/road";

function buildRoadGeometry() {
  const curve = getRoadCurve();
  const frames = curve.computeFrenetFrames(80, false);
  const half = ROAD_WIDTH / 2;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= 80; i++) {
    const t = i / 80;
    const p = curve.getPointAt(t);
    const n = frames.normals[i];
    const side = new THREE.Vector3(-frames.tangents[i].z, 0, frames.tangents[i].x).normalize();
    const left = p.clone().addScaledVector(side, -half);
    const right = p.clone().addScaledVector(side, half);
    left.y += 0.02 + n.y * 0.01;
    right.y += 0.02 + n.y * 0.01;
    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
    uvs.push(0, t * 28, 1, t * 28);
    if (i < 80) {
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
    for (let i = 0; i <= 70; i++) {
      const t = i / 70;
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const lateral = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const inner = p.clone().addScaledVector(lateral, side * half);
      const outer = p.clone().addScaledVector(lateral, side * (half + 2.4));
      inner.y += 0.01;
      outer.y -= 0.08;
      positions.push(inner.x, inner.y, inner.z, outer.x, outer.y, outer.z);
      if (i < 70) {
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
      <meshStandardMaterial color="#c4b49a" roughness={0.95} />
    </mesh>
  );
}

export function Road() {
  const geo = useMemo(() => buildRoadGeometry(), []);

  return (
    <group>
      <mesh geometry={geo} receiveShadow castShadow>
        <meshStandardMaterial color="#4a4a48" roughness={0.88} metalness={0.05} />
      </mesh>
      {/* Center dashed line as thin mesh strip */}
      <RoadMarkings />
      <Shoulder side={1} />
      <Shoulder side={-1} />
    </group>
  );
}

function RoadMarkings() {
  const marks = useMemo(() => {
    const curve = getRoadCurve();
    return Array.from({ length: 36 }, (_, i) => {
      const t = (i + 0.5) / 36;
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const yaw = Math.atan2(tangent.x, tangent.z);
      return { position: [p.x, p.y + 0.035, p.z] as [number, number, number], yaw };
    });
  }, []);

  return (
    <group>
      {marks.map((m, i) => (
        <mesh key={i} position={m.position} rotation={[0, m.yaw, 0]} receiveShadow>
          <boxGeometry args={[0.12, 0.01, 1.6]} />
          <meshStandardMaterial color="#e8e0c8" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}
