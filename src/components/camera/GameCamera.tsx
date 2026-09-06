"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getGameState } from "@/lib/gameStore";
import { START_POSE } from "@/lib/road";
import { getBelvedereInteractPosition } from "@/components/world/Belvedere";

/**
 * Living oblique / isometric camera:
 * - Intro: wide establishing → descend to car
 * - Driving: elevated rear-quarter follow, speed zoom/tilt
 * - Walking: closer oblique
 * - Identity: dolly toward carnet
 */
export function GameCamera() {
  const { camera } = useThree();
  const introT = useRef(0);
  const current = useRef(new THREE.Vector3(28, 22, 55));
  const look = useRef(new THREE.Vector3(0, 1, 10));
  const started = useRef(false);

  useFrame((_, dt) => {
    const state = getGameState();

    if (state.phase === "boot") {
      camera.position.set(32, 24, 58);
      camera.lookAt(-8, 0, -20);
      return;
    }

    if (state.phase === "intro") {
      introT.current = Math.min(1, introT.current + dt * 0.18);
      const t = easeInOut(introT.current);
      const start = new THREE.Vector3(36, 26, 62);
      const mid = new THREE.Vector3(14, 14, 28);
      const end = carCameraPos(START_POSE.position, Math.atan2(START_POSE.tangent.x, START_POSE.tangent.z), 0);
      const a = start.clone().lerp(mid, Math.min(1, t * 1.4));
      const b = mid.clone().lerp(end, Math.max(0, (t - 0.35) / 0.65));
      const pos = t < 0.45 ? a : b;
      const lookA = new THREE.Vector3(-12, 0.5, -30);
      const lookB = START_POSE.position.clone().add(new THREE.Vector3(0, 0.6, 0));
      look.current.lerpVectors(lookA, lookB, t);
      current.current.lerp(pos, 0.08);
      camera.position.copy(current.current);
      camera.lookAt(look.current);

      if (introT.current >= 1 && !started.current) {
        started.current = true;
        // Hand off to playing — parent IntroController sets phase
      }
      return;
    }

    // Playing
    if (state.identityOpen) {
      const target = getBelvedereInteractPosition();
      const desired = target.clone().add(new THREE.Vector3(2.8, 2.2, 3.4));
      current.current.lerp(desired, 1 - Math.pow(0.001, dt));
      look.current.lerp(target.clone().add(new THREE.Vector3(0, 0.4, 0)), 1 - Math.pow(0.001, dt));
      camera.position.copy(current.current);
      camera.lookAt(look.current);
      return;
    }

    const subject =
      state.mode === "walking"
        ? new THREE.Vector3(state.playerPos.x, state.playerPos.y, state.playerPos.z)
        : new THREE.Vector3(state.carPos.x, state.carPos.y, state.carPos.z);
    const yaw = state.carYaw;
    const speed = state.speed;

    const desired =
      state.mode === "walking"
        ? walkCameraPos(subject, yaw)
        : carCameraPos(subject, yaw, speed);

    const lookTarget =
      state.mode === "walking"
        ? subject.clone().add(new THREE.Vector3(0, 1.1, 0))
        : subject.clone().add(new THREE.Vector3(Math.sin(yaw) * 4, 0.8, Math.cos(yaw) * 4));

    const follow = state.mode === "walking" ? 6 : 4.5;
    current.current.lerp(desired, 1 - Math.exp(-follow * dt));
    look.current.lerp(lookTarget, 1 - Math.exp(-8 * dt));
    camera.position.copy(current.current);
    camera.lookAt(look.current);

    // Mild FOV breathe with speed
    const persp = camera as THREE.PerspectiveCamera;
    const targetFov = state.mode === "walking" ? 42 : THREE.MathUtils.lerp(38, 46, Math.min(1, speed / 22));
    persp.fov = THREE.MathUtils.lerp(persp.fov, targetFov, 0.05);
    persp.updateProjectionMatrix();
  });

  return null;
}

function carCameraPos(subject: THREE.Vector3, yaw: number, speed: number) {
  const back = 11 + Math.min(4, speed * 0.12);
  const height = 9.5 + Math.min(2.2, speed * 0.06);
  const side = 7.5;
  return new THREE.Vector3(
    subject.x - Math.sin(yaw) * back + Math.cos(yaw) * side,
    subject.y + height,
    subject.z - Math.cos(yaw) * back - Math.sin(yaw) * side,
  );
}

function walkCameraPos(subject: THREE.Vector3, yaw: number) {
  const back = 6.5;
  const height = 5.8;
  const side = 4.2;
  return new THREE.Vector3(
    subject.x - Math.sin(yaw) * back + Math.cos(yaw) * side,
    subject.y + height,
    subject.z - Math.cos(yaw) * back - Math.sin(yaw) * side,
  );
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function getIntroProgress() {
  return 0;
}
