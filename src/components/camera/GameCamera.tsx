"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useRapier } from "@react-three/rapier";
import * as THREE from "three";
import { getGameState } from "@/lib/gameStore";
import { START_POSE } from "@/lib/road";
import { sampleGroundHeight } from "@/lib/ground";
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
const _dir = new THREE.Vector3();
const _from = { x: 0, y: 0, z: 0 };
const _rayDir = { x: 0, y: 0, z: 0 };

const CAM_DIST_DRIVE = 8.6;
const CAM_DIST_WALK = 5.8;
const CAM_HEIGHT_DRIVE = 3.15;
const CAM_HEIGHT_WALK = 2.55;

/**
 * Modern third-person camera:
 * - different foot vs car framing
 * - Rapier ray obstacle avoidance
 * - mobile-friendly closer distances
 */
export function GameCamera() {
  const { camera } = useThree();
  const { world, rapier } = useRapier();
  const introT = useRef(0);
  const current = useRef(new THREE.Vector3(28, 22, 55));
  const look = useRef(new THREE.Vector3(0, 1, 10));
  const dist = useRef(CAM_DIST_DRIVE);
  const started = useRef(false);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const state = getGameState();
    const mobile = state.isMobile;
    const distDrive = mobile ? CAM_DIST_DRIVE * 0.88 : CAM_DIST_DRIVE;
    const distWalk = mobile ? CAM_DIST_WALK * 0.85 : CAM_DIST_WALK;
    const hDrive = mobile ? CAM_HEIGHT_DRIVE * 0.92 : CAM_HEIGHT_DRIVE;
    const hWalk = mobile ? CAM_HEIGHT_WALK * 0.9 : CAM_HEIGHT_WALK;

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
      offsetPos(_end, START_POSE.position, Math.atan2(START_POSE.tangent.x, START_POSE.tangent.z), 0.12, distDrive, hDrive, 0.42);
      _a.copy(_start).lerp(_mid, Math.min(1, t * 1.4));
      _b.copy(_mid).lerp(_end, Math.max(0, (t - 0.35) / 0.65));
      const pos = t < 0.45 ? _a : _b;
      _lookA.set(-12, 0.5, -30);
      _lookB.copy(START_POSE.position).add(_a.set(0, 0.8, 0));
      look.current.lerpVectors(_lookA, _lookB, t);
      current.current.lerp(pos, 0.08);
      camera.position.copy(current.current);
      camera.lookAt(look.current);
      if (introT.current >= 1 && !started.current) started.current = true;
      return;
    }

    if (state.openChapter === "identity") {
      const target = getBelvedereInteractPosition();
      _desired.copy(target).add(_a.set(5.8, 3.6, 6.4));
      const gY = sampleGroundHeight(_desired.x, _desired.z);
      _desired.y = Math.max(_desired.y, gY + 2.2);
      current.current.lerp(_desired, 1 - Math.exp(-3.5 * dt));
      look.current.lerp(_b.copy(target).add(_lookA.set(0, 0.5, 0)), 1 - Math.exp(-4.5 * dt));
      camera.position.copy(current.current);
      camera.lookAt(look.current);
      return;
    }

    if (state.openChapter) {
      _subject.set(state.playerPos.x, state.playerPos.y, state.playerPos.z);
      offsetPos(_desired, _subject, state.lookYaw, 0.18, distWalk * 1.05, hWalk + 1.0, 0.4);
      const gY = sampleGroundHeight(_desired.x, _desired.z);
      _desired.y = Math.max(_desired.y, gY + 2.0);
      current.current.lerp(_desired, 1 - Math.exp(-3 * dt));
      look.current.lerp(_subject.clone().add(_a.set(0, 1.2, 0)), 1 - Math.exp(-4 * dt));
      camera.position.copy(current.current);
      camera.lookAt(look.current);
      return;
    }

    const walking = state.mode === "walking";
    if (walking) _subject.set(state.playerPos.x, state.playerPos.y + 1.35, state.playerPos.z);
    else _subject.set(state.carPos.x, state.carPos.y + 0.9, state.carPos.z);

    const yaw = walking ? state.lookYaw : state.carYaw;
    const pitch = walking ? state.lookPitch : 0.08;
    const targetDist = walking ? distWalk : distDrive + Math.min(2.2, state.speed * 0.07);
    const height = walking ? hWalk : hDrive + Math.min(1.0, state.speed * 0.035);
    const side = walking ? 0.28 : 0.4;

    dist.current = THREE.MathUtils.lerp(dist.current, targetDist, 1 - Math.exp(-3.2 * dt));
    offsetPos(_desired, _subject, yaw, pitch, dist.current, height, side);

    // Rapier ray obstacle avoidance — pull camera in + lift when blocked
    _dir.copy(_desired).sub(_subject);
    const fullLen = _dir.length();
    if (fullLen > 0.15) {
      _dir.normalize();
      _from.x = _subject.x;
      _from.y = _subject.y + 0.35;
      _from.z = _subject.z;
      _rayDir.x = _dir.x;
      _rayDir.y = _dir.y;
      _rayDir.z = _dir.z;
      const ray = new rapier.Ray(_from, _rayDir);
      const hit = world.castRay(ray, fullLen, true, undefined, undefined, undefined, undefined, (collider) => {
        if (collider.isSensor()) return false;
        // Ignore the kinematic car / capsule — hitting them pulled the camera
        // inside the vehicle (QA: "voiture incomplète / vue dans la coque").
        const body = collider.parent();
        if (body?.isKinematic()) return false;
        return true;
      });
      if (hit && hit.timeOfImpact < fullLen - 0.25) {
        const pull = Math.max(walking ? 2.6 : 2.8, hit.timeOfImpact - 0.55);
        _desired.copy(_subject).addScaledVector(_dir, pull);
        // Prefer lifting over burying into walls/terrain
        _desired.y += walking ? 1.15 : 0.7;
      }
    }

    const gY = sampleGroundHeight(_desired.x, _desired.z);
    _desired.y = Math.max(_desired.y, gY + (walking ? 2.2 : 2.0));
    // Never sink under sea plane
    _desired.y = Math.max(_desired.y, 1.4);

    if (walking) {
      _lookTarget.copy(_subject).add(_a.set(0, 0.15 + pitch * 0.4, 0));
    } else {
      _lookTarget.set(
        _subject.x + Math.sin(yaw) * 6,
        _subject.y + 0.2,
        _subject.z + Math.cos(yaw) * 6,
      );
    }

    const follow = walking ? 7.5 : 5.2;
    current.current.lerp(_desired, 1 - Math.exp(-follow * dt));
    const cg = sampleGroundHeight(current.current.x, current.current.z);
    current.current.y = Math.max(current.current.y, cg + (walking ? 2.0 : 1.9), 1.4);
    look.current.lerp(_lookTarget, 1 - Math.exp(-8 * dt));
    camera.position.copy(current.current);
    camera.lookAt(look.current);

    const persp = camera as THREE.PerspectiveCamera;
    const targetFov = walking ? (mobile ? 48 : 46) : THREE.MathUtils.lerp(40, 50, Math.min(1, state.speed / 20));
    persp.fov = THREE.MathUtils.lerp(persp.fov, targetFov, 0.07);
    persp.updateProjectionMatrix();
  });

  return null;
}

function offsetPos(
  out: THREE.Vector3,
  subject: THREE.Vector3,
  yaw: number,
  pitch: number,
  dist: number,
  height: number,
  sideFrac: number,
) {
  const back = Math.cos(pitch) * dist;
  const lift = height + Math.sin(pitch) * dist * 0.4;
  const side = dist * sideFrac;
  return out.set(
    subject.x - Math.sin(yaw) * back + Math.cos(yaw) * side,
    subject.y + lift,
    subject.z - Math.cos(yaw) * back - Math.sin(yaw) * side,
  );
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
