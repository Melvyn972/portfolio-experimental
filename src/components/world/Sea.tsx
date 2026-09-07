"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Inland water edge — past the beach, never under the road lip. */
export const SEA_INLAND_X = -17.4;
export const SEA_SURFACE_Y = -0.22;

const seaVertex = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
varying float vDeep;

#include <common>
#include <fog_pars_vertex>

void main() {
  vUv = uv;
  vDeep = 1.0 - uv.x;
  vec3 pos = position;
  float amp = vDeep * vDeep * 0.07;
  pos.z += sin(pos.y * 0.12 + uTime * 0.48) * amp;
  pos.z += cos(pos.y * 0.07 + pos.x * 0.05 + uTime * 0.28) * amp * 0.5;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const seaFragment = /* glsl */ `
varying vec2 vUv;
varying float vDeep;

#include <common>
#include <fog_pars_fragment>

void main() {
  vec3 deep = vec3(0.14, 0.32, 0.36);
  vec3 mid = vec3(0.24, 0.42, 0.42);
  vec3 shore = vec3(0.46, 0.54, 0.52);
  vec3 col = mix(deep, mid, smoothstep(0.0, 0.68, vUv.x));
  col = mix(col, shore, smoothstep(0.78, 1.0, vUv.x));
  float sparkle = pow(max(0.0, sin(vUv.y * 28.0) * cos(vUv.x * 18.0)), 18.0);
  col += vec3(0.06, 0.07, 0.06) * sparkle * vDeep * 0.22;
  float foam = smoothstep(0.88, 1.0, vUv.x) * (0.45 + 0.25 * sin(vUv.y * 40.0));
  col = mix(col, vec3(0.86, 0.88, 0.84), foam * 0.55);
  col *= 0.90 + 0.08 * (1.0 - vDeep);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}
`;

/**
 * One grounded water sheet. No stacked planes, no metre-high waves,
 * no inland overlap with the sand bed (that read as floating dark slabs).
 */
export function Sea({ segments = 64 }: { segments?: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((_, dt) => {
    if (mat.current) mat.current.uniforms.uTime.value += dt;
  });

  const width = 78;
  const depth = 260;
  const centerX = SEA_INLAND_X - width * 0.5;
  const segsX = Math.max(24, Math.floor(segments * 0.45));
  const segsZ = Math.max(36, Math.floor(segments * 0.9));

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, SEA_SURFACE_Y, -55]} renderOrder={0} frustumCulled={false}>
      <planeGeometry args={[width, depth, segsX, segsZ]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={seaVertex}
        fragmentShader={seaFragment}
        fog
        depthWrite
        transparent={false}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}
