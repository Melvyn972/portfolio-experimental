"use client";

import { useEffect } from "react";
import { getGameState, setGameState } from "@/lib/gameStore";

/**
 * Progressive load stages:
 * 0 boot → 1 core/world → 2 vehicle/player → 3 details/FX
 */
export function ProgressiveLoader() {
  useEffect(() => {
    const timers = [
      window.setTimeout(() => setGameState({ loadStage: 1 }), 80),
      window.setTimeout(() => setGameState({ loadStage: 2 }), 280),
      window.setTimeout(() => setGameState({ loadStage: 3 }), 900),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    // Ensure stage advances even if already past boot
    if (getGameState().loadStage === 0) setGameState({ loadStage: 1 });
  }, []);

  return null;
}
