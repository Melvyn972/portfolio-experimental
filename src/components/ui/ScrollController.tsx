"use client";

import { useEffect, useRef } from "react";
import { SECTIONS } from "@/data/content";
import { useExperience } from "@/hooks/useExperience";

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "input, textarea, select, button, a, label, [data-scroll-panel], nav[aria-label='Sections']",
    ),
  );
}

/**
 * Scroll / touch / keyboard driven progress through the atelier path.
 */
export function ScrollController({ children }: { children: React.ReactNode }) {
  const { entered, goToSection, activeSection, reducedMotion } = useExperience();
  const lock = useRef(false);
  const touchY = useRef<number | null>(null);

  useEffect(() => {
    if (!entered || reducedMotion) return;

    const onWheel = (e: WheelEvent) => {
      if (isInteractiveTarget(e.target)) return;
      // Allow native scroll inside scroll panels
      const panel = e.target instanceof Element ? e.target.closest("[data-scroll-panel]") : null;
      if (panel) return;
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
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        const idx = SECTIONS.findIndex((s) => s.id === activeSection);
        if (idx < SECTIONS.length - 1) goToSection(SECTIONS[idx + 1].id);
      }
      if (e.key === " ") {
        // Space advances only when not typing
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
      if (isInteractiveTarget(e.target)) {
        touchY.current = null;
        return;
      }
      touchY.current = e.touches[0]?.clientY ?? null;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (touchY.current == null || lock.current) return;
      if (isInteractiveTarget(e.target)) {
        touchY.current = null;
        return;
      }
      const y = e.changedTouches[0]?.clientY ?? touchY.current;
      const dy = touchY.current - y;
      touchY.current = null;
      if (Math.abs(dy) < 56) return;
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
  }, [entered, activeSection, goToSection, reducedMotion]);

  return <>{children}</>;
}
