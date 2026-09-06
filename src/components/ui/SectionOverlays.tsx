"use client";

import {
  EXPERIENCES,
  FORMATION,
  PASSIONS,
  PROFILE,
  PROJECTS,
  SERVICES,
  SKILL_CLUSTERS,
  type SectionId,
} from "@/data/content";
import { useExperience } from "@/hooks/useExperience";

function Panel({
  id,
  children,
  align = "left",
}: {
  id: SectionId;
  children: React.ReactNode;
  align?: "left" | "right" | "center";
}) {
  const { activeSection, entered } = useExperience();
  const active = entered && activeSection === id;

  const alignClass =
    align === "right"
      ? "md:items-end md:text-right md:ml-auto items-stretch text-left"
      : align === "center"
        ? "items-center text-center mx-auto"
        : "items-start text-left";

  return (
    <section
      aria-hidden={!active}
      className={`absolute inset-0 z-20 flex px-3 pt-20 md:px-10 md:pt-28 ${
        active ? "pointer-events-none opacity-100" : "pointer-events-none opacity-0"
      } transition-opacity duration-500`}
      style={{
        // Keep content clear of top bar + mobile bottom rail (+ safe area)
        paddingBottom: "max(6.5rem, calc(5.25rem + env(safe-area-inset-bottom)))",
      }}
    >
      <div
        data-scroll-panel={active ? "true" : undefined}
        className={`${active ? "pointer-events-auto" : "pointer-events-none"} flex max-h-full w-full max-w-xl flex-col gap-3 overflow-y-auto overscroll-contain sm:gap-4 ${alignClass} ${
          active ? "translate-y-0" : "translate-y-3"
        } transition-transform duration-500 [-ms-overflow-style:none] [scrollbar-width:thin]`}
      >
        {children}
      </div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] tracking-[0.3em] text-[var(--brass)] uppercase">{children}</p>
  );
}

export function SectionOverlays() {
  const { goToSection } = useExperience();

  return (
    <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
      <Panel id="entree" align="center">
        <div className="panel-glass rounded-3xl px-5 py-6 sm:px-8 sm:py-8">
          <Eyebrow>01 — Entrée</Eyebrow>
          <h2 className="font-display mt-2 text-3xl font-bold leading-tight sm:text-5xl">
            Atelier Mécanique
            <br />
            <span className="text-[var(--brass)]">Digitale</span>
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--muted)] sm:text-base">
            {PROFILE.tagline}
          </p>
          <button
            type="button"
            onClick={() => goToSection("profil")}
            className="mt-5 min-h-12 rounded-full border border-[var(--brass)]/40 px-6 py-2.5 font-mono text-xs tracking-wider text-[var(--brass)] uppercase transition hover:bg-[var(--brass)] hover:text-[#07080c]"
          >
            Découvrir Melvyn
          </button>
        </div>
      </Panel>

      <Panel id="profil">
        <div className="panel-glass w-full rounded-3xl p-5 sm:p-6">
          <Eyebrow>02 — Profil</Eyebrow>
          <h2 className="font-display mt-2 text-3xl font-bold sm:text-4xl">{PROFILE.name}</h2>
          <p className="font-mono text-sm text-[var(--cyan)]">{PROFILE.title}</p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{PROFILE.credo}</p>
          <p className="mt-2 text-sm text-[var(--fog)]">{PROFILE.ambition}</p>
          <p className="mt-3 font-mono text-xs text-[var(--muted)]">{PROFILE.location}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { href: PROFILE.links.github, label: "GitHub" },
              { href: PROFILE.links.linkedin, label: "LinkedIn" },
              { href: PROFILE.links.codeur, label: "Codeur" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-full border border-[var(--panel-border)] px-4 py-2 font-mono text-[10px] tracking-wider uppercase transition hover:border-[var(--cyan)] hover:text-[var(--cyan)]"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </Panel>

      <Panel id="diagnostic" align="right">
        <Eyebrow>03 — Baie de diagnostic</Eyebrow>
        <h2 className="font-display text-3xl font-bold sm:text-4xl">Parcours pro</h2>
        <p className="max-w-md text-sm text-[var(--muted)]">
          Passion Beauté, Prisma Media, Search Artisan — et missions freelance.
        </p>
        <ul className="mt-1 flex w-full max-w-md flex-col gap-3">
          {EXPERIENCES.map((exp) => (
            <li key={exp.company} className="panel-glass rounded-2xl p-4 text-left">
              <p className="font-mono text-[10px] tracking-wider text-[var(--brass)] uppercase">
                {exp.period}
              </p>
              <p className="mt-1 font-display text-base font-semibold">{exp.role}</p>
              <p className="text-sm text-[var(--cyan)]">{exp.company}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{exp.detail}</p>
              <ul className="mt-2 space-y-1">
                {exp.highlights.map((h) => (
                  <li key={h} className="text-xs leading-relaxed text-[var(--fog)]">
                    · {h}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel id="competences">
        <Eyebrow>04 — Clusters holographiques</Eyebrow>
        <h2 className="font-display text-3xl font-bold sm:text-4xl">Compétences</h2>
        <p className="text-sm text-[var(--muted)]">
          Pas de barres de pourcentage — des modules assemblés comme un build custom.
        </p>
        <div className="mt-1 grid w-full max-w-lg grid-cols-2 gap-2 sm:grid-cols-3">
          {SKILL_CLUSTERS.map((c) => (
            <div key={c.id} className="panel-glass rounded-2xl p-3 text-left">
              <p className="font-mono text-[10px] tracking-wider text-[var(--brass)] uppercase">
                {c.title}
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-[var(--fog)]">
                {c.items.join(" · ")}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel id="projets" align="center">
        <Eyebrow>05 — Établis de pièces</Eyebrow>
        <h2 className="font-display text-3xl font-bold sm:text-4xl">Projets</h2>
        <p className="max-w-lg text-sm text-[var(--muted)]">
          Des pièces à inspecter — apps métier, infra, e-commerce, missions freelance.
        </p>
        <div className="mt-1 grid w-full max-w-3xl grid-cols-1 gap-2 sm:grid-cols-2">
          {PROJECTS.map((p) => (
            <article key={p.id} className="panel-glass rounded-2xl p-4 text-left">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                <span className="font-mono text-[9px] tracking-wider text-[var(--cyan)] uppercase">
                  {p.tag}
                </span>
              </div>
              <p className="mt-1 font-mono text-[10px] text-[var(--brass)]">{p.stack}</p>
              <p className="mt-2 text-xs leading-relaxed text-[var(--fog)]">{p.blurb}</p>
              {"href" in p && p.href ? (
                <a
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex min-h-10 items-center font-mono text-[10px] text-[var(--cyan)] underline-offset-2 hover:underline"
                >
                  Voir le site →
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </Panel>

      <Panel id="passions">
        <Eyebrow>06 — Stations passion</Eyebrow>
        <h2 className="font-display text-3xl font-bold sm:text-4xl">Ce qui nourrit le craft</h2>
        <div className="mt-1 flex max-w-lg flex-col gap-2">
          {PASSIONS.map((p) => (
            <div key={p.id} className="panel-glass rounded-2xl p-4 text-left">
              <p className="font-display text-base font-semibold text-[var(--brass)]">{p.title}</p>
              <p className="mt-1 text-sm text-[var(--fg)]">{p.beat}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{p.craft}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel id="cv" align="right">
        <Eyebrow>07 — Dossier technique</Eyebrow>
        <h2 className="font-display text-3xl font-bold sm:text-4xl">CV</h2>
        <p className="max-w-md text-sm text-[var(--muted)]">
          {PROFILE.age} · {PROFILE.permits} · {PROFILE.location}
        </p>
        <ul className="mt-1 max-w-md space-y-2 text-left text-sm text-[var(--fog)]">
          {FORMATION.map((f) => (
            <li key={f.title} className="panel-glass rounded-xl px-4 py-3">
              <span className="font-mono text-[10px] text-[var(--brass)]">{f.period}</span>
              <p className="font-display font-semibold">{f.title}</p>
              {(f.school || f.detail) && (
                <p className="text-xs text-[var(--muted)]">
                  {[f.school, f.detail].filter(Boolean).join(" · ")}
                </p>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="/cv"
            className="inline-flex min-h-12 items-center rounded-full bg-[var(--brass)] px-5 py-2.5 font-mono text-xs tracking-wider text-[#07080c] uppercase transition hover:bg-[var(--amber)]"
          >
            Voir le CV
          </a>
          <a
            href="/api/cv-pdf"
            className="inline-flex min-h-12 items-center rounded-full border border-[var(--panel-border)] px-5 py-2.5 font-mono text-xs tracking-wider uppercase transition hover:border-[var(--cyan)] hover:text-[var(--cyan)]"
          >
            Télécharger PDF
          </a>
        </div>
      </Panel>

      <Panel id="contact" align="center">
        <div className="panel-glass w-full max-w-md rounded-3xl px-4 py-5 sm:px-6 sm:py-6">
          <Eyebrow>08 — Zone magnétique</Eyebrow>
          <h2 className="font-display mt-2 text-3xl font-bold sm:text-4xl">Projet en tête&nbsp;?</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Auto-entreprise ouverte aux missions : sites, apps métier, TMA, SEO, infra.
          </p>
          <div className="mt-3 hidden flex-wrap justify-center gap-2 sm:flex">
            {SERVICES.map((s) => (
              <span
                key={s}
                className="rounded-full border border-[var(--panel-border)] px-3 py-1 font-mono text-[10px] text-[var(--fog)]"
              >
                {s}
              </span>
            ))}
          </div>
          <ContactForm />
          <div className="mt-4 flex flex-wrap justify-center gap-4 pb-1">
            <a
              href={PROFILE.links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center font-mono text-xs text-[var(--cyan)] hover:underline"
            >
              LinkedIn
            </a>
            <a
              href={PROFILE.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center font-mono text-xs text-[var(--cyan)] hover:underline"
            >
              GitHub
            </a>
            <a
              href={PROFILE.links.codeur}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center font-mono text-xs text-[var(--cyan)] hover:underline"
            >
              Codeur.com
            </a>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function ContactForm() {
  const mailto = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const name = String(data.get("name") || "");
    const email = String(data.get("email") || "");
    const message = String(data.get("message") || "");
    const subject = encodeURIComponent(`Mission freelance — ${name || "Contact portfolio"}`);
    const body = encodeURIComponent(
      `Bonjour Melvyn,\n\n${message}\n\n— ${name}\n${email}`,
    );
    window.location.href = `mailto:${PROFILE.email}?subject=${subject}&body=${body}`;
  };

  return (
    <form
      className="mt-4 w-full space-y-3 text-left"
      onSubmit={(e) => {
        e.preventDefault();
        mailto(e.currentTarget);
      }}
    >
      <label className="block">
        <span className="font-mono text-[10px] tracking-wider text-[var(--muted)] uppercase">
          Nom
        </span>
        <input
          name="name"
          required
          autoComplete="name"
          className="mt-1 min-h-12 w-full rounded-xl border border-[var(--panel-border)] bg-[rgba(7,8,12,0.85)] px-3 py-2 text-sm outline-none focus:border-[var(--brass)]"
          placeholder="Votre nom"
        />
      </label>
      <label className="block">
        <span className="font-mono text-[10px] tracking-wider text-[var(--muted)] uppercase">
          E-mail
        </span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 min-h-12 w-full rounded-xl border border-[var(--panel-border)] bg-[rgba(7,8,12,0.85)] px-3 py-2 text-sm outline-none focus:border-[var(--brass)]"
          placeholder="vous@entreprise.fr"
        />
      </label>
      <label className="block">
        <span className="font-mono text-[10px] tracking-wider text-[var(--muted)] uppercase">
          Projet
        </span>
        <textarea
          name="message"
          required
          rows={3}
          className="mt-1 w-full rounded-xl border border-[var(--panel-border)] bg-[rgba(7,8,12,0.85)] px-3 py-2 text-sm outline-none focus:border-[var(--brass)]"
          placeholder="Sites, apps métier, TMA, SEO, infra…"
        />
      </label>
      <button
        type="submit"
        className="min-h-12 w-full rounded-full bg-[var(--brass)] px-6 py-3 font-display text-sm font-semibold text-[#07080c] transition hover:bg-[var(--amber)]"
      >
        Écrire à Melvyn
      </button>
      <p className="text-center font-mono text-[10px] text-[var(--muted)]">
        Ouverture de votre client mail → {PROFILE.email}
      </p>
    </form>
  );
}
