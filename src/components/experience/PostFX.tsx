"use client";

import { useEffect, useMemo } from "react";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  N8AO,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useExperience } from "@/hooks/useExperience";

export function PostFX() {
  const { quality, isMobile, reducedMotion } = useExperience();

  const low = useMemo(() => {
    if (quality === "low") return true;
    if (quality === "high") return false;
    return isMobile;
  }, [quality, isMobile]);

  if (reducedMotion || low) {
    // Light bloom only on balanced/low — skip heavy AO
    if (low && !reducedMotion) {
      return (
        <EffectComposer enableNormalPass={false} multisampling={0}>
          <Bloom intensity={0.35} luminanceThreshold={0.85} mipmapBlur />
          <Vignette offset={0.25} darkness={0.65} />
        </EffectComposer>
      );
    }
    return null;
  }

  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <N8AO
        aoRadius={0.6}
        intensity={1.35}
        distanceFalloff={0.55}
        quality="medium"
        halfRes
      />
      <Bloom
        intensity={0.55}
        luminanceThreshold={0.72}
        luminanceSmoothing={0.2}
        mipmapBlur
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        // subtle cinematic fringe
        offset={[0.0004, 0.0004]}
      />
      <Vignette offset={0.2} darkness={0.72} />
    </EffectComposer>
  );
}

/** Prefetch secondary zone models after first paint. */
export function DeferredAssetLoader() {
  const { entered, setSceneReady } = useExperience();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { CORE_MODELS, ZONE_MODELS } = await import("@/data/assets");
      const { preloadModels } = await import("./Model");
      preloadModels(CORE_MODELS);
      if (!cancelled) setSceneReady(true);

      if (!entered) return;
      // Stagger zone preloads
      const zones = Object.values(ZONE_MODELS).flat();
      const unique = [...new Set(zones)];
      const chunk = 6;
      for (let i = 0; i < unique.length; i += chunk) {
        if (cancelled) return;
        preloadModels(unique.slice(i, i + chunk));
        await new Promise((r) => setTimeout(r, 120));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [entered, setSceneReady]);

  return null;
}
