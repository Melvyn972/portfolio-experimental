"use client";

import { PROFILE, SECTIONS } from "@/data/content";
import { useExperience } from "@/hooks/useExperience";

export function SectionRail() {
  const { activeSection, goToSection, entered } = useExperience();

  if (!entered) return null;

  return (
    <nav
      aria-label="Navigation de l'atelier"
      className="fixed left-3 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2 md:flex lg:left-5"
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
            className="group flex items-center gap-3 text-left"
          >
            <span
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                active
                  ? "scale-125 bg-[var(--brass)] shadow-[0_0_12px_rgba(201,162,39,0.8)]"
                  : "bg-[var(--muted)]/50 group-hover:bg-[var(--cyan)]"
              }`}
            />
            <span
              className={`font-mono text-[10px] tracking-[0.2em] uppercase transition-opacity ${
                active ? "opacity-100 text-[var(--brass)]" : "opacity-0 group-hover:opacity-70"
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

  if (!entered) return null;

  return (
    <nav
      aria-label="Sections"
      className="fixed bottom-3 left-1/2 z-40 flex w-[min(100%-1.5rem,36rem)] -translate-x-1/2 gap-1 overflow-x-auto rounded-2xl border border-[var(--panel-border)] bg-[rgba(7,8,12,0.85)] p-2 backdrop-blur-xl md:hidden"
    >
      {SECTIONS.map((s) => {
        const active = s.id === activeSection;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => goToSection(s.id)}
            className={`min-w-[4.5rem] flex-1 rounded-xl px-2 py-2.5 text-center font-mono text-[10px] tracking-wider uppercase transition ${
              active
                ? "bg-[rgba(201,162,39,0.2)] text-[var(--brass)]"
                : "text-[var(--muted)]"
            }`}
            aria-current={active ? "true" : undefined}
          >
            {s.short}
            <span className="mt-0.5 block text-[9px] normal-case tracking-normal opacity-80">
              {s.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export function TopBar() {
  const { entered, quality, setQuality, goToSection } = useExperience();

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-start justify-between p-4 md:p-6">
      <div className="pointer-events-auto">
        <p className="font-display text-sm font-semibold tracking-wide text-[var(--fg)] md:text-base">
          {PROFILE.firstName}
          <span className="text-[var(--brass)]"> · </span>
          <span className="text-[var(--muted)]">Atelier</span>
        </p>
        <p className="font-mono text-[10px] tracking-[0.25em] text-[var(--muted)] uppercase">
          Mécanique Digitale
        </p>
      </div>
      <div className="pointer-events-auto flex items-center gap-2">
        {entered && (
          <label className="flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-[rgba(7,8,12,0.7)] px-3 py-1.5 text-[10px] text-[var(--muted)] backdrop-blur">
            <span className="hidden sm:inline">Qualité</span>
            <select
              className="bg-transparent text-[var(--fg)] outline-none"
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
          className="rounded-full border border-[var(--panel-border)] bg-[rgba(7,8,12,0.7)] px-3 py-1.5 font-mono text-[10px] tracking-wider text-[var(--fg)] uppercase backdrop-blur transition hover:border-[var(--brass)] hover:text-[var(--brass)]"
        >
          CV
        </a>
        {entered && (
          <button
            type="button"
            onClick={() => goToSection("contact")}
            className="rounded-full bg-[var(--brass)] px-3 py-1.5 font-mono text-[10px] tracking-wider text-[#07080c] uppercase transition hover:bg-[var(--amber)]"
          >
            Embaucher
          </button>
        )}
      </div>
    </header>
  );
}
