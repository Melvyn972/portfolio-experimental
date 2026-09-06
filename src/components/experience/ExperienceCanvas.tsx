"use client";

import { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { World } from "@/components/world/World";
import { VehicleController } from "@/components/vehicle/VehicleController";
import { GameCamera } from "@/components/camera/GameCamera";
import { PostFX } from "@/components/experience/PostFX";
import { ProgressiveLoader } from "@/components/experience/ProgressiveLoader";
import { useGameStore } from "@/hooks/useGameStore";
import { resolveQuality } from "@/lib/quality";
import { getGameState, setGameState } from "@/lib/gameStore";
import { useKeyboard } from "@/hooks/useKeyboard";

function Scene({ isMobile }: { isMobile: boolean }) {
  const { quality: preset, phase, loadStage } = useGameStore();
  const quality = useMemo(() => resolveQuality(preset, isMobile), [preset, isMobile]);

  return (
    <>
      <ProgressiveLoader />
      <GameCamera />
      {loadStage >= 1 && <World quality={quality} />}
      {loadStage >= 2 && (phase === "playing" || phase === "intro") && <VehicleController />}
      {loadStage >= 3 && <PostFX enabled={quality.postfx} />}
    </>
  );
}

export function ExperienceCanvas() {
  useKeyboard();
  const { quality: preset } = useGameStore();
  const [isMobile, setIsMobile] = useState(false);
  const quality = useMemo(() => resolveQuality(preset, isMobile), [preset, isMobile]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px), (pointer: coarse)");
    const apply = () => {
      const mobile = mq.matches;
      setIsMobile(mobile);
      setGameState({ isMobile: mobile });
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (getGameState().phase === "boot") setGameState({ phase: "intro" });
    }, 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="absolute inset-0" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <Canvas
        className="!absolute inset-0 h-full w-full touch-none"
        style={{ width: "100%", height: "100%", touchAction: "none" }}
        shadows={quality.shadows}
        dpr={quality.dpr}
        gl={{
          antialias: quality.aa,
          powerPreference: "high-performance",
          toneMappingExposure: 1.08,
        }}
        camera={{ fov: 42, near: 0.15, far: 320, position: [32, 24, 58] }}
        onCreated={({ gl }) => {
          gl.setClearColor("#c8dde8");
          gl.domElement.style.touchAction = "none";
        }}
      >
        <Suspense fallback={null}>
          <Scene isMobile={isMobile} />
        </Suspense>
      </Canvas>
    </div>
  );
}
