"use client";

import { EffectComposer, Vignette, BrightnessContrast, Bloom, HueSaturation, N8AO } from "@react-three/postprocessing";

export function PostFX({ enabled, ao = false }: { enabled: boolean; ao?: boolean }) {
  if (!enabled) return null;
  return (
    <EffectComposer multisampling={0} enableNormalPass={ao}>
      <N8AO enabled={ao} aoRadius={1.6} intensity={0.95} quality="performance" halfRes />
      <Bloom luminanceThreshold={0.86} mipmapBlur intensity={0.22} radius={0.42} />
      <HueSaturation saturation={0.08} />
      <BrightnessContrast brightness={0.016} contrast={0.05} />
      <Vignette eskil={false} offset={0.24} darkness={0.3} />
    </EffectComposer>
  );
}
