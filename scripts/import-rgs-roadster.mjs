/**
 * Import RGS Dev CC0 Roadster (FBX) → production GLB.
 * Preserves authored names. Wheels become hub-centered groups so they
 * can spin/steer. Materials become Standard; windows are glass;
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
const src = loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), dirname(FBX) + "/");

const out = new THREE.Group();
out.name = "RgsRoadster";

let wheels = 0;
let body = 0;

src.updateMatrixWorld(true);
src.traverse((o) => {
  if (!o.isMesh) return;
  const name = o.name || "mesh";
  const mats = Array.isArray(o.material) ? o.material : [o.material];
  const converted = mats.map((m) => toStandard(m));

  const geo = o.geometry.clone();
  geo.applyMatrix4(o.matrixWorld);
  geo.scale(SCALE, SCALE, SCALE);

  const mesh = new THREE.Mesh(geo, converted.length === 1 ? converted[0] : converted);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  if (name.toLowerCase().includes("wheel")) {
    geo.computeBoundingBox();
    const hub = geo.boundingBox.getCenter(new THREE.Vector3());
    geo.translate(-hub.x, -hub.y, -hub.z);
    geo.computeBoundingBox();
    const g = new THREE.Group();
    g.name = name;
    g.position.copy(hub);
    mesh.name = name + "_mesh";
    g.add(mesh);
    out.add(g);
    wheels += 1;
    console.log("wheel", name, "hub", hub.toArray().map((n) => n.toFixed(3)));
  } else {
    mesh.name = name;
    out.add(mesh);
    if (name.toLowerCase() === "roadster") body += 1;
    console.log("body", name, "mats", converted.map((m) => m.name).join(","));
  }
});

if (wheels < 4 || body < 1) throw new Error(`unexpected mesh set wheels=${wheels} body=${body}`);

out.updateMatrixWorld(true);
const box = new THREE.Box3().setFromObject(out);
out.position.y -= box.min.y;
out.updateMatrixWorld(true);
const fitted = new THREE.Box3().setFromObject(out);
const size = fitted.getSize(new THREE.Vector3());
console.log("fitted m", size.toArray().map((n) => n.toFixed(3)), "minY", fitted.min.y.toFixed(3));

mkdirSync(dirname(OUT), { recursive: true });
const exporter = new GLTFExporter();
const ab = await exporter.parseAsync(out, { binary: true });
writeFileSync(OUT, Buffer.from(ab));
console.log("wrote", OUT, `${(ab.byteLength / 1024).toFixed(1)} KB`);

function toStandard(m) {
  const name = (m.name || "").toLowerCase();
  const outMat = new THREE.MeshStandardMaterial({ name: m.name || "mat" });
  if (name.includes("window")) {
    outMat.color.set("#7eb8c8");
    outMat.transparent = true;
    outMat.opacity = 0.38;
    outMat.metalness = 0.35;
    outMat.roughness = 0.06;
    outMat.depthWrite = false;
    outMat.side = THREE.DoubleSide;
    outMat.emissive = new THREE.Color("#1a3a48");
    outMat.emissiveIntensity = 0.12;
    return outMat;
  }
  if (name.includes("body blue")) {
    outMat.color.set("#c45c3e");
    outMat.metalness = 0.35;
    outMat.roughness = 0.38;
    return outMat;
  }
  if (name.includes("body beige")) {
    outMat.color.set("#5c4030");
    outMat.roughness = 0.72;
    outMat.metalness = 0.05;
    return outMat;
  }
  if (name.includes("body white")) {
    outMat.color.set("#f3efe6");
    outMat.roughness = 0.55;
    outMat.metalness = 0.1;
    return outMat;
  }
  if (name.includes("body black")) {
    outMat.color.set("#1a1614");
    outMat.roughness = 0.55;
    outMat.metalness = 0.2;
    return outMat;
  }
  if (name.includes("headlight")) {
    outMat.color.set("#f7f2e4");
    outMat.emissive = new THREE.Color("#fff0c8");
    outMat.emissiveIntensity = 0.55;
    outMat.roughness = 0.25;
    outMat.metalness = 0.4;
    return outMat;
  }
  if (name.includes("rear")) {
    outMat.color.set("#b03030");
    outMat.emissive = new THREE.Color("#801818");
    outMat.emissiveIntensity = 0.35;
    outMat.roughness = 0.4;
    return outMat;
  }
  if (name.includes("tire")) {
    outMat.color.set("#1a1a1a");
    outMat.roughness = 0.82;
    outMat.metalness = 0.04;
    return outMat;
  }
  if (name.includes("wheel")) {
    outMat.color.set("#d8d4cc");
    outMat.metalness = 0.75;
    outMat.roughness = 0.28;
    return outMat;
  }
  if (m.color) outMat.color.copy(m.color);
  outMat.roughness = 0.55;
  outMat.metalness = 0.15;
  return outMat;
}
