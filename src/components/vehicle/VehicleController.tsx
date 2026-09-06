"use client";

import { useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Convertible } from "./Convertible";
import { inputRef, consumeInteractPulse } from "@/hooks/useKeyboard";
import { getGameState, setGameState, openChapter, menusBlockInput } from "@/lib/gameStore";
import {
  nearestRoadSample,
  roadCorrectionForce,
  clampToRoad,
  sampleRoad,
  START_POSE,
  ROAD_WIDTH,
} from "@/lib/road";
import { sampleGroundHeight, PLAYER_RADIUS, PLAYER_HEIGHT, MAX_SLOPE } from "@/lib/ground";
import { resolveCollisions } from "@/lib/colliders";
import { findNearestInteractable } from "@/lib/interaction";
import { getBelvedereInteractPosition, getBelvedereStopPosition } from "@/components/world/Belvedere";

const MAX_SPEED = 20;
const ACCEL = 12;
const BRAKE = 30;
const DRAG = 3.4;
const TURN_RATE = 1.65;
const WALK_SPEED = 3.8;
const RUN_SPEED = 6.2;
const EXIT_DIST = 4.8;
const STOP_RADIUS = 5.5;
const STOP_SPEED = 4.5;
const REENTER_RADIUS = 3.5;
const EXIT_LERP_TIME = 0.55;
const ENTER_LERP_TIME = 0.4;

/**
 * Unified player system:
 * Input → MovementState → Physics/Collision → Character / Vehicle → Anim → Camera subjects
 */
export function VehicleController() {
  const car = useRef<THREE.Group>(null);
  const player = useRef<THREE.Group>(null);
  const velocity = useRef(0);
  const yaw = useRef(Math.atan2(START_POSE.tangent.x, START_POSE.tangent.z));
  const walkYaw = useRef(yaw.current);
  const lookPitch = useRef(0.12);
  const pos = useRef(START_POSE.position.clone());
  const playerPos = useRef(new THREE.Vector3());
  const playerVel = useRef(new THREE.Vector3());
  const tmp = useRef(new THREE.Vector3());
  const sideTmp = useRef(new THREE.Vector3());
  const initialized = useRef(false);
  const exitCooldown = useRef(0);
  const transition = useRef<{
    kind: "exit" | "enter" | null;
    t: number;
    from: THREE.Vector3;
    to: THREE.Vector3;
  }>({ kind: null, t: 0, from: new THREE.Vector3(), to: new THREE.Vector3() });
  const suspension = useRef(0);
  const prevGround = useRef(0);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const state = getGameState();
    if (state.phase === "boot") return;

    if (!initialized.current) {
      pos.current.copy(START_POSE.position);
      yaw.current = Math.atan2(START_POSE.tangent.x, START_POSE.tangent.z);
      walkYaw.current = yaw.current;
      if (car.current) {
        car.current.position.copy(pos.current);
        car.current.position.y = 0.05;
        car.current.rotation.y = yaw.current;
      }
      initialized.current = true;
      setGameState({
        carPos: { x: pos.current.x, y: pos.current.y, z: pos.current.z },
        carYaw: yaw.current,
        walkYaw: yaw.current,
      });
    }

    if (state.phase === "intro" || state.openChapter !== null) {
      if (car.current) {
        const y = nearestRoadSample(pos.current).position.y + 0.05 + suspension.current;
        car.current.position.set(pos.current.x, y, pos.current.z);
        car.current.rotation.y = yaw.current;
      }
      return;
    }

    if (menusBlockInput() && state.rescueOpen) return;

    exitCooldown.current = Math.max(0, exitCooldown.current - dt);

    const input = inputRef.current;
    const touch = inputRef.touch;
    const look = inputRef.look;
    const blocked = state.rescueOpen || state.openChapter !== null;
    const forward = !blocked && (input.forward || touch.y > 0.2);
    const back = !blocked && (input.back || touch.y < -0.2);
    const left = !blocked && (input.left || touch.x < -0.2);
    const right = !blocked && (input.right || touch.x > 0.2);
    const brake = !blocked && input.brake;
    const run = !blocked && (input.run || Math.hypot(touch.x, touch.y) > 0.85);

    const stopPos = getBelvedereStopPosition();
    const interactPos = getBelvedereInteractPosition();

    if (state.showExplorerHint && (forward || back || left || right || Math.abs(touch.x) > 0.15)) {
      setGameState({ showExplorerHint: false });
    }

    // Smooth exit / enter transitions
    if (transition.current.kind) {
      const dur = transition.current.kind === "exit" ? EXIT_LERP_TIME : ENTER_LERP_TIME;
      transition.current.t = Math.min(1, transition.current.t + dt / dur);
      const k = easeOutCubic(transition.current.t);
      playerPos.current.lerpVectors(transition.current.from, transition.current.to, k);
      playerPos.current.y = sampleGroundHeight(playerPos.current.x, playerPos.current.z);
      if (player.current) {
        player.current.position.copy(playerPos.current);
        player.current.rotation.y = walkYaw.current;
        player.current.visible = true;
      }
      if (transition.current.t >= 1) {
        if (transition.current.kind === "enter") {
          setGameState({ mode: "driving", nearCar: false, prompt: null, engineOn: true, interactTarget: null });
          if (player.current) player.current.visible = false;
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
      // Vehicle feel: accel / brake / reverse / steer / inertia / friction
      if (forward) velocity.current = Math.min(MAX_SPEED, velocity.current + ACCEL * dt);
      if (back) {
        if (velocity.current > 0.4) velocity.current = Math.max(0, velocity.current - BRAKE * 0.7 * dt);
        else velocity.current = Math.max(-MAX_SPEED * 0.4, velocity.current - ACCEL * 0.55 * dt);
      }
      if (brake) {
        if (velocity.current > 0) velocity.current = Math.max(0, velocity.current - BRAKE * dt);
        else velocity.current = Math.min(0, velocity.current + BRAKE * dt);
      }
      const drag = DRAG + (forward || back ? 0 : 5.5);
      if (velocity.current > 0) velocity.current = Math.max(0, velocity.current - drag * dt);
      if (velocity.current < 0) velocity.current = Math.min(0, velocity.current + drag * dt);

      const speedFactor = THREE.MathUtils.clamp(Math.abs(velocity.current) / MAX_SPEED, 0.12, 1);
      if (left) yaw.current += TURN_RATE * speedFactor * Math.sign(velocity.current || 1) * dt;
      if (right) yaw.current -= TURN_RATE * speedFactor * Math.sign(velocity.current || 1) * dt;

      tmp.current.set(Math.sin(yaw.current), 0, Math.cos(yaw.current));
      pos.current.addScaledVector(tmp.current, velocity.current * dt);
      pos.current.addScaledVector(roadCorrectionForce(pos.current, ROAD_WIDTH * 0.42), dt);
      clampToRoad(pos.current, ROAD_WIDTH * 0.48);

      const sample = nearestRoadSample(pos.current);
      if (sample.t < 0.015 || sample.t > 0.985) {
        const safe = sampleRoad(THREE.MathUtils.clamp(sample.t, 0.015, 0.985));
        pos.current.x = THREE.MathUtils.lerp(pos.current.x, safe.position.x, 0.4);
        pos.current.z = THREE.MathUtils.lerp(pos.current.z, safe.position.z, 0.4);
        if ((sample.t < 0.015 && velocity.current < 0) || (sample.t > 0.985 && velocity.current > 0)) {
          velocity.current *= 0.4;
        }
      }

      if (Math.abs(velocity.current) > 2) {
        const desiredYaw = Math.atan2(sample.tangent.x, sample.tangent.z);
        let dy = desiredYaw - yaw.current;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        yaw.current += dy * 0.035;
      }
      pos.current.y = sample.position.y;

      // Light suspension
      const groundDelta = sample.position.y - prevGround.current;
      suspension.current = THREE.MathUtils.lerp(suspension.current, -groundDelta * 2.5, 0.15);
      suspension.current *= 1 - 4 * dt;
      prevGround.current = sample.position.y;

      const ahead = sampleRoad(THREE.MathUtils.clamp(sample.t + 0.012, 0, 1));
      const pitch = Math.atan2(ahead.position.y - sample.position.y, 2.2) * 0.9;

      if (car.current) {
        car.current.position.set(pos.current.x, sample.position.y + 0.05 + suspension.current, pos.current.z);
        car.current.rotation.order = "YXZ";
        car.current.rotation.y = yaw.current;
        car.current.rotation.x = THREE.MathUtils.lerp(car.current.rotation.x, pitch, 0.14);
        car.current.rotation.z = THREE.MathUtils.lerp(
          car.current.rotation.z,
          ((left ? 1 : 0) - (right ? 1 : 0)) * 0.06,
          0.12,
        );
        car.current.userData.setWheelSpin?.(velocity.current * dt * 2.8);
        car.current.userData.setSteer?.(((left ? 1 : 0) - (right ? 1 : 0)) * 0.55);
      }

      const distStop = Math.hypot(pos.current.x - stopPos.x, pos.current.z - stopPos.z);
      const nearBelvedereZone = distStop < 16;
      // Strong assist on the stop pad so exit is always catchable
      if (distStop < 8) velocity.current *= 1 - 2.4 * dt;
      else if (nearBelvedereZone && Math.abs(velocity.current) > 6) velocity.current *= 1 - 1.6 * dt;
      const nearStop = distStop < STOP_RADIUS && Math.abs(velocity.current) < STOP_SPEED;

      // Exit car
      if (nearStop && exitCooldown.current <= 0 && !blocked && (consumeInteractPulse() || input.exit)) {
        const toward = interactPos.clone().sub(pos.current);
        toward.y = 0;
        if (toward.lengthSq() > 0.01) toward.normalize();
        else toward.set(Math.cos(yaw.current), 0, -Math.sin(yaw.current));
        const exitTo = pos.current.clone().addScaledVector(toward, EXIT_DIST);
        exitTo.y = sampleGroundHeight(exitTo.x, exitTo.z);
        transition.current = {
          kind: "exit",
          t: 0,
          from: pos.current.clone().setY(sample.position.y),
          to: exitTo,
        };
        playerPos.current.copy(pos.current);
        walkYaw.current = Math.atan2(toward.x, toward.z);
        velocity.current = 0;
        exitCooldown.current = 0.8;
        setGameState({
          mode: "walking",
          speed: 0,
          nearStopSpot: true,
          nearCar: false,
          walkYaw: walkYaw.current,
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
        prompt: nearStop ? "Descendre" : nearBelvedereZone ? "Ralentissez sur le marquage" : null,
        interactTarget: nearStop ? "exit-car" : null,
        playerPos: { x: pos.current.x, y: pos.current.y, z: pos.current.z },
      });

      if (typeof window !== "undefined") {
        (window as unknown as { __roadT?: number }).__roadT = sample.t;
      }
      return;
    }

    // ——— Walking character controller ———
    // Look (right stick / look input) — adjusts facing & pitch for camera
    if (!blocked && (Math.abs(look.x) > 0.08 || Math.abs(look.y) > 0.08)) {
      walkYaw.current -= look.x * 1.8 * dt;
      lookPitch.current = THREE.MathUtils.clamp(lookPitch.current + look.y * 1.1 * dt, -0.25, 0.45);
    }

    const moveX = (right ? 1 : 0) - (left ? 1 : 0) + (!blocked && Math.abs(touch.x) > 0.12 ? touch.x : 0);
    const moveZ = (forward ? 1 : 0) - (back ? 1 : 0) + (!blocked && Math.abs(touch.y) > 0.12 ? touch.y : 0);
    let moving = false;
    const speed = run ? RUN_SPEED : WALK_SPEED;

    if (Math.abs(moveX) > 0.01 || Math.abs(moveZ) > 0.01) {
      const basis = walkYaw.current;
      tmp.current.set(Math.sin(basis), 0, Math.cos(basis));
      sideTmp.current.set(tmp.current.z, 0, -tmp.current.x);
      const move = new THREE.Vector3()
        .addScaledVector(tmp.current, moveZ)
        .addScaledVector(sideTmp.current, moveX);
      if (move.lengthSq() > 0.001) {
        move.normalize();
        const mag = Math.min(1, Math.hypot(moveX, moveZ));
        playerVel.current.lerp(move.multiplyScalar(speed * mag), 1 - Math.exp(-12 * dt));
        // Face move direction when advancing
        if (moveZ >= -0.05 || Math.abs(moveX) > 0.25) {
          if (moveZ > 0.05 || Math.abs(moveX) >= Math.abs(moveZ)) {
            const targetYaw = Math.atan2(playerVel.current.x, playerVel.current.z);
            let dy = targetYaw - walkYaw.current;
            while (dy > Math.PI) dy -= Math.PI * 2;
            while (dy < -Math.PI) dy += Math.PI * 2;
            walkYaw.current += dy * Math.min(1, 10 * dt);
          }
        }
        moving = true;
      }
    } else {
      playerVel.current.multiplyScalar(Math.exp(-10 * dt));
    }

    playerPos.current.x += playerVel.current.x * dt;
    playerPos.current.z += playerVel.current.z * dt;

    // Ground + slope limit
    const gy = sampleGroundHeight(playerPos.current.x, playerPos.current.z);
    const prevY = playerPos.current.y;
    const targetY = gy;
    const slope = Math.abs(targetY - prevY) / Math.max(0.001, playerVel.current.length() * dt || 0.05);
    if (slope > MAX_SLOPE * 8 && targetY > prevY + 0.15) {
      // Block steep climb
      playerPos.current.x -= playerVel.current.x * dt;
      playerPos.current.z -= playerVel.current.z * dt;
      playerVel.current.set(0, 0, 0);
    } else {
      playerPos.current.y = THREE.MathUtils.lerp(prevY, targetY, 1 - Math.exp(-14 * dt));
    }

    // Soft world bounds (don't drown / leave map)
    if (playerPos.current.x < -28) playerPos.current.x = -28;
    if (playerPos.current.x > 32) playerPos.current.x = 32;
    if (playerPos.current.z > 50) playerPos.current.z = 50;
    if (playerPos.current.z < -195) playerPos.current.z = -195;

    resolveCollisions(playerPos.current, PLAYER_RADIUS, PLAYER_HEIGHT);

    if (player.current) {
      player.current.position.copy(playerPos.current);
      player.current.rotation.y = walkYaw.current;
      player.current.userData.moving = moving;
      player.current.userData.running = run && moving;
      player.current.visible = true;
    }
    if (car.current) {
      const cs = nearestRoadSample(pos.current);
      car.current.position.set(pos.current.x, cs.position.y + 0.05, pos.current.z);
      car.current.rotation.y = yaw.current;
    }

    const nearCar = playerPos.current.distanceTo(pos.current) < REENTER_RADIUS;
    const interactable = findNearestInteractable(playerPos.current, "walking");

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
        setGameState({ walkYaw: yaw.current, prompt: null, interactTarget: null });
      }
    }

    setGameState({
      speed: 0,
      nearCar,
      nearBelvedere: interactTarget === "carnet",
      nearStopSpot: true,
      prompt,
      interactTarget,
      walkYaw: walkYaw.current,
      lookPitch: lookPitch.current,
      playerPos: { x: playerPos.current.x, y: playerPos.current.y, z: playerPos.current.z },
      carPos: { x: pos.current.x, y: pos.current.y, z: pos.current.z },
    });
  });

  return (
    <group>
      <group ref={car}>
        <Convertible color="#c45c3e" />
      </group>
      <group ref={player}>
        <ExplorerAvatar />
      </group>
    </group>
  );
}

function ExplorerAvatar() {
  const { scene } = useGLTF("/models/explorer.glb");
  const group = useRef<THREE.Group>(null);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  useFrame(({ clock }) => {
    const { mode } = getGameState();
    if (!group.current) return;
    group.current.visible = mode === "walking";
    if (mode !== "walking") return;
    const moving = Boolean(group.current.parent?.userData.moving);
    const running = Boolean(group.current.parent?.userData.running);
    const freq = running ? 11 : 8;
    const amp = running ? 0.055 : 0.035;
    const bob = moving ? Math.sin(clock.elapsedTime * freq) * amp : 0;
    group.current.position.y = bob;
  });

  return (
    <group ref={group} visible={false}>
      <primitive object={model} />
    </group>
  );
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

useGLTF.preload("/models/explorer.glb");
