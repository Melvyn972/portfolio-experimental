/**
 * Import RGS Dev CC0 Roadster (FBX) → production GLB.
 * Preserves authored meshes + names. Materials become Standard; windows glass;
 * body painted terracotta. Scale cm → meters and sit on y=0.
 */
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

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

const FBX = process.argv[2];
const OUT = process.argv[3];
const SCALE = 0.0076;

const buf = readFileSync(FBX);
const loader = new FBXLoader();
const root = loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), dirname(FBX) + "/");
root.name = "RgsRoadster";

let wheels = 0;
let body = 0;
root.traverse((o) => {
  if (!o.isMesh) return;
  const name = o.name.toLowerCase();
  o.castShadow = true;
  o.receiveShadow = true;
  const mats = Array.isArray(o.material) ? o.material : [o.material];
  const converted = mats.map((m) => toStandard(m));
  o.material = converted.length === 1 ? converted[0] : converted;
  if (name.includes("wheel")) wheels += 1;
  if (name === "roadster") body += 1;
  console.log("mesh", o.name, "mats", converted.map((m) => m.name).join(","));
});

if (wheels < 4 || body < 1) throw new Error(`unexpected mesh set wheels=${wheels} body=${body}`);

root.scale.setScalar(SCALE);
root.updateMatrixWorld(true);
const box = new THREE.Box3().setFromObject(root);
root.position.y -= box.min.y;
root.updateMatrixWorld(true);
const fitted = new THREE.Box3().setFromObject(root);
const size = fitted.getSize(new THREE.Vector3());
console.log("fitted m", size.toArray().map((n) => n.toFixed(3)), "minY", fitted.min.y.toFixed(3));

mkdirSync(dirname(OUT), { recursive: true });
const exporter = new GLTFExporter();
const ab = await exporter.parseAsync(root, { binary: true });
writeFileSync(OUT, Buffer.from(ab));
console.log("wrote", OUT, `${(ab.byteLength / 1024).toFixed(1)} KB`);

function toStandard(m) {
  const name = (m.name || "").toLowerCase();
  const out = new THREE.MeshStandardMaterial({ name: m.name || "mat" });
  if (name.includes("window")) {
    out.color.set("#7eb8c8");
    out.transparent = true;
    out.opacity = 0.38;
    out.metalness = 0.35;
    out.roughness = 0.06;
    out.depthWrite = false;
    out.side = THREE.DoubleSide;
    out.emissive = new THREE.Color("#1a3a48");
    out.emissiveIntensity = 0.12;
    return out;
  }
  if (name.includes("body blue")) {
    out.color.set("#c45c3e");
    out.metalness = 0.35;
    out.roughness = 0.38;
    return out;
  }
  if (name.includes("body beige")) {
    out.color.set("#5c4030");
    out.roughness = 0.72;
    out.metalness = 0.05;
    return out;
  }
  if (name.includes("body white")) {
    out.color.set("#f3efe6");
    out.roughness = 0.55;
    out.metalness = 0.1;
    return out;
  }
  if (name.includes("body black")) {
    out.color.set("#1a1614");
    out.roughness = 0.55;
    out.metalness = 0.2;
    return out;
  }
  if (name.includes("headlight")) {
    out.color.set("#f7f2e4");
    out.emissive = new THREE.Color("#fff0c8");
    out.emissiveIntensity = 0.55;
    out.roughness = 0.25;
    out.metalness = 0.4;
    return out;
  }
  if (name.includes("rear")) {
    out.color.set("#b03030");
    out.emissive = new THREE.Color("#801818");
    out.emissiveIntensity = 0.35;
    out.roughness = 0.4;
    return out;
  }
  if (name.includes("tire")) {
    out.color.set("#1a1a1a");
    out.roughness = 0.82;
    out.metalness = 0.04;
    return out;
  }
  if (name.includes("wheel")) {
    out.color.set("#d8d4cc");
    out.metalness = 0.75;
    out.roughness = 0.28;
    return out;
  }
  if (m.color) out.color.copy(m.color);
  out.roughness = 0.55;
  out.metalness = 0.15;
  return out;
}
