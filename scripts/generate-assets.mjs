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
      color: "#b9d6e0",
      metalness: 0.35,
      roughness: 0.06,
      transparent: true,
      opacity: 0.42,
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
  g.add(mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.26, 18), MAT.rubber(), null, [0, 0, Math.PI / 2]));
  g.add(mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.28, 14), MAT.chrome(), null, [0, 0, Math.PI / 2]));
  for (let i = 0; i < 5; i++) {
    const spoke = mesh(new THREE.BoxGeometry(0.04, 0.22, 0.05), MAT.chrome());
    spoke.rotation.set(0, (i * Math.PI) / 5, Math.PI / 2);
    g.add(spoke);
  }
  return g;
}

function buildConvertible() {
  const root = new THREE.Group();
  root.name = "MelvynRoadster";

  const body = new THREE.Group();
  body.name = "body";
  body.add(mesh(new THREE.BoxGeometry(1.9, 0.32, 4.35), MAT.terracotta(), [0, 0.38, 0.05]));
  body.add(mesh(new THREE.BoxGeometry(1.78, 0.16, 3.9), MAT.terracotta(), [0, 0.52, 0.15]));
  body.add(mesh(new THREE.BoxGeometry(1.65, 0.26, 0.65), MAT.terracotta(), [0, 0.46, 1.95]));
  body.add(mesh(new THREE.BoxGeometry(1.35, 0.18, 0.28), MAT.terracotta(), [0, 0.42, 2.28]));
  body.add(mesh(new THREE.BoxGeometry(0.06, 0.14, 3.8), MAT.terracottaDark(), [0.96, 0.34, 0]));
  body.add(mesh(new THREE.BoxGeometry(0.06, 0.14, 3.8), MAT.terracottaDark(), [-0.96, 0.34, 0]));
  body.add(mesh(new THREE.BoxGeometry(1.68, 0.28, 1.65), MAT.cabin(), [0, 0.58, -0.25]));
  body.add(mesh(new THREE.BoxGeometry(0.1, 0.28, 1.9), MAT.terracotta(), [0.9, 0.62, -0.1]));
  body.add(mesh(new THREE.BoxGeometry(0.1, 0.28, 1.9), MAT.terracotta(), [-0.9, 0.62, -0.1]));
  body.add(mesh(new THREE.BoxGeometry(1.72, 0.2, 1.0), MAT.terracotta(), [0, 0.56, -1.7]));
  body.add(mesh(new THREE.BoxGeometry(1.4, 0.24, 0.58), MAT.softTop(), [0, 0.78, -1.5]));
  body.add(mesh(new THREE.BoxGeometry(1.28, 0.1, 0.4), MAT.softTop(), [0, 0.92, -1.42]));

  // Windshield
  body.add(mesh(new THREE.BoxGeometry(1.52, 0.58, 0.05), MAT.glass(), [0, 0.98, 0.58], [-0.38, 0, 0]));
  body.add(mesh(new THREE.BoxGeometry(0.04, 0.58, 0.04), MAT.chrome(), [0.74, 0.9, 0.58], [-0.38, 0, 0]));
  body.add(mesh(new THREE.BoxGeometry(0.04, 0.58, 0.04), MAT.chrome(), [-0.74, 0.9, 0.58], [-0.38, 0, 0]));
  body.add(mesh(new THREE.BoxGeometry(1.52, 0.04, 0.04), MAT.chrome(), [0, 1.2, 0.42], [-0.38, 0, 0]));

  // Seats
  body.add(mesh(new THREE.BoxGeometry(0.52, 0.16, 0.52), MAT.leather(), [0.36, 0.7, -0.1]));
  body.add(mesh(new THREE.BoxGeometry(0.52, 0.16, 0.52), MAT.leather(), [-0.36, 0.7, -0.1]));
  body.add(mesh(new THREE.BoxGeometry(0.52, 0.42, 0.1), MAT.leather(), [0.36, 0.92, -0.32]));
  body.add(mesh(new THREE.BoxGeometry(0.52, 0.42, 0.1), MAT.leather(), [-0.36, 0.92, -0.32]));

  // Wheel + dash
  const steering = mesh(new THREE.TorusGeometry(0.13, 0.018, 8, 18), MAT.cabin(), [0.36, 0.92, 0.28], [1.15, 0, 0]);
  steering.name = "steering";
  body.add(steering);
  body.add(mesh(new THREE.BoxGeometry(1.4, 0.08, 0.28), MAT.cabin(), [0, 0.78, 0.45]));

  // Lights
  body.add(mesh(new THREE.CircleGeometry(0.13, 14), MAT.light(), [0.52, 0.5, 2.38], [Math.PI / 2, 0, 0]));
  body.add(mesh(new THREE.CircleGeometry(0.13, 14), MAT.light(), [-0.52, 0.5, 2.38], [Math.PI / 2, 0, 0]));
  body.add(mesh(new THREE.BoxGeometry(0.38, 0.1, 0.05), MAT.tail(), [0.58, 0.52, -2.18]));
  body.add(mesh(new THREE.BoxGeometry(0.38, 0.1, 0.05), MAT.tail(), [-0.58, 0.52, -2.18]));

  // Grille
  body.add(mesh(new THREE.BoxGeometry(0.65, 0.14, 0.04), MAT.cabin(), [0, 0.4, 2.38]));
  for (const x of [-0.18, -0.06, 0.06, 0.18]) {
    body.add(mesh(new THREE.BoxGeometry(0.03, 0.12, 0.02), MAT.chrome(), [x, 0.4, 2.4]));
  }

  // Mirrors
  body.add(mesh(new THREE.BoxGeometry(0.18, 0.08, 0.1), MAT.chrome(), [0.95, 0.78, 0.55]));
  body.add(mesh(new THREE.BoxGeometry(0.18, 0.08, 0.1), MAT.chrome(), [-0.95, 0.78, 0.55]));

  root.add(body);

  // Nested steer → spin hierarchy for front wheels
  const wheelOffsets = [
    { name: "wheel_FL", pos: [0.82, 0.32, 1.28], steer: true },
    { name: "wheel_FR", pos: [-0.82, 0.32, 1.28], steer: true },
    { name: "wheel_RL", pos: [0.82, 0.32, -1.38], steer: false },
    { name: "wheel_RR", pos: [-0.82, 0.32, -1.38], steer: false },
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

  // Ground shadow disc (optional helper)
  const shadow = mesh(
    new THREE.CircleGeometry(1.35, 24),
    new THREE.MeshBasicMaterial({ color: "#1a1510", transparent: true, opacity: 0.22 }),
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
  g.add(mesh(new THREE.CylinderGeometry(0.1, 0.22, 2.2, 8), MAT.bark(), [0, 1.1, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.08, 1.0, 6), MAT.bark(), [0.15, 1.6, 0], [0, 0, 0.25]));
  g.add(mesh(new THREE.SphereGeometry(1.15, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), MAT.pine(), [0, 2.55, 0]));
  g.add(mesh(new THREE.SphereGeometry(0.7, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), MAT.pineLit(), [0.35, 2.45, 0.2]));
  g.add(mesh(new THREE.SphereGeometry(0.65, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), MAT.pineDark(), [-0.4, 2.4, -0.15]));
  return g;
}

function buildCypress() {
  const g = new THREE.Group();
  g.name = "Cypress";
  g.add(mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.5, 6), MAT.bark(), [0, 1.6, 0]));
  g.add(mesh(new THREE.ConeGeometry(0.55, 4.2, 9), MAT.cypress(), [0, 3.2, 0]));
  return g;
}

function buildOlive() {
  const g = new THREE.Group();
  g.name = "Olive";
  g.add(mesh(new THREE.CylinderGeometry(0.12, 0.2, 1.4, 7), MAT.bark(), [0, 0.7, 0]));
  g.add(mesh(new THREE.SphereGeometry(0.95, 10, 10), MAT.olive(), [0, 1.85, 0]));
  g.add(mesh(new THREE.SphereGeometry(0.5, 8, 8), MAT.oliveLit(), [0.4, 2.0, 0.25]));
  g.add(mesh(new THREE.SphereGeometry(0.45, 8, 8), MAT.olive(), [-0.35, 1.95, -0.2]));
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
  // Legs
  g.add(mesh(new THREE.CapsuleGeometry(0.12, 0.45, 4, 8), MAT.pants(), [0.14, 0.45, 0]));
  g.add(mesh(new THREE.CapsuleGeometry(0.12, 0.45, 4, 8), MAT.pants(), [-0.14, 0.45, 0]));
  // Torso
  g.add(mesh(new THREE.CapsuleGeometry(0.28, 0.55, 4, 10), MAT.shirt(), [0, 1.15, 0]));
  // Arms
  g.add(mesh(new THREE.CapsuleGeometry(0.08, 0.4, 4, 8), MAT.shirt(), [0.38, 1.15, 0], [0, 0, 0.2]));
  g.add(mesh(new THREE.CapsuleGeometry(0.08, 0.4, 4, 8), MAT.shirt(), [-0.38, 1.15, 0], [0, 0, -0.2]));
  // Head
  g.add(mesh(new THREE.SphereGeometry(0.22, 12, 12), MAT.skin(), [0, 1.72, 0]));
  g.add(mesh(new THREE.SphereGeometry(0.23, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), MAT.hair(), [0, 1.82, -0.02]));
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

async function exportGLB(object, filename) {
  const exporter = new GLTFExporter();
  const ab = await exporter.parseAsync(object, { binary: true });
  const out = join(OUT, filename);
  writeFileSync(out, Buffer.from(ab));
  console.log("wrote", filename, `(${(ab.byteLength / 1024).toFixed(1)} KB)`);
}

async function main() {
  await exportGLB(buildConvertible(), "roadster.glb");
  await exportGLB(buildStonePine(), "pine.glb");
  await exportGLB(buildCypress(), "cypress.glb");
  await exportGLB(buildOlive(), "olive.glb");
  await exportGLB(buildBougainvillea(), "bougainvillea.glb");
  await exportGLB(buildRock(0), "rock-a.glb");
  await exportGLB(buildRock(1), "rock-b.glb");
  await exportGLB(buildRock(2), "rock-c.glb");
  await exportGLB(buildBench(), "bench.glb");
  await exportGLB(buildCarnet(), "carnet.glb");
  await exportGLB(buildAvatar(), "explorer.glb");
  await exportGLB(buildLamp(), "lamp.glb");
  await exportGLB(buildZonePlinth(), "plinth.glb");
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
