"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CAMERA_PATH, SECTIONS, type SectionId } from "@/data/content";

export type QualityMode = "auto" | "high" | "low";

interface ExperienceContextValue {
  progress: number;
  setProgress: (p: number) => void;
  activeSection: SectionId;
  setActiveSection: (id: SectionId) => void;
  goToSection: (id: SectionId) => void;
  entered: boolean;
  setEntered: (v: boolean) => void;
  quality: QualityMode;
  setQuality: (q: QualityMode) => void;
  reducedMotion: boolean;
  isMobile: boolean;
  sceneReady: boolean;
  setSceneReady: (v: boolean) => void;
}

const ExperienceContext = createContext<ExperienceContextValue | null>(null);

function sectionIndex(id: SectionId) {
  return SECTIONS.findIndex((s) => s.id === id);
}

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<SectionId>("entree");
  const [entered, setEntered] = useState(false);
  const [quality, setQuality] = useState<QualityMode>("auto");
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false,
  );
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileMq = window.matchMedia("(max-width: 768px)");
    const sync = () => {
      setReducedMotion(mq.matches);
      setIsMobile(mobileMq.matches);
    };
    sync();
    mq.addEventListener("change", sync);
    mobileMq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      mobileMq.removeEventListener("change", sync);
    };
  }, []);

  const goToSection = useCallback((id: SectionId) => {
    const idx = sectionIndex(id);
    if (idx < 0) return;
    const p = idx / (CAMERA_PATH.length - 1);
    setProgress(p);
    setActiveSection(id);
    setEntered(true);
  }, []);

  const value = useMemo(
    () => ({
      progress,
      setProgress,
      activeSection,
      setActiveSection,
      goToSection,
      entered,
      setEntered,
      quality,
      setQuality,
      reducedMotion,
      isMobile,
      sceneReady,
      setSceneReady,
    }),
    [
      progress,
      activeSection,
      goToSection,
      entered,
      quality,
      reducedMotion,
      isMobile,
      sceneReady,
    ],
  );

  return (
    <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>
  );
}

export function useExperience() {
  const ctx = useContext(ExperienceContext);
  if (!ctx) throw new Error("useExperience must be used within ExperienceProvider");
  return ctx;
}
