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
}

export function resolveQuality(preset: QualityPreset, isMobile: boolean): QualitySettings {
  const eco: QualitySettings = {
    dpr: [1, 1.25],
    shadows: false,
    shadowMapSize: 512,
    aa: false,
    postfx: false,
    seaSegments: 48,
    treeCount: 28,
    dust: false,
    anisotropic: 2,
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
  };

  if (preset === "eco") return eco;
  if (preset === "high") return high;
  return isMobile
    ? { ...eco, shadows: true, shadowMapSize: 1024, postfx: true, seaSegments: 56, treeCount: 36 }
    : high;
}
