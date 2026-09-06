"use client";

import { useEffect } from "react";

/** Scopes body scroll to CV routes (game uses overflow:hidden). */
export function CvScrollUnlock() {
  useEffect(() => {
    document.body.classList.add("cv-page");
    document.body.classList.remove("game-locked");
    return () => {
      document.body.classList.remove("cv-page");
    };
  }, []);
  return null;
}
