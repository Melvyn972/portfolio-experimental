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

const _tmp = new THREE.Vector3();
const _side = new THREE.Vector3();
const _toPoint = new THREE.Vector3();

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
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    curve.getPointAt(t, _tmp);
    const d = _tmp.distanceToSquared(world);
    if (d < bestDist) {
      bestDist = d;
      bestT = t;
    }
  }
  const { position, tangent } = sampleRoad(bestT);
  _toPoint.copy(world).sub(position);
  _side.set(-tangent.z, 0, tangent.x);
  const lateral = _toPoint.dot(_side);
  return { t: bestT, position, tangent, lateral, dist: Math.sqrt(bestDist) };
}

/** Soft pull toward road center when drifting off the asphalt. */
export function roadCorrectionForce(world: THREE.Vector3, maxLateral = ROAD_WIDTH * 0.48) {
  const { tangent, lateral } = nearestRoadSample(world);
  _side.set(-tangent.z, 0, tangent.x);
  if (Math.abs(lateral) <= maxLateral) {
    return _side.multiplyScalar(-lateral * 0.35).clone();
  }
  const overshoot = lateral - Math.sign(lateral) * maxLateral;
  return _side.multiplyScalar(-overshoot * 4.5).clone();
}

/** Hard clamp onto the driveable ribbon. */
export function clampToRoad(world: THREE.Vector3, maxLateral = ROAD_WIDTH * 0.42) {
  const { position, tangent, lateral } = nearestRoadSample(world);
  if (Math.abs(lateral) <= maxLateral) {
    world.y = position.y;
    return world;
  }
  _side.set(-tangent.z, 0, tangent.x);
  world.copy(position).addScaledVector(_side, Math.sign(lateral) * maxLateral);
  world.y = position.y;
  return world;
}

/** Belvédère aligned with coastal pocket (~z = −85) and zones.json. */
export const BELVEDERE_T = 0.58;
export const START_POSE = sampleRoad(0.08);
export const BELVEDERE = sampleRoad(BELVEDERE_T);

export function getBelvedereWorldAnchor() {
  const { position, tangent } = BELVEDERE;
  const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
  return {
    position: position.clone(),
    tangent: tangent.clone(),
    side,
    terrace: position.clone().addScaledVector(side, -8.5),
    stop: position.clone().addScaledVector(side, -1.0),
    yaw: Math.atan2(-side.x, -side.z),
  };
}
