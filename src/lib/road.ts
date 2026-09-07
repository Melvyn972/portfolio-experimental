import * as THREE from "three";

/**
 * Lollipop coastal road: one driveable ribbon + south turning circle
 * inland of the phare rocks (never a dirt-wall terminus).
 * Phare stays seaward at (−16, −172).
 */
const ROAD_POINTS: [number, number, number][] = [
  [-3.2, 0.06, 48],
  [-3.3, 0.07, 26],
  [-3.4, 0.08, 4],
  [-3.5, 0.1, -18],
  [-3.5, 0.12, -42],
  [-3.4, 0.14, -66],
  [-3.4, 0.17, -90],
  [-3.3, 0.2, -114],
  [-3.2, 0.22, -138],
  [-3.0, 0.24, -154],
  [-1.2, 0.25, -164],
  [2.4, 0.25, -174],
  [6.8, 0.25, -176],
  [9.2, 0.24, -168],
  [8.6, 0.23, -156],
  [5.2, 0.22, -150],
  [1.0, 0.22, -148],
  [-2.4, 0.21, -140],
  [-3.2, 0.2, -120],
  [-3.4, 0.16, -90],
  [-3.5, 0.12, -54],
  [-3.4, 0.1, -20],
  [-3.3, 0.08, 12],
  [-3.2, 0.07, 36],
  [-1.0, 0.06, 54],
  [3.6, 0.06, 58],
  [2.2, 0.06, 50],
];

export const ROAD_WIDTH = 7.2;
export const ROAD_LENGTH_HINT = 480;
export const ROAD_SURFACE_LIFT = 0.2;

const curve = new THREE.CatmullRomCurve3(
  ROAD_POINTS.map((p) => new THREE.Vector3(...p)),
  true,
  "catmullrom",
  0.3,
);

const _tmp = new THREE.Vector3();
const _side = new THREE.Vector3();
const _toPoint = new THREE.Vector3();

export function getRoadCurve() {
  return curve;
}

export function sampleRoad(t: number) {
  const u = ((t % 1) + 1) % 1;
  const position = curve.getPointAt(u);
  const tangent = curve.getTangentAt(u).normalize();
  return { position, tangent, t: u };
}

function tClosest(x: number, z: number) {
  let bestT = 0;
  let best = Infinity;
  for (let i = 0; i <= 280; i++) {
    const t = i / 280;
    curve.getPointAt(t, _tmp);
    const d = (_tmp.x - x) ** 2 + (_tmp.z - z) ** 2;
    if (d < best) {
      best = d;
      bestT = t;
    }
  }
  return bestT;
}

export function nearestRoadSample(world: THREE.Vector3, samples = 220) {
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
  for (let i = 0; i <= 14; i++) {
    const t = THREE.MathUtils.clamp(bestT + (i / 14 - 0.5) * span * 2, 0, 1);
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

export function roadCorrectionForce(world: THREE.Vector3, maxLateral = ROAD_WIDTH * 0.48) {
  const { tangent, lateral } = nearestRoadSample(world);
  _side.set(-tangent.z, 0, tangent.x);
  if (Math.abs(lateral) <= maxLateral) {
    return _side.multiplyScalar(-lateral * 0.35).clone();
  }
  const overshoot = lateral - Math.sign(lateral) * maxLateral;
  return _side.multiplyScalar(-overshoot * 4.5).clone();
}

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

export const BELVEDERE_T = tClosest(-3.4, -90);
export const START_T = tClosest(-3.3, 26);
export const START_POSE = sampleRoad(START_T);
export const BELVEDERE = sampleRoad(BELVEDERE_T);
export const PHARE_ROAD_T = tClosest(-3.0, -154);

/** Drive/walk pose on the closed lollipop — asphalt Y, never (0,0,0). */
export function ribbonPose(t: number = START_T) {
  const sample = sampleRoad(t);
  const yaw = Math.atan2(sample.tangent.x, sample.tangent.z);
  return {
    t: sample.t,
    x: sample.position.x,
    y: sample.position.y + ROAD_SURFACE_LIFT,
    z: sample.position.z,
    roadY: sample.position.y,
    yaw,
  };
}

export function isNullIsland(x: number, y: number, z: number) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return true;
  return Math.hypot(x, z) < 0.85 && y < 0.55;
}

export function getBelvedereWorldAnchor() {
  const { position, tangent } = BELVEDERE;
  const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
  return {
    position: position.clone(),
    tangent: tangent.clone(),
    side,
    terrace: position.clone().addScaledVector(side, -8.5).setY(1.0),
    stop: position.clone().addScaledVector(side, -0.2),
    yaw: Math.atan2(-side.x, side.z),
  };
}
