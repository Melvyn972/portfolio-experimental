"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { content } from "@/lib/content";
import { sampleGroundHeight } from "@/lib/ground";

/**
 * Soft-GL museum buildings only — no PBR JPGs, no extra tree/hedge/fence GLBs.
 * Maison / studio / atelier / phare stay; decorative clones live on Metal.
 */
export function CoastalZonesLite() {
  const { scene: maisonSrc } = useGLTF("/models/maison.glb");
  const { scene: studioSrc } = useGLTF("/models/studio.glb");
  const { scene: atelierSrc } = useGLTF("/models/kenney/city/atelier.glb");
  const { scene: phareSrc } = useGLTF("/models/phare.glb");
  const maison = useMemo(() => maisonSrc.clone(true), [maisonSrc]);
  const studio = useMemo(() => studioSrc.clone(true), [studioSrc]);
  const atelier = useMemo(() => atelierSrc.clone(true), [atelierSrc]);
  const phare = useMemo(() => phareSrc.clone(true), [phareSrc]);
  const markers = useMemo(() => {
    const map: Record<string, { x: number; y: number; z: number }> = {};
    for (const z of content.zones.zones) map[z.id] = z.marker;
    return map;
  }, []);
  const m = markers["maison-atelier"];
  const s = markers["studio"];
  const p = markers["phare"];

  return (
    <group>
      {m && (
        <group>
          <primitive object={maison} position={[m.x, sampleGroundHeight(m.x, m.z), m.z]} rotation={[0, -0.35, 0]} scale={6.2} />
          <primitive object={atelier} position={[m.x + 7.5, sampleGroundHeight(m.x + 7.5, m.z + 2), m.z + 2]} rotation={[0, 0.2, 0]} scale={5.2} />
        </group>
      )}
      {s && <primitive object={studio} position={[s.x, sampleGroundHeight(s.x, s.z), s.z]} rotation={[0, 0.4, 0]} scale={6.0} />}
      {p && <primitive object={phare} position={[p.x, 0.55, p.z]} scale={0.34} />}
    </group>
  );
}
