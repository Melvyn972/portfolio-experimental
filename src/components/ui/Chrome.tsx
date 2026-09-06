"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PROFILE, SECTIONS } from "@/data/content";
import { useExperience } from "@/hooks/useExperience";

export function SectionRail() {
  const { activeSection, goToSection, entered } = useExperience();

  if (!entered) return null;

  return (
    <nav
      aria-label="Navigation de l'atelier"
      className="fixed left-2 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-1 md:flex lg:left-4"
    >
      {SECTIONS.map((s) => {
        const active = s.id === activeSection;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => goToSection(s.id)}
            aria-current={active ? "true" : undefined}
            aria-label={`Aller à ${s.label}`}
            className="group flex min-h-11 min-w-11 items-center gap-3 px-1 text-left"
          >
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full transition-all duration-300 ${
                active
                  ? "scale-125 bg-[var(--brass)] shadow-[0_0_12px_rgba(201,162,39,0.8)]"
                  : "bg-[var(--muted)]/50 group-hover:bg-[var(--cyan)]"
              }`}
            />
            <span
              className={`font-mono text-[10px] tracking-[0.2em] uppercase transition-opacity ${
                active
                  ? "opacity-100 text-[var(--brass)]"
                  : "opacity-0 group-hover:opacity-70 group-focus-visible:opacity-70"
              }`}
            >
              {s.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export function MobileRail() {
  const { activeSection, goToSection, entered } = useExperience();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [hiddenRight, setHiddenRight] = useState(0);

  const updateOverflow = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    const left = el.scrollLeft;
    setCanLeft(left > 8);
    setCanRight(max - left > 8);
    const viewRight = left + el.clientWidth;
    let hidden = 0;
    el.querySelectorAll<HTMLElement>('button[aria-label^="Aller"]').forEach((btn) => {
      if (btn.offsetLeft + btn.offsetWidth * 0.45 > viewRight) hidden += 1;
    });
    setHiddenRight(hidden);
  }, []);

  useEffect(() => {
    if (!entered) return;
    const el = scrollerRef.current;
    if (!el) return;
    updateOverflow();
    el.addEventListener("scroll", updateOverflow, { passive: true });
    window.addEventListener("resize", updateOverflow);
    return () => {
      el.removeEventListener("scroll", updateOverflow);
      window.removeEventListener("resize", updateOverflow);
    };
  }, [entered, updateOverflow]);

  // Keep active section in view + reveal overflow cue
  useEffect(() => {
    if (!entered) return;
    const el = scrollerRef.current;
    if (!el) return;
    const activeBtn = el.querySelector<HTMLElement>('[aria-current="true"]');
    activeBtn?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    const t = window.setTimeout(updateOverflow, 350);
    return () => window.clearTimeout(t);
  }, [activeSection, entered, updateOverflow]);

  if (!entered) return null;

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(120, el.clientWidth * 0.55), behavior: "smooth" });
  };

  return (
    <nav
      aria-label="Sections"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--panel-border)] bg-[rgba(7,8,12,0.92)] pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl md:hidden"
    >
      <p className="px-3 pb-1 text-center font-mono text-[9px] tracking-wider text-[var(--muted)] uppercase">
        Glisser le rail · 08 sections
        {canRight ? " →" : canLeft ? " ←" : ""}
      </p>
      <div className="relative mx-auto max-w-lg">
        {/* Edge fades */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[rgba(7,8,12,0.95)] to-transparent transition-opacity ${
            canLeft ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[rgba(7,8,12,0.95)] to-transparent transition-opacity ${
            canRight ? "opacity-100" : "opacity-0"
          }`}
        />

        {canRight && hiddenRight > 0 && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-1 right-11 z-[9] flex items-center"
          >
            <span className="rounded-md bg-[rgba(201,162,39,0.15)] px-1.5 py-2 font-mono text-[9px] text-[var(--brass)]">
              +{hiddenRight}
            </span>
          </div>
        )}
        {canLeft && (
          <button
            type="button"
            aria-label="Sections précédentes"
            onClick={() => scrollByDir(-1)}
            className="absolute left-0.5 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--panel-border)] bg-[rgba(13,16,24,0.9)] text-[var(--brass)]"
          >
            ‹
          </button>
        )}
        {canRight && (
          <button
            type="button"
            aria-label="Sections suivantes"
            onClick={() => scrollByDir(1)}
            className="absolute right-0.5 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--brass)]/50 bg-[rgba(13,16,24,0.95)] text-[var(--brass)] shadow-[0_0_12px_rgba(201,162,39,0.35)]"
          >
            ›
          </button>
        )}

        <div
          ref={scrollerRef}
          className="flex w-full gap-1 overflow-x-auto overscroll-x-contain px-2 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {SECTIONS.map((s, i) => {
            const active = s.id === activeSection;
            const isLast = i === SECTIONS.length - 1;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => goToSection(s.id)}
                className={`min-h-12 min-w-[4.35rem] shrink-0 snap-start rounded-xl px-2 py-2 text-center font-mono text-[10px] tracking-wider uppercase transition ${
                  active
                    ? "bg-[rgba(201,162,39,0.22)] text-[var(--brass)]"
                    : "text-[var(--muted)]"
                } ${isLast ? "mr-3" : ""}`}
                aria-current={active ? "true" : undefined}
                aria-label={`Aller à ${s.label}`}
              >
                {s.short}
                <span className="mt-0.5 block text-[9px] normal-case tracking-normal opacity-80">
                  {s.label}
                </span>
              </button>
            );
          })}
          {/* Peek spacer so last items aren't flush */}
          <div className="w-2 shrink-0 snap-end" aria-hidden />
        </div>
      </div>
    </nav>
  );
}

export function TopBar() {
  const { entered, quality, setQuality, goToSection, reducedMotion } = useExperience();

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-start justify-between gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:p-6">
      <div className="pointer-events-auto min-w-0">
        <p className="font-display truncate text-sm font-semibold tracking-wide text-[var(--fg)] md:text-base">
          {PROFILE.firstName}
          <span className="text-[var(--brass)]"> · </span>
          <span className="text-[var(--muted)]">Atelier</span>
        </p>
        <p className="font-mono text-[10px] tracking-[0.25em] text-[var(--muted)] uppercase">
          Mécanique Digitale
        </p>
      </div>
      <div className="pointer-events-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        {entered && !reducedMotion && (
          <label className="flex min-h-11 items-center gap-1.5 rounded-full border border-[var(--panel-border)] bg-[rgba(7,8,12,0.75)] px-2.5 py-1.5 text-[10px] text-[var(--muted)] backdrop-blur sm:px-3">
            <span className="hidden sm:inline">Qualité</span>
            <select
              className="max-w-[4.5rem] bg-transparent text-[var(--fg)] outline-none sm:max-w-none"
              value={quality}
              onChange={(e) => setQuality(e.target.value as typeof quality)}
              aria-label="Qualité du rendu 3D"
            >
              <option value="auto">Auto</option>
              <option value="high">Haute</option>
              <option value="low">Éco</option>
            </select>
          </label>
        )}
        <a
          href="/cv"
          className="inline-flex min-h-11 items-center rounded-full border border-[var(--panel-border)] bg-[rgba(7,8,12,0.75)] px-3 py-1.5 font-mono text-[10px] tracking-wider text-[var(--fg)] uppercase backdrop-blur transition hover:border-[var(--brass)] hover:text-[var(--brass)]"
        >
          CV
        </a>
        {entered && (
          <button
            type="button"
            onClick={() => {
              if (reducedMotion) {
                document.getElementById("contact-2d")?.scrollIntoView({ behavior: "smooth" });
              } else {
                goToSection("contact");
              }
            }}
            className="inline-flex min-h-11 items-center rounded-full bg-[var(--brass)] px-3 py-1.5 font-mono text-[10px] tracking-wider text-[#07080c] uppercase transition hover:bg-[var(--amber)]"
          >
            Embaucher
          </button>
        )}
      </div>
    </header>
  );
}
