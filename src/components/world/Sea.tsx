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
  float w1 = sin(pos.y * 0.1 + uTime * 0.9) * 0.38 * (0.35 + deep);
  float w2 = cos(pos.y * 0.15 + pos.x * 0.1 + uTime * 0.6) * 0.24;
  float w3 = sin((pos.x + pos.y) * 0.07 + uTime * 0.4) * 0.28 * deep;
  float w4 = sin(pos.y * 0.35 - uTime * 1.4) * 0.08 * deep;
  vWave = w1 + w2 + w3 + w4;
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
  vec3 deep = vec3(0.03, 0.26, 0.36);
  vec3 mid = vec3(0.10, 0.52, 0.58);
  vec3 turquoise = vec3(0.28, 0.76, 0.72);
  vec3 shallow = vec3(0.62, 0.90, 0.86);
  vec3 foam = vec3(0.96, 0.99, 0.97);
  vec3 horizon = vec3(0.55, 0.78, 0.82);

  float shore = vShore;
  vec3 col = mix(deep, mid, shore * 0.45 + 0.2);
  col = mix(col, turquoise, pow(shore, 1.05));
  col = mix(col, shallow, pow(shore, 2.1));
  col = mix(col, horizon, pow(1.0 - shore, 1.8) * 0.25);

  float sparkle = pow(max(0.0, sin(vUv.y * 50.0 + uTime * 1.1) * cos(vUv.x * 28.0 - uTime * 0.8)), 8.0);
  col += foam * sparkle * 0.28;

  float crest = smoothstep(0.2, 0.48, vWave);
  col = mix(col, foam, crest * 0.38 * (0.35 + shore));

  float foamBand = smoothstep(0.8, 0.95, shore);
  float foamNoise = 0.5 + 0.5 * sin(vUv.y * 28.0 + uTime * 2.0);
  col = mix(col, foam, foamBand * foamNoise * 0.72);

  float depthFade = smoothstep(0.0, 0.35, 1.0 - shore);
  col = mix(col, deep, depthFade * 0.35);

  gl_FragColor = vec4(col, 0.96);
}
`;

export function Sea({ segments = 80 }: { segments?: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((_, dt) => {
    if (mat.current) mat.current.uniforms.uTime.value += dt;
  });

  const segsX = Math.max(32, Math.floor(segments * 0.55));
  const segsZ = Math.max(48, Math.floor(segments * 1.2));

  return (
    <group>
      {/* Deep water plane — always reads as sea even before shader settles */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-38, -0.55, -60]} receiveShadow>
        <planeGeometry args={[70, 280]} />
        <meshStandardMaterial color="#0e6e72" roughness={0.4} metalness={0.08} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-30, -0.28, -60]} renderOrder={1}>
        <planeGeometry args={[48, 248, segsX, segsZ]} />
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
