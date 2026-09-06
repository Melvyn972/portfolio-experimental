export type GamePhase = "boot" | "intro" | "playing";
export type ControlMode = "driving" | "walking";
export type QualityPreset = "auto" | "high" | "eco";

/** Portfolio discovery chapters — map 1:1 to content/*.json */
export type ChapterId =
  | "identity"
  | "parcours"
  | "competences"
  | "projets"
  | "experiences"
  | "activite"
  | "cv"
  | "contact"
  | "passions";

export const CHAPTERS: { id: ChapterId; label: string; zone: string }[] = [
  { id: "identity", label: "Qui je suis", zone: "belvedere" },
  { id: "parcours", label: "Parcours", zone: "maison-atelier" },
  { id: "experiences", label: "Expériences", zone: "maison-atelier" },
  { id: "competences", label: "Compétences", zone: "maison-atelier" },
  { id: "projets", label: "Projets", zone: "studio" },
  { id: "passions", label: "Passions", zone: "plage" },
  { id: "activite", label: "Activité", zone: "phare" },
  { id: "cv", label: "CV", zone: "phare" },
  { id: "contact", label: "Contact", zone: "phare" },
];

export interface GameState {
  phase: GamePhase;
  mode: ControlMode;
  muted: boolean;
  quality: QualityPreset;
  speed: number;
  nearCar: boolean;
  nearBelvedere: boolean;
  nearStopSpot: boolean;
  /** Open chapter panel (null = closed) */
  openChapter: ChapterId | null;
  showExplorerHint: boolean;
  rescueOpen: boolean;
  engineOn: boolean;
  playerPos: { x: number; y: number; z: number };
  carPos: { x: number; y: number; z: number };
  carYaw: number;
  walkYaw: number;
  /** Camera orbit yaw while walking — never written by movement. */
  lookYaw: number;
  lookPitch: number;
  prompt: string | null;
  /** Interactive target id when in range */
  interactTarget: string | null;
  discovered: Partial<Record<ChapterId, boolean>>;
  loadStage: number;
  debugColliders: boolean;
  isMobile: boolean;
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
  openChapter: null,
  showExplorerHint: false,
  rescueOpen: false,
  engineOn: false,
  playerPos: { x: 0, y: 0, z: 0 },
  carPos: { x: 0, y: 0, z: 0 },
  carYaw: 0,
  walkYaw: 0,
  lookYaw: 0,
  lookPitch: 0.12,
  prompt: null,
  interactTarget: null,
  discovered: {},
  loadStage: 0,
  debugColliders: false,
  isMobile: false,
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

    if (key === "discovered") {
      next.discovered = { ...state.discovered, ...(value as GameState["discovered"]) };
      changed = true;
      continue;
    }

    if (key === "speed" || key === "carYaw" || key === "walkYaw" || key === "lookYaw" || key === "lookPitch") {
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

export function markDiscovered(id: ChapterId) {
  if (state.discovered[id]) return;
  setGameState({ discovered: { [id]: true } });
}

export function openChapter(id: ChapterId | null) {
  if (id) markDiscovered(id);
  setGameState({ openChapter: id, rescueOpen: false, prompt: null });
}

/** Dev helper for Playwright / QA */
if (typeof window !== "undefined") {
  (window as unknown as {
    __coteMelvyn?: {
      getState: typeof getGameState;
      setState: typeof setGameState;
      teleportBelvedere: () => void;
      teleportWalk: (x: number, y: number, z: number, yaw?: number) => void;
    };
  }).__coteMelvyn = {
    getState: getGameState,
    setState: setGameState,
    teleportBelvedere: () => {
      window.dispatchEvent(new CustomEvent("cote:teleport-belvedere"));
    },
    teleportWalk: (x, y, z, yaw) => {
      window.dispatchEvent(new CustomEvent("cote:teleport-walk", { detail: { x, y, z, yaw } }));
    },
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
  return state.openChapter !== null || state.rescueOpen || state.phase !== "playing";
}

export function discoveryProgress() {
  const total = CHAPTERS.length;
  const done = CHAPTERS.filter((c) => state.discovered[c.id]).length;
  return { done, total };
}
