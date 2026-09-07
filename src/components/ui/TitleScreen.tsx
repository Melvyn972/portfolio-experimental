"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/hooks/useGameStore";
import { hasVoyagedBefore, skipToPlay, startJourney } from "@/lib/gameStore";

/**
 * Cinematic cold open — black, sea, discreet logo, one CTA.
 * Returning visitors may skip after 0.5s (Escape / Passer).
 */
export function TitleScreen() {
  const phase = useGameStore((s) => s.phase);
  const [readySkip, setReadySkip] = useState(false);
  const [returning, setReturning] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    setReturning(hasVoyagedBefore());
  }, []);

  useEffect(() => {
    if (phase !== "title") return;
    const t = window.setTimeout(() => setReadySkip(true), 500);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "title") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && readySkip && returning) beginSkip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, readySkip, returning]);

  if (phase !== "title" && phase !== "boot") return null;

  const begin = () => {
    setFadeOut(true);
    window.setTimeout(() => startJourney(), 700);
  };

  const beginSkip = () => {
    setFadeOut(true);
    window.setTimeout(() => skipToPlay(), 400);
  };

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-40 flex flex-col items-center justify-center"
      style={{
        background: "#070604",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.7s ease",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(80,50,24,0.28),transparent_62%)]" />
      <div className="relative flex flex-col items-center px-6 text-center">
        <p className="font-display text-[2.15rem] tracking-[0.04em] text-[#e4d2b0] md:text-5xl">Côte Melvyn</p>
        <p className="mt-3 max-w-sm text-sm tracking-[0.06em] text-[#b8a078] md:text-base">Une côte à explorer.</p>
        {phase === "title" && (
          <button
            type="button"
            className="mt-10 rounded-sm border border-[#b08d57]/70 bg-[#2a1c10]/80 px-8 py-2.5 font-display text-sm tracking-[0.22em] text-[#f0e2c4] shadow-[0_0_32px_rgba(176,141,87,0.18)]"
            onClick={begin}
          >
            DÉMARRER LE VOYAGE
          </button>
        )}
        {phase === "title" && readySkip && returning && (
          <button
            type="button"
            className="mt-4 text-[11px] tracking-[0.18em] text-[#8a7460] underline-offset-4 hover:text-[#c4b08a]"
            onClick={beginSkip}
          >
            Passer
          </button>
        )}
      </div>
    </div>
  );
}
