"use client";

import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { WorldLite } from "@/components/world/WorldLite";
import { PlayerSystem } from "@/components/player/PlayerSystem";
import { PhysicsWorld } from "@/components/physics/PhysicsWorld";
import { WorldColliders } from "@/components/physics/WorldColliders";
import { GameCamera } from "@/components/camera/GameCamera";
import { ProgressiveLoader } from "@/components/experience/ProgressiveLoader";
import { useGameStore } from "@/hooks/useGameStore";
import { resolveQuality } from "@/lib/quality";
import { detectSoftGL, setSoftGL } from "@/lib/softgl";
import { getGameState, setGameState } from "@/lib/gameStore";
import { useKeyboard } from "@/hooks/useKeyboard";

const PostFX = lazy(() => import("@/components/experience/PostFX").then((m) => ({ default: m.PostFX })));
const WorldHeavy = lazy(() => import("@/components/world/World").then((m) => ({ default: m.World })));

function Scene({ isMobile }: { isMobile: boolean }) {
  const preset = useGameStore((s) => s.quality);
  const phase = useGameStore((s) => s.phase);
  const quality = useMemo(() => resolveQuality(preset, isMobile), [preset, isMobile]);

  return (
    <PhysicsWorld interpolate={!quality.lite} lite={quality.lite}>
      {/* Camera / physics / player stay mounted while World GLBs suspend.
          A shared Suspense remounted chase-cam + PlayerSystem on origin
          and dropped the first teleport* after skipToPlay. */}
      <GameCamera />
      {!quality.lite && <WorldColliders />}
      {(phase === "playing" || phase === "intro" || phase === "title") && <PlayerSystem />}
      <Suspense fallback={null}>
        {quality.lite ? <WorldLite /> : <WorldHeavy quality={quality} />}
        {quality.postfx ? <PostFX enabled ao={quality.shadows && !isMobile} /> : null}
        {!quality.lite && <ProgressiveLoader />}
      </Suspense>
    </PhysicsWorld>
  );
}

export function ExperienceCanvas() {
  useKeyboard();
  const preset = useGameStore((s) => s.quality);
  const openChapter = useGameStore((s) => s.openChapter);
  const rescueOpen = useGameStore((s) => s.rescueOpen);
  const [isMobile, setIsMobile] = useState(false);
  const [softGL] = useState(() => {
    const soft = detectSoftGL();
    setSoftGL(soft);
    return soft;
  });
  const quality = useMemo(() => {
    void softGL;
    return resolveQuality(preset, isMobile);
  }, [preset, isMobile, softGL]);

  useEffect(() => {
    if (softGL && getGameState().quality !== "eco") {
      setGameState({ quality: "eco" });
    }
  }, [softGL]);

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
      if (getGameState().phase === "boot") setGameState({ phase: "title" });
    }, 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <Canvas
      shadows={quality.shadows}
      dpr={quality.dpr}
      gl={{
        antialias: quality.aa,
        powerPreference: quality.lite ? "low-power" : "default",
        toneMapping: quality.lite ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping,
        toneMappingExposure: quality.lite ? 1 : 0.96,
        failIfMajorPerformanceCaveat: false,
        stencil: false,
        depth: true,
        alpha: false,
        precision: quality.lite ? "lowp" : "highp",
      }}
      camera={{ fov: 42, near: 0.22, far: quality.lite ? 180 : 360, position: [32, 24, 58] }}
      onCreated={({ gl }) => {
        gl.toneMapping = quality.lite ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = quality.lite ? 1 : 0.96;
        gl.setClearColor("#7e9aa0");
        gl.shadowMap.enabled = quality.shadows;
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => {
            e.preventDefault();
          },
          false,
        );
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
