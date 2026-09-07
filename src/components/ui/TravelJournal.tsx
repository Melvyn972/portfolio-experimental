"use client";

import { useGameStore } from "@/hooks/useGameStore";
import {
  CHAPTERS,
  discoveryProgress,
  openChapter,
  setGameState,
  travelToChapterZone,
  type ChapterId,
} from "@/lib/gameStore";
import { content } from "@/lib/content";

/**
 * In-world discovery language — leather journal + brass, never a white modal.
 */
export function TravelJournal() {
  const { openChapter: chapter, rescueOpen } = useGameStore();
  if (rescueOpen) return <JournalShell onClose={() => setGameState({ rescueOpen: false })} title="Carnet de voyage" index />;
  if (chapter) {
    return (
      <JournalShell onClose={() => openChapter(null)} title={chapterTitle(chapter)}>
        <ChapterPages chapter={chapter} />
      </JournalShell>
    );
  }
  return null;
}

function JournalShell({
  title,
  onClose,
  children,
  index = false,
}: {
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
  index?: boolean;
}) {
  return (
    <div
      className="pointer-events-auto absolute inset-0 z-30 flex items-end justify-center md:items-center"
      style={{
        background: "radial-gradient(ellipse at 50% 40%, rgba(12,8,5,0.35), rgba(8,6,4,0.62))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
        paddingRight: "max(0.75rem, env(safe-area-inset-right))",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="travel-journal relative max-h-[min(78dvh,40rem)] w-full max-w-lg overflow-hidden md:max-w-xl">
        <div className="journal-brass" />
        <div className="flex items-center justify-between px-5 pt-4">
          <p className="font-display text-[11px] tracking-[0.28em] text-[#c4a46a] uppercase">{title}</p>
          <button type="button" className="text-[11px] tracking-[0.12em] text-[#b8a078]" onClick={onClose}>
            Refermer
          </button>
        </div>
        <div className="journal-page mt-3 max-h-[min(64dvh,32rem)] overflow-y-auto px-5 pb-5 pt-3">
          {index ? <JournalIndex /> : children}
        </div>
      </div>
    </div>
  );
}

function JournalIndex() {
  const { discovered } = useGameStore();
  const { done, total } = discoveryProgress();
  const id = content.identity;
  const contact = content.contact;

  return (
    <div>
      <p className="font-display text-xl text-[#2a1f14]">{id.name}</p>
      <p className="mt-1 text-xs tracking-[0.08em] text-[#6a5438]">{id.title}</p>
      <p className="mt-3 text-[11px] leading-relaxed text-[#5c4a32]">
        Pages trouvées {done}/{total}. Le monde reste la voie — ce carnet n’est qu’un index.
      </p>
      <nav className="mt-4 flex flex-col">
        {CHAPTERS.map((c) => {
          const ok = Boolean(discovered[c.id]);
          return (
            <button
              key={c.id}
              type="button"
              className="flex items-center justify-between border-b border-[#8a7048]/25 py-2 text-left text-sm text-[#2a1f14]"
              onClick={() => travelToChapterZone(c.id)}
            >
              <span>
                <span className="mr-2 inline-block w-4 text-center text-[#8a6a3e]">{ok ? "◆" : "◇"}</span>
                {c.label}
              </span>
              <span className="text-[10px] text-[#7a6854]">{zoneLabel(c.zone)}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#5c4a32]">
        <a href="/cv" className="underline decoration-[#b08d57]/50">
          CV
        </a>
        <a href={contact.cvPdf} className="underline decoration-[#b08d57]/50">
          PDF
        </a>
        <a href={`mailto:${contact.email}`} className="underline decoration-[#b08d57]/50">
          Écrire
        </a>
      </div>
    </div>
  );
}

function ChapterPages({ chapter }: { chapter: ChapterId }) {
  const { journalPage } = useGameStore();
  const pages = pagesFor(chapter);
  const page = pages[Math.min(journalPage, pages.length - 1)];
  return (
    <div>
      {page}
      {pages.length > 1 && (
        <div className="mt-5 flex items-center justify-between text-[11px] tracking-[0.14em] text-[#6a5438]">
          <button
            type="button"
            disabled={journalPage <= 0}
            className="disabled:opacity-30"
            onClick={() => setGameState({ journalPage: Math.max(0, journalPage - 1) })}
          >
            ← Page
          </button>
          <span>
            {journalPage + 1} / {pages.length}
          </span>
          <button
            type="button"
            disabled={journalPage >= pages.length - 1}
            className="disabled:opacity-30"
            onClick={() => setGameState({ journalPage: Math.min(pages.length - 1, journalPage + 1) })}
          >
            Page →
          </button>
        </div>
      )}
      <button
        type="button"
        className="mt-4 rounded-sm border border-[#8a7048]/40 px-3 py-1.5 text-[11px] tracking-[0.14em] text-[#4a3c28]"
        onClick={() => openChapter(null)}
      >
        Reprendre la côte
      </button>
    </div>
  );
}

function pagesFor(chapter: ChapterId): React.ReactNode[] {
  const id = content.identity;
  const contact = content.contact;

  switch (chapter) {
    case "identity":
      return [
        <>
          <Hairline />
          <h2 className="font-display text-2xl text-[#2a1f14]">{id.name}</h2>
          <p className="mt-1.5 text-xs tracking-[0.16em] text-[#8a6a3e] uppercase">{id.title}</p>
          <p className="mt-4 text-sm leading-relaxed text-[#3d3226]">{id.presentation}</p>
          <p className="mt-3 text-xs italic text-[#6a5438]">{id.credo}</p>
        </>,
        <>
          <Hairline />
          <p className="text-sm leading-relaxed text-[#3d3226]">{id.tagline}</p>
          <p className="mt-3 text-xs text-[#6a5438]">{id.ambition}</p>
          <p className="mt-4 text-[11px] text-[#7a6854]">
            {id.location} · {id.age} · {id.permits}
          </p>
        </>,
      ];
    case "parcours":
      return [
        <>
          <Hairline />
          <h2 className="font-display text-xl text-[#2a1f14]">Parcours</h2>
          <ul className="mt-3 space-y-2.5 text-sm">
            {content.formations.map((f) => (
              <li key={f.title} className="border-b border-[#8a7048]/20 pb-2">
                <span className="text-[#2a1f14]">{f.title}</span>
                <span className="mt-0.5 block text-xs text-[#6a5438]">
                  {f.period}
                  {f.school ? ` · ${f.school}` : ""}
                  {f.detail ? ` · ${f.detail}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </>,
      ];
    case "experiences":
      return content.experiences.map((e) => (
        <div key={e.company}>
          <Hairline />
          <p className="font-display text-lg text-[#2a1f14]">{e.role}</p>
          <p className="text-xs text-[#6a5438]">
            {e.company} · {e.period}
          </p>
          <p className="mt-1 text-xs text-[#7a6854]">{e.detail}</p>
          <ul className="mt-2 list-inside list-disc text-xs text-[#3d3226]">
            {e.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
      ));
    case "competences":
      return [
        <>
          <Hairline />
          <h2 className="font-display text-xl text-[#2a1f14]">Compétences</h2>
          <div className="mt-3 space-y-2.5 text-sm">
            {content.competences.clusters.map((c) => (
              <p key={c.id} className="text-[#3d3226]">
                <span className="text-[#2a1f14]">{c.title}</span>
                <span className="mt-0.5 block text-xs text-[#6a5438]">{c.items.join(" · ")}</span>
              </p>
            ))}
          </div>
        </>,
      ];
    case "projets": {
      const featured = content.projets.slice(0, 2);
      const rest = content.projets.slice(2);
      return [
        <>
          <Hairline />
          <h2 className="font-display text-xl text-[#2a1f14]">Projets — Polaroids</h2>
          <div className="mt-3 space-y-3 text-sm">
            {featured.map((p) => (
              <ProjectNote key={p.id} p={p} />
            ))}
          </div>
        </>,
        <>
          <Hairline />
          <h2 className="font-display text-xl text-[#2a1f14]">Autres pages</h2>
          <div className="mt-3 space-y-3 text-sm">
            {rest.map((p) => (
              <ProjectNote key={p.id} p={p} />
            ))}
          </div>
        </>,
      ];
    }
    case "passions":
      return content.passions.map((p) => (
        <div key={p.id}>
          <Hairline />
          <p className="font-display text-lg text-[#2a1f14]">{p.title}</p>
          <p className="text-xs italic text-[#6a5438]">{p.beat}</p>
          <p className="mt-2 text-xs text-[#3d3226]">{p.craft}</p>
        </div>
      ));
    case "activite":
      return [
        <>
          <Hairline />
          <h2 className="font-display text-xl text-[#2a1f14]">Activité</h2>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#8a6a3e]">Auto-entreprise</p>
          <ul className="mt-3 space-y-1.5 text-sm text-[#3d3226]">
            {content.activite.services.map((s) => (
              <li key={s}>· {s}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-[#6a5438]">{content.activite.publicNote}</p>
        </>,
      ];
    case "cv":
      return [
        <>
          <Hairline />
          <h2 className="font-display text-xl text-[#2a1f14]">Curriculum vitæ</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#3d3226]">Consultez le CV en ligne ou le PDF.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="/cv" className="rounded-sm bg-[#3d2918] px-3.5 py-2 text-xs text-[#f0e2c4]">
              Lire le CV
            </a>
            <a href={contact.cvPdf} className="rounded-sm border border-[#b08d57]/50 px-3.5 py-2 text-xs text-[#5c4a36]">
              Télécharger le PDF
            </a>
          </div>
        </>,
      ];
    case "contact":
      return [
        <>
          <Hairline />
          <h2 className="font-display text-xl text-[#2a1f14]">Plaque gravée</h2>
          <a className="mt-3 block text-sm text-[#3d2918] underline decoration-[#b08d57]/50" href={`mailto:${contact.email}`}>
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
        </>,
      ];
    default:
      return [];
  }
}

function ProjectNote({
  p,
}: {
  p: { id: string; name: string; tag: string; stack: string; blurb: string; href?: string };
}) {
  return (
    <div className="border-b border-[#8a7048]/20 pb-2.5">
      <p className="text-[#2a1f14]">
        {p.name} <span className="text-xs text-[#8a6a3e]">· {p.tag}</span>
      </p>
      <p className="text-xs text-[#6a5438]">{p.stack}</p>
      <p className="mt-1 text-xs leading-relaxed text-[#3d3226]">{p.blurb}</p>
      {"href" in p && p.href ? (
        <a href={p.href} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs underline">
          Voir le site
        </a>
      ) : null}
    </div>
  );
}

function Hairline() {
  return <div className="mb-3 h-px w-14 bg-gradient-to-r from-[#b08d57] to-transparent" />;
}

function chapterTitle(id: ChapterId) {
  return CHAPTERS.find((c) => c.id === id)?.label ?? "Carnet";
}

function zoneLabel(zone: string) {
  return content.zones.zones.find((x) => x.id === zone)?.name ?? zone;
}
