"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const seaVertex = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
varying float vWave;
varying float vShore;

void main() {
  vUv = uv;
  vShore = uv.x;
  vec3 pos = position;
  float deep = 1.0 - uv.x;
  float w1 = sin(pos.y * 0.1 + uTime * 0.9) * 0.35 * (0.35 + deep);
  float w2 = cos(pos.y * 0.15 + pos.x * 0.1 + uTime * 0.6) * 0.22;
  float w3 = sin((pos.x + pos.y) * 0.07 + uTime * 0.4) * 0.25 * deep;
  vWave = w1 + w2 + w3;
  pos.z += vWave;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const seaFragment = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
varying float vWave;
varying float vShore;

void main() {
  vec3 deep = vec3(0.04, 0.30, 0.38);
  vec3 mid = vec3(0.12, 0.58, 0.60);
  vec3 turquoise = vec3(0.30, 0.78, 0.72);
  vec3 shallow = vec3(0.65, 0.92, 0.86);
  vec3 foam = vec3(0.96, 0.99, 0.97);

  float shore = vShore;
  vec3 col = mix(deep, mid, shore * 0.5 + 0.2);
  col = mix(col, turquoise, pow(shore, 1.1));
  col = mix(col, shallow, pow(shore, 2.2));

  float sparkle = pow(max(0.0, sin(vUv.y * 50.0 + uTime * 1.1) * cos(vUv.x * 28.0 - uTime * 0.8)), 8.0);
  col += foam * sparkle * 0.25;

  float crest = smoothstep(0.22, 0.5, vWave);
  col = mix(col, foam, crest * 0.35 * (0.35 + shore));

  float foamBand = smoothstep(0.82, 0.94, shore);
  float foamNoise = 0.5 + 0.5 * sin(vUv.y * 28.0 + uTime * 2.0);
  col = mix(col, foam, foamBand * foamNoise * 0.7);

  gl_FragColor = vec4(col, 0.95);
}
`;

export function Sea({ segments = 80 }: { segments?: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((_, dt) => {
    if (mat.current) mat.current.uniforms.uTime.value += dt;
  });

  // Strip from roughly x=-14 (shore) to x=-55 (deep), z along the coast
  return (
    <group>
      {/* Solid turquoise base so the sea always reads */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-30, -0.35, -60]} receiveShadow>
        <planeGeometry args={[50, 250]} />
        <meshStandardMaterial color="#1f9a96" roughness={0.35} metalness={0.05} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-30, -0.28, -60]} renderOrder={1}>
        <planeGeometry args={[48, 248, Math.max(32, Math.floor(segments * 0.55)), Math.max(48, Math.floor(segments * 1.2))]} />
        <shaderMaterial
          ref={mat}
          uniforms={uniforms}
          vertexShader={seaVertex}
          fragmentShader={seaFragment}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
