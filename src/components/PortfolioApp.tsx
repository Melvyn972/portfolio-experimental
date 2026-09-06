"use client";

import dynamic from "next/dynamic";
import { ExperienceProvider, useExperience } from "@/hooks/useExperience";
import { ScrollController } from "@/components/ui/ScrollController";
import { LoaderGate } from "@/components/ui/LoaderGate";
import { MobileRail, SectionRail, TopBar } from "@/components/ui/Chrome";
import { SectionOverlays } from "@/components/ui/SectionOverlays";
import { ReducedMotionFallback } from "@/components/ui/ReducedMotionFallback";

const ExperienceCanvas = dynamic(
  () =>
    import("@/components/experience/ExperienceCanvas").then((m) => m.ExperienceCanvas),
  { ssr: false, loading: () => <div className="fixed inset-0 bg-[#07080c]" aria-hidden /> },
);

function Shell() {
  const { reducedMotion, entered } = useExperience();

  return (
    <ScrollController>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[var(--brass)] focus:px-3 focus:py-2 focus:text-[#07080c]"
      >
        Aller au contenu
      </a>
      <TopBar />
      {!reducedMotion && <ExperienceCanvas />}
      {/* Reduced-motion: scrollable 2D only — hide spatial overlays to avoid double content */}
      {reducedMotion && entered ? (
        <main id="contenu">
          <ReducedMotionFallback />
        </main>
      ) : (
        <main id="contenu">
          <SectionOverlays />
        </main>
      )}
      {!reducedMotion && (
        <>
          <SectionRail />
          <MobileRail />
        </>
      )}
      <LoaderGate />
    </ScrollController>
  );
}

export function PortfolioApp() {
  return (
    <ExperienceProvider>
      <Shell />
    </ExperienceProvider>
  );
}
