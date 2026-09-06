import * as THREE from "three";
import { computeTerrainHeight, sampleGroundHeight } from "@/lib/ground";
import { getBelvedereWorldAnchor, nearestRoadSample, ROAD_SURFACE_LIFT } from "@/lib/road";
import { isFinitePos, sanitizeWalkSpawn, zoneWalkSpawns } from "@/lib/spawn";
import { chapterForInteractableId, interactableForChapter } from "@/lib/interaction";
import { inputRef } from "@/hooks/useKeyboard";

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
  /** Menu travel — keep this chapter's prompt while the player stays in its radius. */
  focusChapter: ChapterId | null;
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
  focusChapter: null,
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
      if (!isFinitePos(val)) continue;
      if (!shallowEqualPos(cur, val)) {
        next[key] = { x: val.x, y: val.y, z: val.z };
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

/** Open the in-range chapter now — do not wait for the physics frame (1 fps / SwiftShader). */
export function tryOpenCurrentInteractable() {
  const s = state;
  if (s.phase !== "playing" || s.openChapter || s.rescueOpen) return false;
  if (s.interactTarget === "enter-car" || s.interactTarget === "exit-car") return false;
  const chapter = s.focusChapter ?? chapterForInteractableId(s.interactTarget);
  if (!chapter) return false;
  openChapter(chapter);
  return true;
}

/** Chapter → walk spawn. Menu must drop the player in the world zone, not only open a card. */
export function chapterWalkSpawn(id: ChapterId) {
  const zones = zoneWalkSpawns();
  switch (id) {
    case "identity":
      return zones.belvedere;
    case "parcours":
    case "experiences":
    case "competences":
      return zones.maison;
    case "projets":
      return zones.studio;
    case "passions":
      return zones.plage;
    case "activite":
    case "cv":
    case "contact":
      return zones.phare;
    default:
      return zones.maison;
  }
}

/** Close menus and place the player in the chapter's world zone. */
export function travelToChapterZone(id: ChapterId) {
  const pose = chapterWalkSpawn(id);
  const target = interactableForChapter(id);
  setGameState({
    phase: "playing",
    mode: "walking",
    rescueOpen: false,
    openChapter: null,
    showExplorerHint: false,
    focusChapter: id,
    prompt: target?.label ?? null,
    interactTarget: target?.id ?? null,
    playerPos: { x: pose.x, y: pose.y, z: pose.z },
    walkYaw: pose.yaw,
    lookYaw: pose.yaw,
  });
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("cote:teleport-walk", { detail: { ...pose, focusChapter: id } }));
}

/** Dev helper for Playwright / QA */
if (typeof window !== "undefined") {
  (window as unknown as {
    __coteMelvyn?: {
      getState: typeof getGameState;
      setState: typeof setGameState;
      teleportBelvedere: () => void;
      teleportWalk: (x?: number, y?: number, z?: number, yaw?: number) => void;
      teleportMaison: () => void;
      teleportStudio: () => void;
      teleportPlage: () => void;
      teleportPhare: () => void;
      teleportBelvedereWalk: () => void;
      travelToChapterZone: (id: ChapterId) => void;
      setWalkStick: (x: number, y: number) => void;
      setLookStick: (x: number, y: number) => void;
      live?: {
        mode: string;
        playerPos: { x: number; y: number; z: number };
        carPos: { x: number; y: number; z: number };
        carYaw: number;
        lookYaw: number;
        walkYaw: number;
        driveSpeed: number;
        camFwd: { x: number; z: number };
        lookFwd: { x: number; z: number };
        camDotLook: number;
      };
      sampleHeights: (x: number, z: number) => {
        visual: number;
        walk: number;
        roadY: number;
        liftRoad: number;
        roadDist: number;
        lat: number;
      };
      belvedereAnchor: () => { terrace: { x: number; y: number; z: number }; stop: { x: number; y: number; z: number }; yaw: number };
    };
  }).__coteMelvyn = {
    getState: getGameState,
    setState: setGameState,
    teleportBelvedere: () => {
      window.dispatchEvent(new CustomEvent("cote:teleport-belvedere"));
    },
    teleportWalk: (x, y, z, yaw) => {
      const pose = sanitizeWalkSpawn({ x, y, z, yaw });
      if (!pose) return;
      window.dispatchEvent(new CustomEvent("cote:teleport-walk", { detail: pose }));
    },
    teleportMaison: () => {
      const p = zoneWalkSpawns().maison;
      window.dispatchEvent(new CustomEvent("cote:teleport-walk", { detail: p }));
    },
    teleportStudio: () => {
      const p = zoneWalkSpawns().studio;
      window.dispatchEvent(new CustomEvent("cote:teleport-walk", { detail: p }));
    },
    teleportPlage: () => {
      const p = zoneWalkSpawns().plage;
      window.dispatchEvent(new CustomEvent("cote:teleport-walk", { detail: p }));
    },
    teleportPhare: () => {
      const p = zoneWalkSpawns().phare;
      window.dispatchEvent(new CustomEvent("cote:teleport-walk", { detail: p }));
    },
    teleportBelvedereWalk: () => {
      const p = zoneWalkSpawns().belvedere;
      window.dispatchEvent(new CustomEvent("cote:teleport-walk", { detail: p }));
    },
    travelToChapterZone,
    setWalkStick: (x, y) => {
      inputRef.touch.x = Number.isFinite(x) ? Math.max(-1, Math.min(1, x)) : 0;
      inputRef.touch.y = Number.isFinite(y) ? Math.max(-1, Math.min(1, y)) : 0;
    },
    setLookStick: (x, y) => {
      inputRef.look.x = Number.isFinite(x) ? Math.max(-1, Math.min(1, x)) : 0;
      inputRef.look.y = Number.isFinite(y) ? Math.max(-1, Math.min(1, y)) : 0;
    },
    belvedereAnchor: () => {
      const a = getBelvedereWorldAnchor();
      return {
        terrace: { x: a.terrace.x, y: a.terrace.y, z: a.terrace.z },
        stop: { x: a.stop.x, y: a.stop.y, z: a.stop.z },
        yaw: a.yaw,
      };
    },
    sampleHeights: (x: number, z: number) => {
      const sample = nearestRoadSample(new THREE.Vector3(x, 0, z), 160);
      return {
        visual: computeTerrainHeight(x, z),
        walk: sampleGroundHeight(x, z),
        roadY: sample.position.y,
        liftRoad: sample.position.y + ROAD_SURFACE_LIFT,
        roadDist: Math.min(Math.abs(sample.lateral), sample.dist),
        lat: sample.lateral,
      };
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
