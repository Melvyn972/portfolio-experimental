"use client";

import { PROFILE } from "@/data/content";
import { useExperience } from "@/hooks/useExperience";

export function LoaderGate() {
  const { entered, setEntered, sceneReady, reducedMotion } = useExperience();

  if (entered) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center atelier-gradient">
      <div className="absolute inset-0 opacity-40" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 40%, rgba(201,162,39,0.15), transparent 35%), radial-gradient(circle at 70% 60%, rgba(78,205,196,0.1), transparent 40%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(42,51,72,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(42,51,72,0.35) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative z-10 mx-4 max-w-xl text-center">
        <p className="font-mono text-[11px] tracking-[0.35em] text-[var(--brass)] uppercase animate-pulse-glow">
          Accès atelier
        </p>
        <h1 className="font-display mt-4 text-4xl font-bold leading-[1.05] tracking-tight text-[var(--fg)] sm:text-5xl md:text-6xl">
          {PROFILE.name.split(" ").slice(0, 1).join(" ")}
          <br />
          <span className="text-[var(--mist)] text-[color:var(--atelier-mist)] opacity-90">
            Thierry-Bellefond
          </span>
        </h1>
        <p className="mt-5 text-sm text-[var(--muted)] sm:text-base">{PROFILE.title}</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--fog)]">
          Un univers 3D — garage, établi d&apos;horloger et cockpit — pour explorer un parcours
          tech taillé pour les PME.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => setEntered(true)}
            disabled={!sceneReady && !reducedMotion}
            className="min-h-12 min-w-[14rem] rounded-full bg-[var(--brass)] px-8 py-3 font-display text-sm font-semibold text-[#07080c] transition hover:bg-[var(--amber)] disabled:cursor-wait disabled:opacity-60"
          >
            {sceneReady || reducedMotion ? "Entrer dans l'atelier" : "Initialisation 3D…"}
          </button>
          <a
            href="/cv"
            className="min-h-12 rounded-full border border-[var(--panel-border)] px-6 py-3 font-mono text-xs tracking-wider text-[var(--fg)] uppercase transition hover:border-[var(--cyan)] hover:text-[var(--cyan)]"
          >
            Voir le CV
          </a>
        </div>

        <p className="mt-8 font-mono text-[10px] tracking-wider text-[var(--muted)]">
          Molette / swipe · clavier ↑↓ · rail de sections
        </p>
      </div>
    </div>
  );
}
