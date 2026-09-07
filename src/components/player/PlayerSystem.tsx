"use client";

import { useEffect, useMemo, useRef } from "react";
import { CapsuleCollider, CuboidCollider, RigidBody, useRapier, type RapierRigidBody } from "@react-three/rapier";
import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { Convertible } from "@/components/vehicle/Convertible";
import { inputRef, consumeInteractPulse } from "@/hooks/useKeyboard";
import { getGameState, setGameState, openChapter, menusBlockInput, type ChapterId } from "@/lib/gameStore";
import {
  nearestRoadSample,
  roadCorrectionForce,
  clampToRoad,
  sampleRoad,
  START_POSE,
  ROAD_WIDTH,
  ROAD_SURFACE_LIFT,
} from "@/lib/road";
import { computeTerrainHeight, sampleGroundHeight, PLAYER_RADIUS, PLAYER_HEIGHT } from "@/lib/ground";
import { findNearestInteractable } from "@/lib/interaction";
import { getBelvedereInteractPosition, getBelvedereStopPosition } from "@/components/world/Belvedere";
import { isUnsafePosition, safeRespawnPosition } from "@/lib/respawn";
import { isFinitePos, sanitizeWalkSpawn } from "@/lib/spawn";
import { isInsideCameraOccluder, resolveCollisions } from "@/lib/colliders";
import { SEA_INLAND_X } from "@/lib/sea";

const MAX_SPEED = 22;
const ACCEL = 16.5;
const BRAKE = 30;
const DRAG = 2.6;
const TURN_RATE = 1.7;
const WALK_SPEED = 3.8;
const RUN_SPEED = 6.4;
const EXIT_DIST = 4.8;
const STOP_RADIUS = 7.5;
const STOP_SPEED = 5.5;
const REENTER_RADIUS = 3.5;
const EXIT_LERP_TIME = 0.55;
const ENTER_LERP_TIME = 0.4;
const CAPSULE_HALF = (PLAYER_HEIGHT - PLAYER_RADIUS * 2) * 0.5;
const CAPSULE_Y = PLAYER_RADIUS + CAPSULE_HALF;

/**
 * Authoritative gameplay loop on Rapier:
 * vehicle kinematic + character controller capsule.
 */
export function PlayerSystem() {
  const { camera } = useThree();
  const carBody = useRef<RapierRigidBody>(null);
  const carVisual = useRef<THREE.Group>(null);
  const playerBody = useRef<RapierRigidBody>(null);
  const playerVisual = useRef<THREE.Group>(null);
  const { world, rapier } = useRapier();
  const controller = useRef<ReturnType<typeof world.createCharacterController> | null>(null);

  const velocity = useRef(0);
  const yaw = useRef(Math.atan2(START_POSE.tangent.x, START_POSE.tangent.z));
  const walkYaw = useRef(yaw.current);
  const lookYaw = useRef(yaw.current);
  const lookPitch = useRef(0.12);
  const pos = useRef(START_POSE.position.clone());
  const playerPos = useRef(new THREE.Vector3());
  const playerVel = useRef(new THREE.Vector3());
  const tmp = useRef(new THREE.Vector3());
  const sideTmp = useRef(new THREE.Vector3());
  const moveTmp = useRef(new THREE.Vector3());
  const initialized = useRef(false);
  const skipUntil = useRef(0);
  const exitCooldown = useRef(0);
  const suspension = useRef(0);
  const prevGround = useRef(0);
  const prevScreenPos = useRef(new THREE.Vector3());
  const prevCarFwd = useRef(new THREE.Vector3());
  const prevYaw = useRef(0);
  const holdKey = useRef<"Q" | "D" | "none">("none");
  const holdScreenDx = useRef(0);
  const lastScreenDx = useRef(0);
  const lastSteerDyaw = useRef(0);
  const debugMode = useRef<"walking" | "driving" | null>(null);
  const transition = useRef<{
    kind: "exit" | "enter" | null;
    t: number;
    from: THREE.Vector3;
    to: THREE.Vector3;
  }>({ kind: null, t: 0, from: new THREE.Vector3(), to: new THREE.Vector3() });

  useEffect(() => {
    const c = world.createCharacterController(0.08);
    c.setApplyImpulsesToDynamicBodies(false);
    c.setMaxSlopeClimbAngle((48 * Math.PI) / 180);
    c.setMinSlopeSlideAngle((55 * Math.PI) / 180);
    c.enableAutostep(0.78, 0.38, true);
    c.enableSnapToGround(0.7);
    c.setCharacterMass(70);
    controller.current = c;
    return () => {
      c.free();
      controller.current = null;
    };
  }, [world]);

  useEffect(() => {
    const onTeleport = () => {
      const stop = getBelvedereStopPosition();
      pos.current.set(stop.x, stop.y, stop.z);
      const sample = nearestRoadSample(pos.current);
      yaw.current = Math.atan2(sample.tangent.x, sample.tangent.z);
      velocity.current = 0;
      const yPos = pos.current.y + ROAD_SURFACE_LIFT;
      if (carBody.current) {
        carBody.current.setNextKinematicTranslation({ x: pos.current.x, y: yPos + 0.35, z: pos.current.z });
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw.current, 0, "YXZ"));
        carBody.current.setNextKinematicRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
      }
      if (carVisual.current) {
        carVisual.current.position.set(pos.current.x, yPos, pos.current.z);
        carVisual.current.rotation.set(0, yaw.current, 0);
      }
      setGameState({
        phase: "playing",
        mode: "driving",
        carPos: { x: pos.current.x, y: pos.current.y, z: pos.current.z },
        carYaw: yaw.current,
        speed: 0,
        nearStopSpot: true,
        prompt: "Descendre",
        interactTarget: "exit-car",
      });
    };

    const onTeleportWalk = (ev: Event) => {
      const detail = (ev as CustomEvent<{ x: number; y: number; z: number; yaw?: number; focusChapter?: ChapterId | null }>).detail;
      const pose = sanitizeWalkSpawn(detail ?? {});
      if (!pose) return;
      playerPos.current.set(pose.x, pose.y, pose.z);
      walkYaw.current = pose.yaw;
      lookYaw.current = pose.yaw;
      lookPitch.current = 0.12;
      playerVel.current.set(0, 0, 0);
      transition.current.kind = null;
      skipUntil.current = performance.now() + 200;
      setPlayerKinematic(playerPos.current, walkYaw.current, true);
      if (playerVisual.current) {
        playerVisual.current.visible = true;
        playerVisual.current.rotation.y = walkYaw.current;
      }
      const focus = detail?.focusChapter ?? getGameState().focusChapter;
      const landed = findNearestInteractable(playerPos.current, "walking", focus);
      setGameState({
        phase: "playing",
        mode: "walking",
        openChapter: null,
        rescueOpen: false,
        playerPos: { x: pose.x, y: pose.y, z: pose.z },
        walkYaw: walkYaw.current,
        lookYaw: lookYaw.current,
        lookPitch: lookPitch.current,
        nearStopSpot: false,
        focusChapter: focus,
        prompt: landed?.label ?? getGameState().prompt,
        interactTarget: landed?.id ?? getGameState().interactTarget,
        showExplorerHint: false,
      });
    };

    const onTeleportDrive = (ev: Event) => {
      const t = (ev as CustomEvent<{ t?: number }>).detail?.t;
      const sample = sampleRoad(typeof t === "number" ? t : 0.08);
      pos.current.copy(sample.position);
      yaw.current = Math.atan2(sample.tangent.x, sample.tangent.z);
      velocity.current = 0;
      const yPos = pos.current.y + ROAD_SURFACE_LIFT;
      if (carBody.current) {
        carBody.current.setNextKinematicTranslation({ x: pos.current.x, y: yPos + 0.35, z: pos.current.z });
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw.current, 0, "YXZ"));
        carBody.current.setNextKinematicRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
      }
      if (carVisual.current) {
        carVisual.current.position.set(pos.current.x, yPos, pos.current.z);
        carVisual.current.rotation.set(0, yaw.current, 0);
      }
      lookYaw.current = yaw.current;
      lookPitch.current = 0.08;
      setGameState({
        phase: "playing",
        mode: "driving",
        engineOn: true,
        openChapter: null,
        rescueOpen: false,
        showExplorerHint: false,
        carPos: { x: pos.current.x, y: pos.current.y, z: pos.current.z },
        carYaw: yaw.current,
        lookYaw: yaw.current,
        lookPitch: 0.08,
        speed: 0,
        nearStopSpot: false,
        prompt: null,
        interactTarget: null,
      });
    };

    window.addEventListener("cote:teleport-belvedere", onTeleport);
    window.addEventListener("cote:teleport-walk", onTeleportWalk as EventListener);
    window.addEventListener("cote:teleport-drive", onTeleportDrive as EventListener);
    return () => {
      window.removeEventListener("cote:teleport-belvedere", onTeleport);
      window.removeEventListener("cote:teleport-walk", onTeleportWalk as EventListener);
      window.removeEventListener("cote:teleport-drive", onTeleportDrive as EventListener);
    };
  }, []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.18);
    const state = getGameState();
    if (state.phase === "boot") return;

    if (!initialized.current) {
      pos.current.copy(START_POSE.position);
      yaw.current = Math.atan2(START_POSE.tangent.x, START_POSE.tangent.z);
      // Do not clobber a teleport that landed before the first frame.
      if (state.mode === "walking" && Number.isFinite(state.lookYaw)) {
        walkYaw.current = state.walkYaw;
        lookYaw.current = state.lookYaw;
        if (Number.isFinite(state.playerPos.x)) {
          playerPos.current.set(state.playerPos.x, state.playerPos.y, state.playerPos.z);
        }
      } else {
        walkYaw.current = yaw.current;
        lookYaw.current = yaw.current;
      }
      syncCar(pos.current, yaw.current, 0, 0);
      initialized.current = true;
      setGameState({
        carPos: { x: pos.current.x, y: pos.current.y, z: pos.current.z },
        carYaw: yaw.current,
        walkYaw: walkYaw.current,
        lookYaw: lookYaw.current,
      });
    }

    if (state.phase === "intro" || state.phase === "title" || state.openChapter !== null) {
      syncCar(pos.current, yaw.current, suspension.current, 0);
      return;
    }

    if (menusBlockInput() && state.rescueOpen) return;

    exitCooldown.current = Math.max(0, exitCooldown.current - dt);

    const input = inputRef.current;
    const touch = inputRef.touch;
    const look = inputRef.look;
    const blocked = state.rescueOpen || state.openChapter !== null;
    const forward = !blocked && input.forward;
    const back = !blocked && input.back;
    const left = !blocked && input.left;
    const right = !blocked && input.right;
    const brake = !blocked && input.brake;
    const run = !blocked && (input.run || Math.hypot(touch.x, touch.y) > 0.85);

    const stopPos = getBelvedereStopPosition();
    const interactPos = getBelvedereInteractPosition();

    if (state.showExplorerHint && (forward || back || left || right || Math.hypot(touch.x, touch.y) > 0.15)) {
      setGameState({ showExplorerHint: false });
    }

    // Exit / enter lerp
    if (transition.current.kind) {
      const dur = transition.current.kind === "exit" ? EXIT_LERP_TIME : ENTER_LERP_TIME;
      transition.current.t = Math.min(1, transition.current.t + dt / dur);
      const k = easeOutCubic(transition.current.t);
      playerPos.current.lerpVectors(transition.current.from, transition.current.to, k);
      playerPos.current.y = sampleGroundHeight(playerPos.current.x, playerPos.current.z);
      setPlayerKinematic(playerPos.current, walkYaw.current, true);
      if (transition.current.t >= 1) {
        if (transition.current.kind === "enter") {
          setGameState({ mode: "driving", nearCar: false, prompt: null, engineOn: true, interactTarget: null });
          setPlayerKinematic(playerPos.current, walkYaw.current, false);
        }
        transition.current.kind = null;
      }
      setGameState({
        playerPos: { x: playerPos.current.x, y: playerPos.current.y, z: playerPos.current.z },
        carPos: { x: pos.current.x, y: pos.current.y, z: pos.current.z },
      });
      return;
    }

    if (state.mode === "driving") {
      const analogSteer = !blocked && Math.abs(touch.x) > 0.12;
      const analogThrottle = !blocked && Math.abs(touch.y) > 0.12 && !input.forward && !input.back;
      if (forward) velocity.current = Math.min(MAX_SPEED, velocity.current + ACCEL * dt);
      if (back) {
        if (velocity.current > 0.4) velocity.current = Math.max(0, velocity.current - BRAKE * 0.7 * dt);
        else velocity.current = Math.max(-MAX_SPEED * 0.4, velocity.current - ACCEL * 0.55 * dt);
      }
      if (analogThrottle) {
        if (touch.y > 0) velocity.current = Math.min(MAX_SPEED, velocity.current + ACCEL * touch.y * dt);
        else if (velocity.current > 0.4) velocity.current = Math.max(0, velocity.current + BRAKE * 0.7 * touch.y * dt);
        else velocity.current = Math.max(-MAX_SPEED * 0.4, velocity.current + ACCEL * 0.55 * touch.y * dt);
      }
      if (brake) {
        if (velocity.current > 0) velocity.current = Math.max(0, velocity.current - BRAKE * dt);
        else velocity.current = Math.min(0, velocity.current + BRAKE * dt);
      }
      const drag = DRAG + (forward || back || analogThrottle ? 0 : 5.5);
      if (velocity.current > 0) velocity.current = Math.max(0, velocity.current - drag * dt);
      if (velocity.current < 0) velocity.current = Math.min(0, velocity.current + drag * dt);

      const speedFactor = THREE.MathUtils.clamp(Math.abs(velocity.current) / MAX_SPEED, 0.42, 1);
      const turnSign = Math.sign(velocity.current || 1);
      // Parent GPU FAIL 601f7fc: Q turned camera-RIGHT. Flip vs that HEAD.
      // Screen-left = −cameraRight (look × up). Q/A = left, D = right.
      if (analogSteer) {
        yaw.current -= touch.x * TURN_RATE * speedFactor * turnSign * dt;
      } else {
        if (left) yaw.current += TURN_RATE * speedFactor * turnSign * dt;
        if (right) yaw.current -= TURN_RATE * speedFactor * turnSign * dt;
      }
      tmp.current.set(Math.sin(yaw.current), 0, Math.cos(yaw.current));
      pos.current.addScaledVector(tmp.current, velocity.current * dt);
      pos.current.addScaledVector(roadCorrectionForce(pos.current, ROAD_WIDTH * 0.42), dt);
      clampToRoad(pos.current, ROAD_WIDTH * 0.48);

      const sample = nearestRoadSample(pos.current);

      if (Math.abs(velocity.current) > 2) {
        const desiredYaw = Math.atan2(sample.tangent.x, sample.tangent.z);
        let dy = desiredYaw - yaw.current;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        yaw.current += dy * 0.035;
      }
      pos.current.y = sample.position.y;

      const groundDelta = sample.position.y - prevGround.current;
      suspension.current = THREE.MathUtils.lerp(suspension.current, -groundDelta * 2.5, 0.15);
      suspension.current *= 1 - 4 * dt;
      prevGround.current = sample.position.y;

      const ahead = sampleRoad(sample.t + 0.012);
      const pitch = Math.atan2(ahead.position.y - sample.position.y, 2.2) * 0.9;
      const roll = ((left ? 1 : 0) - (right ? 1 : 0)) * 0.06;

      syncCar(pos.current, yaw.current, suspension.current, pitch, roll);
      if (carVisual.current) {
        carVisual.current.userData.setWheelSpin?.(velocity.current * dt * 3.15);
        const steerAmt = analogSteer ? -touch.x * 0.42 : ((left ? 1 : 0) - (right ? 1 : 0)) * 0.42;
        carVisual.current.userData.setSteer?.(steerAmt);
      }

      const distStop = Math.hypot(pos.current.x - stopPos.x, pos.current.z - stopPos.z);
      const nearBelvedereZone = distStop < 18;
      if (distStop < 10) velocity.current *= 1 - 3.2 * dt;
      else if (nearBelvedereZone && Math.abs(velocity.current) > 5) velocity.current *= 1 - 2.0 * dt;
      const nearStop = distStop < STOP_RADIUS && Math.abs(velocity.current) < STOP_SPEED;
      const canExit = Math.abs(velocity.current) < 3.4;

      if (canExit && exitCooldown.current <= 0 && !blocked && (consumeInteractPulse() || input.exit)) {
        const toward = tmp.current;
        if (nearStop) {
          toward.copy(interactPos).sub(pos.current);
          toward.y = 0;
          if (toward.lengthSq() > 0.01) toward.normalize();
          else toward.set(Math.cos(yaw.current), 0, -Math.sin(yaw.current));
        } else {
          toward.set(-sample.tangent.z, 0, sample.tangent.x);
          if (toward.lengthSq() > 0.01) toward.normalize();
          if (toward.x < 0) toward.negate();
          if (Math.abs(toward.x) < 0.22) toward.set(1, 0, 0);
        }
        const exitTo = pos.current.clone().addScaledVector(toward, EXIT_DIST);
        exitTo.x = THREE.MathUtils.clamp(exitTo.x, SEA_INLAND_X + 1.6, 22);
        exitTo.y = sampleGroundHeight(exitTo.x, exitTo.z);
        transition.current = {
          kind: "exit",
          t: 0,
          from: pos.current.clone().setY(sample.position.y),
          to: exitTo,
        };
        playerPos.current.copy(pos.current);
        walkYaw.current = Math.atan2(toward.x, toward.z);
        lookYaw.current = walkYaw.current;
        lookPitch.current = 0.12;
        velocity.current = 0;
        exitCooldown.current = 0.8;
        setPlayerKinematic(playerPos.current, walkYaw.current, true);
        setGameState({
          mode: "walking",
          speed: 0,
          nearStopSpot: true,
          nearCar: false,
          walkYaw: walkYaw.current,
          lookYaw: lookYaw.current,
          prompt: null,
          engineOn: true,
          interactTarget: null,
        });
      }

      setGameState({
        speed: Math.abs(velocity.current),
        carPos: { x: pos.current.x, y: pos.current.y, z: pos.current.z },
        carYaw: yaw.current,
        walkYaw: yaw.current,
        nearStopSpot: nearStop,
        nearCar: false,
        prompt: canExit ? "Descendre" : nearBelvedereZone ? "Ralentissez sur le marquage" : null,
        interactTarget: canExit ? "exit-car" : null,
        playerPos: { x: pos.current.x, y: pos.current.y, z: pos.current.z },
      });

      if (typeof window !== "undefined") {
        (window as unknown as { __roadT?: number }).__roadT = sample.t;
      }
      writeAxesDebug("driving");
      return;
    }

    // ——— Walking ———
    // lookYaw / lookPitch = camera only (look right = +yaw).
    // Movement is lookYaw-relative so a chasing camera cannot invert axes
    // while it lerps. walkYaw = avatar facing only — never fed back into look.
    const mouseX = inputRef.lookDelta.x;
    const mouseY = inputRef.lookDelta.y;
    inputRef.lookDelta.x = 0;
    inputRef.lookDelta.y = 0;
    const analogLook = !blocked && (Math.abs(look.x) > 0.06 || Math.abs(look.y) > 0.06);
    // Frozen signs for the whole session. Never remap, never mix analog + mouse.
    // look.x > 0 → yaw right. look.y > 0 → pitch up. Movement uses lookYaw only.
    const LOOK_YAW_RATE = 2.05;
    const LOOK_PITCH_RATE = 1.1;
    if (analogLook) {
      lookYaw.current += look.x * LOOK_YAW_RATE * dt;
      lookPitch.current = THREE.MathUtils.clamp(lookPitch.current + look.y * LOOK_PITCH_RATE * dt, -0.22, 0.38);
    } else if (!blocked && (mouseX || mouseY)) {
      lookYaw.current += mouseX;
      lookPitch.current = THREE.MathUtils.clamp(lookPitch.current + mouseY, -0.22, 0.38);
    }

    const analogActive = !blocked && (Math.abs(touch.x) > 0.12 || Math.abs(touch.y) > 0.12);
    const moveX = analogActive ? touch.x : (right ? 1 : 0) - (left ? 1 : 0);
    const moveZ = analogActive ? touch.y : (forward ? 1 : 0) - (back ? 1 : 0);
    let moving = false;
    const speed = run ? RUN_SPEED : WALK_SPEED;

    if (Math.abs(moveX) > 0.01 || Math.abs(moveZ) > 0.01) {
      // Authoritative basis = lookYaw (same as the chase rig). Camera world
      // direction is NOT used: a mid-lerp / in-front camera would invert W/stick.
      tmp.current.set(Math.sin(lookYaw.current), 0, Math.cos(lookYaw.current));
      // Parent GPU FAIL 601f7fc: Q strafed camera-RIGHT. Flip vs that HEAD.
      // cameraRight = look × up = (−lookZ, 0, lookX). This basis matches it
      // so Q (moveX < 0) goes −cameraRight = screen-left.
      sideTmp.current.set(-tmp.current.z, 0, tmp.current.x);
      moveTmp.current
        .set(0, 0, 0)
        .addScaledVector(tmp.current, moveZ)
        .addScaledVector(sideTmp.current, moveX);
      if (moveTmp.current.lengthSq() > 0.001) {
        moveTmp.current.normalize();
        const mag = Math.min(1, Math.hypot(moveX, moveZ));
        playerVel.current.lerp(moveTmp.current.multiplyScalar(speed * mag), 1 - Math.exp(-12 * dt));
        const targetYaw = Math.atan2(playerVel.current.x, playerVel.current.z);
        let dy = targetYaw - walkYaw.current;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        walkYaw.current += dy * Math.min(1, 12 * dt);
        moving = true;
      }
    } else {
      playerVel.current.multiplyScalar(Math.exp(-10 * dt));
    }

    // Authoritative ground follow — Rapier heightfield + CC treated gentle
    // ramps as walls. Horizontal move + snap Y + tight building AABBs.
    if (performance.now() >= skipUntil.current) {
      playerPos.current.x += playerVel.current.x * dt;
      playerPos.current.z += playerVel.current.z * dt;
    }
    playerPos.current.y = sampleGroundHeight(playerPos.current.x, playerPos.current.z);
    resolveCollisions(playerPos.current, PLAYER_RADIUS, PLAYER_HEIGHT);
    playerPos.current.y = sampleGroundHeight(playerPos.current.x, playerPos.current.z);
    setPlayerKinematic(playerPos.current, walkYaw.current, true);

    // Soft world bounds — beach stays walkable, sea sheet is a wall (no swim-off).
    const waterLimit = SEA_INLAND_X + 0.85;
    if (playerPos.current.x < waterLimit) {
      playerPos.current.x = waterLimit;
      playerVel.current.x = Math.max(0, playerVel.current.x);
    }
    if (playerPos.current.x > 30) playerPos.current.x = 30;
    if (playerPos.current.z > 46) playerPos.current.z = 46;
    if (playerPos.current.z < -188) playerPos.current.z = -188;

    // Soft snap if the capsule dropped into a trench / void under the mesh.
    const standY = sampleGroundHeight(playerPos.current.x, playerPos.current.z);
    if (Number.isFinite(standY) && playerPos.current.y < standY - 0.55) {
      playerPos.current.y = standY;
      playerVel.current.set(0, 0, 0);
      setPlayerKinematic(playerPos.current, walkYaw.current, true);
    }

    // Safe respawn — never stuck in void/sea/under map
    if (isUnsafePosition(playerPos.current)) {
      const safe = safeRespawnPosition(playerPos.current);
      playerPos.current.copy(safe);
      playerVel.current.set(0, 0, 0);
      setPlayerKinematic(playerPos.current, walkYaw.current, true);
    }

    if (playerVisual.current) {
      playerVisual.current.rotation.y = walkYaw.current;
      playerVisual.current.userData.moving = moving;
      playerVisual.current.userData.running = run && moving;
      playerVisual.current.visible = true;
    }

    // Keep car synced while walking
    syncCar(pos.current, yaw.current, 0, 0);

    const nearCar = playerPos.current.distanceTo(pos.current) < REENTER_RADIUS;
    const focus = getGameState().focusChapter;
    const interactable = findNearestInteractable(playerPos.current, "walking", focus);
    if (focus && interactable?.chapter !== focus) {
      setGameState({ focusChapter: null });
    }

    let prompt: string | null = null;
    let interactTarget: string | null = null;
    if (interactable) {
      prompt = interactable.label;
      interactTarget = interactable.id;
    } else if (nearCar) {
      prompt = "Monter";
      interactTarget = "enter-car";
    }

    if (exitCooldown.current <= 0 && !blocked && consumeInteractPulse()) {
      if (interactable) {
        openChapter(interactable.chapter);
      } else if (nearCar) {
        exitCooldown.current = 0.8;
        transition.current = {
          kind: "enter",
          t: 0,
          from: playerPos.current.clone(),
          to: pos.current.clone().setY(sampleGroundHeight(pos.current.x, pos.current.z)),
        };
        walkYaw.current = yaw.current;
        lookYaw.current = yaw.current;
        setGameState({ walkYaw: yaw.current, lookYaw: yaw.current, prompt: null, interactTarget: null });
      }
    }

    if (!Number.isFinite(playerPos.current.x) || !Number.isFinite(playerPos.current.y) || !Number.isFinite(playerPos.current.z)) {
      const safe = safeRespawnPosition(new THREE.Vector3(0, 0.2, -38));
      playerPos.current.copy(safe);
      setPlayerKinematic(playerPos.current, walkYaw.current, true);
    }

    setGameState({
      speed: 0,
      nearCar,
      nearBelvedere: interactTarget === "carnet",
      nearStopSpot: true,
      prompt,
      interactTarget,
      walkYaw: walkYaw.current,
      lookYaw: lookYaw.current,
      lookPitch: lookPitch.current,
      playerPos: { x: playerPos.current.x, y: playerPos.current.y, z: playerPos.current.z },
      carPos: { x: pos.current.x, y: pos.current.y, z: pos.current.z },
    });

    writeAxesDebug("walking");

    void rapier;
  });

  function writeAxesDebug(mode: "walking" | "driving") {
    if (typeof window === "undefined") return;
    const api = (window as unknown as { __coteMelvyn?: Record<string, unknown> }).__coteMelvyn;
    if (!api) return;
    camera.getWorldDirection(tmp.current);
    tmp.current.y = 0;
    if (tmp.current.lengthSq() > 1e-8) tmp.current.normalize();
    // Three.js: cameraRight = lookDir × worldUp. +screenDeltaX = moved right on screen.
    const camRx = -tmp.current.z;
    const camRz = tmp.current.x;
    const subj = mode === "driving" ? pos.current : playerPos.current;
    const dpx = subj.x - prevScreenPos.current.x;
    const dpz = subj.z - prevScreenPos.current.z;
    const posDx = dpx * camRx + dpz * camRz;
    const fwdX = Math.sin(yaw.current);
    const fwdZ = Math.cos(yaw.current);
    if (debugMode.current !== mode || prevScreenPos.current.lengthSq() < 1e-8) {
      debugMode.current = mode;
      prevScreenPos.current.copy(subj);
      prevCarFwd.current.set(fwdX, 0, fwdZ);
      prevYaw.current = yaw.current;
      holdScreenDx.current = 0;
    }
    const headDx = (fwdX - prevCarFwd.current.x) * camRx + (fwdZ - prevCarFwd.current.z) * camRz;
    // Walk = feet vs cameraRight. Drive = nose vs cameraRight (road curve
    // must not drown the steer sign).
    const screenDeltaX = mode === "driving" ? headDx : posDx;
    let steerYawDelta = yaw.current - prevYaw.current;
    while (steerYawDelta > Math.PI) steerYawDelta -= Math.PI * 2;
    while (steerYawDelta < -Math.PI) steerYawDelta += Math.PI * 2;
    const key = inputRef.current.left && !inputRef.current.right ? "Q" : inputRef.current.right && !inputRef.current.left ? "D" : "none";
    if (key !== holdKey.current) {
      holdKey.current = key;
      holdScreenDx.current = 0;
    }
    if (key !== "none") holdScreenDx.current += screenDeltaX;
    prevScreenPos.current.copy(subj);
    prevCarFwd.current.set(fwdX, 0, fwdZ);
    prevYaw.current = yaw.current;
    lastScreenDx.current = screenDeltaX;
    lastSteerDyaw.current = steerYawDelta;

    const basisYaw = mode === "driving" ? yaw.current : lookYaw.current;
    const lookFx = Math.sin(basisYaw);
    const lookFz = Math.cos(basisYaw);
    const snap = {
      mode,
      key,
      screenDeltaX,
      screenDeltaXHold: holdScreenDx.current,
      steerYawDelta,
      playerPos: { x: playerPos.current.x, y: playerPos.current.y, z: playerPos.current.z },
      carPos: { x: pos.current.x, y: pos.current.y, z: pos.current.z },
      carYaw: yaw.current,
      lookYaw: lookYaw.current,
      walkYaw: walkYaw.current,
      driveSpeed: velocity.current,
      camFwd: { x: tmp.current.x, z: tmp.current.z },
      camRight: { x: camRx, z: camRz },
      lookFwd: { x: lookFx, z: lookFz },
      camDotLook: tmp.current.x * lookFx + tmp.current.z * lookFz,
      camPos: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
      camInside: isInsideCameraOccluder(camera.position, 0.08),
      camGround: computeTerrainHeight(camera.position.x, camera.position.z),
      camClearance: camera.position.y - computeTerrainHeight(camera.position.x, camera.position.z),
      sandY: computeTerrainHeight(pos.current.x, pos.current.z),
      asphaltY: pos.current.y + ROAD_SURFACE_LIFT,
      sandBelowAsphalt: computeTerrainHeight(pos.current.x, pos.current.z) <= pos.current.y + ROAD_SURFACE_LIFT - 0.08,
      keys: { ...inputRef.current },
    };
    api._live = snap;
    const liveFn = Object.assign(() => snap, snap);
    api.live = liveFn;
  }

  function syncCar(
    p: THREE.Vector3,
    y: number,
    susp: number,
    pitch: number,
    roll = 0,
  ) {
    const yPos = p.y + ROAD_SURFACE_LIFT + susp;
    if (carBody.current) {
      carBody.current.setNextKinematicTranslation({ x: p.x, y: yPos + 0.35, z: p.z });
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, y, roll, "YXZ"));
      carBody.current.setNextKinematicRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
    }
    if (carVisual.current) {
      carVisual.current.position.set(p.x, yPos, p.z);
      carVisual.current.rotation.order = "YXZ";
      carVisual.current.rotation.y = y;
      carVisual.current.rotation.x = THREE.MathUtils.lerp(carVisual.current.rotation.x, pitch, 0.2);
      carVisual.current.rotation.z = THREE.MathUtils.lerp(carVisual.current.rotation.z, roll, 0.15);
    }
  }

  function setPlayerKinematic(feet: THREE.Vector3, facing: number, visible: boolean) {
    if (!isFinitePos(feet)) return;
    if (playerBody.current) {
      const t = { x: feet.x, y: feet.y + CAPSULE_Y, z: feet.z };
      playerBody.current.setTranslation(t, true);
      playerBody.current.setNextKinematicTranslation(t);
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, facing, 0));
      playerBody.current.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
      playerBody.current.setNextKinematicRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
    }
    if (playerVisual.current) {
      playerVisual.current.visible = visible;
      playerVisual.current.rotation.y = facing;
    }
  }

  return (
    <group>
      <RigidBody
        ref={carBody}
        type="kinematicPosition"
        colliders={false}
        position={[START_POSE.position.x, START_POSE.position.y + 0.4, START_POSE.position.z]}
        enabledRotations={[false, true, false]}
      >
        <CuboidCollider args={[1.05, 0.5, 2.25]} friction={0.8} />
      </RigidBody>
      <group ref={carVisual}>
        <Convertible color="#c45c3e" />
      </group>

      <RigidBody
        ref={playerBody}
        type="kinematicPosition"
        colliders={false}
        position={[START_POSE.position.x, START_POSE.position.y + CAPSULE_Y, START_POSE.position.z]}
        enabledRotations={[false, true, false]}
      >
        <CapsuleCollider args={[CAPSULE_HALF, PLAYER_RADIUS]} friction={0.9} />
        <group ref={playerVisual} position={[0, -CAPSULE_Y, 0]} visible={false}>
          <ExplorerAvatar />
        </group>
      </RigidBody>
    </group>
  );
}

function ExplorerAvatar() {
  const gltf = useGLTF("/models/explorer.glb");
  const group = useRef<THREE.Group>(null);
  const mixer = useRef<THREE.AnimationMixer | null>(null);
  const actions = useRef<Record<string, THREE.AnimationAction>>({});
  const current = useRef<string | null>(null);

  const model = useMemo(() => {
    const clone = SkeletonUtils.clone(gltf.scene);
    clone.traverse((o: THREE.Object3D) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
        // Hide weapon trail / dagger gizmos (Quaternius Rogue extras)
        if (/nurbs|path|dagger|weapon|rogue001/i.test(o.name)) {
          m.visible = false;
        }
      }
    });
    return clone;
  }, [gltf.scene]);

  useEffect(() => {
    const mix = new THREE.AnimationMixer(model);
    mixer.current = mix;
    const clips = gltf.animations ?? [];
    const pick = (names: string[]) => clips.find((c) => names.includes(c.name));
    const idle = pick(["Idle", "CharacterArmature|Idle", "Attacking_Idle"]);
    const walk = pick(["Walk", "CharacterArmature|Walk"]);
    const run = pick(["Run", "CharacterArmature|Run"]);
    if (idle) actions.current.idle = mix.clipAction(idle);
    if (walk) actions.current.walk = mix.clipAction(walk);
    if (run) actions.current.run = mix.clipAction(run);
    actions.current.idle?.play();
    current.current = "idle";
    return () => {
      mix.stopAllAction();
      mix.uncacheRoot(model);
      mixer.current = null;
    };
  }, [model, gltf.animations]);

  useFrame((_, dt) => {
    const { mode } = getGameState();
    if (!group.current) return;
    group.current.visible = mode === "walking";
    mixer.current?.update(dt);
    if (mode !== "walking") return;

    const moving = Boolean(group.current.parent?.userData.moving);
    const running = Boolean(group.current.parent?.userData.running);
    const next = !moving ? "idle" : running ? "run" : "walk";
    if (next !== current.current) {
      const prev = current.current ? actions.current[current.current] : null;
      const act = actions.current[next] ?? actions.current.idle;
      if (act) {
        act.reset().fadeIn(0.18).play();
        prev?.fadeOut(0.18);
        current.current = next;
      }
    }
  });

  // Quaternius Rogue ≈ 2.8u tall → scale to ~1.75m
  return (
    <group ref={group} scale={0.64} position={[0, 0, 0]}>
      <primitive object={model} />
    </group>
  );
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

useGLTF.preload("/models/explorer.glb");
