"use client";

import {
  EXPERIENCES,
  PASSIONS,
  PROFILE,
  PROJECTS,
  SKILL_CLUSTERS,
} from "@/data/content";

/** Elegant 2D fallback when prefers-reduced-motion is on. */
export function ReducedMotionFallback() {
  return (
    <div className="fixed inset-0 z-0 overflow-y-auto atelier-gradient">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(42,51,72,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(42,51,72,0.4) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl space-y-16 px-6 py-28 pb-40">
        <header>
          <p className="font-mono text-[11px] tracking-[0.3em] text-[var(--brass)] uppercase">
            Mode confort · sans WebGL
          </p>
          <h2 className="font-display mt-3 text-4xl font-bold">{PROFILE.name}</h2>
          <p className="mt-2 text-[var(--cyan)]">{PROFILE.title}</p>
          <p className="mt-4 text-[var(--muted)]">{PROFILE.tagline}</p>
        </header>

        <section>
          <h3 className="font-display text-2xl font-semibold text-[var(--brass)]">Parcours</h3>
          <ul className="mt-4 space-y-4">
            {EXPERIENCES.map((e) => (
              <li key={e.company} className="panel-glass rounded-2xl p-4">
                <p className="font-mono text-xs text-[var(--brass)]">{e.period}</p>
                <p className="font-semibold">{e.role} — {e.company}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="font-display text-2xl font-semibold text-[var(--brass)]">Compétences</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {SKILL_CLUSTERS.map((c) => (
              <div key={c.id} className="panel-glass rounded-2xl p-4">
                <p className="font-mono text-xs text-[var(--cyan)]">{c.title}</p>
                <p className="mt-2 text-sm text-[var(--fog)]">{c.items.join(" · ")}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="font-display text-2xl font-semibold text-[var(--brass)]">Projets</h3>
          <ul className="mt-4 space-y-3">
            {PROJECTS.map((p) => (
              <li key={p.id} className="panel-glass rounded-2xl p-4">
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-[var(--muted)]">{p.blurb}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="font-display text-2xl font-semibold text-[var(--brass)]">Passions</h3>
          <ul className="mt-4 space-y-3">
            {PASSIONS.map((p) => (
              <li key={p.id} className="panel-glass rounded-2xl p-4">
                <p className="font-semibold text-[var(--brass)]">{p.title}</p>
                <p className="text-sm">{p.beat}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
