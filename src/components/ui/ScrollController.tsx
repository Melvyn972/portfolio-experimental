"use client";

import { useEffect, useRef } from "react";
import { SECTIONS } from "@/data/content";
import { useExperience } from "@/hooks/useExperience";

/**
 * Scroll / touch / keyboard driven progress through the atelier path.
 */
export function ScrollController({ children }: { children: React.ReactNode }) {
  const { setProgress, entered, goToSection, activeSection, reducedMotion } = useExperience();
  const lock = useRef(false);
  const touchY = useRef<number | null>(null);

  useEffect(() => {
    if (!entered || reducedMotion) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (lock.current) return;
      const delta = Math.sign(e.deltaY);
      if (delta === 0) return;
      lock.current = true;
      const idx = SECTIONS.findIndex((s) => s.id === activeSection);
      const next = Math.min(Math.max(idx + delta, 0), SECTIONS.length - 1);
      goToSection(SECTIONS[next].id);
      window.setTimeout(() => {
        lock.current = false;
      }, 700);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        const idx = SECTIONS.findIndex((s) => s.id === activeSection);
        if (idx < SECTIONS.length - 1) goToSection(SECTIONS[idx + 1].id);
      }
      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        const idx = SECTIONS.findIndex((s) => s.id === activeSection);
        if (idx > 0) goToSection(SECTIONS[idx - 1].id);
      }
      if (e.key === "Home") goToSection("entree");
      if (e.key === "End") goToSection("contact");
    };

    const onTouchStart = (e: TouchEvent) => {
      touchY.current = e.touches[0]?.clientY ?? null;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (touchY.current == null || lock.current) return;
      const y = e.changedTouches[0]?.clientY ?? touchY.current;
      const dy = touchY.current - y;
      touchY.current = null;
      if (Math.abs(dy) < 48) return;
      lock.current = true;
      const idx = SECTIONS.findIndex((s) => s.id === activeSection);
      const next = Math.min(Math.max(idx + (dy > 0 ? 1 : -1), 0), SECTIONS.length - 1);
      goToSection(SECTIONS[next].id);
      window.setTimeout(() => {
        lock.current = false;
      }, 700);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [entered, activeSection, goToSection, reducedMotion, setProgress]);

  return <>{children}</>;
}
