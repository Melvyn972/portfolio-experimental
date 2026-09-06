"use client";

import { EffectComposer, Vignette, BrightnessContrast, Bloom, HueSaturation, N8AO } from "@react-three/postprocessing";

export function PostFX({ enabled, ao = false }: { enabled: boolean; ao?: boolean }) {
  if (!enabled) return null;
  return (
    <EffectComposer multisampling={0} enableNormalPass={ao}>
      <N8AO enabled={ao} aoRadius={1.85} intensity={1.45} quality="performance" halfRes />
      <Bloom luminanceThreshold={0.82} mipmapBlur intensity={0.38} radius={0.48} />
      <HueSaturation saturation={0.1} />
      <BrightnessContrast brightness={0.01} contrast={0.12} />
      <Vignette eskil={false} offset={0.22} darkness={0.42} />
    </EffectComposer>
  );
}
