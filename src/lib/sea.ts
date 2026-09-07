/** Inland water edge — past the beach, never under the road lip. */
export const SEA_INLAND_X = -17.4;
/** Mediterranean sheet. Terrain seaward of SEA_INLAND_X must stay below this. */
export const SEA_SURFACE_Y = -0.22;
/** How far under the sea the heightfield / underlay must sit. */
export const SEA_BED_Y = SEA_SURFACE_Y - 0.42;
