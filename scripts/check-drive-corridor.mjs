import * as THREE from "three";

const ROAD_POINTS = [
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

const curve = new THREE.CatmullRomCurve3(
  ROAD_POINTS.map((p) => new THREE.Vector3(...p)),
  true,
  "catmullrom",
  0.3,
);

const phare = { x: -16, z: -172 };
const maison = { x: 16, z: -42 };
let minPhare = Infinity;
let minMaison = Infinity;
let minX = Infinity;
let maxX = -Infinity;
let minZ = Infinity;
let maxZ = -Infinity;
let seaHits = 0;

for (let i = 0; i <= 180; i++) {
  const p = curve.getPointAt(i / 180);
  minX = Math.min(minX, p.x);
  maxX = Math.max(maxX, p.x);
  minZ = Math.min(minZ, p.z);
  maxZ = Math.max(maxZ, p.z);
  minPhare = Math.min(minPhare, Math.hypot(p.x - phare.x, p.z - phare.z));
  minMaison = Math.min(minMaison, Math.hypot(p.x - maison.x, p.z - maison.z));
  if (p.x < -12) seaHits++;
}

const len = curve.getLength();
const hasSouthCircle = maxX > 8 && minZ < -168;
const ok = hasSouthCircle && minPhare > 12 && minMaison > 10 && seaHits === 0 && len > 380;
console.log(
  JSON.stringify(
    {
      len: +len.toFixed(1),
      minX: +minX.toFixed(2),
      maxX: +maxX.toFixed(2),
      minZ: +minZ.toFixed(1),
      maxZ: +maxZ.toFixed(1),
      minPhare: +minPhare.toFixed(2),
      minMaison: +minMaison.toFixed(2),
      seaHits,
      ok,
    },
    null,
    2,
  ),
);
if (!ok) {
  console.error("FAIL: lollipop still hits phare / sea / maison");
  process.exit(1);
}
console.log("PASS: lollipop loop, phare off-ribbon");
