"use client";

import { useGameStore } from "@/hooks/useGameStore";
import {
  setGameState,
  toggleMute,
  setQuality,
  openChapter,
  tryOpenCurrentInteractable,
  discoveryProgress,
  skipToPlay,
} from "@/lib/gameStore";
import { inputRef } from "@/hooks/useKeyboard";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { TravelJournal } from "@/components/ui/TravelJournal";
import { TitleScreen } from "@/components/ui/TitleScreen";

/**
 * Mobile-first HUD:
 * Menu/Mute top (safe-area) · 3D center clear · Joystick BL · Look BR · Interact only when available
 */
export function GameHUD() {
  const state = useGameStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (state.openChapter) openChapter(null);
        else if (state.rescueOpen) setGameState({ rescueOpen: false });
      }
      if (e.key === "F3") {
        setGameState({ debugColliders: !state.debugColliders });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.openChapter, state.rescueOpen, state.debugColliders]);

  return (
    <div className="pointer-events-none fixed inset-0 z-20 text-[var(--fg)]">
      <TitleScreen />
      {state.phase !== "title" && state.phase !== "boot" && <TopBar />}
      {state.phase === "intro" && <CinematicSkip />}
      {state.showExplorerHint && state.phase === "playing" && !state.openChapter && !state.prompt && (
        <ExplorerHint />
      )}
      <TravelJournal />
      <TouchControls />
      <InteractPrompt />
      <SpeedWhisper />
      <AxesProof />
    </div>
  );
}

function CinematicSkip() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShow(true), 500);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <button
      type="button"
      className="pointer-events-auto absolute right-4 top-16 text-[10px] tracking-[0.2em] text-[#d8c8a8]/70"
      onClick={() => skipToPlay()}
    >
      Passer
    </button>
  );
}

function AxesProof() {
  const [enabled, setEnabled] = useState(false);
  const [line, setLine] = useState("axes…");
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setEnabled(q.get("debug") === "1" || q.get("debug") === "axes");
  }, []);
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const tick = () => {
      const api = (window as unknown as { __coteMelvyn?: { live?: (() => Record<string, unknown>) | Record<string, unknown> } }).__coteMelvyn;
      const raw = api?.live;
      const l = typeof raw === "function" ? raw() : raw;
      if (l) {
        const key = String(l.key ?? "none");
        const sx = Number(l.screenDeltaX ?? 0);
        const hold = Number(l.screenDeltaXHold ?? 0);
        const dy = Number(l.steerYawDelta ?? 0);
        setLine(
          `key=${key}  screenDeltaX=${sx.toFixed(3)} (+=droite écran)  hold=${hold.toFixed(2)}  steerYawDelta=${dy.toFixed(3)}  ${l.mode}`,
        );
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);
  if (!enabled) return null;
  return (
    <div className="absolute left-1/2 top-[4.6rem] z-30 -translate-x-1/2 rounded-sm bg-[#1c1610]/70 px-2 py-1 font-mono text-[10px] text-[#f3ead8]">
      {line}
    </div>
  );
}

function ExplorerHint() {
  const { mode } = useGameStore();
  const [touch, setTouch] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse), (max-width: 768px)");
    const apply = () => setTouch(mq.matches || window.innerWidth < 768);
    apply();
    mq.addEventListener("change", apply);
    setReady(true);
    return () => mq.removeEventListener("change", apply);
  }, []);
  if (!ready) return null;
  const text = touch
    ? mode === "walking"
      ? "Stick gauche : marcher · stick droit : regard"
      : "Stick : conduire · Interagir au belvédère"
    : mode === "walking"
      ? "ZQSD ou WASD · souris — marcher"
      : "ZQSD ou WASD · E — conduisez";
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 animate-fade-in"
      style={{ top: "calc(3.25rem + env(safe-area-inset-top, 0px))" }}
    >
      <p className="rounded-sm bg-[#1a120c]/45 px-2.5 py-1 text-center text-[10px] tracking-wide text-[#e8d8b8] backdrop-blur-sm md:text-xs">
        {text}
      </p>
    </div>
  );
}

function TopBar() {
  const { muted, quality, rescueOpen, isMobile } = useGameStore();
  const { done, total } = discoveryProgress();
  return (
    <div
      className="pointer-events-auto absolute left-0 right-0 top-0 flex items-start justify-between gap-2"
      style={{
        paddingTop: "max(0.5rem, env(safe-area-inset-top))",
        paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
        paddingRight: "max(0.75rem, env(safe-area-inset-right))",
      }}
    >
      <div className="min-w-0">
        <p className="font-display text-base tracking-[0.06em] text-[#f0e2c4]/90 md:text-xl">Côte Melvyn</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
        {!isMobile && (
          <select
            aria-label="Qualité"
            className="rounded-sm border border-[#c4a574]/25 bg-[#1a120c]/40 px-2 py-1 text-[10px] text-[#e8d8b8] backdrop-blur md:text-xs"
            value={quality}
            onChange={(e) => setQuality(e.target.value as "auto" | "high" | "eco")}
          >
            <option value="auto">Auto</option>
            <option value="high">Haute</option>
            <option value="eco">Éco</option>
          </select>
        )}
        <button
          type="button"
          aria-label={muted ? "Activer le son" : "Couper le son"}
          className="rounded-sm border border-[#c4a574]/25 bg-[#1a120c]/40 px-2 py-1 text-[10px] text-[#e8d8b8] backdrop-blur md:px-3 md:py-1.5 md:text-xs"
          onClick={() => toggleMute()}
        >
          {muted ? "Son" : "Muet"}
        </button>
        <button
          type="button"
          className="rounded-sm border border-[#c4a574]/25 bg-[#1a120c]/40 px-2 py-1 text-[10px] text-[#e8d8b8] backdrop-blur md:px-3 md:py-1.5 md:text-xs"
          onClick={() => setGameState({ rescueOpen: !rescueOpen })}
        >
          Menu{done > 0 ? ` · ${done}/${total}` : ""}
        </button>
      </div>
    </div>
  );
}

function InteractPrompt() {
  const { prompt, phase, openChapter, rescueOpen, isMobile } = useGameStore();
  if (!prompt || phase !== "playing" || openChapter || rescueOpen) return null;

  return (
    <div
      className="pointer-events-auto absolute left-1/2 z-40 -translate-x-1/2"
      style={{
        ...(isMobile
          ? { top: "calc(3.4rem + env(safe-area-inset-top, 0px))" }
          : { bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }),
      }}
    >
      <button
        type="button"
        className="rounded-sm border border-[#b08d57]/60 bg-[#1a120c]/72 px-5 py-2 font-display text-sm tracking-wide text-[#f0e2c4] shadow-[0_8px_24px_rgba(20,10,4,0.35)] backdrop-blur-md md:px-6 md:py-2.5 md:text-base"
        onClick={() => {
          if (!tryOpenCurrentInteractable()) inputRef.interactPulse = 1;
        }}
      >
        {!isMobile && <span className="mr-2 font-mono text-[11px] text-[#8a6a3e]">E</span>}
        {prompt}
      </button>
    </div>
  );
}

function shortInteractLabel(prompt: string | null) {
  if (!prompt) return "E";
  if (/parcours/i.test(prompt)) return "Parcours";
  const first = prompt.split(/[\s&/]/)[0]?.trim();
  return first && first.length <= 12 ? first : "E";
}

function SpeedWhisper() {
  const { speed, mode, phase, isMobile } = useGameStore();
  if (phase !== "playing" || mode !== "driving" || speed < 0.5 || isMobile) return null;
  return (
    <div
      className="absolute font-mono text-[10px] text-[#7a6854]/70 md:text-xs"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))", right: "max(1rem, env(safe-area-inset-right))" }}
    >
      {Math.round(speed * 3.6)} km/h
    </div>
  );
}

function TouchControls() {
  const [isTouch, setIsTouch] = useState(false);
  const { interactTarget, prompt, openChapter, rescueOpen, mode, phase } = useGameStore();

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    let locked = false;
    const apply = () => {
      // Safari URL-bar resize must not remount sticks (axis invert mid-session).
      if (locked) return;
      const touch = mq.matches || window.innerWidth < 768;
      if (!touch) return;
      locked = true;
      setIsTouch(true);
      setGameState({ isMobile: true });
    };
    apply();
    mq.addEventListener("change", apply);
    window.addEventListener("resize", apply);
    return () => {
      mq.removeEventListener("change", apply);
      window.removeEventListener("resize", apply);
    };
  }, []);

  useEffect(() => {
    const blockScroll = (e: TouchEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("button, a, select, input, textarea")) return;
      e.preventDefault();
    };
    document.addEventListener("touchmove", blockScroll, { passive: false });
    return () => document.removeEventListener("touchmove", blockScroll);
  }, []);

  useEffect(() => {
    if (mode !== "walking") {
      inputRef.look.x = 0;
      inputRef.look.y = 0;
    }
  }, [mode]);

  if (!isTouch) return null;
  const hidden = phase !== "playing" || Boolean(openChapter) || rescueOpen;

  const showInteract = Boolean(interactTarget && prompt);
  const showLook = mode === "walking";
  const showRun = mode === "walking";

  return (
    <>
      {/* Sticks stay mounted — remount on Safari chrome / menu was flipping axes */}
      <VirtualStick
        side="left"
        inactive={hidden}
        onChange={(x, y) => {
          inputRef.touch.x = x;
          inputRef.touch.y = y;
        }}
      />
      <VirtualStick
        side="right"
        inactive={hidden || !showLook}
        onChange={(x, y) => {
          inputRef.look.x = x;
          inputRef.look.y = y;
        }}
      />
      {showInteract && (
        <button
          type="button"
          className="pointer-events-auto absolute rounded-full border border-[#c4a574]/55 bg-[#f3ead8]/75 text-[10px] text-[#3d3226] shadow backdrop-blur"
          style={{
            bottom: showLook
              ? "calc(6.5rem + env(safe-area-inset-bottom, 0px))"
              : "calc(1.25rem + env(safe-area-inset-bottom, 0px))",
            right: "max(1rem, env(safe-area-inset-right))",
            width: "3.25rem",
            height: "3.25rem",
          }}
          onClick={() => {
            inputRef.interactPulse = 1;
          }}
        >
          {shortInteractLabel(prompt)}
        </button>
      )}
      {showRun && (
        <button
          type="button"
          className="pointer-events-auto absolute rounded-sm border border-[#c4a574]/45 bg-[#f3ead8]/65 px-2.5 py-1.5 text-[10px] text-[#3d3226] backdrop-blur"
          style={{
            bottom: "calc(4.75rem + env(safe-area-inset-bottom, 0px))",
            left: "max(0.75rem, env(safe-area-inset-left))",
          }}
          onPointerDown={() => {
            inputRef.current.run = true;
          }}
          onPointerUp={() => {
            inputRef.current.run = false;
          }}
          onPointerCancel={() => {
            inputRef.current.run = false;
          }}
        >
          Courir
        </button>
      )}
    </>
  );
}

function VirtualStick({
  side,
  onChange,
  inactive = false,
}: {
  side: "left" | "right";
  onChange: (x: number, y: number) => void;
  inactive?: boolean;
}) {
  const zone = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const gesture = useRef<{ id: number; ox: number; oy: number } | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!inactive) return;
    gesture.current = null;
    onChangeRef.current(0, 0);
    setKnob({ x: 0, y: 0 });
  }, [inactive]);

  useEffect(() => {
    const reset = () => {
      gesture.current = null;
      onChangeRef.current(0, 0);
      setKnob({ x: 0, y: 0 });
    };

    const apply = (screenX: number, screenY: number) => {
      const g = gesture.current;
      if (!g) return;
      // Origin = finger-down in SCREEN space. pageX/clientY jump when iOS
      // Safari chrome hides (even pageY === clientY on an unscrolled page).
      const radius = 52;
      let x = (screenX - g.ox) / radius;
      let y = (g.oy - screenY) / radius;
      const mag = Math.hypot(x, y);
      if (mag > 1) {
        x /= mag;
        y /= mag;
      }
      onChangeRef.current(x, y);
      setKnob({ x, y });
    };

    const down = (e: PointerEvent) => {
      const el = zone.current;
      if (!el || !el.contains(e.target as Node)) return;
      if (el.dataset.inactive === "1") return;
      if (gesture.current) return;
      e.preventDefault();
      gesture.current = { id: e.pointerId, ox: e.screenX, oy: e.screenY };
      apply(e.screenX, e.screenY);
    };
    const move = (e: PointerEvent) => {
      if (!gesture.current || e.pointerId !== gesture.current.id) return;
      e.preventDefault();
      apply(e.screenX, e.screenY);
    };
    const up = (e: PointerEvent) => {
      if (!gesture.current || e.pointerId !== gesture.current.id) return;
      reset();
    };

    const el = zone.current;
    if (!el) return;
    el.addEventListener("pointerdown", down, { passive: false });
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    window.addEventListener("blur", reset);
    window.addEventListener("visibilitychange", () => {
      if (document.hidden) reset();
    });
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("blur", reset);
      reset();
    };
  }, []);

  const style: CSSProperties =
    side === "left"
      ? {
          bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
          left: "max(0.75rem, env(safe-area-inset-left))",
        }
      : {
          bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
          right: "max(1rem, env(safe-area-inset-right))",
        };

  return (
    <div
      ref={zone}
      data-inactive={inactive ? "1" : "0"}
      className="pointer-events-auto absolute h-16 w-16 rounded-full border border-[#c4a574]/40 bg-[#f3ead8]/32 backdrop-blur-[2px] touch-none sm:h-[4.5rem] sm:w-[4.5rem]"
      style={{ ...style, visibility: inactive ? "hidden" : "visible", pointerEvents: inactive ? "none" : "auto" }}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3d3226]/55 sm:h-6 sm:w-6"
        style={{ transform: `translate(calc(-50% + ${knob.x * 22}px), calc(-50% + ${-knob.y * 22}px))` }}
      />
    </div>
  );
}
