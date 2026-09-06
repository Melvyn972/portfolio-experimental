import type { Metadata } from "next";
import {
  EXPERIENCES,
  FORMATION,
  PROFILE,
  PROJECTS,
  SKILL_CLUSTERS,
} from "@/data/content";
import { CvToolbar } from "@/components/ui/CvToolbar";

export const metadata: Metadata = {
  title: "CV",
  description: `CV de ${PROFILE.name} — ${PROFILE.title}`,
};

export default function CvPage() {
  return (
    <div className="min-h-screen bg-[#f7f5f0] text-[#12141a]">
      <CvToolbar />

      <article className="mx-auto max-w-3xl px-6 py-10 print:max-w-none print:px-0 print:py-0">
        <header className="border-b-2 border-[#c9a227] pb-6">
          <h1 className="font-display text-4xl font-bold tracking-tight">{PROFILE.name}</h1>
          <p className="mt-2 text-lg text-[#3a4558]">{PROFILE.title}</p>
          <p className="mt-3 text-sm text-[#5a6478]">{PROFILE.tagline}</p>
          <dl className="mt-4 grid gap-1 text-sm text-[#3a4558] sm:grid-cols-2">
            <div>
              <dt className="inline font-semibold">Localisation : </dt>
              <dd className="inline">{PROFILE.location}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">E-mail : </dt>
              <dd className="inline">
                <a href={`mailto:${PROFILE.email}`} className="underline">
                  {PROFILE.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="inline font-semibold">GitHub : </dt>
              <dd className="inline">
                <a href={PROFILE.links.github} className="underline">
                  Melvyn972
                </a>
              </dd>
            </div>
            <div>
              <dt className="inline font-semibold">LinkedIn : </dt>
              <dd className="inline">
                <a href={PROFILE.links.linkedin} className="underline">
                  Profil
                </a>
              </dd>
            </div>
            <div>
              <dt className="inline font-semibold">Infos : </dt>
              <dd className="inline">
                {PROFILE.age} · {PROFILE.permits}
              </dd>
            </div>
          </dl>
        </header>

        <section className="mt-8">
          <h2 className="font-display text-xl font-bold text-[#6b5a2a]">Profil</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#3a4558]">{PROFILE.credo}</p>
          <p className="mt-1 text-sm text-[#3a4558]">{PROFILE.ambition}</p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-bold text-[#6b5a2a]">Expériences</h2>
          <ul className="mt-4 space-y-5">
            {EXPERIENCES.map((exp) => (
              <li key={exp.company}>
                <p className="font-mono text-xs uppercase tracking-wider text-[#8a7350]">
                  {exp.period}
                </p>
                <p className="font-semibold">
                  {exp.role} — {exp.company}
                </p>
                <p className="text-sm text-[#5a6478]">{exp.detail}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#3a4558]">
                  {exp.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-bold text-[#6b5a2a]">Projets clés</h2>
          <ul className="mt-4 space-y-3">
            {PROJECTS.map((p) => (
              <li key={p.id} className="text-sm">
                <span className="font-semibold">{p.name}</span>
                <span className="text-[#8a7350]"> — {p.stack}</span>
                <p className="text-[#3a4558]">{p.blurb}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-bold text-[#6b5a2a]">Compétences</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {SKILL_CLUSTERS.map((c) => (
              <div key={c.id}>
                <p className="font-semibold text-sm">{c.title}</p>
                <p className="text-sm text-[#3a4558]">{c.items.join(", ")}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-bold text-[#6b5a2a]">Formation</h2>
          <ul className="mt-3 space-y-3">
            {FORMATION.map((f) => (
              <li key={f.title} className="text-sm">
                <span className="font-mono text-xs text-[#8a7350]">{f.period}</span>
                <p className="font-semibold">{f.title}</p>
                {(f.school || f.detail) && (
                  <p className="text-[#5a6478]">{[f.school, f.detail].filter(Boolean).join(" · ")}</p>
                )}
              </li>
            ))}
          </ul>
        </section>

        <footer className="mt-10 border-t border-black/10 pt-4 text-xs text-[#5a6478]">
          Document généré pour le portfolio Atelier Mécanique Digitale — auto-entreprise · missions
          freelance. Contact : {PROFILE.email}
        </footer>
      </article>
    </div>
  );
}
