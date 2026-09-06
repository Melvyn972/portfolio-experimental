"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { getRoadCurve, ROAD_SURFACE_LIFT, ROAD_WIDTH } from "@/lib/road";

/** Visual asphalt half-width — slightly wider than drive ribbon so it overlaps berms. */
const ASPHALT_HALF = ROAD_WIDTH / 2 + 0.18;
/** Thin slab — a 1.45 m wall was the grey/blue underside strip. */
const SLAB_DEPTH = 0.16;
const SEGMENTS = 120;

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

function buildRoadRibbon() {
  const curve = getRoadCurve();
  const frames = curve.computeFrenetFrames(SEGMENTS, false);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const p = curve.getPointAt(t);
    const side = new THREE.Vector3(-frames.tangents[i].z, 0, frames.tangents[i].x).normalize();
    const left = p.clone().addScaledVector(side, -ASPHALT_HALF);
    const right = p.clone().addScaledVector(side, ASPHALT_HALF);
    const yTop = p.y + ROAD_SURFACE_LIFT;
    const yBot = yTop - SLAB_DEPTH;
    positions.push(left.x, yTop, left.z, right.x, yTop, right.z, left.x, yBot, left.z, right.x, yBot, right.z);
    uvs.push(0, t * 28, 1, t * 28, 0, t * 28, 1, t * 28);
    if (i < SEGMENTS) {
      const a = i * 4;
      const b = a + 4;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
      indices.push(a + 2, b + 2, a + 3, a + 3, b + 2, b + 3);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Continuous sand/earth slope from under the asphalt lip out to the beach / shelf.
 * No vertical walls — those read as the blue/grey underside strip.
 */
function buildBerm(side: 1 | -1) {
  const curve = getRoadCurve();
  const positions: number[] = [];
  const indices: number[] = [];
  const sea = side < 0;
  const reach = sea ? 7.2 : 4.2;

  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const lat = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const yRoad = p.y + ROAD_SURFACE_LIFT;

    const a = p.clone().addScaledVector(lat, side * (ASPHALT_HALF - 0.35));
    const b = p.clone().addScaledVector(lat, side * (ASPHALT_HALF + 0.06));
    const c = p.clone().addScaledVector(lat, side * (ASPHALT_HALF + reach * 0.42));
    const d = p.clone().addScaledVector(lat, side * (ASPHALT_HALF + reach));
    a.y = yRoad - 0.006;
    b.y = yRoad - 0.014;
    c.y = sea ? THREE.MathUtils.lerp(yRoad - 0.05, -0.08, 0.45) : yRoad + 0.02;
    d.y = sea ? -0.14 : p.y + 0.03;

    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, d.x, d.y, d.z);
    if (i < SEGMENTS) {
      const s0 = i * 4;
      const s1 = s0 + 4;
      const flip = side > 0;
      const quad = (i0: number, i1: number, i2: number, i3: number) => {
        if (flip) indices.push(i0, i2, i1, i1, i2, i3);
        else indices.push(i0, i1, i2, i1, i3, i2);
      };
      quad(s0, s0 + 1, s1, s1 + 1);
      quad(s0 + 1, s0 + 2, s1 + 1, s1 + 2);
      quad(s0 + 2, s0 + 3, s1 + 2, s1 + 3);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function Road() {
  const ribbon = useMemo(() => buildRoadRibbon(), []);
  const seaBerm = useMemo(() => buildBerm(-1), []);
  const inlandBerm = useMemo(() => buildBerm(1), []);
  const asphalt = useMemo(() => makeAsphaltTexture(), []);

  return (
    <group>
      <mesh geometry={seaBerm} receiveShadow>
        <meshStandardMaterial color="#d7c4a4" roughness={0.96} depthWrite />
      </mesh>
      <mesh geometry={inlandBerm} receiveShadow>
        <meshStandardMaterial color="#b7a888" roughness={0.95} depthWrite />
      </mesh>
      <mesh geometry={ribbon} receiveShadow renderOrder={2}>
        <meshStandardMaterial
          color="#2c2b29"
          map={asphalt}
          roughness={0.86}
          metalness={0.06}
          envMapIntensity={0.35}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
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
    const half = ROAD_WIDTH / 2 - 0.38;
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
