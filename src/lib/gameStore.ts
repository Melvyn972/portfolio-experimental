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
  prompt: null,
};

export function getGameState() {
  return state;
}

export function setGameState(partial: Partial<GameState>) {
  state = { ...state, ...partial };
  listeners.forEach((l) => l());
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
