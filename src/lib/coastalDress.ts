import * as THREE from "three";
import type { CoastalPbr } from "@/lib/pbrTextures";

const _hsl = { h: 0, s: 0, l: 0 };

function isRoof(name: string, mat: THREE.MeshStandardMaterial) {
  if (/roof|tile|toit|awning/.test(name)) return true;
  mat.color.getHSL(_hsl);
  return _hsl.s > 0.28 && _hsl.h > 0.18 && _hsl.h < 0.55 && _hsl.l > 0.22 && _hsl.l < 0.72;
}

function isWindow(name: string) {
  return /window|glass|vitre/.test(name);
}

/**
 * Retint Kenney city kits: clay roofs + stucco walls.
 * Mutates a cloned scene. Maps are shared (do not dispose).
 */
export function dressCoastalBuilding(root: THREE.Object3D, pbr: CoastalPbr, wallTint: string) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const raw = mesh.material;
    const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const nextList = list.map((mat) => {
      if (!(mat instanceof THREE.MeshStandardMaterial) && !(mat instanceof THREE.MeshPhysicalMaterial)) return mat;
      const name = `${mat.name} ${mesh.name}`.toLowerCase();
      const next = mat.clone();
      next.envMapIntensity = 0.95;
      if (isWindow(name)) {
        next.roughness = 0.12;
        next.metalness = 0.15;
        next.envMapIntensity = 1.35;
        return next;
      }
      if (isRoof(name, mat)) {
        next.map = pbr.roof.map;
        next.roughnessMap = pbr.roof.roughnessMap;
        next.color.set("#c45a38");
        next.roughness = 0.62;
        next.metalness = 0.04;
        next.envMapIntensity = 0.7;
        return next;
      }
      next.map = pbr.stucco.map;
      next.normalMap = pbr.stucco.normalMap;
      next.roughnessMap = pbr.stucco.roughnessMap;
      next.color.set(wallTint);
      next.roughness = 0.86;
      next.metalness = 0.02;
      return next;
    });
    mesh.material = Array.isArray(raw) ? nextList : nextList[0];
  });
}
