"use client";

import { EffectComposer, Vignette, BrightnessContrast, Bloom, HueSaturation, N8AO } from "@react-three/postprocessing";

export function PostFX({ enabled, ao = false }: { enabled: boolean; ao?: boolean }) {
  if (!enabled) return null;
  return (
    <EffectComposer multisampling={0} enableNormalPass={ao}>
      <N8AO enabled={ao} aoRadius={1.5} intensity={1.15} quality="performance" halfRes />
      <Bloom luminanceThreshold={0.9} mipmapBlur intensity={0.28} radius={0.42} />
      <HueSaturation saturation={0.07} />
      <BrightnessContrast brightness={0.015} contrast={0.09} />
      <Vignette eskil={false} offset={0.26} darkness={0.36} />
    </EffectComposer>
  );
}
