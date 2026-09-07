/** Land-side climb stub around the phare — stays east of the sea walk wall. */

export const PHARE_CLIMB = {
  cx: -16,
  cz: -172,
  r: 2.38,
  steps: 12,
  y0: 0.42,
  y1: 2.92,
  /** South (+Z) → east → north (−Z / WOW). Never the seaward half. */
  ang0: Math.PI / 2,
  ang1: -Math.PI / 2,
} as const;

export function lighthouseClimbStep(i: number) {
  const max = Math.max(1, PHARE_CLIMB.steps - 1);
  const t = i / max;
  const ang = PHARE_CLIMB.ang0 + (PHARE_CLIMB.ang1 - PHARE_CLIMB.ang0) * t;
  return {
    x: PHARE_CLIMB.cx + Math.cos(ang) * PHARE_CLIMB.r,
    z: PHARE_CLIMB.cz + Math.sin(ang) * PHARE_CLIMB.r,
    y: PHARE_CLIMB.y0 + t * (PHARE_CLIMB.y1 - PHARE_CLIMB.y0),
    ang,
    t,
  };
}

/** Extra stand height on the spiral treads. Never used by the drive heightfield. */
export function walkPlatformHeight(x: number, z: number): number | null {
  if (x > -12.15 || x < -16.45) return null;
  if (z > -168.6 || z < -175.4) return null;
  let best: number | null = null;
  let bestD = 0.58;
  for (let i = 0; i < PHARE_CLIMB.steps; i++) {
    const s = lighthouseClimbStep(i);
    const d = Math.hypot(x - s.x, z - s.z);
    if (d < bestD) {
      bestD = d;
      best = s.y;
    }
  }
  return best;
}
