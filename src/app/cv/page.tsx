import type { Metadata } from "next";
import { content } from "@/lib/content";
import { CvToolbar } from "@/components/ui/CvToolbar";
import { CvScrollUnlock } from "@/components/ui/CvScrollUnlock";

export const metadata: Metadata = {
  title: "CV",
  description: `CV de ${content.identity.name} — ${content.identity.title}`,
};

export default function CvPage() {
  const { identity, contact, experiences, formations, competences, projets } = content;

  return (
    <div className="min-h-screen overflow-x-auto overflow-y-auto bg-[#f7f1e6] text-[#2c241c]">
      <CvScrollUnlock />
      <CvToolbar />

      <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10 print:max-w-none print:px-0 print:py-0">
        <header className="border-b-2 border-[#b08d57] pb-6">
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{identity.name}</h1>
          <p className="mt-2 text-base text-[#5c4a36] sm:text-lg">{identity.title}</p>
          <p className="mt-3 text-sm leading-relaxed text-[#7a6854]">{identity.tagline}</p>
          <dl className="mt-4 grid gap-2 text-sm text-[#4a3e32]">
            <div>
              <dt className="font-semibold">Localisation</dt>
              <dd>{identity.location}</dd>
            </div>
            <div>
              <dt className="font-semibold">E-mail</dt>
              <dd>
                <a href={`mailto:${contact.email}`} className="underline">
                  {contact.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Réseaux</dt>
              <dd className="flex flex-wrap gap-3">
                <a href={contact.networks.github.url} className="underline">
                  GitHub
                </a>
                <a href={contact.networks.linkedin.url} className="underline">
                  LinkedIn
                </a>
                <a href={contact.networks.codeur.url} className="underline">
                  Codeur
                </a>
              </dd>
            </div>
          </dl>
        </header>

        <section className="mt-8">
          <h2 className="font-display text-xl text-[#2c241c]">Expériences</h2>
          <ul className="mt-4 space-y-5">
            {experiences.map((e) => (
              <li key={`${e.company}-${e.period}`}>
                <p className="font-semibold">
                  {e.role} — {e.company}
                </p>
                <p className="text-sm text-[#7a6854]">
                  {e.period}
                  {e.detail ? ` · ${e.detail}` : ""}
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#4a3e32]">
                  {e.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl">Formations</h2>
          <ul className="mt-4 space-y-3">
            {formations.map((f) => (
              <li key={f.title}>
                <p className="font-semibold">{f.title}</p>
                <p className="text-sm text-[#7a6854]">
                  {f.period}
                  {f.school ? ` · ${f.school}` : ""}
                  {f.detail ? ` · ${f.detail}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl">Compétences</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {competences.clusters.map((c) => (
              <div key={c.id}>
                <p className="font-semibold">{c.title}</p>
                <p className="text-sm text-[#4a3e32]">{c.items.join(" · ")}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 mb-12">
          <h2 className="font-display text-xl">Projets</h2>
          <ul className="mt-4 space-y-3">
            {projets.map((p) => (
              <li key={p.id}>
                <p className="font-semibold">
                  {p.name} <span className="text-sm font-normal text-[#7a6854]">· {p.tag}</span>
                </p>
                <p className="text-sm text-[#4a3e32]">
                  {p.blurb} <span className="text-[#7a6854]">({p.stack})</span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </div>
  );
}
