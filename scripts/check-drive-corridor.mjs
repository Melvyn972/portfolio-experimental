/**
 * Offline check: coastal ribbon stays near x ≈ −2.4 (no inland S-curve)
 * and ahead samples stay flat enough that a car cannot hit a dirt wall.
 */
import * as THREE from "three";

const ROAD_POINTS = [
  [-2.0, 0.06, 44],
  [-2.1, 0.07, 26],
  [-2.2, 0.08, 8],
  [-2.3, 0.1, -10],
  [-2.4, 0.12, -28],
  [-2.5, 0.13, -46],
  [-2.6, 0.15, -64],
  [-2.7, 0.18, -82],
  [-2.6, 0.22, -100],
  [-2.5, 0.26, -118],
  [-2.4, 0.3, -136],
  [-2.3, 0.33, -154],
  [-2.2, 0.36, -172],
  [-2.1, 0.38, -186],
];

const curve = new THREE.CatmullRomCurve3(
  ROAD_POINTS.map((p) => new THREE.Vector3(...p)),
  false,
  "catmullrom",
  0.45,
);

let maxAbsX = 0;
let maxAbsTx = 0;
let minX = Infinity;
let maxX = -Infinity;

for (let i = 0; i <= 80; i++) {
  const t = i / 80;
  const p = curve.getPointAt(t);
  const tan = curve.getTangentAt(t).normalize();
  maxAbsX = Math.max(maxAbsX, Math.abs(p.x));
  maxAbsTx = Math.max(maxAbsTx, Math.abs(tan.x));
  minX = Math.min(minX, p.x);
  maxX = Math.max(maxX, p.x);
}

const xSpan = maxX - minX;
const ok = xSpan < 1.2 && maxAbsTx < 0.22 && minX > -3.2 && maxX < -1.6;
console.log(
  JSON.stringify(
    { minX: +minX.toFixed(3), maxX: +maxX.toFixed(3), xSpan: +xSpan.toFixed(3), maxAbsTx: +maxAbsTx.toFixed(3), ok },
    null,
    2,
  ),
);
if (!ok) {
  console.error("FAIL: road still snakes inland");
  process.exit(1);
}
console.log("PASS: road stays in a coastal corridor");
