"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getGameState } from "@/lib/gameStore";
import { START_POSE } from "@/lib/road";
import { sampleGroundHeight } from "@/lib/ground";
import { getBelvedereInteractPosition } from "@/components/world/Belvedere";
import { getColliders } from "@/lib/colliders";

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
const _ray = new THREE.Raycaster();

const CAM_DIST_DRIVE = 12.5;
const CAM_DIST_WALK = 8.0;
const CAM_HEIGHT_DRIVE = 5.8;
const CAM_HEIGHT_WALK = 4.6;

/**
 * Constant-distance follow camera with collision pull-in,
 * ground clamp, and heavy damping (no shake).
 */
export function GameCamera() {
  const { camera, scene } = useThree();
  const introT = useRef(0);
  const current = useRef(new THREE.Vector3(28, 22, 55));
  const look = useRef(new THREE.Vector3(0, 1, 10));
  const dist = useRef(CAM_DIST_DRIVE);
  const started = useRef(false);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
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
      offsetPos(_end, START_POSE.position, Math.atan2(START_POSE.tangent.x, START_POSE.tangent.z), 0.12, CAM_DIST_DRIVE, CAM_HEIGHT_DRIVE, 0.45);
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
      // Stay outside the canopy — elevated three-quarter view of carnet
      _desired.copy(target).add(_a.set(6.2, 4.2, 7.0));
      const gY = sampleGroundHeight(_desired.x, _desired.z);
      _desired.y = Math.max(_desired.y, gY + 2.5);
      current.current.lerp(_desired, 1 - Math.exp(-3.5 * dt));
      look.current.lerp(_b.copy(target).add(_lookA.set(0, 0.5, 0)), 1 - Math.exp(-4.5 * dt));
      camera.position.copy(current.current);
      camera.lookAt(look.current);
      return;
    }

    if (state.openChapter) {
      // Soft hold — elevated view of player, never into architecture
      _subject.set(state.playerPos.x, state.playerPos.y, state.playerPos.z);
      offsetPos(_desired, _subject, state.walkYaw, 0.18, CAM_DIST_WALK * 1.05, CAM_HEIGHT_WALK + 1.2, 0.45);
      const gY = sampleGroundHeight(_desired.x, _desired.z);
      _desired.y = Math.max(_desired.y, gY + 2.2);
      current.current.lerp(_desired, 1 - Math.exp(-3 * dt));
      look.current.lerp(_subject.clone().add(_a.set(0, 1.2, 0)), 1 - Math.exp(-4 * dt));
      camera.position.copy(current.current);
      camera.lookAt(look.current);
      return;
    }

    const walking = state.mode === "walking";
    if (walking) _subject.set(state.playerPos.x, state.playerPos.y, state.playerPos.z);
    else _subject.set(state.carPos.x, state.carPos.y, state.carPos.z);

    const yaw = walking ? state.walkYaw : state.carYaw;
    const pitch = walking ? state.lookPitch : 0.1;
    const targetDist = walking ? CAM_DIST_WALK : CAM_DIST_DRIVE + Math.min(2.5, state.speed * 0.08);
    const height = walking ? CAM_HEIGHT_WALK : CAM_HEIGHT_DRIVE + Math.min(1.2, state.speed * 0.04);
    const side = walking ? 0.38 : 0.48;

    dist.current = THREE.MathUtils.lerp(dist.current, targetDist, 1 - Math.exp(-3 * dt));
    offsetPos(_desired, _subject, yaw, pitch, dist.current, height, side);

    // Collision avoid: pull camera toward subject if blocked
    _dir.copy(_desired).sub(_subject);
    const fullLen = _dir.length();
    if (fullLen > 0.1) {
      _dir.normalize();
      const hit = sphereCastPull(_subject, _desired, 0.45);
      if (hit < fullLen) {
        _desired.copy(_subject).addScaledVector(_dir, Math.max(2.2, hit - 0.3));
      }
    }

    // Never under ground
    const gY = sampleGroundHeight(_desired.x, _desired.z);
    _desired.y = Math.max(_desired.y, gY + 2.4);

    if (walking) {
      _lookTarget.copy(_subject).add(_a.set(0, 1.35 + pitch * 0.5, 0));
    } else {
      _lookTarget.set(
        _subject.x + Math.sin(yaw) * 5,
        _subject.y + 1.0,
        _subject.z + Math.cos(yaw) * 5,
      );
    }

    const follow = walking ? 5.5 : 4.2;
    current.current.lerp(_desired, 1 - Math.exp(-follow * dt));
    // Extra ground clamp on smoothed position
    const cg = sampleGroundHeight(current.current.x, current.current.z);
    current.current.y = Math.max(current.current.y, cg + 2.2);
    look.current.lerp(_lookTarget, 1 - Math.exp(-7 * dt));
    camera.position.copy(current.current);
    camera.lookAt(look.current);

    const persp = camera as THREE.PerspectiveCamera;
    const targetFov = walking ? 44 : THREE.MathUtils.lerp(40, 48, Math.min(1, state.speed / 20));
    persp.fov = THREE.MathUtils.lerp(persp.fov, targetFov, 0.06);
    persp.updateProjectionMatrix();

    void scene;
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
  const lift = height + Math.sin(pitch) * dist * 0.35;
  const side = dist * sideFrac;
  return out.set(
    subject.x - Math.sin(yaw) * back + Math.cos(yaw) * side,
    subject.y + lift,
    subject.z - Math.cos(yaw) * back - Math.sin(yaw) * side,
  );
}

/** Approximate camera collision against collider AABBs. */
function sphereCastPull(from: THREE.Vector3, to: THREE.Vector3, radius: number) {
  const colliders = getColliders();
  _dir.copy(to).sub(from);
  const len = _dir.length();
  if (len < 0.01) return len;
  _dir.multiplyScalar(1 / len);

  let minHit = len;
  const steps = 10;
  for (let i = 1; i <= steps; i++) {
    const t = (i / steps) * len;
    const px = from.x + _dir.x * t;
    const py = from.y + _dir.y * t;
    const pz = from.z + _dir.z * t;
    for (const c of colliders) {
      if (
        px + radius > c.min.x &&
        px - radius < c.max.x &&
        py + radius > c.min.y &&
        py - radius < c.max.y &&
        pz + radius > c.min.z &&
        pz - radius < c.max.z
      ) {
        minHit = Math.min(minHit, t);
        break;
      }
    }
  }
  void _ray;
  return minHit;
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
