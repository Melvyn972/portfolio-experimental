"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const seaVertex = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
varying float vWave;

void main() {
  vUv = uv;
  vec3 pos = position;
  float w1 = sin(pos.x * 0.08 + uTime * 0.7) * 0.18;
  float w2 = cos(pos.y * 0.11 + uTime * 0.55) * 0.12;
  float w3 = sin((pos.x + pos.y) * 0.05 + uTime * 0.35) * 0.22;
  vWave = w1 + w2 + w3;
  pos.z += vWave;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const seaFragment = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
varying float vWave;

void main() {
  vec3 deep = vec3(0.04, 0.28, 0.34);
  vec3 mid = vec3(0.12, 0.55, 0.58);
  vec3 shallow = vec3(0.45, 0.82, 0.78);
  vec3 foam = vec3(0.92, 0.97, 0.95);

  float depth = smoothstep(0.15, 0.85, vUv.x);
  vec3 col = mix(shallow, mid, depth);
  col = mix(col, deep, smoothstep(0.45, 1.0, depth));

  float sparkle = pow(max(0.0, sin(vUv.x * 40.0 + uTime) * cos(vUv.y * 28.0 - uTime * 0.8)), 8.0);
  col += foam * sparkle * 0.18;

  float crest = smoothstep(0.22, 0.38, vWave);
  col = mix(col, foam, crest * 0.25 * (1.0 - depth));

  gl_FragColor = vec4(col, 0.94);
}
`;

export function Sea({ segments = 80 }: { segments?: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((_, dt) => {
    if (mat.current) mat.current.uniforms.uTime.value += dt;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-42, -0.35, -60]} receiveShadow>
      <planeGeometry args={[120, 240, segments, Math.floor(segments * 1.4)]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={seaVertex}
        fragmentShader={seaFragment}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
