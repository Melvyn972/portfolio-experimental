"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import { getGameState, subscribeGame, type GameState } from "@/lib/gameStore";

/**
 * Subscribe to game state. Pass a selector so pose ticks (carPos/speed)
 * do not re-render the R3F tree — that remount storm was Chrome Error 9.
 */
export function useGameStore(): GameState;
export function useGameStore<T>(selector: (s: GameState) => T, isEqual?: (a: T, b: T) => boolean): T;
export function useGameStore<T = GameState>(
  selector?: (s: GameState) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  const eqRef = useRef(isEqual);
  eqRef.current = isEqual;
  const cache = useRef<T>(selector ? selector(getGameState()) : (getGameState() as unknown as T));

  const getSnapshot = useCallback(() => {
    const sel = selectorRef.current;
    const next = sel ? sel(getGameState()) : (getGameState() as unknown as T);
    if (eqRef.current(cache.current, next)) return cache.current;
    cache.current = next;
    return next;
  }, []);

  return useSyncExternalStore(subscribeGame, getSnapshot, getSnapshot);
}
