"use client";

import { useGameStore } from "@/hooks/useGameStore";
import { setGameState, toggleMute, setQuality } from "@/lib/gameStore";
import { content } from "@/lib/content";
import { inputRef } from "@/hooks/useKeyboard";
import { useEffect, useRef, useState } from "react";

export function GameHUD() {
  const state = useGameStore();

  return (
    <div className="pointer-events-none fixed inset-0 z-20 text-[var(--fg)]">
      <TopBar />
      {state.phase === "intro" && <IntroTitle />}
      {state.showExplorerHint && state.phase === "playing" && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 animate-fade-in">
          <p className="font-display text-sm tracking-[0.28em] uppercase text-[#5c4a36]">Explorer</p>
          <p className="mt-1 text-center text-xs text-[#7a6854]">ZQSD · souris tactile · E pour interagir</p>
        </div>
      )}
      {state.prompt && state.phase === "playing" && !state.identityOpen && (
        <div className="pointer-events-auto absolute bottom-28 left-1/2 -translate-x-1/2">
          <button
            type="button"
            className="rounded-sm border border-[#c4a574]/60 bg-[#f3ead8]/80 px-5 py-2.5 font-display text-sm tracking-wide text-[#3d3226] shadow-[0_8px_30px_rgba(80,50,20,0.12)] backdrop-blur-md"
            onClick={() => {
              inputRef.interactPulse = 1;
            }}
          >
            {state.prompt}
          </button>
        </div>
      )}
      {state.identityOpen && <IdentityReveal />}
      {state.rescueOpen && <RescueMenu />}
      <TouchControls />
      <SpeedWhisper />
    </div>
  );
}

function TopBar() {
  const { muted, quality, rescueOpen } = useGameStore();
  return (
    <div className="pointer-events-auto absolute left-0 right-0 top-0 flex items-start justify-between p-4 md:p-5">
      <div>
        <p className="font-display text-lg tracking-[0.08em] text-[#3f3428] md:text-xl">Côte Melvyn</p>
        <p className="text-[10px] uppercase tracking-[0.22em] text-[#8a7460]">Méditerranée · exploration</p>
      </div>
      <div className="flex items-center gap-2">
        <select
          aria-label="Qualité"
          className="rounded-sm border border-[#c4a574]/40 bg-[#f7f0e4]/75 px-2 py-1.5 text-xs text-[#4a3c2e] backdrop-blur"
          value={quality}
          onChange={(e) => setQuality(e.target.value as "auto" | "high" | "eco")}
        >
          <option value="auto">Auto</option>
          <option value="high">Haute</option>
          <option value="eco">Éco</option>
        </select>
        <button
          type="button"
          aria-label={muted ? "Activer le son" : "Couper le son"}
          className="rounded-sm border border-[#c4a574]/40 bg-[#f7f0e4]/75 px-3 py-1.5 text-xs text-[#4a3c2e] backdrop-blur"
          onClick={() => toggleMute()}
        >
          {muted ? "Son" : "Muet"}
        </button>
        <button
          type="button"
          className="rounded-sm border border-[#c4a574]/40 bg-[#f7f0e4]/75 px-3 py-1.5 text-xs text-[#4a3c2e] backdrop-blur"
          onClick={() => setGameState({ rescueOpen: !rescueOpen })}
        >
          Menu
        </button>
      </div>
    </div>
  );
}

function IntroTitle() {
  return (
    <div className="absolute inset-x-0 top-[18%] flex flex-col items-center animate-fade-in">
      <p className="font-display text-3xl text-[#2f281f] md:text-5xl">Côte Melvyn</p>
      <p className="mt-2 max-w-md px-6 text-center text-sm text-[#6b5a48]">
        Une route côtière, une voiture, un belvédère — le monde de Melvyn.
      </p>
    </div>
  );
}

function IdentityReveal() {
  const id = content.identity;
  return (
    <div className="pointer-events-auto absolute inset-0 flex items-end justify-center bg-gradient-to-t from-[#2a2118]/55 via-transparent to-transparent p-6 pb-16 md:items-center md:bg-transparent md:pb-6">
      <div className="identity-panel max-w-lg animate-rise border border-[#c9b896]/70 bg-[#f6f1e6]/88 p-6 shadow-[0_20px_60px_rgba(40,30,15,0.25)] backdrop-blur-xl md:p-8">
        <div className="mb-4 h-px w-16 bg-gradient-to-r from-[#b08d57] to-transparent" />
        <p className="font-display text-2xl text-[#2c241c] md:text-3xl">{id.name}</p>
        <p className="mt-2 font-display text-sm tracking-[0.14em] text-[#8a6a3e] uppercase">
          {id.title}
        </p>
        <p className="mt-5 text-sm leading-relaxed text-[#4a3e32]">{id.presentation}</p>
        <p className="mt-4 text-xs italic text-[#7a6854]">{id.credo}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-sm bg-[#3d3226] px-4 py-2 text-xs tracking-wide text-[#f3ead8]"
            onClick={() => setGameState({ identityOpen: false })}
          >
            Continuer l&apos;exploration
          </button>
          <a
            href={content.contact.cvPdf}
            className="rounded-sm border border-[#b08d57]/50 px-4 py-2 text-xs text-[#5c4a36]"
          >
            Télécharger le CV
          </a>
        </div>
      </div>
    </div>
  );
}

function RescueMenu() {
  const id = content.identity;
  const contact = content.contact;
  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex justify-end bg-[#2a2118]/25 backdrop-blur-[2px]">
      <aside className="flex h-full w-full max-w-sm flex-col gap-5 overflow-y-auto border-l border-[#c9b896]/40 bg-[#f7f1e6]/94 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <p className="font-display text-lg text-[#2c241c]">Profil</p>
          <button type="button" className="text-sm text-[#7a6854]" onClick={() => setGameState({ rescueOpen: false })}>
            Fermer
          </button>
        </div>
        <div>
          <p className="font-display text-xl text-[#2c241c]">{id.name}</p>
          <p className="text-sm text-[#8a6a3e]">{id.title}</p>
          <p className="mt-3 text-sm leading-relaxed text-[#4a3e32]">{id.tagline}</p>
        </div>
        <nav className="flex flex-col gap-2 text-sm">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a7460]">Parcours</p>
          {content.experiences.slice(0, 3).map((e) => (
            <div key={e.company} className="border-b border-[#dccfb8]/60 py-2">
              <p className="text-[#2c241c]">{e.role}</p>
              <p className="text-xs text-[#7a6854]">
                {e.company} · {e.period}
              </p>
            </div>
          ))}
        </nav>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a7460]">Contact</p>
          <a className="mt-2 block text-sm text-[#3d3226] underline decoration-[#b08d57]/50" href={`mailto:${contact.email}`}>
            {contact.email}
          </a>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <a href={contact.networks.github.url} target="_blank" rel="noreferrer" className="text-[#5c4a36]">
              GitHub
            </a>
            <a href={contact.networks.linkedin.url} target="_blank" rel="noreferrer" className="text-[#5c4a36]">
              LinkedIn
            </a>
            <a href={contact.networks.codeur.url} target="_blank" rel="noreferrer" className="text-[#5c4a36]">
              Codeur
            </a>
            <a href={contact.cvPdf} className="text-[#5c4a36]">
              CV
            </a>
          </div>
        </div>
        <p className="mt-auto text-[10px] leading-relaxed text-[#9a8874]">
          Menu recruteur — le monde reste la voie principale. Zones futures : Maison/Atelier, Studio, Plage, Phare.
        </p>
      </aside>
    </div>
  );
}

function SpeedWhisper() {
  const { speed, mode, phase } = useGameStore();
  if (phase !== "playing" || mode !== "driving" || speed < 0.5) return null;
  return (
    <div className="absolute bottom-6 right-6 font-mono text-xs text-[#7a6854]/80">
      {Math.round(speed * 3.6)} km/h
    </div>
  );
}

function TouchControls() {
  const zone = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  if (!isTouch) return null;

  const onMove = (clientX: number, clientY: number) => {
    const el = zone.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let x = (clientX - cx) / (rect.width / 2);
    let y = (cy - clientY) / (rect.height / 2);
    const mag = Math.hypot(x, y);
    if (mag > 1) {
      x /= mag;
      y /= mag;
    }
    inputRef.touch.x = x;
    inputRef.touch.y = y;
    setKnob({ x, y });
  };

  return (
    <div className="pointer-events-auto absolute bottom-6 left-6 flex items-end gap-4 md:bottom-8 md:left-8">
      <div
        ref={zone}
        className="relative h-28 w-28 rounded-full border border-[#c4a574]/50 bg-[#f3ead8]/45 backdrop-blur"
        onPointerDown={(e) => {
          setActive(true);
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          onMove(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (!active) return;
          onMove(e.clientX, e.clientY);
        }}
        onPointerUp={() => {
          setActive(false);
          inputRef.touch.x = 0;
          inputRef.touch.y = 0;
          setKnob({ x: 0, y: 0 });
        }}
      >
        <div
          className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3d3226]/70"
          style={{ transform: `translate(calc(-50% + ${knob.x * 36}px), calc(-50% + ${-knob.y * 36}px))` }}
        />
      </div>
      <button
        type="button"
        className="mb-2 rounded-sm border border-[#c4a574]/50 bg-[#f3ead8]/70 px-4 py-3 text-xs text-[#3d3226]"
        onClick={() => {
          inputRef.interactPulse = 1;
        }}
      >
        Interagir
      </button>
    </div>
  );
}
