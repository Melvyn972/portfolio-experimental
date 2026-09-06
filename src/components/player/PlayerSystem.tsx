"use client";

import { useEffect, useMemo, useRef } from "react";
import { CapsuleCollider, CuboidCollider, RigidBody, useRapier, type RapierRigidBody } from "@react-three/rapier";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { Convertible } from "@/components/vehicle/Convertible";
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
import { sampleGroundHeight, PLAYER_RADIUS, PLAYER_HEIGHT } from "@/lib/ground";
import { findNearestInteractable } from "@/lib/interaction";
import { getBelvedereInteractPosition, getBelvedereStopPosition } from "@/components/world/Belvedere";
import { isUnsafePosition, safeRespawnPosition } from "@/lib/respawn";

const MAX_SPEED = 20;
const ACCEL = 12;
const BRAKE = 30;
const DRAG = 3.4;
const TURN_RATE = 1.65;
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
  const carBody = useRef<RapierRigidBody>(null);
  const carVisual = useRef<THREE.Group>(null);
  const playerBody = useRef<RapierRigidBody>(null);
  const playerVisual = useRef<THREE.Group>(null);
  const { world, rapier } = useRapier();
  const controller = useRef<ReturnType<typeof world.createCharacterController> | null>(null);

  const velocity = useRef(0);
  const yaw = useRef(Math.atan2(START_POSE.tangent.x, START_POSE.tangent.z));
  const walkYaw = useRef(yaw.current);
  const lookPitch = useRef(0.12);
  const pos = useRef(START_POSE.position.clone());
  const playerPos = useRef(new THREE.Vector3());
  const playerVel = useRef(new THREE.Vector3());
  const tmp = useRef(new THREE.Vector3());
  const sideTmp = useRef(new THREE.Vector3());
  const desired = useRef(new THREE.Vector3());
  const initialized = useRef(false);
  const exitCooldown = useRef(0);
  const suspension = useRef(0);
  const prevGround = useRef(0);
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
    c.enableAutostep(0.45, 0.28, true);
    c.enableSnapToGround(0.55);
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
      const yPos = pos.current.y + 0.08;
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
    window.addEventListener("cote:teleport-belvedere", onTeleport);
    return () => window.removeEventListener("cote:teleport-belvedere", onTeleport);
  }, []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const state = getGameState();
    if (state.phase === "boot") return;

    if (!initialized.current) {
      pos.current.copy(START_POSE.position);
      yaw.current = Math.atan2(START_POSE.tangent.x, START_POSE.tangent.z);
      walkYaw.current = yaw.current;
      syncCar(pos.current, yaw.current, 0, 0);
      initialized.current = true;
      setGameState({
        carPos: { x: pos.current.x, y: pos.current.y, z: pos.current.z },
        carYaw: yaw.current,
        walkYaw: yaw.current,
      });
    }

    if (state.phase === "intro" || state.openChapter !== null) {
      syncCar(pos.current, yaw.current, suspension.current, 0);
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

      const groundDelta = sample.position.y - prevGround.current;
      suspension.current = THREE.MathUtils.lerp(suspension.current, -groundDelta * 2.5, 0.15);
      suspension.current *= 1 - 4 * dt;
      prevGround.current = sample.position.y;

      const ahead = sampleRoad(THREE.MathUtils.clamp(sample.t + 0.012, 0, 1));
      const pitch = Math.atan2(ahead.position.y - sample.position.y, 2.2) * 0.9;
      const roll = ((left ? 1 : 0) - (right ? 1 : 0)) * 0.06;

      syncCar(pos.current, yaw.current, suspension.current, pitch, roll);
      if (carVisual.current) {
        carVisual.current.userData.setWheelSpin?.(velocity.current * dt * 2.8);
        carVisual.current.userData.setSteer?.(((left ? 1 : 0) - (right ? 1 : 0)) * 0.55);
      }

      const distStop = Math.hypot(pos.current.x - stopPos.x, pos.current.z - stopPos.z);
      const nearBelvedereZone = distStop < 18;
      if (distStop < 10) velocity.current *= 1 - 3.2 * dt;
      else if (nearBelvedereZone && Math.abs(velocity.current) > 5) velocity.current *= 1 - 2.0 * dt;
      const nearStop = distStop < STOP_RADIUS && Math.abs(velocity.current) < STOP_SPEED;

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
        setPlayerKinematic(playerPos.current, walkYaw.current, true);
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

    // ——— Walking with Rapier CharacterController ———
    if (!blocked && (Math.abs(look.x) > 0.08 || Math.abs(look.y) > 0.08)) {
      walkYaw.current -= look.x * 1.9 * dt;
      lookPitch.current = THREE.MathUtils.clamp(lookPitch.current + look.y * 1.15 * dt, -0.28, 0.48);
    }

    const moveX = (right ? 1 : 0) - (left ? 1 : 0) + (!blocked && Math.abs(touch.x) > 0.12 ? touch.x : 0);
    const moveZ = (forward ? 1 : 0) - (back ? 1 : 0) + (!blocked && Math.abs(touch.y) > 0.12 ? touch.y : 0);
    let moving = false;
    const speed = run ? RUN_SPEED : WALK_SPEED;

    desired.current.set(0, -14 * dt, 0); // gravity step for controller

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

    desired.current.x += playerVel.current.x * dt;
    desired.current.z += playerVel.current.z * dt;

    const body = playerBody.current;
    const ctrl = controller.current;
    if (body && ctrl) {
      const colliders = body.numColliders();
      if (colliders > 0) {
        const collider = body.collider(0);
        ctrl.computeColliderMovement(collider, desired.current);
        const mv = ctrl.computedMovement();
        const t = body.translation();
        const next = { x: t.x + mv.x, y: t.y + mv.y, z: t.z + mv.z };
        body.setNextKinematicTranslation(next);
        playerPos.current.set(next.x, next.y - CAPSULE_Y, next.z);
      }
    } else {
      playerPos.current.x += desired.current.x;
      playerPos.current.z += desired.current.z;
      playerPos.current.y = sampleGroundHeight(playerPos.current.x, playerPos.current.z);
    }

    // Soft world bounds
    if (playerPos.current.x < -24) playerPos.current.x = -24;
    if (playerPos.current.x > 32) playerPos.current.x = 32;
    if (playerPos.current.z > 50) playerPos.current.z = 50;
    if (playerPos.current.z < -195) playerPos.current.z = -195;

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

    // Face quaternion for capsule body
    if (body) {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, walkYaw.current, 0));
      body.setNextKinematicRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
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

    void rapier;
  });

  function syncCar(
    p: THREE.Vector3,
    y: number,
    susp: number,
    pitch: number,
    roll = 0,
  ) {
    const yPos = p.y + 0.08 + susp;
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
    if (playerBody.current) {
      playerBody.current.setNextKinematicTranslation({
        x: feet.x,
        y: feet.y + CAPSULE_Y,
        z: feet.z,
      });
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, facing, 0));
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
        <CuboidCollider args={[0.95, 0.45, 2.0]} friction={0.8} />
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

  // Quaternius Rogue ≈ 2.8u tall → scale to ~1.7m
  return (
    <group ref={group} scale={0.62} position={[0, 0, 0]}>
      <primitive object={model} />
    </group>
  );
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

useGLTF.preload("/models/explorer.glb");
