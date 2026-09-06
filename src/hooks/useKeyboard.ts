"use client";

import { useEffect } from "react";
import { tryOpenCurrentInteractable } from "@/lib/gameStore";

export interface InputState {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  brake: boolean;
  run: boolean;
  interact: boolean;
  exit: boolean;
}

const empty: InputState = {
  forward: false,
  back: false,
  left: false,
  right: false,
  brake: false,
  run: false,
  interact: false,
  exit: false,
};

/**
 * Mutable input shared with the R3F frame loop.
 * touch = left stick (move), look = right stick / mouse look
 */
export const inputRef: {
  current: InputState;
  touch: { x: number; y: number };
  look: { x: number; y: number };
  /** Mouse look deltas (consumed each frame). Not a held axis. */
  lookDelta: { x: number; y: number };
  interactPulse: number;
} = {
  current: { ...empty },
  touch: { x: 0, y: 0 },
  look: { x: 0, y: 0 },
  lookDelta: { x: 0, y: 0 },
  interactPulse: 0,
};

/**
 * Dual layout: AZERTY ZQSD + QWERTY WASD + arrows.
 * Uses both event.code (physical key) and event.key (character)
 * so W and Z both mean forward, A and Q both mean left — Melvyn
 * on AZERTY and a QWERTY parent never see “the other layout inverted”.
 */
function axisFromEvent(e: KeyboardEvent): "forward" | "back" | "left" | "right" | null {
  const k = e.key.toLowerCase();
  const c = e.code;
  if (c === "KeyW" || c === "KeyZ" || c === "ArrowUp" || k === "w" || k === "z" || k === "arrowup") return "forward";
  if (c === "KeyS" || c === "ArrowDown" || k === "s" || k === "arrowdown") return "back";
  if (c === "KeyA" || c === "KeyQ" || c === "ArrowLeft" || k === "a" || k === "q" || k === "arrowleft") return "left";
  if (c === "KeyD" || c === "ArrowRight" || k === "d" || k === "arrowright") return "right";
  return null;
}

export function useKeyboard() {
  useEffect(() => {
    const api = (
      window as unknown as {
        __coteMelvyn?: {
          setWalkStick?: (x: number, y: number) => void;
          setLookStick?: (x: number, y: number) => void;
        };
      }
    ).__coteMelvyn;
    if (api) {
      api.setWalkStick = (x, y) => {
        inputRef.touch.x = Number.isFinite(x) ? Math.max(-1, Math.min(1, x)) : 0;
        inputRef.touch.y = Number.isFinite(y) ? Math.max(-1, Math.min(1, y)) : 0;
      };
      api.setLookStick = (x, y) => {
        inputRef.look.x = Number.isFinite(x) ? Math.max(-1, Math.min(1, x)) : 0;
        inputRef.look.y = Number.isFinite(y) ? Math.max(-1, Math.min(1, y)) : 0;
      };
    }
  }, []);

  useEffect(() => {
    const held = new Set<string>();

    const sync = () => {
      let forward = false;
      let back = false;
      let left = false;
      let right = false;
      for (const token of held) {
        if (token.startsWith("forward:")) forward = true;
        else if (token.startsWith("back:")) back = true;
        else if (token.startsWith("left:")) left = true;
        else if (token.startsWith("right:")) right = true;
      }
      inputRef.current.forward = forward;
      inputRef.current.back = back;
      inputRef.current.left = left;
      inputRef.current.right = right;
    };

    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const axis = axisFromEvent(e);
      if (axis || k === " " || k === "shift") e.preventDefault();
      if (axis) {
        held.add(`${axis}:${e.code || k}`);
        sync();
      }
      if (k === " ") inputRef.current.brake = true;
      if (k === "shift") inputRef.current.run = true;
      if (k === "e" || k === "f") {
        inputRef.current.interact = true;
        inputRef.interactPulse = 1;
        inputRef.current.exit = true;
        tryOpenCurrentInteractable();
      }
      if (k === "escape" && document.pointerLockElement) {
        document.exitPointerLock();
      }
    };

    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const axis = axisFromEvent(e);
      if (axis) {
        held.delete(`${axis}:${e.code || k}`);
        if (e.code) held.delete(`${axis}:${e.code}`);
        held.delete(`${axis}:${k}`);
        sync();
      }
      if (k === " ") inputRef.current.brake = false;
      if (k === "shift") inputRef.current.run = false;
      if (k === "e" || k === "f") {
        inputRef.current.interact = false;
        inputRef.current.exit = false;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!document.pointerLockElement) return;
      // Sane look — 7uppr0w14 was ~2.5× too hot and clipped through roofs.
      const dx = THREE_CLAMP(e.movementX, -28, 28) * 0.00085;
      const dy = THREE_CLAMP(e.movementY, -28, 28) * 0.00062;
      inputRef.lookDelta.x += dx;
      inputRef.lookDelta.y -= dy;
    };

    const blur = () => {
      held.clear();
      inputRef.current = { ...empty };
    };

    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("blur", blur);
      held.clear();
      inputRef.current = { ...empty };
    };
  }, []);
}

function THREE_CLAMP(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function consumeInteractPulse() {
  if (inputRef.interactPulse > 0) {
    inputRef.interactPulse = 0;
    return true;
  }
  return false;
}
