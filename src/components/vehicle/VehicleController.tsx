"use client";

import { useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Convertible } from "./Convertible";
import { inputRef, consumeInteractPulse } from "@/hooks/useKeyboard";
import { getGameState, setGameState, menusBlockInput } from "@/lib/gameStore";
import {
  nearestRoadSample,
  roadCorrectionForce,
  clampToRoad,
  sampleRoad,
  START_POSE,
  ROAD_WIDTH,
} from "@/lib/road";
import { getBelvedereInteractPosition, getBelvedereStopPosition } from "@/components/world/Belvedere";

const MAX_SPEED = 22;
const ACCEL = 14;
const BRAKE = 28;
const DRAG = 3.2;
const TURN_RATE = 1.55;
const WALK_SPEED = 4.2;
const EXIT_DIST = 5.5;
const STOP_RADIUS = 3.6;
const REENTER_RADIUS = 3.4;
const CARNET_RADIUS = 4.5;

export function VehicleController() {
  const car = useRef<THREE.Group>(null);
  const player = useRef<THREE.Group>(null);
  const velocity = useRef(0);
  const yaw = useRef(Math.atan2(START_POSE.tangent.x, START_POSE.tangent.z));
  const walkYaw = useRef(yaw.current);
  const pos = useRef(START_POSE.position.clone());
  const playerPos = useRef(new THREE.Vector3());
  const tmp = useRef(new THREE.Vector3());
  const sideTmp = useRef(new THREE.Vector3());
  const initialized = useRef(false);
  const exitCooldown = useRef(0);
  const transitioning = useRef(0);

  useFrame((_, dt) => {
    const state = getGameState();
    if (state.phase === "boot") return;

    if (!initialized.current) {
      pos.current.copy(START_POSE.position);
      yaw.current = Math.atan2(START_POSE.tangent.x, START_POSE.tangent.z);
      walkYaw.current = yaw.current;
      if (car.current) {
        car.current.position.copy(pos.current);
        car.current.position.y = 0.02;
        car.current.rotation.y = yaw.current;
      }
      initialized.current = true;
      setGameState({
        carPos: { x: pos.current.x, y: pos.current.y, z: pos.current.z },
        carYaw: yaw.current,
        walkYaw: yaw.current,
      });
    }

    if (state.identityOpen || state.phase === "intro") {
      if (car.current) {
        const y = nearestRoadSample(pos.current).position.y + 0.02;
        car.current.position.set(pos.current.x, y, pos.current.z);
        car.current.rotation.y = yaw.current;
      }
      return;
    }

    if (menusBlockInput() && state.phase === "playing" && state.rescueOpen) {
      // Keep visuals frozen in place while menu is open
      return;
    }

    exitCooldown.current = Math.max(0, exitCooldown.current - dt);
    transitioning.current = Math.max(0, transitioning.current - dt);

    const input = inputRef.current;
    const touch = inputRef.touch;
    const blocked = state.rescueOpen || state.identityOpen;
    const forward = !blocked && (input.forward || touch.y > 0.25);
    const back = !blocked && (input.back || touch.y < -0.25);
    const left = !blocked && (input.left || touch.x < -0.25);
    const right = !blocked && (input.right || touch.x > 0.25);
    const brake = !blocked && input.brake;

    const stopPos = getBelvedereStopPosition();
    const interactPos = getBelvedereInteractPosition();

    if (state.showExplorerHint && (forward || back || left || right || Math.abs(touch.x) > 0.2 || Math.abs(touch.y) > 0.2)) {
      setGameState({ showExplorerHint: false });
    }

    if (state.mode === "driving") {
      if (forward) velocity.current = Math.min(MAX_SPEED, velocity.current + ACCEL * dt);
      if (back) velocity.current = Math.max(-MAX_SPEED * 0.45, velocity.current - ACCEL * 0.7 * dt);
      if (brake) {
        if (velocity.current > 0) velocity.current = Math.max(0, velocity.current - BRAKE * dt);
        else velocity.current = Math.min(0, velocity.current + BRAKE * dt);
      }
      const drag = DRAG + (forward || back ? 0 : 4);
      if (velocity.current > 0) velocity.current = Math.max(0, velocity.current - drag * dt);
      if (velocity.current < 0) velocity.current = Math.min(0, velocity.current + drag * dt);

      const speedFactor = THREE.MathUtils.clamp(Math.abs(velocity.current) / MAX_SPEED, 0.15, 1);
      if (left) yaw.current += TURN_RATE * speedFactor * Math.sign(velocity.current || 1) * dt;
      if (right) yaw.current -= TURN_RATE * speedFactor * Math.sign(velocity.current || 1) * dt;

      tmp.current.set(Math.sin(yaw.current), 0, Math.cos(yaw.current));
      pos.current.addScaledVector(tmp.current, velocity.current * dt);
      pos.current.addScaledVector(roadCorrectionForce(pos.current, ROAD_WIDTH * 0.42), dt);
      clampToRoad(pos.current, ROAD_WIDTH * 0.48);

      const sample = nearestRoadSample(pos.current);
      if (sample.t < 0.02 || sample.t > 0.96) {
        const safe = sampleRoad(THREE.MathUtils.clamp(sample.t, 0.02, 0.96));
        pos.current.x = THREE.MathUtils.lerp(pos.current.x, safe.position.x, 0.35);
        pos.current.z = THREE.MathUtils.lerp(pos.current.z, safe.position.z, 0.35);
        if ((sample.t < 0.02 && velocity.current < 0) || (sample.t > 0.96 && velocity.current > 0)) {
          velocity.current *= 0.5;
        }
        if (sample.t > 0.98) velocity.current = Math.min(velocity.current, 0);
        if (sample.t < 0.02) velocity.current = Math.max(velocity.current, 0);
      }

      if (Math.abs(velocity.current) > 2) {
        const desiredYaw = Math.atan2(sample.tangent.x, sample.tangent.z);
        let dy = desiredYaw - yaw.current;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        yaw.current += dy * 0.04;
      }
      pos.current.y = sample.position.y;

      // Light pitch from road slope (next sample)
      const ahead = sampleRoad(THREE.MathUtils.clamp(sample.t + 0.01, 0, 1));
      const pitch = Math.atan2(ahead.position.y - sample.position.y, 2.0) * 0.85;

      if (car.current) {
        car.current.position.set(pos.current.x, sample.position.y + 0.02, pos.current.z);
        car.current.rotation.order = "YXZ";
        car.current.rotation.y = yaw.current;
        car.current.rotation.x = THREE.MathUtils.lerp(car.current.rotation.x, pitch, 0.12);
        car.current.rotation.z = THREE.MathUtils.lerp(
          car.current.rotation.z,
          ((left ? 1 : 0) - (right ? 1 : 0)) * 0.05,
          0.1,
        );
        car.current.userData.setWheelSpin?.(velocity.current * dt * 1.4);
        car.current.userData.setSteer?.(((left ? 1 : 0) - (right ? 1 : 0)) * 0.45);
      }

      const distStop = Math.hypot(pos.current.x - stopPos.x, pos.current.z - stopPos.z);
      const nearStop = distStop < STOP_RADIUS && Math.abs(velocity.current) < 3.5;
      const nearBelvedereZone = distStop < 14;

      if (nearBelvedereZone && Math.abs(velocity.current) > 6) {
        velocity.current *= 1 - 1.8 * dt;
      }

      if (nearStop && exitCooldown.current <= 0 && !blocked && (consumeInteractPulse() || input.exit)) {
        const towardBelvedere = interactPos.clone().sub(pos.current);
        towardBelvedere.y = 0;
        if (towardBelvedere.lengthSq() > 0.01) towardBelvedere.normalize();
        else towardBelvedere.set(Math.cos(yaw.current), 0, -Math.sin(yaw.current));
        playerPos.current.copy(pos.current).addScaledVector(towardBelvedere, EXIT_DIST);
        playerPos.current.y = Math.max(sample.position.y, 0.95);
        walkYaw.current = Math.atan2(towardBelvedere.x, towardBelvedere.z);
        velocity.current = 0;
        exitCooldown.current = 0.75;
        transitioning.current = 0.55;
        setGameState({
          mode: "walking",
          speed: 0,
          nearStopSpot: true,
          nearCar: false,
          walkYaw: walkYaw.current,
          prompt: "Rejoindre le belvédère",
          engineOn: true,
          playerPos: { x: playerPos.current.x, y: playerPos.current.y, z: playerPos.current.z },
        });
      }

      setGameState({
        speed: Math.abs(velocity.current),
        carPos: { x: pos.current.x, y: pos.current.y, z: pos.current.z },
        carYaw: yaw.current,
        walkYaw: yaw.current,
        nearStopSpot: nearStop,
        nearCar: false,
        prompt: nearStop
          ? "E — Descendre au belvédère"
          : nearBelvedereZone
            ? "Ralentissez sur le marquage"
            : null,
        playerPos: { x: pos.current.x, y: pos.current.y, z: pos.current.z },
      });

      if (typeof window !== "undefined") {
        (window as unknown as { __roadT?: number }).__roadT = sample.t;
      }
      return;
    }

    // Walking — movement relative to current facing; don't flip yaw when only reversing
    const moveX = (right ? 1 : 0) - (left ? 1 : 0) + (!blocked && Math.abs(touch.x) > 0.15 ? touch.x : 0);
    const moveZ = (forward ? 1 : 0) - (back ? 1 : 0) + (!blocked && Math.abs(touch.y) > 0.15 ? touch.y : 0);
    let moving = false;

    if (Math.abs(moveX) > 0.01 || Math.abs(moveZ) > 0.01) {
      const basis = walkYaw.current;
      tmp.current.set(Math.sin(basis), 0, Math.cos(basis));
      sideTmp.current.set(tmp.current.z, 0, -tmp.current.x);
      const move = new THREE.Vector3()
        .addScaledVector(tmp.current, moveZ)
        .addScaledVector(sideTmp.current, moveX);
      if (move.lengthSq() > 0.001) {
        move.normalize();
        playerPos.current.addScaledVector(move, WALK_SPEED * dt);
        // Update facing when advancing or strafing — never when purely reversing
        // (pure reverse would flip yaw each frame and cancel movement).
        if (moveZ >= -0.01 || Math.abs(moveX) > 0.2) {
          if (moveZ > 0.05 || Math.abs(moveX) >= Math.abs(moveZ)) {
            walkYaw.current = Math.atan2(move.x, move.z);
          }
        }
        moving = true;
      }
    }

    const distCarnet = Math.hypot(playerPos.current.x - interactPos.x, playerPos.current.z - interactPos.z);
    if (distCarnet < 9) {
      playerPos.current.y = THREE.MathUtils.lerp(playerPos.current.y, 1.05, 0.18);
    } else {
      playerPos.current.y = nearestRoadSample(playerPos.current).position.y;
    }

    const latSample = nearestRoadSample(playerPos.current);
    if (Math.abs(latSample.lateral) > 18) {
      sideTmp.current.set(-latSample.tangent.z, 0, latSample.tangent.x);
      playerPos.current.addScaledVector(sideTmp.current, -Math.sign(latSample.lateral) * 0.25);
    }

    if (player.current) {
      player.current.position.set(playerPos.current.x, playerPos.current.y, playerPos.current.z);
      player.current.rotation.y = walkYaw.current;
      player.current.userData.moving = moving;
    }
    if (car.current) {
      const cs = nearestRoadSample(pos.current);
      car.current.position.set(pos.current.x, cs.position.y + 0.02, pos.current.z);
      car.current.rotation.y = yaw.current;
    }

    const nearCar = playerPos.current.distanceTo(pos.current) < REENTER_RADIUS;
    const nearBelvedere = distCarnet < CARNET_RADIUS;
    let prompt: string | null = null;
    if (nearBelvedere) prompt = "E — Consulter le carnet";
    else if (nearCar) prompt = "E — Monter";
    else prompt = "Rejoindre le belvédère";

    if (exitCooldown.current <= 0 && !blocked && consumeInteractPulse()) {
      if (nearBelvedere) {
        setGameState({ identityOpen: true, prompt: null });
      } else if (nearCar) {
        exitCooldown.current = 0.75;
        transitioning.current = 0.45;
        walkYaw.current = yaw.current;
        setGameState({
          mode: "driving",
          nearCar: false,
          nearBelvedere: false,
          prompt: null,
          engineOn: true,
          walkYaw: yaw.current,
        });
      }
    }

    setGameState({
      speed: 0,
      nearCar,
      nearBelvedere,
      nearStopSpot: true,
      prompt,
      walkYaw: walkYaw.current,
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
    const bob = moving ? Math.sin(clock.elapsedTime * 8) * 0.04 : 0;
    group.current.position.y = bob;
  });

  return (
    <group ref={group} visible={false}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload("/models/explorer.glb");
