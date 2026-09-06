"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Convertible } from "./Convertible";
import { inputRef, consumeInteractPulse } from "@/hooks/useKeyboard";
import { getGameState, setGameState } from "@/lib/gameStore";
import { nearestRoadSample, roadCorrectionForce, clampToRoad, sampleRoad, START_POSE, ROAD_WIDTH, BELVEDERE_T } from "@/lib/road";
import { getBelvedereInteractPosition, getBelvedereStopPosition } from "@/components/world/Belvedere";

const MAX_SPEED = 22;
const ACCEL = 14;
const BRAKE = 28;
const DRAG = 3.2;
const TURN_RATE = 1.55;
const WALK_SPEED = 4.2;

export function VehicleController() {
  const car = useRef<THREE.Group>(null);
  const player = useRef<THREE.Group>(null);
  const velocity = useRef(0);
  const yaw = useRef(Math.atan2(START_POSE.tangent.x, START_POSE.tangent.z));
  const pos = useRef(START_POSE.position.clone());
  const playerPos = useRef(new THREE.Vector3());
  const tmp = useRef(new THREE.Vector3());
  const initialized = useRef(false);
  const exitCooldown = useRef(0);

  useFrame((_, dt) => {
    const state = getGameState();
    if (state.phase === "boot") return;

    if (!initialized.current) {
      pos.current.copy(START_POSE.position);
      yaw.current = Math.atan2(START_POSE.tangent.x, START_POSE.tangent.z);
      if (car.current) {
        car.current.position.copy(pos.current);
        car.current.position.y = 0.02;
        car.current.rotation.y = yaw.current;
      }
      initialized.current = true;
      setGameState({
        carPos: { x: pos.current.x, y: pos.current.y, z: pos.current.z },
        carYaw: yaw.current,
      });
    }

    if (state.identityOpen || state.phase === "intro") {
      if (car.current) {
        car.current.position.set(pos.current.x, nearestRoadSample(pos.current).position.y + 0.02, pos.current.z);
        car.current.rotation.y = yaw.current;
      }
      return;
    }

    exitCooldown.current = Math.max(0, exitCooldown.current - dt);
    const input = inputRef.current;
    const touch = inputRef.touch;
    const forward = input.forward || touch.y > 0.25;
    const back = input.back || touch.y < -0.25;
    const left = input.left || touch.x < -0.25;
    const right = input.right || touch.x > 0.25;

    const stopPos = getBelvedereStopPosition();
    const interactPos = getBelvedereInteractPosition();

    // Clear explorer hint on first drive input
    if (state.showExplorerHint && (forward || back || left || right || Math.abs(touch.x) > 0.2 || Math.abs(touch.y) > 0.2)) {
      setGameState({ showExplorerHint: false });
    }

    if (state.mode === "driving") {
      if (forward) velocity.current = Math.min(MAX_SPEED, velocity.current + ACCEL * dt);
      if (back) velocity.current = Math.max(-MAX_SPEED * 0.45, velocity.current - ACCEL * 0.7 * dt);
      if (input.brake) {
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
      // Keep on the playable ribbon length
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
      // Light assist: ease yaw toward road tangent while moving
      if (Math.abs(velocity.current) > 2) {
        const desiredYaw = Math.atan2(sample.tangent.x, sample.tangent.z);
        let dy = desiredYaw - yaw.current;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        yaw.current += dy * 0.04;
      }
      pos.current.y = sample.position.y;

      if (car.current) {
        car.current.position.set(pos.current.x, sample.position.y + 0.02, pos.current.z);
        car.current.rotation.y = yaw.current;
        car.current.rotation.z = THREE.MathUtils.lerp(
          car.current.rotation.z,
          ((left ? 1 : 0) - (right ? 1 : 0)) * 0.05,
          0.1,
        );
        car.current.userData.setWheelSpin?.(velocity.current * dt * 1.4);
        car.current.userData.setSteer?.(((left ? 1 : 0) - (right ? 1 : 0)) * 0.45);
      }

      const nearBelvedereZone = Math.abs(sample.t - BELVEDERE_T) < 0.08;
      const nearStop = nearBelvedereZone && Math.abs(velocity.current) < 4;

      // Soft speed dampener near the belvedere so the stop is catchable
      if (nearBelvedereZone && Math.abs(velocity.current) > 6) {
        velocity.current *= 1 - 1.8 * dt;
      }

      if (nearStop && exitCooldown.current <= 0 && (consumeInteractPulse() || input.exit)) {
        const towardBelvedere = interactPos.clone().sub(pos.current);
        towardBelvedere.y = 0;
        if (towardBelvedere.lengthSq() > 0.01) towardBelvedere.normalize();
        else towardBelvedere.set(Math.cos(yaw.current), 0, -Math.sin(yaw.current));
        playerPos.current.copy(pos.current).addScaledVector(towardBelvedere, 5.5);
        playerPos.current.y = Math.max(sample.position.y, 0.9);
        velocity.current = 0;
        exitCooldown.current = 0.6;
        setGameState({
          mode: "walking",
          speed: 0,
          nearStopSpot: true,
          nearCar: false,
          prompt: "Rejoindre le belvédère · E pour lire le carnet",
          engineOn: true,
        });
      }

      setGameState({
        speed: Math.abs(velocity.current),
        carPos: { x: pos.current.x, y: pos.current.y, z: pos.current.z },
        carYaw: yaw.current,
        nearStopSpot: nearStop,
        nearCar: false,
        prompt: nearStop
          ? "E / Descendre — Belvédère"
          : nearBelvedereZone
            ? "Ralentissez pour descendre"
            : null,
        playerPos: { x: pos.current.x, y: pos.current.y, z: pos.current.z },
      });
      // stash road t for QA
      if (typeof window !== "undefined") {
        (window as unknown as { __roadT?: number }).__roadT = sample.t;
      }
      return;
    }

    // Walking
    const moveX = (right ? 1 : 0) - (left ? 1 : 0) + (Math.abs(touch.x) > 0.15 ? touch.x : 0);
    const moveZ = (forward ? 1 : 0) - (back ? 1 : 0) + (Math.abs(touch.y) > 0.15 ? touch.y : 0);

    if (Math.abs(moveX) > 0.01 || Math.abs(moveZ) > 0.01) {
      const forwardDir = new THREE.Vector3(Math.sin(yaw.current), 0, Math.cos(yaw.current));
      const rightDir = new THREE.Vector3(forwardDir.z, 0, -forwardDir.x);
      tmp.current
        .set(0, 0, 0)
        .addScaledVector(forwardDir, moveZ)
        .addScaledVector(rightDir, moveX);
      if (tmp.current.lengthSq() > 0.001) {
        tmp.current.normalize();
        playerPos.current.addScaledVector(tmp.current, WALK_SPEED * dt);
      }
    }

    // Height: terrace near carnet, else road/ground sample
    const distCarnet = playerPos.current.distanceTo(interactPos);
    if (distCarnet < 8) {
      playerPos.current.y = THREE.MathUtils.lerp(playerPos.current.y, 1.05, 0.15);
    } else {
      playerPos.current.y = nearestRoadSample(playerPos.current).position.y;
    }

    // Soft bounds around coast slice
    const lat = nearestRoadSample(playerPos.current).lateral;
    if (Math.abs(lat) > 18) {
      const sample = nearestRoadSample(playerPos.current);
      const side = new THREE.Vector3(-sample.tangent.z, 0, sample.tangent.x);
      playerPos.current.addScaledVector(side, -Math.sign(lat) * 0.25);
    }

    if (player.current) {
      player.current.position.set(playerPos.current.x, playerPos.current.y + 0.9, playerPos.current.z);
    }
    if (car.current) {
      const cs = nearestRoadSample(pos.current);
      car.current.position.set(pos.current.x, cs.position.y + 0.02, pos.current.z);
      car.current.rotation.y = yaw.current;
    }

    const nearCar = playerPos.current.distanceTo(pos.current) < 2.8;
    const nearBelvedere = playerPos.current.distanceTo(interactPos) < 4.0;
    let prompt: string | null = null;
    if (nearBelvedere) prompt = "E — Consulter le carnet";
    else if (nearCar) prompt = "E — Monter";
    else prompt = "Rejoindre le belvédère";

    if (exitCooldown.current <= 0 && consumeInteractPulse()) {
      if (nearBelvedere) {
        setGameState({ identityOpen: true, prompt: null });
      } else if (nearCar) {
        exitCooldown.current = 0.6;
        setGameState({
          mode: "driving",
          nearCar: false,
          nearBelvedere: false,
          prompt: null,
          engineOn: true,
        });
      }
    }

    setGameState({
      speed: 0,
      nearCar,
      nearBelvedere,
      nearStopSpot: true,
      prompt,
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
        <AvatarMesh />
      </group>
    </group>
  );
}

function AvatarMesh() {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const { mode } = getGameState();
    if (ref.current) ref.current.visible = mode === "walking";
  });
  return (
    <group ref={ref} visible={false}>
      <mesh castShadow>
        <capsuleGeometry args={[0.28, 0.7, 4, 8]} />
        <meshStandardMaterial color="#3d4f5c" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.65, 0]} castShadow>
        <sphereGeometry args={[0.22, 10, 10]} />
        <meshStandardMaterial color="#d6b39a" roughness={0.6} />
      </mesh>
    </group>
  );
}
