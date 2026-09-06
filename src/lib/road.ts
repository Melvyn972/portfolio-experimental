import * as THREE from "three";

/** Coastal road centerline (~200m), sea on −X, cliffs on +X. */
const ROAD_POINTS: [number, number, number][] = [
  [0, 0.05, 40],
  [2, 0.05, 20],
  [-1, 0.08, 0],
  [-4, 0.1, -20],
  [-2, 0.12, -40],
  [1, 0.15, -55],
  [-3, 0.18, -70],
  [-6, 0.22, -85],
  [-4, 0.25, -100],
  [0, 0.28, -115],
  [3, 0.3, -130],
  [-1, 0.32, -145],
  [-5, 0.35, -160],
];

export const ROAD_WIDTH = 7.2;
export const ROAD_LENGTH_HINT = 200;

const curve = new THREE.CatmullRomCurve3(
  ROAD_POINTS.map((p) => new THREE.Vector3(...p)),
  false,
  "catmullrom",
  0.45,
);

export function getRoadCurve() {
  return curve;
}

export function sampleRoad(t: number) {
  const clamped = THREE.MathUtils.clamp(t, 0, 1);
  const position = curve.getPointAt(clamped);
  const tangent = curve.getTangentAt(clamped).normalize();
  return { position, tangent, t: clamped };
}

export function nearestRoadSample(world: THREE.Vector3, samples = 120) {
  let bestT = 0;
  let bestDist = Infinity;
  const tmp = new THREE.Vector3();
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    curve.getPointAt(t, tmp);
    const d = tmp.distanceToSquared(world);
    if (d < bestDist) {
      bestDist = d;
      bestT = t;
    }
  }
  const { position, tangent } = sampleRoad(bestT);
  const toPoint = world.clone().sub(position);
  const lateral = toPoint.dot(new THREE.Vector3(-tangent.z, 0, tangent.x));
  return { t: bestT, position, tangent, lateral, dist: Math.sqrt(bestDist) };
}

/** Soft pull toward road center when drifting off the asphalt. */
export function roadCorrectionForce(world: THREE.Vector3, maxLateral = ROAD_WIDTH * 0.48) {
  const { tangent, lateral } = nearestRoadSample(world);
  if (Math.abs(lateral) <= maxLateral) return new THREE.Vector3();
  const overshoot = lateral - Math.sign(lateral) * maxLateral;
  const side = new THREE.Vector3(-tangent.z, 0, tangent.x);
  return side.multiplyScalar(-overshoot * 2.4);
}

export const START_POSE = sampleRoad(0.08);
export const BELVEDERE_T = 0.52;
export const BELVEDERE = sampleRoad(BELVEDERE_T);
export const STOP_SPOTS = [
  { t: 0.5, label: "Belvédère" },
  { t: 0.54, label: "Terrasse" },
];
