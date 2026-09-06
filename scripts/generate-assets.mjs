/**
 * Génère des assets GLB stylisés méditerranéens (CC0 maison) —
 * un seul langage low-poly premium, pas de mix cartoon/photoreal.
 * Usage: node scripts/generate-assets.mjs
 */
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

/** Node lacks FileReader — GLTFExporter binary path needs it. */
if (typeof globalThis.FileReader === "undefined") {
  globalThis.FileReader = class FileReader {
    result = null;
    onloadend = null;
    onerror = null;
    readAsArrayBuffer(blob) {
      Promise.resolve(blob.arrayBuffer())
        .then((ab) => {
          this.result = ab;
          this.onloadend?.({ target: this });
        })
        .catch((err) => this.onerror?.(err));
    }
  };
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../public/models");
mkdirSync(OUT, { recursive: true });

const MAT = {
  terracotta: () => new THREE.MeshStandardMaterial({ color: "#c45c3e", metalness: 0.55, roughness: 0.32 }),
  terracottaDark: () => new THREE.MeshStandardMaterial({ color: "#9a3f2a", metalness: 0.4, roughness: 0.4 }),
  chrome: () => new THREE.MeshStandardMaterial({ color: "#d8d4cc", metalness: 0.9, roughness: 0.18 }),
  rubber: () => new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.78, metalness: 0.05 }),
  leather: () => new THREE.MeshStandardMaterial({ color: "#2a2420", roughness: 0.75 }),
  glass: () =>
    new THREE.MeshStandardMaterial({
      color: "#7eb8c8",
      metalness: 0.45,
      roughness: 0.05,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
      emissive: "#3a6a78",
      emissiveIntensity: 0.18,
      side: THREE.DoubleSide,
    }),
  softTop: () => new THREE.MeshStandardMaterial({ color: "#2a221c", roughness: 0.88 }),
  cabin: () => new THREE.MeshStandardMaterial({ color: "#1c1815", roughness: 0.82 }),
  light: () =>
    new THREE.MeshStandardMaterial({ color: "#f7f2e4", emissive: "#fff0c8", emissiveIntensity: 0.45 }),
  tail: () =>
    new THREE.MeshStandardMaterial({ color: "#b03030", emissive: "#801818", emissiveIntensity: 0.3 }),
  bark: () => new THREE.MeshStandardMaterial({ color: "#5a4030", roughness: 0.92 }),
  pine: () => new THREE.MeshStandardMaterial({ color: "#3a6b42", roughness: 0.85 }),
  pineLit: () => new THREE.MeshStandardMaterial({ color: "#4a7c52", roughness: 0.85 }),
  pineDark: () => new THREE.MeshStandardMaterial({ color: "#2f5c38", roughness: 0.85 }),
  cypress: () => new THREE.MeshStandardMaterial({ color: "#1f4a32", roughness: 0.88 }),
  olive: () => new THREE.MeshStandardMaterial({ color: "#7a9260", roughness: 0.9 }),
  oliveLit: () => new THREE.MeshStandardMaterial({ color: "#8aa570", roughness: 0.9 }),
  blossom: () => new THREE.MeshStandardMaterial({ color: "#d4537e", roughness: 0.7 }),
  blossomLit: () => new THREE.MeshStandardMaterial({ color: "#e8789a", roughness: 0.7 }),
  leaf: () => new THREE.MeshStandardMaterial({ color: "#4a7a3a", roughness: 0.9 }),
  stone: () => new THREE.MeshStandardMaterial({ color: "#e4d9c6", roughness: 0.88 }),
  stoneDark: () => new THREE.MeshStandardMaterial({ color: "#d8ccb8", roughness: 0.9 }),
  wood: () => new THREE.MeshStandardMaterial({ color: "#8b5e3c", roughness: 0.65 }),
  woodDark: () => new THREE.MeshStandardMaterial({ color: "#6e4a30", roughness: 0.7 }),
  brass: () => new THREE.MeshStandardMaterial({ color: "#b08d57", metalness: 0.78, roughness: 0.32 }),
  rock: () => new THREE.MeshStandardMaterial({ color: "#b9aa92", roughness: 0.95, flatShading: true }),
  rockLit: () => new THREE.MeshStandardMaterial({ color: "#cfc0a8", roughness: 0.95, flatShading: true }),
  skin: () => new THREE.MeshStandardMaterial({ color: "#d6b39a", roughness: 0.65 }),
  shirt: () => new THREE.MeshStandardMaterial({ color: "#3d4f5c", roughness: 0.7 }),
  pants: () => new THREE.MeshStandardMaterial({ color: "#2c3540", roughness: 0.75 }),
  hair: () => new THREE.MeshStandardMaterial({ color: "#2a221c", roughness: 0.85 }),
};

function mesh(geo, mat, pos, rot, scale) {
  const m = new THREE.Mesh(geo, mat);
  if (pos) m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  if (scale) m.scale.set(...scale);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function buildWheel() {
  const g = new THREE.Group();
  g.name = "wheel";
  // Thick tire — readable from the rear 3/4 camera (not a paper disc)
  g.add(mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.42, 22), MAT.rubber(), null, [0, 0, Math.PI / 2]));
  g.add(
    mesh(
      new THREE.TorusGeometry(0.3, 0.04, 8, 22),
      new THREE.MeshStandardMaterial({ color: "#2a2a2a", roughness: 0.7 }),
      null,
      [0, 0, Math.PI / 2],
    ),
  );
  g.add(mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.44, 16), MAT.chrome(), null, [0, 0, Math.PI / 2]));
  g.add(
    mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.46, 10),
      new THREE.MeshStandardMaterial({ color: "#1a1512", roughness: 0.5 }),
      null,
      [0, 0, Math.PI / 2],
    ),
  );
  for (let i = 0; i < 5; i++) {
    const spoke = mesh(new THREE.BoxGeometry(0.05, 0.26, 0.07), MAT.chrome());
    spoke.rotation.set(0, (i * Math.PI) / 5, Math.PI / 2);
    g.add(spoke);
  }
  return g;
}

/** Side-profile extruded hull — elegant Mediterranean roadster silhouette. */
function buildHullExtrusion() {
  const shape = new THREE.Shape();
  // X = length (rear − → front +), Y = height
  shape.moveTo(-2.15, 0.12);
  shape.lineTo(-2.18, 0.48);
  shape.quadraticCurveTo(-1.95, 0.92, -1.55, 0.88); // folded soft-top mass
  shape.quadraticCurveTo(-1.1, 0.78, -0.55, 0.7);
  shape.lineTo(0.15, 0.68);
  shape.lineTo(0.55, 1.05); // windshield rake
  shape.lineTo(0.72, 1.12);
  shape.lineTo(0.88, 0.62);
  shape.quadraticCurveTo(1.35, 0.52, 1.85, 0.48); // hood
  shape.quadraticCurveTo(2.2, 0.42, 2.28, 0.28); // nose
  shape.quadraticCurveTo(2.32, 0.18, 2.2, 0.12);
  shape.lineTo(-2.15, 0.12);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 1.72,
    bevelEnabled: true,
    bevelThickness: 0.07,
    bevelSize: 0.05,
    bevelSegments: 2,
    curveSegments: 16,
  });
  // Shape XY extruded +Z → rotate so length runs along world Z, width along X
  geo.rotateY(-Math.PI / 2);
  geo.translate(0.86, 0, 0);
  return geo;
}

function buildConvertible() {
  const root = new THREE.Group();
  root.name = "MelvynRoadster";

  const body = new THREE.Group();
  body.name = "body";

  // Main sculpted hull + readable volumes (hood / rear deck)
  body.add(mesh(buildHullExtrusion(), MAT.terracotta()));
  body.add(mesh(new THREE.BoxGeometry(1.55, 0.16, 1.35), MAT.terracotta(), [0, 0.58, 1.35]));
  body.add(mesh(new THREE.BoxGeometry(1.5, 0.12, 1.05), MAT.terracottaDark(), [0, 0.7, -1.35]));

  // Cabin tub + readable interior (floor, door cards)
  body.add(mesh(new THREE.BoxGeometry(1.55, 0.22, 1.55), MAT.cabin(), [0, 0.58, -0.15]));
  body.add(mesh(new THREE.BoxGeometry(1.42, 0.04, 1.42), MAT.leather(), [0, 0.72, -0.12]));
  body.add(mesh(new THREE.BoxGeometry(0.06, 0.32, 1.2), MAT.leather(), [0.72, 0.86, -0.1]));
  body.add(mesh(new THREE.BoxGeometry(0.06, 0.32, 1.2), MAT.leather(), [-0.72, 0.86, -0.1]));

  // Character line / rocker
  body.add(mesh(new THREE.BoxGeometry(0.05, 0.12, 3.6), MAT.terracottaDark(), [0.9, 0.32, 0.05]));
  body.add(mesh(new THREE.BoxGeometry(0.05, 0.12, 3.6), MAT.terracottaDark(), [-0.9, 0.32, 0.05]));

  // Wheel arches (half-cylinders)
  for (const [x, z] of [
    [0.92, 1.28],
    [-0.92, 1.28],
    [0.92, -1.38],
    [-0.92, -1.38],
  ]) {
    const arch = mesh(
      new THREE.TorusGeometry(0.42, 0.06, 8, 16, Math.PI),
      MAT.terracottaDark(),
      [x, 0.32, z],
      [0, x > 0 ? Math.PI / 2 : -Math.PI / 2, 0],
    );
    body.add(arch);
  }

  // Soft top stack (more rounded)
  body.add(mesh(new THREE.CapsuleGeometry(0.28, 0.9, 4, 10), MAT.softTop(), [0, 0.82, -1.45], [0, 0, Math.PI / 2]));
  body.add(mesh(new THREE.BoxGeometry(1.25, 0.08, 0.45), MAT.softTop(), [0, 0.98, -1.4]));

  // Windshield — thick tinted pane, readable from the chase cam
  body.add(mesh(new THREE.BoxGeometry(1.52, 0.62, 0.08), MAT.glass(), [0, 1.08, 0.52], [-0.48, 0, 0]));
  body.add(mesh(new THREE.BoxGeometry(0.05, 0.64, 0.05), MAT.chrome(), [0.74, 1.0, 0.52], [-0.48, 0, 0]));
  body.add(mesh(new THREE.BoxGeometry(0.05, 0.64, 0.05), MAT.chrome(), [-0.74, 1.0, 0.52], [-0.48, 0, 0]));
  body.add(mesh(new THREE.BoxGeometry(1.52, 0.05, 0.05), MAT.chrome(), [0, 1.34, 0.36], [-0.48, 0, 0]));
  body.add(mesh(new THREE.BoxGeometry(1.52, 0.04, 0.05), MAT.chrome(), [0, 0.82, 0.66], [-0.48, 0, 0]));

  // Seats (sculpted)
  for (const sx of [0.34, -0.34]) {
    body.add(mesh(new THREE.BoxGeometry(0.48, 0.14, 0.48), MAT.leather(), [sx, 0.7, -0.08]));
    body.add(mesh(new THREE.BoxGeometry(0.48, 0.4, 0.1), MAT.leather(), [sx, 0.9, -0.28]));
    body.add(mesh(new THREE.SphereGeometry(0.12, 8, 8), MAT.leather(), [sx, 1.05, -0.28]));
  }

  const steering = mesh(new THREE.TorusGeometry(0.14, 0.02, 8, 20), MAT.cabin(), [0.34, 0.92, 0.28], [1.15, 0, 0]);
  steering.name = "steering";
  body.add(steering);
  body.add(mesh(new THREE.BoxGeometry(1.35, 0.07, 0.26), MAT.cabin(), [0, 0.78, 0.42]));

  // Headlights (recessed rings)
  for (const hx of [0.48, -0.48]) {
    body.add(mesh(new THREE.TorusGeometry(0.12, 0.02, 8, 16), MAT.chrome(), [hx, 0.48, 2.2], [Math.PI / 2, 0, 0]));
    body.add(mesh(new THREE.CircleGeometry(0.11, 16), MAT.light(), [hx, 0.48, 2.22], [Math.PI / 2, 0, 0]));
  }
  body.add(mesh(new THREE.BoxGeometry(0.36, 0.09, 0.04), MAT.tail(), [0.55, 0.5, -2.12]));
  body.add(mesh(new THREE.BoxGeometry(0.36, 0.09, 0.04), MAT.tail(), [-0.55, 0.5, -2.12]));

  // Grille
  body.add(mesh(new THREE.BoxGeometry(0.7, 0.16, 0.04), MAT.cabin(), [0, 0.38, 2.22]));
  for (const x of [-0.2, -0.07, 0.07, 0.2]) {
    body.add(mesh(new THREE.BoxGeometry(0.03, 0.14, 0.02), MAT.chrome(), [x, 0.38, 2.24]));
  }

  // Mirrors
  body.add(mesh(new THREE.SphereGeometry(0.07, 8, 8), MAT.chrome(), [0.95, 0.78, 0.5]));
  body.add(mesh(new THREE.SphereGeometry(0.07, 8, 8), MAT.chrome(), [-0.95, 0.78, 0.5]));
  body.add(mesh(new THREE.BoxGeometry(0.04, 0.04, 0.12), MAT.chrome(), [0.88, 0.76, 0.48]));
  body.add(mesh(new THREE.BoxGeometry(0.04, 0.04, 0.12), MAT.chrome(), [-0.88, 0.76, 0.48]));

  root.add(body);

  // Chrome bumper lips so the nose/tail read as a finished car
  body.add(mesh(new THREE.BoxGeometry(1.55, 0.08, 0.1), MAT.chrome(), [0, 0.22, 2.26]));
  body.add(mesh(new THREE.BoxGeometry(1.5, 0.08, 0.1), MAT.chrome(), [0, 0.22, -2.16]));

  const wheelOffsets = [
    { name: "wheel_FL", pos: [0.84, 0.36, 1.28], steer: true },
    { name: "wheel_FR", pos: [-0.84, 0.36, 1.28], steer: true },
    { name: "wheel_RL", pos: [0.84, 0.36, -1.38], steer: false },
    { name: "wheel_RR", pos: [-0.84, 0.36, -1.38], steer: false },
  ];
  for (const w of wheelOffsets) {
    const steerG = new THREE.Group();
    steerG.name = w.steer ? `${w.name}_steer` : w.name;
    steerG.position.set(...w.pos);
    const spinG = new THREE.Group();
    spinG.name = `${w.name}_spin`;
    spinG.add(buildWheel());
    steerG.add(spinG);
    root.add(steerG);
  }

  const shadow = mesh(
    new THREE.CircleGeometry(1.4, 28),
    new THREE.MeshBasicMaterial({ color: "#1a1510", transparent: true, opacity: 0.2 }),
    [0, 0.02, 0],
    [-Math.PI / 2, 0, 0],
  );
  shadow.castShadow = false;
  root.add(shadow);

  return root;
}

function buildStonePine() {
  const g = new THREE.Group();
  g.name = "StonePine";
  g.add(mesh(new THREE.CylinderGeometry(0.12, 0.28, 2.4, 8), MAT.bark(), [0, 1.2, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.06, 0.1, 1.1, 6), MAT.bark(), [0.2, 1.7, 0.05], [0, 0, 0.35]));
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.9, 6), MAT.bark(), [-0.18, 1.65, -0.1], [0, 0, -0.3]));
  // Umbrella canopy — flattened icosahedrons
  for (const [pos, s, mat] of [
    [[0, 2.7, 0], 1.25, MAT.pine()],
    [[0.45, 2.55, 0.25], 0.75, MAT.pineLit()],
    [[-0.5, 2.5, -0.2], 0.7, MAT.pineDark()],
    [[0.1, 2.85, -0.35], 0.55, MAT.pine()],
  ]) {
    const geo = new THREE.IcosahedronGeometry(s, 1);
    const posAttr = geo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i);
      posAttr.setY(i, y * 0.45 + (y > 0 ? 0.15 : 0));
      const n = 0.92 + ((Math.sin(i * 7.1) * 0.5 + 0.5) * 0.16);
      posAttr.setX(i, posAttr.getX(i) * n);
      posAttr.setZ(i, posAttr.getZ(i) * n);
    }
    geo.computeVertexNormals();
    g.add(mesh(geo, mat, pos));
  }
  return g;
}

function buildCypress() {
  const g = new THREE.Group();
  g.name = "Cypress";
  g.add(mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.45, 6), MAT.bark(), [0, 1.55, 0]));
  const layers = [
    [0.62, 1.1, 2.0],
    [0.48, 1.0, 2.9],
    [0.32, 0.9, 3.7],
    [0.18, 0.7, 4.35],
  ];
  for (const [r, h, y] of layers) {
    g.add(mesh(new THREE.ConeGeometry(r, h, 9), MAT.cypress(), [0, y, 0]));
  }
  return g;
}

function buildOlive() {
  const g = new THREE.Group();
  g.name = "Olive";
  g.add(mesh(new THREE.CylinderGeometry(0.14, 0.22, 1.5, 7), MAT.bark(), [0, 0.75, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.8, 5), MAT.bark(), [0.25, 1.4, 0.1], [0, 0, 0.5]));
  for (const [pos, s, mat] of [
    [[0, 1.95, 0], 1.0, MAT.olive()],
    [[0.45, 2.05, 0.3], 0.55, MAT.oliveLit()],
    [[-0.4, 2.0, -0.25], 0.5, MAT.olive()],
    [[0.15, 2.25, -0.3], 0.4, MAT.oliveLit()],
  ]) {
    const geo = new THREE.IcosahedronGeometry(s, 1);
    const a = geo.attributes.position;
    for (let i = 0; i < a.count; i++) {
      const n = 0.9 + (Math.sin(i * 5.3) * 0.5 + 0.5) * 0.2;
      a.setXYZ(i, a.getX(i) * n, a.getY(i) * n, a.getZ(i) * n);
    }
    geo.computeVertexNormals();
    g.add(mesh(geo, mat, pos));
  }
  return g;
}

function buildBougainvillea() {
  const g = new THREE.Group();
  g.name = "Bougainvillea";
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.08, 1.4, 5), MAT.leaf(), [0, 0.7, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.9, 4), MAT.leaf(), [0.2, 1.0, 0], [0, 0, 0.6]));
  for (let i = 0; i < 18; i++) {
    const a = i * 0.55;
    const mat = i % 3 === 0 ? MAT.blossom() : i % 3 === 1 ? MAT.blossomLit() : MAT.blossom();
    g.add(
      mesh(new THREE.SphereGeometry(0.1 + (i % 4) * 0.035, 6, 6), mat, [
        Math.sin(a) * (0.4 + (i % 4) * 0.1),
        0.35 + (i % 6) * 0.2,
        Math.cos(a * 1.2) * (0.3 + (i % 3) * 0.12),
      ]),
    );
  }
  for (let i = 0; i < 4; i++) {
    g.add(
      mesh(new THREE.SphereGeometry(0.18, 6, 6), MAT.leaf(), [
        Math.sin(i) * 0.3,
        0.6 + i * 0.2,
        Math.cos(i) * 0.25,
      ]),
    );
  }
  return g;
}

function buildRock(seed = 0) {
  const g = new THREE.Group();
  g.name = `Rock_${seed}`;
  const geo = new THREE.DodecahedronGeometry(1, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const n = 0.85 + ((Math.sin(i * 12.9898 + seed) * 43758.5453) % 1) * 0.35;
    pos.setXYZ(i, pos.getX(i) * n, pos.getY(i) * (0.7 + n * 0.2), pos.getZ(i) * n);
  }
  geo.computeVertexNormals();
  g.add(mesh(geo, seed % 2 === 0 ? MAT.rock() : MAT.rockLit()));
  return g;
}

function buildBench() {
  const g = new THREE.Group();
  g.name = "Bench";
  g.add(mesh(new THREE.BoxGeometry(2.6, 0.12, 0.55), MAT.wood(), [0, 0.2, 0]));
  g.add(mesh(new THREE.BoxGeometry(0.12, 0.4, 0.5), MAT.woodDark(), [-0.9, 0, 0]));
  g.add(mesh(new THREE.BoxGeometry(0.12, 0.4, 0.5), MAT.woodDark(), [0.9, 0, 0]));
  g.add(mesh(new THREE.BoxGeometry(2.4, 0.08, 0.1), MAT.wood(), [0, 0.45, -0.22]));
  return g;
}

function buildCarnet() {
  const g = new THREE.Group();
  g.name = "IdentityCarnet";
  g.add(mesh(new THREE.CylinderGeometry(0.09, 0.14, 1.1, 12), MAT.brass(), [0, 0.55, 0]));
  g.add(mesh(new THREE.BoxGeometry(0.95, 0.06, 0.68), MAT.brass(), [0, 1.12, 0.06], [-0.35, 0, 0]));
  g.add(
    mesh(
      new THREE.BoxGeometry(0.8, 0.025, 0.55),
      new THREE.MeshStandardMaterial({
        color: "#e8f2f0",
        metalness: 0.2,
        roughness: 0.12,
        transparent: true,
        opacity: 0.85,
        emissive: "#d7ebe6",
        emissiveIntensity: 0.18,
      }),
      [0, 1.2, 0.1],
      [-0.35, 0, 0],
    ),
  );
  g.add(
    mesh(
      new THREE.BoxGeometry(0.65, 0.01, 0.45),
      new THREE.MeshStandardMaterial({ color: "#f7f1e4", roughness: 0.85 }),
      [0, 1.22, 0.1],
      [-0.35, 0, 0],
    ),
  );
  return g;
}

function buildAvatar() {
  const g = new THREE.Group();
  g.name = "Explorer";

  // Hip root for stance
  g.add(mesh(new THREE.SphereGeometry(0.16, 10, 10), MAT.pants(), [0, 0.88, 0]));

  // Legs as named groups (pivot at hip) for walk/run swing
  const legL = new THREE.Group();
  legL.name = "legL";
  legL.position.set(0.15, 0.9, 0);
  legL.add(mesh(new THREE.CapsuleGeometry(0.11, 0.38, 4, 10), MAT.pants(), [0, -0.32, 0]));
  legL.add(mesh(new THREE.CapsuleGeometry(0.09, 0.34, 4, 8), MAT.pants(), [0, -0.72, 0]));
  legL.add(mesh(new THREE.BoxGeometry(0.2, 0.1, 0.32), MAT.leather(), [0, -1.0, 0.04]));
  g.add(legL);

  const legR = new THREE.Group();
  legR.name = "legR";
  legR.position.set(-0.15, 0.9, 0);
  legR.add(mesh(new THREE.CapsuleGeometry(0.11, 0.38, 4, 10), MAT.pants(), [0, -0.32, 0]));
  legR.add(mesh(new THREE.CapsuleGeometry(0.09, 0.34, 4, 8), MAT.pants(), [0, -0.72, 0]));
  legR.add(mesh(new THREE.BoxGeometry(0.2, 0.1, 0.32), MAT.leather(), [0, -1.0, 0.04]));
  g.add(legR);

  // Torso
  g.add(mesh(new THREE.CapsuleGeometry(0.26, 0.5, 4, 12), MAT.shirt(), [0, 1.28, 0]));
  g.add(mesh(new THREE.BoxGeometry(0.52, 0.12, 0.36), MAT.shirt(), [0, 1.52, 0.02]));

  // Arms named for swing
  const armL = new THREE.Group();
  armL.name = "armL";
  armL.position.set(0.36, 1.42, 0);
  armL.add(mesh(new THREE.CapsuleGeometry(0.075, 0.36, 4, 8), MAT.shirt(), [0.04, -0.22, 0], [0, 0, 0.15]));
  armL.add(mesh(new THREE.SphereGeometry(0.07, 8, 8), MAT.skin(), [0.08, -0.48, 0]));
  g.add(armL);

  const armR = new THREE.Group();
  armR.name = "armR";
  armR.position.set(-0.36, 1.42, 0);
  armR.add(mesh(new THREE.CapsuleGeometry(0.075, 0.36, 4, 8), MAT.shirt(), [-0.04, -0.22, 0], [0, 0, -0.15]));
  armR.add(mesh(new THREE.SphereGeometry(0.07, 8, 8), MAT.skin(), [-0.08, -0.48, 0]));
  g.add(armR);

  // Head + hair
  g.add(mesh(new THREE.SphereGeometry(0.2, 14, 14), MAT.skin(), [0, 1.78, 0]));
  g.add(mesh(new THREE.SphereGeometry(0.215, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.58), MAT.hair(), [0, 1.88, -0.02]));
  // Simple face accents
  g.add(mesh(new THREE.SphereGeometry(0.025, 6, 6), new THREE.MeshStandardMaterial({ color: "#2a221c" }), [0.07, 1.8, 0.17]));
  g.add(mesh(new THREE.SphereGeometry(0.025, 6, 6), new THREE.MeshStandardMaterial({ color: "#2a221c" }), [-0.07, 1.8, 0.17]));
  return g;
}

function buildLamp() {
  const g = new THREE.Group();
  g.name = "CoastLamp";
  g.add(mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.5, 8), MAT.stone(), [0, 1.25, 0]));
  g.add(mesh(new THREE.BoxGeometry(0.7, 0.08, 0.35), MAT.stoneDark(), [0.35, 2.2, 0]));
  return g;
}

function buildZonePlinth() {
  const g = new THREE.Group();
  g.name = "ZonePlinth";
  g.add(mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.25, 8), MAT.stone()));
  g.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6), MAT.brass(), [0, 0.35, 0]));
  return g;
}

const MAT_EXTRA = {
  plaster: () => new THREE.MeshStandardMaterial({ color: "#f0e8d8", roughness: 0.88 }),
  plasterWarm: () => new THREE.MeshStandardMaterial({ color: "#e8dcc8", roughness: 0.9 }),
  tile: () => new THREE.MeshStandardMaterial({ color: "#c45c3e", roughness: 0.72 }),
  tileDark: () => new THREE.MeshStandardMaterial({ color: "#9a3f2a", roughness: 0.75 }),
  shutter: () => new THREE.MeshStandardMaterial({ color: "#3d5c4a", roughness: 0.7 }),
  lighthouse: () => new THREE.MeshStandardMaterial({ color: "#f5f0e6", roughness: 0.82 }),
  lighthouseBand: () => new THREE.MeshStandardMaterial({ color: "#c45c3e", roughness: 0.7 }),
  lantern: () =>
    new THREE.MeshStandardMaterial({
      color: "#fff4d0",
      emissive: "#ffd090",
      emissiveIntensity: 0.65,
      roughness: 0.3,
    }),
};

function buildBelvedereStructure() {
  const g = new THREE.Group();
  g.name = "BelvedereStructure";
  // Plinth + deck
  g.add(mesh(new THREE.BoxGeometry(11.2, 0.84, 8.7), MAT.stone(), [0, 0.42, 0]));
  g.add(mesh(new THREE.BoxGeometry(10.6, 0.1, 8.1), MAT_EXTRA.plaster(), [0, 0.9, 0]));
  // Tile grooves (subtle)
  for (const z of [-3, -1, 1, 3]) {
    g.add(mesh(new THREE.BoxGeometry(10.2, 0.012, 0.035), MAT.stoneDark(), [0, 0.96, z]));
  }
  for (const x of [-3.5, -1.2, 1.2, 3.5]) {
    g.add(mesh(new THREE.BoxGeometry(0.035, 0.012, 7.7), MAT.stoneDark(), [x, 0.96, 0]));
  }
  // Cascading steps
  [
    [4.6, 0.32, 1.5, 2.4, 0.5, 2.5],
    [6.3, 0.16, 1.5, 1.7, 0.28, 2.1],
    [7.4, 0.05, 1.5, 1.0, 0.12, 1.85],
  ].forEach(([x, y, z, w, h, d], i) => {
    g.add(
      mesh(
        new THREE.BoxGeometry(w, h, d),
        i === 0 ? MAT.stone() : i === 1 ? MAT.stoneDark() : MAT.rockLit(),
        [x, y, z],
      ),
    );
  });
  // Sea parapet
  g.add(mesh(new THREE.BoxGeometry(0.38, 0.75, 7.8), MAT.stoneDark(), [-4.95, 1.3, 0]));
  for (const z of [-3.4, -1.15, 1.15, 3.4]) {
    g.add(mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.55, 8), MAT.stone(), [-4.95, 1.75, z]));
    g.add(mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 8), MAT.brass(), [-4.95, 2.07, z]));
  }
  g.add(
    mesh(
      new THREE.BoxGeometry(0.05, 0.42, 6.4),
      new THREE.MeshStandardMaterial({
        color: "#c5e0e8",
        metalness: 0.35,
        roughness: 0.08,
        transparent: true,
        opacity: 0.4,
      }),
      [-4.78, 1.5, 0],
    ),
  );
  g.add(mesh(new THREE.BoxGeometry(9.6, 0.55, 0.28), MAT.stoneDark(), [0, 1.2, -3.75]));
  g.add(mesh(new THREE.BoxGeometry(9.6, 0.4, 0.26), MAT.stoneDark(), [0, 1.15, 3.75]));
  g.add(mesh(new THREE.BoxGeometry(0.08, 0.06, 7.4), MAT.brass(), [-4.95, 1.85, 0]));
  // Canopy
  for (const x of [3.15, 0.45]) {
    g.add(mesh(new THREE.CylinderGeometry(0.07, 0.08, 2.5, 8), MAT.stone(), [x, 2.15, -1.75]));
  }
  g.add(mesh(new THREE.BoxGeometry(5.0, 0.12, 2.5), MAT.wood(), [1.8, 3.42, -1.75]));
  g.add(mesh(new THREE.BoxGeometry(4.6, 0.05, 2.15), MAT.woodDark(), [1.8, 3.3, -1.75]));
  return g;
}

function buildMaison() {
  const g = new THREE.Group();
  g.name = "MaisonAtelier";
  // Main volume
  g.add(mesh(new THREE.BoxGeometry(9.5, 3.4, 7.2), MAT_EXTRA.plaster(), [0, 1.7, 0]));
  // Terrace wing
  g.add(mesh(new THREE.BoxGeometry(4.2, 2.4, 4.5), MAT_EXTRA.plasterWarm(), [5.2, 1.2, 1.2]));
  // Roof tiles (hipped simple)
  g.add(mesh(new THREE.BoxGeometry(10.2, 0.25, 7.8), MAT_EXTRA.tile(), [0, 3.55, 0], [0.08, 0, 0]));
  g.add(mesh(new THREE.BoxGeometry(4.6, 0.2, 4.9), MAT_EXTRA.tileDark(), [5.2, 2.55, 1.2], [0.1, 0, 0]));
  // Chimney
  g.add(mesh(new THREE.BoxGeometry(0.7, 1.2, 0.7), MAT.stone(), [-2.5, 4.3, -1.5]));
  // Door
  g.add(mesh(new THREE.BoxGeometry(1.1, 2.1, 0.12), MAT.woodDark(), [0.5, 1.05, 3.62]));
  g.add(mesh(new THREE.SphereGeometry(0.05, 8, 8), MAT.brass(), [0.9, 1.05, 3.7]));
  // Windows + shutters
  for (const [x, y, z] of [
    [-2.5, 1.8, 3.62],
    [2.2, 1.8, 3.62],
    [-4.8, 1.6, 0],
    [4.8, 1.6, -1],
  ]) {
    g.add(mesh(new THREE.BoxGeometry(1.2, 1.1, 0.08), MAT.glass(), [x, y, z]));
    g.add(mesh(new THREE.BoxGeometry(0.35, 1.15, 0.1), MAT_EXTRA.shutter(), [x - 0.7, y, z]));
    g.add(mesh(new THREE.BoxGeometry(0.35, 1.15, 0.1), MAT_EXTRA.shutter(), [x + 0.7, y, z]));
  }
  // Stone base
  g.add(mesh(new THREE.BoxGeometry(9.8, 0.45, 7.5), MAT.stone(), [0, 0.2, 0]));
  g.add(mesh(new THREE.BoxGeometry(4.5, 0.35, 4.8), MAT.stoneDark(), [5.2, 0.15, 1.2]));
  // Pergola posts
  for (const x of [3.8, 6.4]) {
    g.add(mesh(new THREE.CylinderGeometry(0.08, 0.09, 2.2, 6), MAT.wood(), [x, 2.3, 3.6]));
  }
  g.add(mesh(new THREE.BoxGeometry(3.2, 0.1, 0.15), MAT.woodDark(), [5.1, 3.35, 3.6]));
  return g;
}

function buildStudio() {
  const g = new THREE.Group();
  g.name = "StudioProjets";
  g.add(mesh(new THREE.BoxGeometry(7.5, 2.8, 5.5), MAT_EXTRA.plasterWarm(), [0, 1.4, 0]));
  g.add(mesh(new THREE.BoxGeometry(8.0, 0.22, 5.9), MAT_EXTRA.tileDark(), [0, 2.95, 0], [0.06, 0, 0]));
  // Large glass facade
  g.add(
    mesh(
      new THREE.BoxGeometry(5.5, 1.8, 0.08),
      new THREE.MeshStandardMaterial({
        color: "#b9d6e0",
        metalness: 0.3,
        roughness: 0.1,
        transparent: true,
        opacity: 0.55,
      }),
      [0, 1.5, 2.78],
    ),
  );
  g.add(mesh(new THREE.BoxGeometry(0.12, 1.9, 0.12), MAT.brass(), [-2.8, 1.5, 2.78]));
  g.add(mesh(new THREE.BoxGeometry(0.12, 1.9, 0.12), MAT.brass(), [2.8, 1.5, 2.78]));
  g.add(mesh(new THREE.BoxGeometry(5.7, 0.1, 0.12), MAT.brass(), [0, 2.45, 2.78]));
  // Side door
  g.add(mesh(new THREE.BoxGeometry(0.9, 1.9, 0.1), MAT.wood(), [3.8, 0.95, 1.2]));
  // Display plinths outside
  for (const x of [-1.8, 0, 1.8]) {
    g.add(mesh(new THREE.BoxGeometry(1.0, 0.55, 0.7), MAT.stone(), [x, 0.28, 3.6]));
    g.add(mesh(new THREE.BoxGeometry(0.7, 0.08, 0.5), MAT.brass(), [x, 0.6, 3.6]));
  }
  return g;
}

function buildPhare() {
  const g = new THREE.Group();
  g.name = "Phare";
  // Rocky plinth
  g.add(mesh(new THREE.CylinderGeometry(3.2, 3.6, 0.8, 16), MAT.stone(), [0, 0.35, 0]));
  g.add(mesh(new THREE.CylinderGeometry(2.6, 2.9, 0.45, 14), MAT.stoneDark(), [0, 0.85, 0]));
  // Tower shaft (higher detail taper)
  g.add(mesh(new THREE.CylinderGeometry(1.05, 1.65, 8.2, 20), MAT_EXTRA.lighthouse(), [0, 5.0, 0]));
  // Red/white bands
  for (const y of [2.4, 4.2, 6.0, 7.6]) {
    g.add(mesh(new THREE.CylinderGeometry(1.28, 1.42, 0.42, 20), MAT_EXTRA.lighthouseBand(), [0, y, 0]));
  }
  // Vertical window slits
  for (const y of [3.3, 5.1, 6.9]) {
    g.add(mesh(new THREE.BoxGeometry(0.35, 0.7, 0.08), MAT.glass(), [0, y, 1.35]));
  }
  // Watch gallery
  g.add(mesh(new THREE.CylinderGeometry(1.55, 1.55, 0.18, 16), MAT.stoneDark(), [0, 9.15, 0]));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.add(
      mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.55, 6),
        MAT.brass(),
        [Math.cos(a) * 1.45, 9.45, Math.sin(a) * 1.45],
      ),
    );
  }
  g.add(mesh(new THREE.TorusGeometry(1.45, 0.045, 6, 24), MAT.brass(), [0, 9.72, 0], [Math.PI / 2, 0, 0]));
  // Lantern room
  g.add(mesh(new THREE.CylinderGeometry(1.05, 1.15, 1.9, 12), MAT.glass(), [0, 10.55, 0]));
  g.add(mesh(new THREE.SphereGeometry(0.42, 14, 14), MAT_EXTRA.lantern(), [0, 10.55, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.5, 8), MAT.chrome(), [0, 10.55, 0]));
  // Dome roof
  g.add(mesh(new THREE.ConeGeometry(1.35, 1.1, 14), MAT_EXTRA.tile(), [0, 11.85, 0]));
  g.add(mesh(new THREE.SphereGeometry(0.12, 8, 8), MAT.brass(), [0, 12.45, 0]));
  // Door + steps
  g.add(mesh(new THREE.BoxGeometry(0.85, 1.85, 0.16), MAT.woodDark(), [0, 1.55, 1.72]));
  g.add(mesh(new THREE.BoxGeometry(1.4, 0.18, 0.7), MAT.stone(), [0, 0.55, 2.3]));
  g.add(mesh(new THREE.BoxGeometry(1.1, 0.16, 0.55), MAT.stoneDark(), [0, 0.72, 2.0]));
  return g;
}

function buildStoneWall() {
  const g = new THREE.Group();
  g.name = "StoneWall";
  g.add(mesh(new THREE.BoxGeometry(4.5, 1.1, 0.45), MAT.stone(), [0, 0.55, 0]));
  for (let i = 0; i < 5; i++) {
    g.add(
      mesh(
        new THREE.BoxGeometry(0.7 + (i % 2) * 0.2, 0.35, 0.5),
        i % 2 === 0 ? MAT.stoneDark() : MAT.rockLit(),
        [-1.6 + i * 0.85, 0.9 + (i % 2) * 0.1, 0],
      ),
    );
  }
  return g;
}

async function exportGLB(object, filename) {
  const exporter = new GLTFExporter();
  const ab = await exporter.parseAsync(object, { binary: true });
  const out = join(OUT, filename);
  writeFileSync(out, Buffer.from(ab));
  console.log("wrote", filename, `(${(ab.byteLength / 1024).toFixed(1)} KB)`);
}

async function main() {
  const only = process.argv.slice(2);
  const jobs = {
    roadster: () => exportGLB(buildConvertible(), "roadster.glb"),
    pine: () => exportGLB(buildStonePine(), "pine.glb"),
    cypress: () => exportGLB(buildCypress(), "cypress.glb"),
    olive: () => exportGLB(buildOlive(), "olive.glb"),
    bougainvillea: () => exportGLB(buildBougainvillea(), "bougainvillea.glb"),
    "rock-a": () => exportGLB(buildRock(0), "rock-a.glb"),
    "rock-b": () => exportGLB(buildRock(1), "rock-b.glb"),
    "rock-c": () => exportGLB(buildRock(2), "rock-c.glb"),
    bench: () => exportGLB(buildBench(), "bench.glb"),
    carnet: () => exportGLB(buildCarnet(), "carnet.glb"),
    explorer: () => exportGLB(buildAvatar(), "explorer.glb"),
    lamp: () => exportGLB(buildLamp(), "lamp.glb"),
    plinth: () => exportGLB(buildZonePlinth(), "plinth.glb"),
    belvedere: () => exportGLB(buildBelvedereStructure(), "belvedere.glb"),
    maison: () => exportGLB(buildMaison(), "maison.glb"),
    studio: () => exportGLB(buildStudio(), "studio.glb"),
    phare: () => exportGLB(buildPhare(), "phare.glb"),
    "stone-wall": () => exportGLB(buildStoneWall(), "stone-wall.glb"),
  };

  const keys = only.length ? only : Object.keys(jobs);
  for (const key of keys) {
    if (!jobs[key]) {
      console.warn("skip unknown", key);
      continue;
    }
    await jobs[key]();
  }
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
