/** Inland coastal hamlet — stays off the road ribbon and the maison porch (16.15, −36.2). */

export const TOWN_LOTS = [
  { id: "lot-a", x: 22.8, z: -10.5, yaw: -0.18, kind: "maison" as const },
  { id: "lot-b", x: 25.4, z: -22.0, yaw: 0.12, kind: "atelier" as const },
  { id: "lot-c", x: 23.6, z: -48.8, yaw: -0.28, kind: "maison" as const },
  { id: "lot-d", x: 26.2, z: -62.0, yaw: 0.22, kind: "studio" as const },
  { id: "lot-e", x: 23.2, z: -78.5, yaw: -0.34, kind: "atelier" as const },
  { id: "lot-f", x: 25.8, z: -96.5, yaw: 0.16, kind: "maison" as const },
  { id: "lot-g", x: 23.0, z: -118.0, yaw: 0.08, kind: "studio" as const },
  { id: "lot-h", x: 26.4, z: -138.5, yaw: -0.2, kind: "atelier" as const },
];

export const TOWN_FOOTPRINT: Record<(typeof TOWN_LOTS)[number]["kind"], { sx: number; sy: number; sz: number }> = {
  maison: { sx: 4.6, sy: 5.2, sz: 2.8 },
  atelier: { sx: 3.6, sy: 4.6, sz: 2.4 },
  studio: { sx: 3.8, sy: 5.0, sz: 2.6 },
};

/** Cobbled lane inland of the coastal road — never overlaps the asphalt ribbon. */
export const TOWN_LANE_X = 19.35;
