"use client";

import { useGameStore } from "@/hooks/useGameStore";
import {
  setGameState,
  toggleMute,
  setQuality,
  openChapter,
  travelToChapterZone,
  CHAPTERS,
  discoveryProgress,
  type ChapterId,
} from "@/lib/gameStore";
import { content } from "@/lib/content";
import { inputRef } from "@/hooks/useKeyboard";
import { useEffect, useRef, useState, type CSSProperties } from "react";

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
      <TopBar />
      {state.phase === "intro" && <IntroTitle />}
      {state.showExplorerHint && state.phase === "playing" && !state.openChapter && (
        <ExplorerHint />
      )}
      {state.openChapter && <ChapterPanel chapter={state.openChapter} />}
      {state.rescueOpen && <DiscoveryMenu />}
      <TouchControls />
      <InteractPrompt />
      <SpeedWhisper />
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
      ? "ZQSD · souris · Shift — marcher"
      : "ZQSD · Shift · E — explorez la côte";
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 animate-fade-in"
      style={{ top: "calc(3.25rem + env(safe-area-inset-top, 0px))" }}
    >
      <p className="rounded-sm bg-[#f3ead8]/55 px-2.5 py-1 text-center text-[10px] tracking-wide text-[#6b5a48] backdrop-blur-sm md:text-xs">
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
        <p className="font-display text-base tracking-[0.06em] text-[#3f3428] md:text-xl">Côte Melvyn</p>
        {!isMobile && (
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#8a7460]">Méditerranée · exploration</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
        {!isMobile && (
          <select
            aria-label="Qualité"
            className="rounded-sm border border-[#c4a574]/40 bg-[#f7f0e4]/80 px-2 py-1 text-[10px] text-[#4a3c2e] backdrop-blur md:text-xs"
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
          className="rounded-sm border border-[#c4a574]/40 bg-[#f7f0e4]/80 px-2 py-1 text-[10px] text-[#4a3c2e] backdrop-blur md:px-3 md:py-1.5 md:text-xs"
          onClick={() => toggleMute()}
        >
          {muted ? "Son" : "Muet"}
        </button>
        <button
          type="button"
          className="rounded-sm border border-[#c4a574]/40 bg-[#f7f0e4]/80 px-2 py-1 text-[10px] text-[#4a3c2e] backdrop-blur md:px-3 md:py-1.5 md:text-xs"
          onClick={() => setGameState({ rescueOpen: !rescueOpen })}
        >
          Menu{done > 0 ? ` · ${done}/${total}` : ""}
        </button>
      </div>
    </div>
  );
}

function IntroTitle() {
  return (
    <div className="absolute inset-x-0 top-[16%] flex flex-col items-center animate-fade-in px-4">
      <p className="font-display text-3xl text-[#2f281f] md:text-5xl">Côte Melvyn</p>
      <p className="mt-2 max-w-sm text-center text-xs text-[#6b5a48] md:max-w-md md:text-sm">
        Une côte à explorer — le portfolio de Melvyn se découvre en marchant.
      </p>
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
        bottom: isMobile
          ? "calc(10.5rem + env(safe-area-inset-bottom, 0px))"
          : "calc(5.5rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <button
        type="button"
        className="rounded-sm border border-[#b08d57]/70 bg-[#f6efe2] px-5 py-2 font-display text-sm tracking-wide text-[#2c241c] shadow-[0_8px_24px_rgba(80,50,20,0.16)] backdrop-blur-md md:px-6 md:py-2.5 md:text-base"
        onClick={() => {
          inputRef.interactPulse = 1;
        }}
      >
        {!isMobile && <span className="mr-2 font-mono text-[11px] text-[#8a6a3e]">E</span>}
        {prompt}
      </button>
    </div>
  );
}

function ChapterPanel({ chapter }: { chapter: ChapterId }) {
  return (
    <div
      className="pointer-events-auto absolute inset-0 flex items-end justify-center bg-gradient-to-t from-[#2a2118]/50 via-transparent to-transparent md:items-center md:bg-transparent"
      style={{
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
        paddingRight: "max(0.75rem, env(safe-area-inset-right))",
      }}
    >
      <div className="identity-panel max-h-[min(58dvh,32rem)] w-full max-w-md animate-rise overflow-y-auto border border-[#c9b896]/60 bg-[#f6f1e6]/82 p-3.5 shadow-[0_16px_48px_rgba(40,30,15,0.22)] backdrop-blur-lg md:max-h-[75vh] md:max-w-lg md:p-7">
        <ChapterBody chapter={chapter} />
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-sm bg-[#3d3226] px-3.5 py-2 text-xs tracking-wide text-[#f3ead8]"
            onClick={() => openChapter(null)}
          >
            Continuer l&apos;exploration
          </button>
        </div>
      </div>
    </div>
  );
}

function ChapterBody({ chapter }: { chapter: ChapterId }) {
  const id = content.identity;
  const contact = content.contact;

  switch (chapter) {
    case "identity":
      return (
        <>
          <Hairline />
          <h2 className="font-display text-xl text-[#2c241c] md:text-3xl">{id.name}</h2>
          <p className="mt-1.5 font-display text-xs tracking-[0.14em] text-[#8a6a3e] uppercase md:text-sm">{id.title}</p>
          <p className="mt-4 text-sm leading-relaxed text-[#4a3e32]">{id.presentation}</p>
          <p className="mt-3 text-xs italic text-[#7a6854]">{id.credo}</p>
          <p className="mt-2 text-[11px] text-[#9a8874]">
            {id.location} · {id.age} · {id.permits}
          </p>
        </>
      );
    case "parcours":
      return (
        <>
          <Hairline />
          <h2 className="font-display text-xl text-[#2c241c]">Parcours</h2>
          <p className="mt-1 text-xs text-[#8a6a3e]">Formations</p>
          <ul className="mt-3 space-y-2.5 text-sm">
            {content.formations.map((f) => (
              <li key={f.title} className="border-b border-[#dccfb8]/50 pb-2">
                <span className="text-[#2c241c]">{f.title}</span>
                <span className="mt-0.5 block text-xs text-[#7a6854]">
                  {f.period}
                  {f.school ? ` · ${f.school}` : ""}
                  {f.detail ? ` · ${f.detail}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </>
      );
    case "experiences":
      return (
        <>
          <Hairline />
          <h2 className="font-display text-xl text-[#2c241c]">Expériences</h2>
          <div className="mt-3 space-y-3 text-sm">
            {content.experiences.map((e) => (
              <div key={e.company} className="border-b border-[#dccfb8]/50 pb-3">
                <p className="text-[#2c241c]">{e.role}</p>
                <p className="text-xs text-[#7a6854]">
                  {e.company} · {e.period}
                </p>
                <p className="mt-1 text-xs text-[#9a8874]">{e.detail}</p>
                <ul className="mt-1.5 list-inside list-disc text-xs text-[#4a3e32]">
                  {e.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      );
    case "competences":
      return (
        <>
          <Hairline />
          <h2 className="font-display text-xl text-[#2c241c]">Compétences</h2>
          <div className="mt-3 space-y-2.5 text-sm">
            {content.competences.clusters.map((c) => (
              <p key={c.id} className="text-[#4a3e32]">
                <span className="text-[#2c241c]">{c.title}</span>
                <span className="mt-0.5 block text-xs text-[#7a6854]">{c.items.join(" · ")}</span>
              </p>
            ))}
          </div>
        </>
      );
    case "projets":
      return (
        <>
          <Hairline />
          <h2 className="font-display text-xl text-[#2c241c]">Projets</h2>
          <div className="mt-3 space-y-3 text-sm">
            {content.projets.map((p) => (
              <div key={p.id} className="border-b border-[#dccfb8]/50 pb-2.5">
                <p className="text-[#2c241c]">
                  {p.name} <span className="text-xs text-[#8a6a3e]">· {p.tag}</span>
                </p>
                <p className="text-xs text-[#7a6854]">{p.stack}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#4a3e32]">{p.blurb}</p>
                {"href" in p && p.href ? (
                  <a href={p.href} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-[#5c4a36] underline">
                    Voir le site
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </>
      );
    case "passions":
      return (
        <>
          <Hairline />
          <h2 className="font-display text-xl text-[#2c241c]">Passions</h2>
          <div className="mt-3 space-y-3 text-sm">
            {content.passions.map((p) => (
              <div key={p.id}>
                <p className="text-[#2c241c]">{p.title}</p>
                <p className="text-xs italic text-[#7a6854]">{p.beat}</p>
                <p className="mt-0.5 text-xs text-[#4a3e32]">{p.craft}</p>
              </div>
            ))}
          </div>
        </>
      );
    case "activite":
      return (
        <>
          <Hairline />
          <h2 className="font-display text-xl text-[#2c241c]">Activité</h2>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#8a6a3e]">Auto-entreprise</p>
          <ul className="mt-3 space-y-1.5 text-sm text-[#4a3e32]">
            {content.activite.services.map((s) => (
              <li key={s}>· {s}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-[#9a8874]">{content.activite.publicNote}</p>
        </>
      );
    case "cv":
      return (
        <>
          <Hairline />
          <h2 className="font-display text-xl text-[#2c241c]">Curriculum vitæ</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#4a3e32]">
            Consultez le CV en ligne ou téléchargez le PDF.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="/cv" className="rounded-sm bg-[#3d3226] px-3.5 py-2 text-xs text-[#f3ead8]">
              Lire le CV
            </a>
            <a
              href={contact.cvPdf}
              className="rounded-sm border border-[#b08d57]/50 px-3.5 py-2 text-xs text-[#5c4a36]"
            >
              Télécharger le PDF
            </a>
          </div>
        </>
      );
    case "contact":
      return (
        <>
          <Hairline />
          <h2 className="font-display text-xl text-[#2c241c]">Contact</h2>
          <a className="mt-3 block text-sm text-[#3d3226] underline decoration-[#b08d57]/50" href={`mailto:${contact.email}`}>
            {contact.email}
          </a>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-[#5c4a36]">
            <a href={contact.networks.github.url} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href={contact.networks.linkedin.url} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            <a href={contact.networks.codeur.url} target="_blank" rel="noreferrer">
              Codeur
            </a>
            <a href={contact.site} target="_blank" rel="noreferrer">
              Site
            </a>
          </div>
        </>
      );
    default:
      return null;
  }
}

function Hairline() {
  return <div className="mb-3 h-px w-14 bg-gradient-to-r from-[#b08d57] to-transparent" />;
}

function DiscoveryMenu() {
  const { discovered } = useGameStore();
  const { done, total } = discoveryProgress();
  const id = content.identity;
  const contact = content.contact;

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex justify-end bg-[#2a2118]/25 backdrop-blur-[2px]">
      <aside
        className="flex h-full w-full max-w-sm flex-col gap-4 overflow-y-auto border-l border-[#c9b896]/40 bg-[#f7f1e6]/95 shadow-2xl"
        style={{
          paddingTop: "max(1rem, env(safe-area-inset-top))",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
          paddingLeft: "1.25rem",
          paddingRight: "max(1.25rem, env(safe-area-inset-right))",
        }}
      >
        <div className="flex items-center justify-between">
          <p className="font-display text-lg text-[#2c241c]">Carte</p>
          <button type="button" className="text-sm text-[#7a6854]" onClick={() => setGameState({ rescueOpen: false })}>
            Fermer
          </button>
        </div>
        <div>
          <p className="font-display text-base text-[#2c241c]">{id.name}</p>
          <p className="text-xs text-[#8a6a3e]">{id.title}</p>
          <p className="mt-2 text-[11px] text-[#9a8874]">
            Découverte {done}/{total} — le monde reste la voie principale.
          </p>
        </div>

        <nav className="flex flex-col gap-1 text-sm">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a7460]">Chapitres</p>
          {CHAPTERS.map((c) => {
            const ok = Boolean(discovered[c.id]);
            return (
              <button
                key={c.id}
                type="button"
                className="flex items-center justify-between border-b border-[#dccfb8]/50 py-2 text-left text-[#2c241c]"
                onClick={() => {
                  travelToChapterZone(c.id);
                }}
              >
                <span>
                  <span className="mr-2 inline-block w-4 text-center text-[#8a6a3e]">{ok ? "✓" : "○"}</span>
                  {c.label}
                </span>
                <span className="text-[10px] text-[#9a8874]">{zoneLabel(c.zone)}</span>
              </button>
            );
          })}
        </nav>

        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a7460]">Raccourcis</p>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-[#5c4a36]">
            <a href="/cv">CV en ligne</a>
            <a href={contact.cvPdf}>PDF</a>
            <a href={`mailto:${contact.email}`}>Email</a>
          </div>
        </div>

        <p className="mt-auto text-[10px] leading-relaxed text-[#9a8874]">
          Un chapitre vous place dans la zone, à pied. Approchez le lieu pour le prompt (Parcours, projets…). Fermer revient où vous étiez.
        </p>
      </aside>
    </div>
  );
}

function shortInteractLabel(prompt: string | null) {
  if (!prompt) return "E";
  if (/parcours/i.test(prompt)) return "Parcours";
  const first = prompt.split(/[\s&/]/)[0]?.trim();
  return first && first.length <= 12 ? first : "E";
}

function zoneLabel(zone: string) {
  const z = content.zones.zones.find((x) => x.id === zone);
  return z?.name ?? zone;
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
      inputRef.touch.x = 0;
      inputRef.touch.y = 0;
    }
  }, [mode]);

  if (!isTouch || phase !== "playing" || openChapter || rescueOpen) return null;

  const showInteract = Boolean(interactTarget && prompt);
  const showLook = mode === "walking";
  const showRun = mode === "walking";

  return (
    <>
      {/* Left: move joystick */}
      <VirtualStick
        side="left"
        onChange={(x, y) => {
          inputRef.touch.x = x;
          inputRef.touch.y = y;
        }}
      />
      {/* Right: look stick (walking) or empty for interact */}
      {showLook && (
        <VirtualStick
          side="right"
          onChange={(x, y) => {
            inputRef.look.x = x;
            inputRef.look.y = y;
          }}
        />
      )}
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
}: {
  side: "left" | "right";
  onChange: (x: number, y: number) => void;
}) {
  const zone = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const gesture = useRef<{ id: number; ox: number; oy: number } | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const reset = () => {
      gesture.current = null;
      onChangeRef.current(0, 0);
      setKnob({ x: 0, y: 0 });
    };

    const apply = (clientX: number, clientY: number) => {
      const g = gesture.current;
      if (!g) return;
      // Origin = finger-down, not widget center — iOS Safari chrome
      // hide/show used to shift getBoundingClientRect and flip axes mid-session.
      const radius = 52;
      let x = (clientX - g.ox) / radius;
      let y = (g.oy - clientY) / radius;
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
      if (gesture.current) return;
      e.preventDefault();
      // Origin = this pointerdown. Never re-read getBoundingClientRect.
      // No setPointerCapture — iOS Safari drops capture when chrome hides.
      gesture.current = { id: e.pointerId, ox: e.clientX, oy: e.clientY };
      apply(e.clientX, e.clientY);
    };
    const move = (e: PointerEvent) => {
      if (!gesture.current || e.pointerId !== gesture.current.id) return;
      e.preventDefault();
      apply(e.clientX, e.clientY);
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
    window.addEventListener("lostpointercapture", up);
    window.addEventListener("blur", reset);
    window.addEventListener("visibilitychange", () => {
      if (document.hidden) reset();
    });
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("lostpointercapture", up);
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
      className="pointer-events-auto absolute h-[5rem] w-[5rem] rounded-full border border-[#c4a574]/40 bg-[#f3ead8]/32 backdrop-blur-[2px] touch-none sm:h-20 sm:w-20"
      style={style}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3d3226]/55 sm:h-6 sm:w-6"
        style={{ transform: `translate(calc(-50% + ${knob.x * 22}px), calc(-50% + ${-knob.y * 22}px))` }}
      />
    </div>
  );
}
