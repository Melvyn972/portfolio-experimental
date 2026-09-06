"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { World } from "@/components/world/World";
import { VehicleController } from "@/components/vehicle/VehicleController";
import { GameCamera } from "@/components/camera/GameCamera";
import { PostFX } from "@/components/experience/PostFX";
import { useGameStore } from "@/hooks/useGameStore";
import { resolveQuality } from "@/lib/quality";
import { setGameState } from "@/lib/gameStore";
import { useKeyboard } from "@/hooks/useKeyboard";

function Scene({ isMobile }: { isMobile: boolean }) {
  const { quality: preset, phase } = useGameStore();
  const quality = useMemo(() => resolveQuality(preset, isMobile), [preset, isMobile]);

  return (
    <>
      <GameCamera />
      <World quality={quality} />
      {(phase === "playing" || phase === "intro") && <VehicleController />}
      <PostFX enabled={quality.postfx} />
    </>
  );
}

export function ExperienceCanvas() {
  useKeyboard();
  const { quality: preset } = useGameStore();
  const [isMobile, setIsMobile] = useState(false);
  const quality = useMemo(() => resolveQuality(preset, isMobile), [preset, isMobile]);
  const started = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px), (pointer: coarse)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const t = window.setTimeout(() => setGameState({ phase: "intro" }), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <Canvas
      shadows={quality.shadows}
      dpr={quality.dpr}
      gl={{
        antialias: quality.aa,
        powerPreference: "high-performance",
        toneMappingExposure: 1.05,
      }}
      camera={{ fov: 40, near: 0.1, far: 280, position: [32, 24, 58] }}
      onCreated={({ gl }) => {
        gl.setClearColor("#c8dde8");
      }}
    >
      <Suspense fallback={null}>
        <Scene isMobile={isMobile} />
      </Suspense>
    </Canvas>
  );
}
