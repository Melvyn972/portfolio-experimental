"use client";

import dynamic from "next/dynamic";
import { GameHUD } from "@/components/ui/GameHUD";
import { AmbientAudio, IntroDirector } from "@/components/audio/AmbientAudio";
import { useGameStore } from "@/hooks/useGameStore";

const ExperienceCanvas = dynamic(
  () => import("@/components/experience/ExperienceCanvas").then((m) => m.ExperienceCanvas),
  { ssr: false, loading: () => <LoaderScreen /> },
);

function LoaderScreen() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#d8e6ef]">
      <div className="text-center">
        <p className="font-display text-2xl text-[#2f281f]">Côte Melvyn</p>
        <p className="mt-2 text-xs uppercase tracking-[0.25em] text-[#8a7460]">Chargement de la côte…</p>
      </div>
    </div>
  );
}

export function CoteMelvynApp() {
  const { phase } = useGameStore();

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-[#d8e6ef]">
      <ExperienceCanvas />
      <GameHUD />
      <AmbientAudio />
      <IntroDirector />
      {phase === "boot" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#d8e6ef]">
          <div className="animate-fade-in text-center">
            <p className="font-display text-3xl text-[#2f281f]">Côte Melvyn</p>
            <p className="mt-2 text-xs uppercase tracking-[0.25em] text-[#8a7460]">Préparation du soleil…</p>
          </div>
        </div>
      )}
    </main>
  );
}
