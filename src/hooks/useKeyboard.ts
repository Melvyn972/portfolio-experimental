"use client";

import { useEffect, useRef } from "react";

export interface InputState {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  brake: boolean;
  interact: boolean;
  exit: boolean;
}

const empty: InputState = {
  forward: false,
  back: false,
  left: false,
  right: false,
  brake: false,
  interact: false,
  exit: false,
};

/** Mutable input shared with the R3F frame loop. */
export const inputRef: { current: InputState; touch: { x: number; y: number }; interactPulse: number } = {
  current: { ...empty },
  touch: { x: 0, y: 0 },
  interactPulse: 0,
};

export function useKeyboard() {
  const ready = useRef(false);

  useEffect(() => {
    if (ready.current) return;
    ready.current = true;

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
      if (k === "e" || k === "f") {
        inputRef.current.interact = true;
        inputRef.interactPulse = 1;
        inputRef.current.exit = true;
      }
    };

    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w" || k === "z") inputRef.current.forward = false;
      if (k === "arrowdown" || k === "s") inputRef.current.back = false;
      if (k === "arrowleft" || k === "a" || k === "q") inputRef.current.left = false;
      if (k === "arrowright" || k === "d") inputRef.current.right = false;
      if (k === " ") inputRef.current.brake = false;
      if (k === "e" || k === "f") {
        inputRef.current.interact = false;
        inputRef.current.exit = false;
      }
    };

    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
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
