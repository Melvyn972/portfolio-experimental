/** Inland coastal hamlet — stays off the road ribbon and the maison porch. */
export const TOWN_LOTS = [
  { id: "lot-a", x: 22.6, z: -22.0, yaw: -0.22, kind: "maison" as const },
  { id: "lot-b", x: 25.0, z: -54.5, yaw: 0.18, kind: "atelier" as const },
  { id: "lot-c", x: 23.4, z: -74.0, yaw: -0.38, kind: "studio" as const },
  { id: "lot-d", x: 25.6, z: -96.5, yaw: 0.28, kind: "maison" as const },
  { id: "lot-e", x: 22.2, z: -134.0, yaw: 0.12, kind: "atelier" as const },
];

export const TOWN_FOOTPRINT: Record<(typeof TOWN_LOTS)[number]["kind"], { sx: number; sy: number; sz: number }> = {
  maison: { sx: 4.6, sy: 5.2, sz: 2.8 },
  atelier: { sx: 3.6, sy: 4.6, sz: 2.4 },
  studio: { sx: 3.8, sy: 5.0, sz: 2.6 },
};
