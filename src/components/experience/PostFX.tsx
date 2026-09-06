"use client";

import { EffectComposer, Vignette, BrightnessContrast } from "@react-three/postprocessing";

export function PostFX({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return (
    <EffectComposer multisampling={0}>
      <BrightnessContrast brightness={0.02} contrast={0.08} />
      <Vignette eskil={false} offset={0.22} darkness={0.42} />
    </EffectComposer>
  );
}
