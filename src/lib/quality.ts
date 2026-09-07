import { getSoftGL } from "@/lib/softgl";

export type QualityPreset = "auto" | "high" | "eco";

export interface QualitySettings {
  dpr: [number, number];
  shadows: boolean;
  shadowMapSize: number;
  aa: boolean;
  postfx: boolean;
  seaSegments: number;
  treeCount: number;
  dust: boolean;
  anisotropic: number;
  /** Soft-GL / Éco: skip PBR, cliffs, particles, dense heightfield. */
  lite: boolean;
}

export function resolveQuality(preset: QualityPreset, isMobile: boolean): QualitySettings {
  const eco: QualitySettings = {
    dpr: [1, 1],
    shadows: false,
    shadowMapSize: 512,
    aa: false,
    postfx: false,
    seaSegments: 8,
    treeCount: 8,
    dust: false,
    anisotropic: 1,
    lite: true,
  };
  const high: QualitySettings = {
    dpr: [1, 2],
    shadows: true,
    shadowMapSize: isMobile ? 1024 : 2048,
    aa: !isMobile,
    postfx: true,
    seaSegments: isMobile ? 72 : 110,
    treeCount: isMobile ? 40 : 78,
    dust: !isMobile,
    anisotropic: 8,
    lite: false,
  };

  // Software GL cannot run Haute — Auto on a Chromebook was Error 9.
  if (getSoftGL()) return eco;
  if (preset === "eco") return eco;
  if (preset === "high") return high;
  return isMobile
    ? { ...eco, shadows: true, shadowMapSize: 1024, postfx: false, seaSegments: 24, treeCount: 14, lite: true }
    : high;
}

