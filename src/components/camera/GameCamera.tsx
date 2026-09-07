"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useRapier } from "@react-three/rapier";
import * as THREE from "three";
import { getGameState } from "@/lib/gameStore";
import { START_POSE } from "@/lib/road";
import { computeTerrainHeight, sampleGroundHeight } from "@/lib/ground";
import { getBelvedereInteractPosition } from "@/components/world/Belvedere";
import { pushCameraOut } from "@/lib/colliders";

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
const CAM_DIST_WALK = 5.6;
const CAM_HEIGHT_DRIVE = 3.25;
const CAM_HEIGHT_WALK = 3.05;

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
  const lastMode = useRef(getGameState().mode);
  const lastPhase = useRef(getGameState().phase);
  const lastSubject = useRef(new THREE.Vector3(Infinity, 0, 0));
  const snapFrames = useRef(4);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const state = getGameState();
    const mobile = state.isMobile;
    const distDrive = mobile ? CAM_DIST_DRIVE * 1.05 : CAM_DIST_DRIVE;
    const distWalk = mobile ? CAM_DIST_WALK * 0.95 : CAM_DIST_WALK;
    const hDrive = mobile ? CAM_HEIGHT_DRIVE * 1.05 : CAM_HEIGHT_DRIVE;
    const hWalk = mobile ? CAM_HEIGHT_WALK * 0.95 : CAM_HEIGHT_WALK;

    if (state.phase === "boot" || state.phase === "title") {
      camera.position.set(-26, 28, 12);
      camera.lookAt(-10, 0.2, -55);
      current.current.copy(camera.position);
      look.current.set(-10, 0.2, -55);
      introT.current = 0;
      started.current = false;
      return;
    }

    if (state.phase === "intro") {
      introT.current = Math.min(1, introT.current + dt * 0.11);
      const t = easeInOut(introT.current);
      // Aerial over the sea → travel the coast → descend on the roadster.
      _start.set(-26, 28, 12);
      _mid.set(-16, 16, -48);
      offsetPos(_end, START_POSE.position, Math.atan2(START_POSE.tangent.x, START_POSE.tangent.z), 0.12, distDrive, hDrive, 0.42);
      if (t < 0.42) {
        current.current.lerpVectors(_start, _mid, t / 0.42);
        look.current.lerpVectors(_lookA.set(-18, 0.1, -40), _lookB.set(-8, 0.4, -90), t / 0.42);
      } else if (t < 0.78) {
        const u = (t - 0.42) / 0.36;
        current.current.lerpVectors(_mid, _a.set(4, 9, 40), u);
        look.current.lerpVectors(_lookB.set(-8, 0.4, -90), START_POSE.position.clone().setY(1.1), u);
      } else {
        const u = (t - 0.78) / 0.22;
        current.current.lerpVectors(_a.set(4, 9, 40), _end, u);
        look.current.lerp(START_POSE.position.clone().setY(0.85), u);
      }
      camera.position.copy(current.current);
      camera.lookAt(look.current);
      if (introT.current >= 1 && !started.current) started.current = true;
      snapFrames.current = 10;
      return;
    }

    if (lastPhase.current !== state.phase) {
      lastPhase.current = state.phase;
      if (state.phase === "playing") snapFrames.current = 12;
    }

    if (state.openChapter === "identity") {
      const target = getBelvedereInteractPosition();
      _desired.copy(target).add(_a.set(5.8, 3.6, 6.4));
      liftAboveGround(_desired, target.y, false);
      current.current.lerp(_desired, 1 - Math.exp(-3.5 * dt));
      liftAboveGround(current.current, target.y, false);
      look.current.lerp(_b.copy(target).add(_lookA.set(0, 0.5, 0)), 1 - Math.exp(-4.5 * dt));
      camera.position.copy(current.current);
      camera.lookAt(look.current);
      return;
    }

    if (state.openChapter && state.relicFocus) {
      _subject.set(state.relicFocus.x, state.relicFocus.y, state.relicFocus.z);
      _desired.copy(_subject).add(_a.set(4.6, 2.85, 4.9));
      liftAboveGround(_desired, _subject.y, true);
      pushCameraOut(_desired, 0.7);
      liftAboveGround(_desired, _subject.y, true);
      current.current.lerp(_desired, 1 - Math.exp(-2.6 * dt));
      pushCameraOut(current.current, 0.7);
      liftAboveGround(current.current, _subject.y, true);
      look.current.lerp(_subject.clone().add(_lookA.set(0, 0.42, 0)), 1 - Math.exp(-3.4 * dt));
      camera.position.copy(current.current);
      camera.lookAt(look.current);
      return;
    }

    if (state.openChapter) {
      _subject.set(state.playerPos.x, state.playerPos.y, state.playerPos.z);
      offsetPos(_desired, _subject, state.lookYaw, 0.18, distWalk * 1.05, hWalk + 1.0, 0.4);
      liftAboveGround(_desired, _subject.y, true);
      pushCameraOut(_desired, 0.7);
      liftAboveGround(_desired, _subject.y, true);
      current.current.lerp(_desired, 1 - Math.exp(-3 * dt));
      pushCameraOut(current.current, 0.7);
      liftAboveGround(current.current, _subject.y, true);
      look.current.lerp(_subject.clone().add(_a.set(0, 1.2, 0)), 1 - Math.exp(-4 * dt));
      camera.position.copy(current.current);
      camera.lookAt(look.current);
      return;
    }

    const walking = state.mode === "walking";
    if (lastMode.current !== state.mode) {
      lastMode.current = state.mode;
      snapFrames.current = 8;
    }
    const subject = walking ? state.playerPos : state.carPos;
    if (!Number.isFinite(subject.x) || !Number.isFinite(subject.y) || !Number.isFinite(subject.z)) {
      return;
    }
    if (walking) _subject.set(subject.x, subject.y + 1.35, subject.z);
    else _subject.set(subject.x, subject.y + 0.9, subject.z);
    if (lastSubject.current.distanceTo(_subject) > 3.5) snapFrames.current = 10;
    lastSubject.current.copy(_subject);

    const yaw = walking ? state.lookYaw : state.carYaw;
    const pitch = walking ? state.lookPitch : 0.08;
    const targetDist = walking ? distWalk : distDrive + Math.min(2.2, state.speed * 0.07);
    const height = walking ? hWalk : hDrive + Math.min(1.0, state.speed * 0.035);
    // Tiny side offset so camera-forward ≈ look/car yaw (large offset felt inverted).
    const side = walking ? 0.08 : 0.16;

    dist.current = THREE.MathUtils.lerp(dist.current, targetDist, 1 - Math.exp(-3.2 * dt));
    offsetPos(_desired, _subject, yaw, pitch, dist.current, height, side);
    // Hard rule: camera stays behind the look/car yaw. Obstacle pull must
    // never flip in front — that reads as "controls inverted" mid-session.

    // Rapier ray — Metal / Haute only. SwiftShader Éco often returns junk
    // hits that yanked the chase cam under the heightfield (hfudbw9rf).
    const useCamRay = state.quality === "high" && !mobile;
    _dir.copy(_desired).sub(_subject);
    const fullLen = _dir.length();
    if (useCamRay && fullLen > 0.15) {
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
        const body = collider.parent();
        if (body?.isKinematic()) return false;
        return true;
      });
      if (hit && hit.timeOfImpact < fullLen - 0.25) {
        const hitY = _from.y + _rayDir.y * hit.timeOfImpact;
        const downward = _rayDir.y < -0.15 || hitY < _subject.y - 0.15;
        if (downward) {
          liftAboveGround(_desired, _subject.y, walking);
        } else {
          const pull = Math.max(walking ? 1.65 : 3.2, hit.timeOfImpact - 0.85);
          _desired.copy(_subject).addScaledVector(_dir, pull);
          _desired.y = Math.max(_desired.y + (walking ? 0.55 : 0.4), _subject.y + 1.35);
        }
      }
    }

    {
      const fwdX = Math.sin(yaw);
      const fwdZ = Math.cos(yaw);
      const toCamX = _desired.x - _subject.x;
      const toCamZ = _desired.z - _subject.z;
      if (toCamX * fwdX + toCamZ * fwdZ > 0.05) {
        offsetPos(_desired, _subject, yaw, pitch, dist.current, height, side);
      }
    }

    liftAboveGround(_desired, _subject.y, walking);

    if (walking) {
      _lookTarget.set(
        _subject.x + Math.sin(yaw) * 5.2,
        _subject.y + 0.08 + pitch * 0.7,
        _subject.z + Math.cos(yaw) * 5.2,
      );
    } else {
      _lookTarget.set(
        _subject.x + Math.sin(yaw) * 22,
        _subject.y + 1.05,
        _subject.z + Math.cos(yaw) * 22,
      );
    }

    pushCameraOut(_desired, 0.62);

    const follow = walking ? 16 : 8.5;
    const fwdX = Math.sin(yaw);
    const fwdZ = Math.cos(yaw);
    const toCurX = current.current.x - _subject.x;
    const toCurZ = current.current.z - _subject.z;
    const inFront = toCurX * fwdX + toCurZ * fwdZ > 0.02;
    camera.getWorldDirection(_dir);
    _dir.y = 0;
    const camDot = _dir.lengthSq() < 1e-8 ? 1 : _dir.normalize().dot(_a.set(fwdX, 0, fwdZ));
    if (snapFrames.current > 0 || inFront || camDot < 0.25 || current.current.distanceTo(_desired) > 3.2) {
      current.current.copy(_desired);
      look.current.copy(_lookTarget);
      if (snapFrames.current > 0) snapFrames.current -= 1;
    } else {
      current.current.lerp(_desired, 1 - Math.exp(-follow * dt));
      look.current.lerp(_lookTarget, 1 - Math.exp(-11 * dt));
    }
    const maxAbove = _subject.y + (walking ? 3.4 : 4.6);
    if (Number.isFinite(maxAbove) && current.current.y > maxAbove) {
      current.current.y = maxAbove;
    }
    pushCameraOut(_desired, 0.62);
    pushCameraOut(current.current, 0.62);
    // Last: stay above the visual sand + asphalt. Occluder eject must not win.
    liftAboveGround(_desired, _subject.y, walking);
    liftAboveGround(current.current, _subject.y, walking);
    camera.position.copy(current.current);
    camera.lookAt(look.current);
    camera.updateMatrixWorld(true);

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

function maxGroundAt(x: number, z: number) {
  let m = -Infinity;
  const offs = [0, 0.85, -0.85];
  for (const dx of offs) {
    for (const dz of offs) {
      if (dx !== 0 && dz !== 0) continue;
      const v = computeTerrainHeight(x + dx, z + dz);
      const s = sampleGroundHeight(x + dx, z + dz);
      if (Number.isFinite(v)) m = Math.max(m, v);
      if (Number.isFinite(s)) m = Math.max(m, s);
    }
  }
  return Number.isFinite(m) ? m : 0.2;
}

/** Chase cam never sits under the heightfield / road ribbon. */
function liftAboveGround(pos: THREE.Vector3, subjectY: number, walking: boolean) {
  if (!Number.isFinite(pos.x) || !Number.isFinite(pos.z)) return;
  const floor = Math.max(
    maxGroundAt(pos.x, pos.z) + (walking ? 1.95 : 2.25),
    Number.isFinite(subjectY) ? subjectY + 1.35 : 1.9,
    1.9,
  );
  if (!Number.isFinite(pos.y) || pos.y < floor) pos.y = floor;
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
