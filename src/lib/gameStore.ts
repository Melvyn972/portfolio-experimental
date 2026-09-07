import * as THREE from "three";
import { computeTerrainHeight, sampleGroundHeight } from "@/lib/ground";
import { getBelvedereWorldAnchor, nearestRoadSample, ROAD_SURFACE_LIFT, ribbonPose, START_T, isNullIsland } from "@/lib/road";
import { SEA_INLAND_X, SEA_SURFACE_Y } from "@/lib/sea";
import { isFinitePos, sanitizeWalkSpawn, zoneWalkSpawns } from "@/lib/spawn";
import { getSoftGL } from "@/lib/softgl";
import { chapterForInteractableId, interactableForChapter } from "@/lib/interaction";
import { inputRef } from "@/hooks/useKeyboard";

export type GamePhase = "boot" | "title" | "intro" | "playing";
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
  { id: "activite", label: "Freelance", zone: "phare" },
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
  /** Page inside the open travel journal (0-based). */
  journalPage: number;
  /** Relic world position — camera eases in when a chapter opens. */
  relicFocus: { x: number; y: number; z: number } | null;
  /** Last newly found chapter — leather toast, not a white card. */
  lastFound: ChapterId | null;
}

type Listener = () => void;

const listeners = new Set<Listener>();

const BOOT_RIBBON = ribbonPose(START_T);

export type PendingTeleport =
  | { kind: "drive"; t: number }
  | { kind: "walk"; x: number; y: number; z: number; yaw: number; focusChapter?: ChapterId | null };

let pendingTeleport: PendingTeleport | null = null;
let teleportGen = 0;

export function getTeleportGen() {
  return teleportGen;
}

function bumpTeleportGen() {
  teleportGen += 1;
}

export function queuePendingTeleport(next: PendingTeleport) {
  pendingTeleport = next;
}

export function consumePendingTeleport() {
  const next = pendingTeleport;
  pendingTeleport = null;
  return next;
}

export function peekPendingTeleport() {
  return pendingTeleport;
}

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
  playerPos: { x: BOOT_RIBBON.x, y: BOOT_RIBBON.y, z: BOOT_RIBBON.z },
  carPos: { x: BOOT_RIBBON.x, y: BOOT_RIBBON.y, z: BOOT_RIBBON.z },
  carYaw: BOOT_RIBBON.yaw,
  walkYaw: BOOT_RIBBON.yaw,
  lookYaw: BOOT_RIBBON.yaw,
  lookPitch: 0.12,
  prompt: null,
  interactTarget: null,
  focusChapter: null,
  discovered: {},
  loadStage: 0,
  debugColliders: false,
  isMobile: false,
  journalPage: 0,
  relicFocus: null,
  lastFound: null,
};

function shallowEqualPos(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
  eps = 0.08,
) {
  return Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps && Math.abs(a.z - b.z) < eps;
}

const POSE_KEYS = new Set<keyof GameState>([
  "playerPos",
  "carPos",
  "speed",
  "carYaw",
  "walkYaw",
  "lookYaw",
  "lookPitch",
]);

let lastPoseNotifyAt = 0;
const POSE_NOTIFY_MS = 250;

export function getGameState() {
  return state;
}

/** Push state; skips notify when nothing UI-relevant changed. */
export function setGameState(partial: Partial<GameState>) {
  let changed = false;
  let uiChanged = false;
  const next = { ...state };

  const mark = (key: keyof GameState) => {
    changed = true;
    if (!POSE_KEYS.has(key)) uiChanged = true;
  };

  for (const key of Object.keys(partial) as (keyof GameState)[]) {
    const value = partial[key];
    if (value === undefined) continue;

    if (key === "playerPos" || key === "carPos") {
      const cur = state[key];
      const val = value as { x: number; y: number; z: number };
      if (!isFinitePos(val)) continue;
      if (isNullIsland(val.x, val.y, val.z)) continue;
      if (!shallowEqualPos(cur, val)) {
        next[key] = { x: val.x, y: val.y, z: val.z };
        mark(key);
      }
      continue;
    }

    if (key === "relicFocus") {
      const val = value as GameState["relicFocus"];
      if (val === null) {
        if (state.relicFocus !== null) {
          next.relicFocus = null;
          mark(key);
        }
        continue;
      }
      if (!isFinitePos(val)) continue;
      if (!state.relicFocus || !shallowEqualPos(state.relicFocus, val, 0.05)) {
        next.relicFocus = { x: val.x, y: val.y, z: val.z };
        mark(key);
      }
      continue;
    }

    if (key === "discovered") {
      next.discovered = { ...state.discovered, ...(value as GameState["discovered"]) };
      mark(key);
      continue;
    }

    if (key === "speed" || key === "carYaw" || key === "walkYaw" || key === "lookYaw" || key === "lookPitch") {
      const cur = state[key] as number;
      const val = value as number;
      const eps = key === "speed" ? 0.15 : 0.02;
      if (Math.abs(cur - val) >= eps) {
        (next as Record<string, unknown>)[key] = val;
        mark(key);
      }
      continue;
    }

    if (state[key] !== value) {
      (next as Record<string, unknown>)[key] = value;
      mark(key);
    }
  }

  if (!changed) return;
  state = next;
  // Soft-GL: pose-only ticks must not notify React 60×/s (R3F remount → Error 9).
  if (!uiChanged && getSoftGL()) {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - lastPoseNotifyAt < POSE_NOTIFY_MS) return;
    lastPoseNotifyAt = now;
  }
  listeners.forEach((l) => l());
}

export function markDiscovered(id: ChapterId) {
  if (state.discovered[id]) return;
  setGameState({ discovered: { [id]: true }, lastFound: id });
}

export function openChapter(id: ChapterId | null) {
  if (id) markDiscovered(id);
  const relic = id ? interactableForChapter(id) : null;
  setGameState({
    openChapter: id,
    rescueOpen: false,
    prompt: null,
    journalPage: 0,
    relicFocus: relic ? { x: relic.position.x, y: relic.position.y, z: relic.position.z } : null,
  });
}

const VOYAGE_KEY = "cote-melvyn-voyage";

export function hasVoyagedBefore() {
  try {
    return window.localStorage.getItem(VOYAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markVoyaged() {
  try {
    window.localStorage.setItem(VOYAGE_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

/** Black-title CTA → aerial cinematic. */
export function startJourney() {
  markVoyaged();
  setGameState({
    phase: "intro",
    engineOn: false,
    showExplorerHint: false,
    openChapter: null,
    rescueOpen: false,
    relicFocus: null,
    lastFound: null,
  });
}

/** Snap store + physics queue onto the ribbon above asphalt. Never (0,0,0). */
export function applyRibbonDrive(t: number = START_T) {
  const pose = ribbonPose(t);
  queuePendingTeleport({ kind: "drive", t: pose.t });
  bumpTeleportGen();
  setGameState({
    phase: "playing",
    mode: "driving",
    engineOn: true,
    openChapter: null,
    rescueOpen: false,
    relicFocus: null,
    lastFound: null,
    carPos: { x: pose.x, y: pose.y, z: pose.z },
    playerPos: { x: pose.x, y: pose.y, z: pose.z },
    carYaw: pose.yaw,
    walkYaw: pose.yaw,
    lookYaw: pose.yaw,
    lookPitch: 0.08,
    speed: 0,
    prompt: null,
    interactTarget: null,
    nearStopSpot: false,
  });
  if (typeof window === "undefined") return pose;
  window.dispatchEvent(new CustomEvent("cote:teleport-drive", { detail: { t: pose.t } }));
  return pose;
}

export function applyWalkTeleport(raw: { x?: number; y?: number; z?: number; yaw?: number; focusChapter?: ChapterId | null }) {
  const pose = sanitizeWalkSpawn(raw);
  if (!pose) return null;
  queuePendingTeleport({
    kind: "walk",
    x: pose.x,
    y: pose.y,
    z: pose.z,
    yaw: pose.yaw,
    focusChapter: raw.focusChapter ?? null,
  });
  bumpTeleportGen();
  setGameState({
    phase: "playing",
    mode: "walking",
    openChapter: null,
    rescueOpen: false,
    relicFocus: null,
    showExplorerHint: false,
    playerPos: { x: pose.x, y: pose.y, z: pose.z },
    walkYaw: pose.yaw,
    lookYaw: pose.yaw,
    lookPitch: 0.12,
    focusChapter: raw.focusChapter ?? state.focusChapter,
  });
  if (typeof window === "undefined") return pose;
  window.dispatchEvent(
    new CustomEvent("cote:teleport-walk", { detail: { ...pose, focusChapter: raw.focusChapter ?? null } }),
  );
  return pose;
}

/** Escape / Passer / fin d’intro — ruban valide, jamais (0,0,0). */
export function skipToPlay() {
  markVoyaged();
  applyRibbonDrive(START_T);
  setGameState({ showExplorerHint: true });
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
    relicFocus: null,
    showExplorerHint: false,
    focusChapter: id,
    prompt: target?.label ?? null,
    interactTarget: target?.id ?? null,
    playerPos: { x: pose.x, y: pose.y, z: pose.z },
    walkYaw: pose.yaw,
    lookYaw: pose.yaw,
  });
  applyWalkTeleport({ ...pose, focusChapter: id });
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
      setKeys: (partial: Partial<import("@/hooks/useKeyboard").InputState>) => void;
      enterCar: () => void;
      teleportDrive: (t?: number) => void;
      startJourney: () => void;
      skipToPlay: () => void;
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
        camPos?: { x: number; y: number; z: number };
        camInside?: boolean;
        keys?: { forward: boolean; back: boolean; left: boolean; right: boolean };
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
      applyWalkTeleport({ x, y, z, yaw });
    },
    teleportMaison: () => {
      applyWalkTeleport(zoneWalkSpawns().maison);
    },
    teleportStudio: () => {
      applyWalkTeleport(zoneWalkSpawns().studio);
    },
    teleportPlage: () => {
      applyWalkTeleport(zoneWalkSpawns().plage);
    },
    teleportPhare: () => {
      applyWalkTeleport(zoneWalkSpawns().phare);
    },
    teleportBelvedereWalk: () => {
      applyWalkTeleport(zoneWalkSpawns().belvedere);
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
    setKeys: (partial) => {
      Object.assign(inputRef.current, partial);
    },
    enterCar: () => {
      setGameState({
        phase: "playing",
        mode: "driving",
        engineOn: true,
        openChapter: null,
        relicFocus: null,
        rescueOpen: false,
        showExplorerHint: false,
      });
    },
    teleportDrive: (t = START_T) => {
      applyRibbonDrive(typeof t === "number" && Number.isFinite(t) ? t : START_T);
    },
    startJourney,
    skipToPlay,
    belvedereAnchor: () => {
      const a = getBelvedereWorldAnchor();
      return {
        terrace: { x: a.terrace.x, y: a.terrace.y, z: a.terrace.z },
        stop: { x: a.stop.x, y: a.stop.y, z: a.stop.z },
        yaw: a.yaw,
      };
    },
    sampleHeights: (x: number, z: number) => {
      const sample = nearestRoadSample(new THREE.Vector3(x, 0, z), 280);
      const visual = computeTerrainHeight(x, z);
      const liftRoad = sample.position.y + ROAD_SURFACE_LIFT;
      return {
        visual,
        walk: sampleGroundHeight(x, z),
        roadY: sample.position.y,
        liftRoad,
        roadDist: Math.min(Math.abs(sample.lateral), sample.dist),
        lat: sample.lateral,
        sandBelowAsphalt: visual <= liftRoad - 0.08,
        seaCovered: x < SEA_INLAND_X && visual >= SEA_SURFACE_Y - 0.02,
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
  // Soft-GL + Haute/Auto = Chrome Error 9. HUD must stay on Éco.
  if (getSoftGL()) {
    setGameState({ quality: "eco" });
    return;
  }
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
