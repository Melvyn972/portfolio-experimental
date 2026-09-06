"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { Group, Object3D } from "three";
import { MODELS, type ModelKey } from "@/data/assets";
import { useExperience } from "@/hooks/useExperience";

type GltfProps = {
  model: ModelKey;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
  /** Optional cinematic palette override */
  tint?: "steel" | "brass" | "carbon" | "glass" | "keep";
};

const PALETTE: Record<Exclude<GltfProps["tint"], undefined | "keep">, THREE.ColorRepresentation> = {
  steel: "#2a3344",
  brass: "#8a7340",
  carbon: "#141820",
  glass: "#3a5a62",
};

function stylize(root: Object3D, cast: boolean, receive: boolean, tint: GltfProps["tint"], low: boolean) {
  root.traverse((obj) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mesh = obj as any;
    if (!mesh.isMesh) return;
    mesh.castShadow = cast && !low;
    mesh.receiveShadow = receive;
    mesh.frustumCulled = true;

    const applyMat = (mat: THREE.Material) => {
      const m = mat.clone() as THREE.MeshStandardMaterial;
      if (tint && tint !== "keep") {
        m.map = null;
        m.color = new THREE.Color(PALETTE[tint]);
        m.metalness = tint === "glass" ? 0.35 : tint === "carbon" ? 0.7 : 0.82;
        m.roughness = tint === "brass" ? 0.28 : tint === "glass" ? 0.12 : 0.38;
        if (tint === "brass") {
          m.emissive = new THREE.Color("#c9a227");
          m.emissiveIntensity = 0.08;
        }
        if (tint === "glass") {
          m.transparent = true;
          m.opacity = 0.55;
          m.envMapIntensity = 1.4;
        } else {
          m.envMapIntensity = 1.15;
        }
      } else if ("metalness" in m) {
        // Keep Kenney colormap but push toward PBR industrial look
        m.metalness = Math.max(m.metalness ?? 0, 0.45);
        m.roughness = Math.min(Math.max(m.roughness ?? 0.5, 0.25), 0.55);
        m.envMapIntensity = 1.05;
        if (m.color) m.color.multiplyScalar(0.55);
      }
      m.needsUpdate = true;
      return m;
    };

    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map(applyMat);
    } else if (mesh.material) {
      mesh.material = applyMat(mesh.material);
    }
  });
}

/** GLB wrapper — meshopt + cinematic material pass. */
export function Model({
  model,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  castShadow = true,
  receiveShadow = true,
  tint = "steel",
}: GltfProps) {
  const path = MODELS[model];
  const { scene } = useGLTF(path, false, true);
  const { quality, isMobile } = useExperience();
  const low = quality === "low" || (quality === "auto" && isMobile);

  const clone = useMemo(() => {
    const c = scene.clone(true) as Group;
    stylize(c, castShadow, receiveShadow, tint, low);
    return c;
  }, [scene, castShadow, receiveShadow, tint, low]);

  return <primitive object={clone} position={position} rotation={rotation} scale={scale} />;
}

export function preloadModels(keys: ModelKey[]) {
  keys.forEach((k) => {
    useGLTF.preload(MODELS[k], false, true);
  });
}
