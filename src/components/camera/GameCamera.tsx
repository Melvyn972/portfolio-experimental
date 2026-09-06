"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getGameState } from "@/lib/gameStore";
import { START_POSE } from "@/lib/road";
import { getBelvedereInteractPosition } from "@/components/world/Belvedere";

const _subject = new THREE.Vector3();
const _desired = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _start = new THREE.Vector3();
const _mid = new THREE.Vector3();
const _end = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _lookA = new THREE.Vector3();
const _lookB = new THREE.Vector3();

/**
 * Living oblique / isometric camera:
 * - Intro: wide establishing → descend to car
 * - Driving: elevated rear-quarter follow
 * - Walking: closer oblique using walk facing
 * - Identity: dolly toward carnet
 */
export function GameCamera() {
  const { camera } = useThree();
  const introT = useRef(0);
  const current = useRef(new THREE.Vector3(28, 22, 55));
  const look = useRef(new THREE.Vector3(0, 1, 10));
  const started = useRef(false);
  const minY = useRef(1.2);

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
      _start.set(36, 26, 62);
      _mid.set(14, 14, 28);
      carCameraPos(_end, START_POSE.position, Math.atan2(START_POSE.tangent.x, START_POSE.tangent.z), 0);
      _a.copy(_start).lerp(_mid, Math.min(1, t * 1.4));
      _b.copy(_mid).lerp(_end, Math.max(0, (t - 0.35) / 0.65));
      const pos = t < 0.45 ? _a : _b;
      _lookA.set(-12, 0.5, -30);
      _lookB.copy(START_POSE.position).add(new THREE.Vector3(0, 0.6, 0));
      look.current.lerpVectors(_lookA, _lookB, t);
      current.current.lerp(pos, 0.08);
      camera.position.copy(current.current);
      camera.lookAt(look.current);
      if (introT.current >= 1 && !started.current) started.current = true;
      return;
    }

    if (state.identityOpen) {
      const target = getBelvedereInteractPosition();
      _desired.copy(target).add(_a.set(2.8, 2.2, 3.4));
      current.current.lerp(_desired, 1 - Math.pow(0.001, dt));
      look.current.lerp(_b.copy(target).add(_lookA.set(0, 0.4, 0)), 1 - Math.pow(0.001, dt));
      camera.position.copy(current.current);
      camera.lookAt(look.current);
      return;
    }

    if (state.mode === "walking") {
      _subject.set(state.playerPos.x, state.playerPos.y, state.playerPos.z);
    } else {
      _subject.set(state.carPos.x, state.carPos.y, state.carPos.z);
    }

    const yaw = state.mode === "walking" ? state.walkYaw : state.carYaw;
    const speed = state.speed;

    if (state.mode === "walking") walkCameraPos(_desired, _subject, yaw);
    else carCameraPos(_desired, _subject, yaw, speed);

    // Keep camera above terrain / sea
    _desired.y = Math.max(_desired.y, minY.current + _subject.y);

    if (state.mode === "walking") {
      _lookTarget.copy(_subject).add(_a.set(0, 1.1, 0));
    } else {
      _lookTarget.set(
        _subject.x + Math.sin(yaw) * 4,
        _subject.y + 0.8,
        _subject.z + Math.cos(yaw) * 4,
      );
    }

    const follow = state.mode === "walking" ? 6 : 4.5;
    current.current.lerp(_desired, 1 - Math.exp(-follow * dt));
    look.current.lerp(_lookTarget, 1 - Math.exp(-8 * dt));
    camera.position.copy(current.current);
    camera.lookAt(look.current);

    const persp = camera as THREE.PerspectiveCamera;
    const targetFov = state.mode === "walking" ? 42 : THREE.MathUtils.lerp(38, 46, Math.min(1, speed / 22));
    persp.fov = THREE.MathUtils.lerp(persp.fov, targetFov, 0.05);
    persp.updateProjectionMatrix();
  });

  return null;
}

function carCameraPos(out: THREE.Vector3, subject: THREE.Vector3, yaw: number, speed: number) {
  const back = 9.5 + Math.min(3.5, speed * 0.1);
  const height = 6.8 + Math.min(1.8, speed * 0.05);
  const side = 5.8;
  return out.set(
    subject.x - Math.sin(yaw) * back + Math.cos(yaw) * side,
    subject.y + height,
    subject.z - Math.cos(yaw) * back - Math.sin(yaw) * side,
  );
}

function walkCameraPos(out: THREE.Vector3, subject: THREE.Vector3, yaw: number) {
  const back = 6.5;
  const height = 5.8;
  const side = 4.2;
  return out.set(
    subject.x - Math.sin(yaw) * back + Math.cos(yaw) * side,
    subject.y + height,
    subject.z - Math.cos(yaw) * back - Math.sin(yaw) * side,
  );
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
