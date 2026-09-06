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
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "w", "a", "s", "d", "z", "q"].includes(k)) {
        e.preventDefault();
      }
      if (k === "arrowup" || k === "w" || k === "z") inputRef.current.forward = true;
      if (k === "arrowdown" || k === "s") inputRef.current.back = true;
      if (k === "arrowleft" || k === "a" || k === "q") inputRef.current.left = true;
      if (k === "arrowright" || k === "d") inputRef.current.right = true;
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
      if (k === "arrowup" || k === "w" || k === "z") inputRef.current.forward = false;
      if (k === "arrowdown" || k === "s") inputRef.current.back = false;
      if (k === "arrowleft" || k === "a" || k === "q") inputRef.current.left = false;
      if (k === "arrowright" || k === "d") inputRef.current.right = false;
      if (k === " ") inputRef.current.brake = false;
      if (k === "shift") inputRef.current.run = false;
      if (k === "e" || k === "f") {
        inputRef.current.interact = false;
        inputRef.current.exit = false;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!document.pointerLockElement) return;
      inputRef.lookDelta.x += e.movementX * 0.0022;
      inputRef.lookDelta.y -= e.movementY * 0.0018;
    };

    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up);
    window.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("mousemove", onMouseMove);
      inputRef.current = { ...empty };
    };
  }, []);
}

export function consumeInteractPulse() {
  if (inputRef.interactPulse > 0) {
    inputRef.interactPulse = 0;
    return true;
  }
  return false;
}
