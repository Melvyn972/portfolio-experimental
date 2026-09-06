"use client";

import {
  EXPERIENCES,
  FORMATION,
  PASSIONS,
  PROFILE,
  PROJECTS,
  SERVICES,
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
      <div className="relative mx-auto max-w-3xl space-y-14 px-5 py-24 pb-28 sm:px-6 sm:py-28">
        <header>
          <p className="font-mono text-[11px] tracking-[0.3em] text-[var(--brass)] uppercase">
            Mode confort · sans WebGL
          </p>
          <h1 className="font-display mt-3 text-3xl font-bold sm:text-4xl">{PROFILE.name}</h1>
          <p className="mt-2 text-[var(--cyan)]">{PROFILE.title}</p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
            {PROFILE.tagline}
          </p>
          <p className="mt-2 text-sm text-[var(--fog)]">{PROFILE.credo}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href="/cv-melvyn-thierry-bellefond.pdf"
              download
              className="inline-flex min-h-11 items-center rounded-full bg-[var(--brass)] px-4 py-2 font-mono text-[10px] tracking-wider text-[#07080c] uppercase"
            >
              Télécharger le CV
            </a>
            <a
              href="/cv"
              className="inline-flex min-h-11 items-center rounded-full border border-[var(--panel-border)] px-4 py-2 font-mono text-[10px] tracking-wider uppercase"
            >
              Voir le CV
            </a>
            <a
              href="#contact-2d"
              className="inline-flex min-h-11 items-center rounded-full border border-[var(--brass)]/40 px-4 py-2 font-mono text-[10px] tracking-wider text-[var(--brass)] uppercase"
            >
              Contact
            </a>
          </div>
        </header>

        <section id="parcours-2d">
          <h2 className="font-display text-2xl font-semibold text-[var(--brass)]">Parcours</h2>
          <ul className="mt-4 space-y-4">
            {EXPERIENCES.map((e) => (
              <li key={e.company} className="panel-glass rounded-2xl p-4">
                <p className="font-mono text-xs text-[var(--brass)]">{e.period}</p>
                <p className="font-semibold">
                  {e.role} — {e.company}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">{e.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold text-[var(--brass)]">Compétences</h2>
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
          <h2 className="font-display text-2xl font-semibold text-[var(--brass)]">Projets</h2>
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
          <h2 className="font-display text-2xl font-semibold text-[var(--brass)]">Passions</h2>
          <ul className="mt-4 space-y-3">
            {PASSIONS.map((p) => (
              <li key={p.id} className="panel-glass rounded-2xl p-4">
                <p className="font-semibold text-[var(--brass)]">{p.title}</p>
                <p className="text-sm">{p.beat}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold text-[var(--brass)]">Formation</h2>
          <ul className="mt-4 space-y-3">
            {FORMATION.map((f) => (
              <li key={f.title} className="panel-glass rounded-2xl p-4">
                <p className="font-mono text-xs text-[var(--brass)]">{f.period}</p>
                <p className="font-semibold">{f.title}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="contact-2d" className="panel-glass rounded-3xl p-5 sm:p-6">
          <h2 className="font-display text-2xl font-semibold text-[var(--brass)]">Contact</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Auto-entreprise — {SERVICES.slice(0, 4).join(", ").toLowerCase()}.
          </p>
          <a
            href={`mailto:${PROFILE.email}?subject=${encodeURIComponent("Mission freelance")}`}
            className="mt-5 inline-flex min-h-12 items-center rounded-full bg-[var(--brass)] px-6 py-3 font-display text-sm font-semibold text-[#07080c]"
          >
            Écrire à Melvyn
          </a>
          <div className="mt-4 flex flex-wrap gap-4">
            <a href={PROFILE.links.linkedin} className="font-mono text-xs text-[var(--cyan)]">
              LinkedIn
            </a>
            <a href={PROFILE.links.github} className="font-mono text-xs text-[var(--cyan)]">
              GitHub
            </a>
            <a href={PROFILE.links.codeur} className="font-mono text-xs text-[var(--cyan)]">
              Codeur.com
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
