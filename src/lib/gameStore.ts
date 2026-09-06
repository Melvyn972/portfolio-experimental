export type GamePhase = "boot" | "intro" | "playing";
export type ControlMode = "driving" | "walking";
export type QualityPreset = "auto" | "high" | "eco";

export interface GameState {
  phase: GamePhase;
  mode: ControlMode;
  muted: boolean;
  quality: QualityPreset;
  speed: number;
  nearCar: boolean;
  nearBelvedere: boolean;
  nearStopSpot: boolean;
  identityOpen: boolean;
  showExplorerHint: boolean;
  rescueOpen: boolean;
  engineOn: boolean;
  playerPos: { x: number; y: number; z: number };
  carPos: { x: number; y: number; z: number };
  carYaw: number;
  walkYaw: number;
  prompt: string | null;
}

type Listener = () => void;

const listeners = new Set<Listener>();

let state: GameState = {
  phase: "boot",
  mode: "driving",
  muted: false,
  quality: "auto",
  speed: 0,
  nearCar: false,
  nearBelvedere: false,
  nearStopSpot: false,
  identityOpen: false,
  showExplorerHint: false,
  rescueOpen: false,
  engineOn: false,
  playerPos: { x: 0, y: 0, z: 0 },
  carPos: { x: 0, y: 0, z: 0 },
  carYaw: 0,
  walkYaw: 0,
  prompt: null,
};

function shallowEqualPos(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
  eps = 0.08,
) {
  return Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps && Math.abs(a.z - b.z) < eps;
}

export function getGameState() {
  return state;
}

/** Push state; skips notify when nothing UI-relevant changed. */
export function setGameState(partial: Partial<GameState>) {
  let changed = false;
  const next = { ...state };

  for (const key of Object.keys(partial) as (keyof GameState)[]) {
    const value = partial[key];
    if (value === undefined) continue;

    if (key === "playerPos" || key === "carPos") {
      const cur = state[key];
      const val = value as { x: number; y: number; z: number };
      if (!shallowEqualPos(cur, val)) {
        next[key] = val;
        changed = true;
      }
      continue;
    }

    if (key === "speed" || key === "carYaw" || key === "walkYaw") {
      const cur = state[key] as number;
      const val = value as number;
      const eps = key === "speed" ? 0.15 : 0.02;
      if (Math.abs(cur - val) >= eps) {
        (next as Record<string, unknown>)[key] = val;
        changed = true;
      }
      continue;
    }

    if (state[key] !== value) {
      (next as Record<string, unknown>)[key] = value;
      changed = true;
    }
  }

  if (!changed) return;
  state = next;
  listeners.forEach((l) => l());
}

/** Dev helper for Playwright / QA */
if (typeof window !== "undefined") {
  (window as unknown as { __coteMelvyn?: { getState: typeof getGameState } }).__coteMelvyn = {
    getState: getGameState,
  };
}

export function subscribeGame(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function toggleMute() {
  setGameState({ muted: !state.muted });
}

export function setQuality(quality: QualityPreset) {
  setGameState({ quality });
}

export function menusBlockInput() {
  return state.identityOpen || state.rescueOpen || state.phase !== "playing";
}
