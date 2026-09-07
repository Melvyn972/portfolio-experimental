"use client";

import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

export type CoastalPbr = {
  cobble: { map: THREE.Texture; normalMap: THREE.Texture; roughnessMap: THREE.Texture };
  stucco: { map: THREE.Texture; normalMap: THREE.Texture; roughnessMap: THREE.Texture };
  roof: { map: THREE.Texture; roughnessMap: THREE.Texture };
  terra: { map: THREE.Texture; roughnessMap: THREE.Texture };
  asphalt: { map: THREE.Texture; roughnessMap: THREE.Texture };
};

function prep(tex: THREE.Texture, repeat: number, anisotropy = 4) {
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = anisotropy;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function prepLinear(tex: THREE.Texture, repeat: number, anisotropy = 4) {
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = anisotropy;
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Poly Haven CC0 1k maps — cobble / stucco / clay roof / terracotta / asphalt. */
export function useCoastalPbr(anisotropy = 4): CoastalPbr {
  const maps = useTexture({
    cobbleDiff: "/textures/pbr/cobble_diff.jpg",
    cobbleNor: "/textures/pbr/cobble_nor.jpg",
    cobbleRough: "/textures/pbr/cobble_rough.jpg",
    stuccoDiff: "/textures/pbr/stucco_diff.jpg",
    stuccoNor: "/textures/pbr/stucco_nor.jpg",
    stuccoRough: "/textures/pbr/stucco_rough.jpg",
    roofDiff: "/textures/pbr/roof_diff.jpg",
    roofRough: "/textures/pbr/roof_rough.jpg",
    terraDiff: "/textures/pbr/terra_diff.jpg",
    terraRough: "/textures/pbr/terra_rough.jpg",
    asphaltDiff: "/textures/pbr/asphalt_diff.jpg",
    asphaltRough: "/textures/pbr/asphalt_rough.jpg",
  });

  return useMemo(() => ({
    cobble: {
      map: prep(maps.cobbleDiff, 2.4, anisotropy),
      normalMap: prepLinear(maps.cobbleNor, 2.4, anisotropy),
      roughnessMap: prepLinear(maps.cobbleRough, 2.4, anisotropy),
    },
    stucco: {
      map: prep(maps.stuccoDiff, 1.6, anisotropy),
      normalMap: prepLinear(maps.stuccoNor, 1.6, anisotropy),
      roughnessMap: prepLinear(maps.stuccoRough, 1.6, anisotropy),
    },
    roof: {
      map: prep(maps.roofDiff, 2.2, anisotropy),
      roughnessMap: prepLinear(maps.roofRough, 2.2, anisotropy),
    },
    terra: {
      map: prep(maps.terraDiff, 1.8, anisotropy),
      roughnessMap: prepLinear(maps.terraRough, 1.8, anisotropy),
    },
      asphalt: {
      map: prep(maps.asphaltDiff, 6, anisotropy),
      roughnessMap: prepLinear(maps.asphaltRough, 6, anisotropy),
    },
  }), [maps, anisotropy]);
}

useTexture.preload("/textures/pbr/cobble_diff.jpg");
useTexture.preload("/textures/pbr/stucco_diff.jpg");
useTexture.preload("/textures/pbr/roof_diff.jpg");
useTexture.preload("/textures/pbr/terra_diff.jpg");
useTexture.preload("/textures/pbr/asphalt_diff.jpg");
