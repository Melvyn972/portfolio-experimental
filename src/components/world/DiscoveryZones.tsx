"use client";

import { useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { content } from "@/lib/content";
import { CHAPTERS, getGameState } from "@/lib/gameStore";
import { sampleGroundHeight } from "@/lib/ground";
import { lighthouseClimbStep, PHARE_CLIMB } from "@/lib/lighthouseClimb";
import { enableShadows, groundClone } from "@/lib/gltfFit";
import { MuseumPlaque } from "./MuseumPlaque";

/**
 * One memorable museum beat per zone — real Melvyn copy, not RPG spam.
 * Maison rooms, atelier tools, studio stubs, plage quiet, phare climb + sky.
 */
export function DiscoveryZones() {
  return (
    <group>
      <MaisonParcours />
      <AtelierTools />
      <StudioGallery />
      <PlageNook />
      <LighthouseClimb />
      <VisitedConstellation />
      <VisitedBeacons />
    </group>
  );
}

function MaisonParcours() {
  const marker = content.zones.zones.find((z) => z.id === "maison-atelier")?.marker;
  const pot = useGrounded("/models/ph/ceramic_pot/ceramic_pot_1k.gltf");
  if (!marker) return null;
  const y = sampleGroundHeight(16.15, -36.4);
  const formations = content.formations;
  const jobs = content.experiences;

  return (
    <group position={[16.15, y, -36.55]}>
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[7.4, 0.08, 3.35]} />
        <meshStandardMaterial color="#c4b49a" roughness={0.9} />
      </mesh>
      {[-2.35, 0, 2.35].map((x) => (
        <mesh key={`tile-${x}`} position={[x, 0.07, 0]} receiveShadow>
          <boxGeometry args={[2.2, 0.03, 3.05]} />
          <meshStandardMaterial color="#b8a888" roughness={0.92} />
        </mesh>
      ))}
      <mesh position={[0, 1.05, -1.52]} castShadow receiveShadow>
        <boxGeometry args={[7.2, 1.85, 0.12]} />
        <meshStandardMaterial color="#efe6d6" roughness={0.86} />
      </mesh>
      {[-1.18, 1.18].map((x) => (
        <mesh key={`part-${x}`} position={[x, 0.95, -0.15]} castShadow>
          <boxGeometry args={[0.1, 1.65, 2.55]} />
          <meshStandardMaterial color="#e4d8c4" roughness={0.84} />
        </mesh>
      ))}
      <mesh position={[0, 2.08, -0.2]} castShadow>
        <boxGeometry args={[7.5, 0.1, 3.5]} />
        <meshStandardMaterial color="#c45c3e" roughness={0.68} />
      </mesh>
      {[
        [-3.5, -1.4],
        [3.5, -1.4],
        [-3.5, 1.35],
        [3.5, 1.35],
      ].map(([x, z], i) => (
        <mesh key={`post-${i}`} position={[x, 1.05, z]} castShadow>
          <boxGeometry args={[0.16, 1.9, 0.16]} />
          <meshStandardMaterial color="#6a5438" roughness={0.78} />
        </mesh>
      ))}

      <MuseumPlaque
        title={formations[0]?.title ?? "Parcours"}
        lines={[
          [formations[0]?.period, formations[0]?.school].filter(Boolean).join(" · "),
          formations[1] ? `${formations[1].title} · ${formations[1].period}` : "",
          formations[2] ? `${formations[2].title}` : "",
        ].filter(Boolean)}
        width={1.55}
        height={0.72}
        position={[-2.35, 1.22, -1.42]}
      />
      <MuseumPlaque
        title={jobs[0]?.company ?? "Passion Beauté"}
        lines={[jobs[0]?.role ?? "", jobs[0]?.period ?? "", jobs[0]?.detail ?? ""].filter(Boolean)}
        width={1.55}
        height={0.72}
        position={[0, 1.22, -1.42]}
      />
      <MuseumPlaque
        title={jobs[1]?.company ?? "Prisma Media"}
        lines={[jobs[1]?.role ?? "", jobs[1]?.period ?? "", jobs[2] ? `${jobs[2].company} · ${jobs[2].role}` : ""].filter(
          Boolean,
        )}
        width={1.55}
        height={0.72}
        position={[2.35, 1.22, -1.42]}
      />

      <mesh position={[-2.35, 0.38, 0.15]} castShadow>
        <boxGeometry args={[0.95, 0.52, 0.55]} />
        <meshStandardMaterial color="#8a6a48" roughness={0.8} />
      </mesh>
      <mesh position={[0.05, 0.32, 0.2]} castShadow>
        <boxGeometry args={[1.15, 0.4, 0.7]} />
        <meshStandardMaterial color="#6a4a32" roughness={0.82} />
      </mesh>
      <group position={[2.55, 0, 0.85]} scale={0.55}>
        <primitive object={pot} />
      </group>
    </group>
  );
}

function AtelierTools() {
  const marker = content.zones.zones.find((z) => z.id === "maison-atelier")?.marker;
  if (!marker) return null;
  const x = marker.x + 5.05;
  const z = marker.z + 3.45;
  const y = sampleGroundHeight(x, z);
  const clusters = content.competences.clusters.slice(0, 4);

  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.55, 0.08, 1.15]} />
        <meshStandardMaterial color="#5c4030" roughness={0.78} />
      </mesh>
      {[-0.85, 0.85].map((ox) => (
        <mesh key={`leg-${ox}`} position={[ox, 0.2, 0]} castShadow>
          <boxGeometry args={[0.1, 0.4, 0.95]} />
          <meshStandardMaterial color="#4a3224" roughness={0.8} />
        </mesh>
      ))}
      {clusters.map((c, i) => {
        const px = -0.9 + i * 0.6;
        return (
          <group key={c.id} position={[px, 0.52, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.42, 0.16, 0.32]} />
              <meshStandardMaterial
                color={i % 2 ? "#3a4a52" : "#4a3a2a"}
                roughness={0.45}
                metalness={0.25}
                emissive="#2a2018"
                emissiveIntensity={0.12}
              />
            </mesh>
          </group>
        );
      })}
      <MuseumPlaque
        title="Établi — compétences"
        lines={clusters.map((c) => `${c.title} · ${c.items.slice(0, 3).join(", ")}`)}
        width={1.7}
        height={0.62}
        position={[0, 1.15, -0.62]}
        rotation={[-0.08, 0, 0]}
      />
    </group>
  );
}

function StudioGallery() {
  const marker = content.zones.zones.find((z) => z.id === "studio")?.marker;
  const plinth = useGrounded("/models/plinth.glb");
  if (!marker) return null;
  const featured = content.projets.filter((p) => ["vdapb", "eresapb", "freepro"].includes(p.id));
  const y = sampleGroundHeight(marker.x, marker.z + 3.7);

  return (
    <group position={[marker.x, y, marker.z + 3.75]}>
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[5.6, 0.06, 2.2]} />
        <meshStandardMaterial color="#d2c4a8" roughness={0.9} />
      </mesh>
      {featured.map((p, i) => {
        const px = (i - 1) * 1.7;
        return (
          <group key={p.id} position={[px, 0, 0.05]}>
            <group scale={1.15}>
              <primitive object={plinth.clone(true)} />
            </group>
            <mesh position={[0, 0.72, 0]} castShadow>
              <boxGeometry args={[0.42, 0.28, 0.08]} />
              <meshStandardMaterial color="#2a2018" roughness={0.55} emissive="#5c4030" emissiveIntensity={0.2} />
            </mesh>
            <MuseumPlaque
              title={p.name}
              lines={[p.stack, p.blurb]}
              width={1.15}
              height={0.55}
              position={[0, 1.22, 0.12]}
            />
          </group>
        );
      })}
    </group>
  );
}

function PlageNook() {
  const marker = content.zones.zones.find((z) => z.id === "plage")?.marker;
  const bench = useGrounded("/models/ph/painted_wooden_bench/painted_wooden_bench_1k.gltf");
  const pot = useGrounded("/models/ph/ceramic_pot/ceramic_pot_1k.gltf");
  if (!marker) return null;
  const x = marker.x + 1.15;
  const z = marker.z - 2.15;
  const y = sampleGroundHeight(x, z);
  const passion = content.passions[0];

  return (
    <group position={[x, y, z]}>
      <group rotation={[0, 0.4, 0]} scale={0.95}>
        <primitive object={bench} />
      </group>
      <group position={[1.15, 0, 0.35]} scale={0.48}>
        <primitive object={pot} />
      </group>
      <MuseumPlaque
        title={passion?.title ?? "Automobile"}
        lines={[passion?.beat ?? "", passion?.craft ?? ""].filter(Boolean)}
        width={0.95}
        height={0.48}
        position={[-0.15, 0.72, -0.55]}
        rotation={[-0.12, 0.15, 0]}
      />
    </group>
  );
}

function LighthouseClimb() {
  const steps = useMemo(
    () => Array.from({ length: PHARE_CLIMB.steps }, (_, i) => lighthouseClimbStep(i)),
    [],
  );
  const summit = steps[steps.length - 1];

  return (
    <group>
      {steps.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, s.z]} rotation={[0, -s.ang, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.95, 0.1, 0.58]} />
          <meshStandardMaterial color={i % 2 ? "#8a7a60" : "#7a6a52"} roughness={0.9} />
        </mesh>
      ))}
      {steps.map((s, i) =>
        i % 2 === 0 ? (
          <mesh key={`rail-${i}`} position={[s.x + Math.cos(s.ang) * 0.38, s.y + 0.42, s.z + Math.sin(s.ang) * 0.38]}>
            <boxGeometry args={[0.06, 0.72, 0.06]} />
            <meshStandardMaterial color="#5c4a32" roughness={0.75} />
          </mesh>
        ) : null,
      )}
      {summit && (
        <group position={[summit.x, summit.y + 0.08, summit.z]}>
          <mesh receiveShadow>
            <cylinderGeometry args={[0.85, 0.92, 0.1, 10]} />
            <meshStandardMaterial color="#c4b08a" roughness={0.82} />
          </mesh>
          <mesh position={[0, 0.55, 0]} castShadow>
            <sphereGeometry args={[0.12, 10, 8]} />
            <meshStandardMaterial color="#ffe6b0" emissive="#ffb347" emissiveIntensity={0.85} />
          </mesh>
          <MuseumPlaque
            title="Lanterne"
            lines={["Auto-entreprise", content.activite.services[0] ?? "", "Le ciel s’allume — ébauche."]}
            width={0.92}
            height={0.46}
            position={[0.05, 1.05, 0.2]}
            rotation={[-0.1, 0.4, 0]}
          />
        </group>
      )}
    </group>
  );
}

function VisitedConstellation() {
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const stars = useMemo(
    () =>
      CHAPTERS.map((c, i) => ({
        id: c.id,
        x: -6 + i * 2.35,
        y: 15.2 + Math.sin(i * 1.15) * 1.55 + (i % 3) * 0.35,
        z: -186.5 - (i % 2) * 1.8,
      })),
    [],
  );

  useFrame(({ clock }) => {
    const found = getGameState().discovered;
    const t = clock.elapsedTime;
    mats.current.forEach((mat, i) => {
      if (!mat) return;
      const on = Boolean(found[stars[i].id]);
      const pulse = 0.15 + Math.sin(t * 1.4 + i) * 0.08;
      mat.emissiveIntensity = on ? 0.95 + pulse : 0.08 + pulse * 0.25;
      mat.color.set(on ? "#ffe6b0" : "#6a6458");
      mat.emissive.set(on ? "#ffc878" : "#2a261c");
    });
  });

  return (
    <group>
      {stars.map((s, i) => (
        <mesh key={s.id} position={[s.x, s.y, s.z]}>
          <sphereGeometry args={[0.18 + (i % 3) * 0.03, 8, 6]} />
          <meshStandardMaterial
            ref={(el) => {
              mats.current[i] = el;
            }}
            color="#6a6458"
            emissive="#2a261c"
            emissiveIntensity={0.1}
            roughness={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}

function VisitedBeacons() {
  const refs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const spots = useMemo(() => {
    return content.zones.zones
      .filter((z) => z.id !== "route" && z.id !== "wow" && z.id !== "belvedere")
      .map((z) => {
        const oz = z.id === "maison-atelier" ? 4.15 : z.id === "studio" ? 3.9 : z.id === "phare" ? 3.1 : 0;
        const x = z.marker.x;
        const zz = z.marker.z + oz;
        return { id: z.id, x, y: sampleGroundHeight(x, zz) + 0.08, z: zz };
      });
  }, []);

  useFrame(({ clock }) => {
    const d = getGameState().discovered;
    const t = clock.elapsedTime;
    refs.current.forEach((mat, i) => {
      if (!mat) return;
      const zone = spots[i]?.id;
      const on = CHAPTERS.some((c) => c.zone === zone && d[c.id]);
      mat.emissiveIntensity = on ? 0.72 + Math.sin(t * 2.2 + i) * 0.18 : 0.12;
    });
  });

  return (
    <group>
      {spots.map((s, i) => (
        <group key={s.id} position={[s.x, s.y, s.z]}>
          <mesh position={[0, 0.28, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.05, 0.55, 6]} />
            <meshStandardMaterial color="#5c4a32" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.62, 0]}>
            <sphereGeometry args={[0.09, 8, 6]} />
            <meshStandardMaterial
              ref={(el) => {
                refs.current[i] = el;
              }}
              color="#b08d57"
              emissive="#8a6a38"
              emissiveIntensity={0.14}
              metalness={0.45}
              roughness={0.35}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function useGrounded(path: string) {
  const { scene } = useGLTF(path);
  return useMemo(() => {
    const c = scene.clone(true);
    enableShadows(c);
    groundClone(c);
    return c;
  }, [scene]);
}

useGLTF.preload("/models/plinth.glb");
useGLTF.preload("/models/ph/ceramic_pot/ceramic_pot_1k.gltf");
useGLTF.preload("/models/ph/painted_wooden_bench/painted_wooden_bench_1k.gltf");
