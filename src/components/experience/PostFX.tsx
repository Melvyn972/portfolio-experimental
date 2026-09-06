"use client";

import { EffectComposer, Vignette, BrightnessContrast, Bloom, HueSaturation, N8AO } from "@react-three/postprocessing";

export function PostFX({ enabled, ao = false }: { enabled: boolean; ao?: boolean }) {
  if (!enabled) return null;
  return (
    <EffectComposer multisampling={0} enableNormalPass={ao}>
      <N8AO enabled={ao} aoRadius={1.6} intensity={0.95} quality="performance" halfRes />
      <Bloom luminanceThreshold={0.9} mipmapBlur intensity={0.16} radius={0.38} />
      <HueSaturation saturation={0.05} />
      <BrightnessContrast brightness={0.012} contrast={0.035} />
      <Vignette eskil={false} offset={0.26} darkness={0.34} />
    </EffectComposer>
  );
}
