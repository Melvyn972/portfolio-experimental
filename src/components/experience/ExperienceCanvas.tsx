"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  AdaptiveDpr,
  Environment,
  Preload,
  SoftShadows,
} from "@react-three/drei";
import * as THREE from "three";
import { CAMERA_PATH, type SectionId } from "@/data/content";
import { HDRI_PATH } from "@/data/assets";
import { useExperience } from "@/hooks/useExperience";
import { AtelierWorld } from "./AtelierWorld";
import { DeferredAssetLoader, PostFX } from "./PostFX";

function CameraRig() {
  const { progress, setActiveSection, reducedMotion } = useExperience();
  const { camera } = useThree();
  const pos = useRef(new THREE.Vector3(...CAMERA_PATH[0].position));
  const look = useRef(new THREE.Vector3(...CAMERA_PATH[0].lookAt));
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());
  const a = useRef(new THREE.Vector3());
  const b = useRef(new THREE.Vector3());

  useFrame((_, dt) => {
    const max = CAMERA_PATH.length - 1;
    const scaled = THREE.MathUtils.clamp(progress, 0, 1) * max;
    const i = Math.floor(scaled);
    const f = scaled - i;
    const curr = CAMERA_PATH[Math.min(i, max)];
    const next = CAMERA_PATH[Math.min(i + 1, max)];

    a.current.set(...curr.position);
    b.current.set(...next.position);
    targetPos.current.lerpVectors(a.current, b.current, f);

    a.current.set(...curr.lookAt);
    b.current.set(...next.lookAt);
    targetLook.current.lerpVectors(a.current, b.current, f);

    const smooth = reducedMotion ? 1 : 1 - Math.exp(-dt * 3.4);
    pos.current.lerp(targetPos.current, smooth);
    look.current.lerp(targetLook.current, smooth);
    camera.position.copy(pos.current);
    camera.lookAt(look.current);

    const nearest = Math.round(scaled);
    const id = CAMERA_PATH[nearest]?.id as SectionId | undefined;
    if (id) setActiveSection(id);
  });

  return null;
}

function SceneBoot() {
  const { setSceneReady } = useExperience();
  useEffect(() => {
    setSceneReady(true);
  }, [setSceneReady]);
  return null;
}

export function ExperienceCanvas() {
  const { quality, isMobile, reducedMotion } = useExperience();

  const low = useMemo(() => {
    if (quality === "low") return true;
    if (quality === "high") return false;
    return isMobile;
  }, [quality, isMobile]);

  const dpr: [number, number] = low ? [1, 1.15] : [1, 1.75];

  if (reducedMotion) return null;

  return (
    <div className="fixed inset-0 z-0 bg-[#07080c]" aria-hidden="true">
      <Canvas
        dpr={dpr}
        shadows={low ? false : "soft"}
        gl={{
          antialias: !low,
          powerPreference: "high-performance",
          alpha: false,
          stencil: false,
          depth: true,
        }}
        camera={{ fov: 42, near: 0.1, far: 90, position: CAMERA_PATH[0].position }}
        onCreated={({ gl }) => {
          gl.setClearColor("#07080c");
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = low ? 1.05 : 1.15;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <CameraRig />
        <SceneBoot />
        <DeferredAssetLoader />
        <AtelierWorld />
        <Environment
          files={HDRI_PATH}
          background={false}
          environmentIntensity={low ? 0.35 : 0.55}
        />
        {!low && <SoftShadows size={18} samples={8} focus={0.85} />}
        <PostFX />
        <AdaptiveDpr pixelated />
        <Preload all />
      </Canvas>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "linear-gradient(180deg, rgba(7,8,12,0.4) 0%, transparent 18%, transparent 72%, rgba(7,8,12,0.75) 100%)",
        }}
      />
    </div>
  );
}
