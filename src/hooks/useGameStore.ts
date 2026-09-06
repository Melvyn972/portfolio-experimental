"use client";

import { useSyncExternalStore } from "react";
import { getGameState, subscribeGame, type GameState } from "@/lib/gameStore";

export function useGameStore(): GameState {
  return useSyncExternalStore(subscribeGame, getGameState, getGameState);
}
