import * as THREE from "three";

/**
 * Coastal road centerline (~220 m). Stay near x ≈ −2.4 so the ribbon
 * never aims at the inland shelf — Melvyn FAIL: S-curve pointed the
 * car into a dirt wall.
 */
const ROAD_POINTS: [number, number, number][] = [
  [-2.0, 0.06, 44],
  [-2.1, 0.07, 26],
  [-2.2, 0.08, 8],
  [-2.3, 0.10, -10],
  [-2.4, 0.12, -28],
  [-2.5, 0.13, -46],
  [-2.6, 0.15, -64],
  [-2.7, 0.18, -82],
  [-2.6, 0.22, -100],
  [-2.5, 0.26, -118],
  [-2.4, 0.30, -136],
  [-2.3, 0.33, -154],
  [-2.2, 0.36, -172],
  [-2.1, 0.38, -186],
];

export const ROAD_WIDTH = 7.2;
export const ROAD_LENGTH_HINT = 220;
/** Thin asphalt overlay above the continuous sand bed. */
export const ROAD_SURFACE_LIFT = 0.2;

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

export function nearestRoadSample(world: THREE.Vector3, samples = 160) {
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
  const span = 1 / samples;
  for (let i = 0; i <= 12; i++) {
    const t = THREE.MathUtils.clamp(bestT + (i / 12 - 0.5) * span * 2, 0, 1);
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

/** Belvédère aligned with coastal pocket (~z = −85). */
export const BELVEDERE_T = 0.52;
export const START_POSE = sampleRoad(0.06);
export const BELVEDERE = sampleRoad(BELVEDERE_T);
/** Near-phare road stop for final destination */
export const PHARE_ROAD_T = 0.9;

export function getBelvedereWorldAnchor() {
  const { position, tangent } = BELVEDERE;
  const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
  return {
    position: position.clone(),
    tangent: tangent.clone(),
    side,
    terrace: position.clone().addScaledVector(side, -8.5).setY(1.0),
    stop: position.clone().addScaledVector(side, -0.2),
    // Local +Z faces inland (toward the road) so stairs approach from the ribbon.
    yaw: Math.atan2(-side.x, side.z),
  };
}
