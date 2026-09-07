/** Inland coastal hamlet — stays off the road ribbon and the maison porch (16.15, −36.2). */

export const TOWN_LOTS = [
  { id: "lot-a", x: 22.8, z: -10.5, yaw: -0.18, kind: "maison" as const, tint: "#f3eee4" },
  { id: "lot-b", x: 25.4, z: -22.0, yaw: 0.12, kind: "atelier" as const, tint: "#ead4c6" },
  { id: "lot-i", x: 24.6, z: -33.6, yaw: 0.08, kind: "studio" as const, tint: "#e8dfc6" },
  { id: "lot-c", x: 23.6, z: -48.8, yaw: -0.28, kind: "maison" as const, tint: "#efe0d0" },
  { id: "lot-d", x: 26.2, z: -62.0, yaw: 0.22, kind: "studio" as const, tint: "#f7f2ea" },
  { id: "lot-e", x: 23.2, z: -78.5, yaw: -0.34, kind: "atelier" as const, tint: "#e4d2be" },
  { id: "lot-k", x: 21.2, z: -70.6, yaw: -0.22, kind: "maison" as const, tint: "#f2e6d4" },
  { id: "lot-l", x: 28.6, z: -86.4, yaw: 0.2, kind: "atelier" as const, tint: "#e8d4c0" },
  { id: "lot-f", x: 25.8, z: -96.5, yaw: 0.16, kind: "maison" as const, tint: "#ead8c8" },
  { id: "lot-j", x: 27.0, z: -108.8, yaw: -0.12, kind: "maison" as const, tint: "#f0e6d4" },
  { id: "lot-g", x: 23.0, z: -118.0, yaw: 0.08, kind: "studio" as const, tint: "#efe4d2" },
  { id: "lot-h", x: 26.4, z: -138.5, yaw: -0.2, kind: "atelier" as const, tint: "#e8d0c0" },
];

export const TOWN_FOOTPRINT: Record<(typeof TOWN_LOTS)[number]["kind"], { sx: number; sy: number; sz: number }> = {
  maison: { sx: 4.6, sy: 5.2, sz: 2.8 },
  atelier: { sx: 3.6, sy: 4.6, sz: 2.4 },
  studio: { sx: 3.8, sy: 5.0, sz: 2.6 },
};

/** Cobbled lane inland of the coastal road — never overlaps the asphalt ribbon. */
export const TOWN_LANE_X = 19.35;
