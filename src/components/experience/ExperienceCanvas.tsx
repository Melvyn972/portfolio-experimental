"use client";

import { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Suspense } from "react";
import { World } from "@/components/world/World";
import { PlayerSystem } from "@/components/player/PlayerSystem";
import { PhysicsWorld } from "@/components/physics/PhysicsWorld";
import { WorldColliders } from "@/components/physics/WorldColliders";
import { GameCamera } from "@/components/camera/GameCamera";
import { PostFX } from "@/components/experience/PostFX";
import { ProgressiveLoader } from "@/components/experience/ProgressiveLoader";
import { useGameStore } from "@/hooks/useGameStore";
import { resolveQuality } from "@/lib/quality";
import { getGameState, setGameState } from "@/lib/gameStore";
import { useKeyboard } from "@/hooks/useKeyboard";

function Scene({ isMobile }: { isMobile: boolean }) {
  const { quality: preset, phase } = useGameStore();
  const quality = useMemo(() => resolveQuality(preset, isMobile), [preset, isMobile]);

  return (
    <PhysicsWorld>
      <GameCamera />
      <World quality={quality} />
      <WorldColliders />
      {(phase === "playing" || phase === "intro") && <PlayerSystem />}
      <PostFX enabled={quality.postfx} ao={quality.shadows && !isMobile} />
      <ProgressiveLoader />
    </PhysicsWorld>
  );
}

export function ExperienceCanvas() {
  useKeyboard();
  const { quality: preset, openChapter, rescueOpen } = useGameStore();
  const [isMobile, setIsMobile] = useState(false);
  const quality = useMemo(() => resolveQuality(preset, isMobile), [preset, isMobile]);

  useEffect(() => {
    if ((openChapter || rescueOpen) && document.pointerLockElement) {
      document.exitPointerLock();
    }
  }, [openChapter, rescueOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px), (pointer: coarse)");
    let locked = false;
    const apply = () => {
      // iOS Safari chrome hide/show must not flip desktop/mobile mid-session
      // (that remounts sticks and feels like an invert).
      if (locked) return;
      if (mq.matches) {
        locked = true;
        setIsMobile(true);
        setGameState({ isMobile: true });
      }
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
    <Canvas
      shadows={quality.shadows}
      dpr={quality.dpr}
      gl={{
        antialias: quality.aa,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      camera={{ fov: 42, near: 0.1, far: 280, position: [32, 24, 58] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.setClearColor("#8aafb0");
      }}
      onPointerDown={(e) => {
        const t = e.target as HTMLElement | undefined;
        if (t?.requestPointerLock && getGameState().phase === "playing" && !getGameState().isMobile) {
          t.requestPointerLock();
        }
      }}
    >
      <Suspense fallback={null}>
        <Scene isMobile={isMobile} />
      </Suspense>
    </Canvas>
  );
}
