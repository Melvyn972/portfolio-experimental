"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { getRoadCurve, ROAD_SURFACE_LIFT, ROAD_WIDTH } from "@/lib/road";
import { useCoastalPbr } from "@/lib/pbrTextures";

/** Top-face overlay only — sits on the sand bed. No slab, no walls, no berms. */
const ASPHALT_HALF = ROAD_WIDTH / 2 + 0.12;
const SEGMENTS = 320;

function makeAsphaltTexture() {
  const s = 64;
  const data = new Uint8Array(s * s * 4);
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const i = (y * s + x) * 4;
      const n = 38 + ((x * 13 + y * 7) % 14);
      data[i] = n;
      data[i + 1] = n;
      data[i + 2] = n - 2;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, s, s);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function buildOverlay(segments = SEGMENTS) {
  const curve = getRoadCurve();
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const y = p.y + ROAD_SURFACE_LIFT;
    const left = p.clone().addScaledVector(side, -ASPHALT_HALF);
    const right = p.clone().addScaledVector(side, ASPHALT_HALF);
    positions.push(left.x, y, left.z, right.x, y, right.z);
    uvs.push(0, t * 36, 1, t * 36);
    if (i < segments) {
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

export function Road({ simple = false }: { simple?: boolean }) {
  const overlay = useMemo(() => buildOverlay(simple ? 96 : SEGMENTS), [simple]);
  const fallback = useMemo(() => (simple ? null : makeAsphaltTexture()), [simple]);
  return simple ? <RoadMeshLite overlay={overlay} /> : <RoadPbr overlay={overlay} fallback={fallback!} />;
}

function RoadMeshLite({ overlay }: { overlay: THREE.BufferGeometry }) {
  const dashes = useMemo(() => {
    const curve = getRoadCurve();
    const positions: number[] = [];
    const indices: number[] = [];
    const n = 24;
    let v = 0;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const y = p.y + ROAD_SURFACE_LIFT + 0.012;
      const halfW = 0.08;
      const halfL = 0.9;
      const c = [
        p.clone().addScaledVector(side, -halfW).addScaledVector(tangent, -halfL),
        p.clone().addScaledVector(side, halfW).addScaledVector(tangent, -halfL),
        p.clone().addScaledVector(side, -halfW).addScaledVector(tangent, halfL),
        p.clone().addScaledVector(side, halfW).addScaledVector(tangent, halfL),
      ];
      for (const q of c) positions.push(q.x, y, q.z);
      indices.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
      v += 4;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    return geo;
  }, []);

  return (
    <group>
      <mesh geometry={overlay} renderOrder={6}>
        <meshBasicMaterial
          color="#2a2926"
          depthWrite
          polygonOffset
          polygonOffsetFactor={-8}
          polygonOffsetUnits={-8}
        />
      </mesh>
      <mesh geometry={dashes} renderOrder={7}>
        <meshBasicMaterial color="#efe6d0" depthWrite={false} polygonOffset polygonOffsetFactor={-9} />
      </mesh>
    </group>
  );
}

function RoadPbr({
  overlay,
  fallback,
}: {
  overlay: THREE.BufferGeometry;
  fallback: THREE.DataTexture;
}) {
  const pbr = useCoastalPbr(6);
  return (
    <group>
      <mesh geometry={overlay} receiveShadow renderOrder={6}>
        <meshStandardMaterial
          color="#3f3a34"
          map={pbr.asphalt.map ?? fallback}
          roughnessMap={pbr.asphalt.roughnessMap}
          roughness={0.92}
          metalness={0.02}
          envMapIntensity={0.18}
          depthWrite
          polygonOffset
          polygonOffsetFactor={-6}
          polygonOffsetUnits={-6}
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
        <mesh key={i} position={m.position} rotation={[0, m.yaw, 0]} receiveShadow renderOrder={7}>
          <boxGeometry args={[0.1, 0.01, 3.2]} />
          <meshStandardMaterial color="#e6deca" roughness={0.7} polygonOffset polygonOffsetFactor={-9} />
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
        <mesh key={i} position={m.position} rotation={[0, m.yaw, 0]} receiveShadow renderOrder={7}>
          <boxGeometry args={[0.16, 0.01, 1.85]} />
          <meshStandardMaterial color="#efe6d0" roughness={0.68} polygonOffset polygonOffsetFactor={-9} />
        </mesh>
      ))}
    </group>
  );
}
