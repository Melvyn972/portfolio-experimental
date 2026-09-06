"use client";

import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ContactShadows, Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { Model } from "./Model";
import { useExperience } from "@/hooks/useExperience";

function SpinGroup({
  children,
  speed = 0.4,
  axis = "z",
}: {
  children: React.ReactNode;
  speed?: number;
  axis?: "x" | "y" | "z";
}) {
  const ref = useRef<THREE.Group>(null);
  const { reducedMotion } = useExperience();
  useFrame((_, dt) => {
    if (reducedMotion || !ref.current) return;
    ref.current.rotation[axis] += dt * speed;
  });
  return <group ref={ref}>{children}</group>;
}

function WarmSpot({
  position,
  intensity = 8,
  color = "#e8a54b",
}: {
  position: [number, number, number];
  intensity?: number;
  color?: string;
}) {
  return (
    <spotLight
      position={position}
      intensity={intensity}
      color={color}
      angle={0.5}
      penumbra={0.7}
      distance={20}
      castShadow
      shadow-bias={-0.00025}
      shadow-mapSize={[1024, 1024]}
    />
  );
}

function Floor() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -4]} receiveShadow>
        <planeGeometry args={[70, 80]} />
        <meshStandardMaterial color="#07090f" metalness={0.94} roughness={0.32} envMapIntensity={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 0]} receiveShadow>
        <circleGeometry args={[7.5, 64]} />
        <meshStandardMaterial color="#121722" metalness={0.9} roughness={0.22} envMapIntensity={1.1} />
      </mesh>
      <gridHelper args={[48, 48, "#1c2433", "#0e121a"]} position={[0, 0.02, -4]} />
    </>
  );
}

function AtelierShell() {
  return (
    <group>
      <Model model="doorway" position={[0, 0, 11]} scale={1.8} rotation={[0, Math.PI, 0]} tint="carbon" />
      <Model model="structureTall" position={[-5.5, 0, 8]} scale={1.35} tint="steel" />
      <Model model="structureTall" position={[5.5, 0, 8]} scale={1.35} tint="steel" />
      <Model model="wall" position={[-6.5, 0, 3]} scale={1.5} rotation={[0, Math.PI / 2, 0]} tint="carbon" />
      <Model model="wall" position={[6.5, 0, 3]} scale={1.5} rotation={[0, -Math.PI / 2, 0]} tint="carbon" />
      <Model model="structureMedium" position={[-7, 0, -2]} scale={1.3} rotation={[0, Math.PI / 2, 0]} tint="steel" />
      <Model model="structureMedium" position={[7.2, 0, -3]} scale={1.3} rotation={[0, -Math.PI / 2, 0]} tint="steel" />
      <Model model="lightPostLarge" position={[-4.2, 0, 9]} scale={1.1} tint="brass" />
      <Model model="lightPostLarge" position={[4.2, 0, 9]} scale={1.1} tint="brass" />
      <Model model="lightPost" position={[-5, 0, -7]} scale={1.15} tint="brass" />
      <Model model="lightPost" position={[5.5, 0, -11]} scale={1.15} tint="brass" />
      <Model model="barrier" position={[-7.5, 0, 5]} scale={1.2} rotation={[0, Math.PI / 2, 0]} tint="brass" />
      <Model model="barrier" position={[7.8, 0, 4]} scale={1.2} rotation={[0, -Math.PI / 2, 0]} tint="brass" />
      <Model model="cone" position={[-2.2, 0, 9.5]} scale={1.3} tint="brass" />
      <Model model="cone" position={[2.4, 0, 9.2]} scale={1.1} tint="brass" />
    </group>
  );
}

function ProfileHub() {
  return (
    <group position={[0, 0, 0]}>
      <Model model="desk" position={[0, 0, 0.5]} scale={2.6} tint="carbon" />
      <Model model="deskCorner" position={[1.7, 0, 0.15]} scale={2.3} rotation={[0, -0.45, 0]} tint="carbon" />
      <Model model="chairDesk" position={[0.15, 0, 1.55]} scale={2.3} rotation={[0, Math.PI, 0]} tint="steel" />
      <Model model="monitor" position={[-0.4, 0.9, 0.2]} scale={2.5} tint="glass" />
      <Model model="monitor" position={[0.55, 0.9, 0.08]} scale={2.3} rotation={[0, -0.28, 0]} tint="glass" />
      <Model model="laptop" position={[1.2, 0.9, 0.5]} scale={2.3} rotation={[0, -0.55, 0]} tint="steel" />
      <Model model="keyboard" position={[0.05, 0.91, 0.65]} scale={2.3} tint="carbon" />
      <Model model="mouse" position={[0.75, 0.91, 0.7]} scale={2.3} tint="carbon" />
      <Model model="speaker" position={[-1.15, 0.91, 0.25]} scale={2.1} tint="steel" />
      <Model model="speakerSmall" position={[1.55, 0.91, 0.2]} scale={2.1} tint="steel" />

      <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.22}>
        <Model model="screenWide" position={[-2.5, 1.85, -0.7]} scale={1.5} rotation={[0, 0.55, 0]} tint="glass" />
      </Float>
      <Float speed={0.9} rotationIntensity={0.1} floatIntensity={0.18}>
        <Model model="screenHanging" position={[2.7, 2.15, -0.5]} scale={1.4} rotation={[0, -0.5, 0]} tint="glass" />
      </Float>

      <group position={[-1.9, 1.35, -1.3]}>
        <SpinGroup speed={0.35}>
          <Model model="cogA" scale={1.5} rotation={[Math.PI / 2, 0, 0]} tint="brass" />
        </SpinGroup>
        <group position={[0.9, 0, 0.08]}>
          <SpinGroup speed={-0.55}>
            <Model model="cogB" scale={1.05} rotation={[Math.PI / 2, 0, 0]} tint="brass" />
          </SpinGroup>
        </group>
        <group position={[-0.75, 0.12, -0.05]}>
          <SpinGroup speed={0.7}>
            <Model model="cogC" scale={0.8} rotation={[Math.PI / 2, 0, 0]} tint="steel" />
          </SpinGroup>
        </group>
      </group>

      <Model model="machine" position={[3.0, 0, -1.6]} scale={1.25} rotation={[0, -0.85, 0]} tint="steel" />
      <pointLight position={[0.2, 1.5, 0.7]} color="#4ecdc4" intensity={5} distance={5.5} />
      <pointLight position={[-0.9, 1.3, 0.35]} color="#c9a227" intensity={3} distance={4.5} />
    </group>
  );
}

function DiagnosticBay() {
  return (
    <group position={[8.2, 0, -1]}>
      <Model model="pitsOffice" position={[0, 0, 0]} scale={1.35} rotation={[0, -Math.PI / 2, 0]} tint="carbon" />
      <Model model="scanner" position={[-1.1, 0, 1.1]} scale={1.45} tint="steel" />
      <Model model="machineFortified" position={[1.4, 0, 0.4]} scale={1.25} tint="steel" />
      <Model model="robotArmA" position={[0.15, 0, 2.1]} scale={1.35} rotation={[0, Math.PI, 0]} tint="brass" />
      <Model model="screenPanel" position={[-0.4, 1.55, -0.7]} scale={1.5} tint="glass" />
      <Model model="boxLarge" position={[2.1, 0, 2.1]} scale={1.15} tint="carbon" />
      <Model model="warning" position={[-2.1, 0, 0.2]} scale={1.15} tint="brass" />
      <WarmSpot position={[0, 5.2, 2]} intensity={11} color="#e8a54b" />
    </group>
  );
}

function SkillsZone() {
  return (
    <group position={[-8.2, 0, -2]}>
      <Model model="screenHanging" position={[0, 2.1, 0]} scale={1.7} rotation={[0, 0.55, 0]} tint="glass" />
      <Model model="screenFlat" position={[-1.4, 1.45, -1.4]} scale={1.5} rotation={[0, 0.85, 0]} tint="glass" />
      <Model model="screenSmall" position={[1.15, 1.25, -1.9]} scale={1.6} rotation={[0, 0.25, 0]} tint="glass" />
      <Model model="robotArmB" position={[2.1, 0, 0.4]} scale={1.25} tint="steel" />
      <SpinGroup speed={0.4}>
        <Model model="cogD" position={[0, 1.0, -0.8]} scale={1.55} rotation={[Math.PI / 2, 0, 0]} tint="brass" />
      </SpinGroup>
      <group position={[1.3, 1.05, -0.4]}>
        <SpinGroup speed={-0.65}>
          <Model model="cogE" scale={1.1} rotation={[Math.PI / 2, 0, 0]} tint="brass" />
        </SpinGroup>
      </group>
      <Model model="catwalk" position={[-2.1, 0, 1]} scale={1.4} rotation={[0, Math.PI / 2, 0]} tint="steel" />
      <pointLight position={[0, 2.6, 0]} color="#4ecdc4" intensity={7} distance={9} />
    </group>
  );
}

function ProjectsBench() {
  const pieces: {
    model: Parameters<typeof Model>[0]["model"];
    pos: [number, number, number];
    rot?: number;
    tint?: Parameters<typeof Model>[0]["tint"];
  }[] = [
    { model: "boxSmall", pos: [-1.7, 0.02, -7.3], tint: "carbon" },
    { model: "boxLarge", pos: [-0.45, 0.02, -8.05], rot: 0.35, tint: "steel" },
    { model: "piston", pos: [0.65, 0.02, -7.4], tint: "brass" },
    { model: "machineBed", pos: [1.75, 0.02, -7.95], rot: -0.25, tint: "steel" },
    { model: "cardboard", pos: [2.55, 0.02, -7.25], tint: "keep" },
    { model: "books", pos: [-2.35, 0.02, -7.95], tint: "keep" },
    { model: "topLarge", pos: [0.15, 0.02, -8.55], tint: "brass" },
  ];

  return (
    <group>
      <Model model="bench" position={[-0.2, 0, -8]} scale={3.4} tint="carbon" />
      <Model model="bench" position={[2.9, 0, -8]} scale={3.4} tint="carbon" />
      {pieces.map((p, i) => (
        <Float key={i} speed={1 + i * 0.04} floatIntensity={0.12} rotationIntensity={0.06}>
          <Model model={p.model} position={p.pos} scale={1.4} rotation={[0, p.rot ?? 0, 0]} tint={p.tint} />
        </Float>
      ))}
      <Model model="lampCeiling" position={[0.6, 3.1, -8]} scale={2} tint="brass" />
      <WarmSpot position={[0.6, 4.4, -7]} intensity={13} color="#ffd089" />
    </group>
  );
}

function PassionStations() {
  return (
    <group position={[-6, 0, -12.5]}>
      <Model model="sedan" position={[0.2, 0, 0.2]} scale={1.2} rotation={[0, 0.55, 0]} tint="carbon" />
      <Model model="cone" position={[2.1, 0, 1.1]} scale={1.35} tint="brass" />
      <Model model="cone" position={[2.55, 0, 0.45]} scale={1.15} tint="brass" />

      <Model model="kart" position={[4.6, 0, -1.4]} scale={1.35} rotation={[0, -0.45, 0]} tint="steel" />
      <Model model="wheelRacing" position={[3.5, 0.38, -0.35]} scale={1.55} rotation={[0, 0.2, Math.PI / 2]} tint="carbon" />
      <Model model="wheelDark" position={[5.5, 0.38, -2.15]} scale={1.45} rotation={[0.2, 0, Math.PI / 2]} tint="carbon" />
      <Model model="drivetrain" position={[3.9, 0.42, -1.95]} scale={1.5} tint="brass" />

      <group position={[1.6, 1.55, -2.4]}>
        <SpinGroup speed={0.3}>
          <Model model="cogA" scale={1.6} rotation={[Math.PI / 2, 0, 0]} tint="brass" />
        </SpinGroup>
        <group position={[0.95, 0, 0.1]}>
          <SpinGroup speed={-0.5}>
            <Model model="cogC" scale={1.1} rotation={[Math.PI / 2, 0, 0]} tint="brass" />
          </SpinGroup>
        </group>
      </group>

      <Model model="tv" position={[6.6, 0, -3]} scale={2.3} rotation={[0, -0.85, 0]} tint="glass" />
      <Model model="speaker" position={[5.7, 0, -3.15]} scale={2.05} tint="steel" />

      <Model model="desk" position={[-2.6, 0, -2]} scale={2.05} rotation={[0, 0.4, 0]} tint="carbon" />
      <Model model="laptop" position={[-2.4, 0.88, -1.75]} scale={2.05} tint="steel" />
      <Model model="hatchback" position={[-1.1, 0, 2.6]} scale={0.95} rotation={[0, 2.15, 0]} tint="steel" />
      <WarmSpot position={[2, 5.2, -1]} intensity={10} color="#c9a227" />
    </group>
  );
}

function CvStation() {
  return (
    <group position={[6.6, 0, -13]}>
      <Model model="sideTable" position={[0, 0, 0]} scale={2.5} tint="carbon" />
      <Model model="monitor" position={[0, 0.88, 0]} scale={2.7} tint="glass" />
      <Model model="books" position={[0.75, 0.88, 0.25]} scale={2.05} tint="keep" />
      <Model model="lampFloor" position={[-1.15, 0, 0.65]} scale={2.25} tint="brass" />
      <Model model="laptop" position={[-0.55, 0.88, 0.4]} scale={2.05} rotation={[0, 0.4, 0]} tint="steel" />
      <pointLight position={[0, 2.1, 0.55]} color="#e8edf7" intensity={5.5} distance={6.5} />
    </group>
  );
}

function ContactZone() {
  const ring = useRef<THREE.Group>(null);
  const { reducedMotion } = useExperience();
  useFrame((_, dt) => {
    if (reducedMotion || !ring.current) return;
    ring.current.rotation.y += dt * 0.28;
  });

  return (
    <group position={[0, 0, -20]}>
      <Model model="crane" position={[-3.2, 0, 0.2]} scale={1.35} tint="steel" />
      <Model model="hopper" position={[3.1, 0, 1.1]} scale={1.25} tint="brass" />
      <Model model="container" position={[5.1, 0, -2]} scale={1.05} rotation={[0, 0.28, 0]} tint="carbon" />
      <Model model="radar" position={[-4.2, 0, -2]} scale={1.35} tint="steel" />
      <Model model="pylon" position={[0.2, 0, 2.1]} scale={1.45} tint="brass" />
      <Model model="tank" position={[-6.1, 0, 1]} scale={1.15} tint="steel" />
      <Model model="robotArmB" position={[2.2, 0, -1.5]} scale={1.2} rotation={[0, -0.6, 0]} tint="brass" />

      <group ref={ring} position={[0, 1.45, -1]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.15, 0.05, 16, 96]} />
          <meshStandardMaterial
            color="#c9a227"
            emissive="#c9a227"
            emissiveIntensity={2.6}
            toneMapped={false}
            metalness={0.85}
            roughness={0.18}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.6, 0.028, 12, 72]} />
          <meshStandardMaterial
            color="#4ecdc4"
            emissive="#4ecdc4"
            emissiveIntensity={2.2}
            toneMapped={false}
            metalness={0.7}
            roughness={0.2}
          />
        </mesh>
      </group>
      <pointLight position={[0, 3.2, -1]} color="#c9a227" intensity={12} distance={15} />
      <pointLight position={[1.2, 2.2, -2]} color="#4ecdc4" intensity={7} distance={11} />
    </group>
  );
}

function Atmosphere({ low }: { low: boolean }) {
  return (
    <>
      {!low && (
        <Sparkles
          count={70}
          scale={[26, 7, 38]}
          position={[0, 3, -4]}
          size={2.2}
          speed={0.32}
          opacity={0.4}
          color="#c9a227"
        />
      )}
      <ContactShadows
        position={[0, 0.015, -4]}
        opacity={low ? 0.4 : 0.62}
        scale={42}
        blur={low ? 2.2 : 3.2}
        far={14}
        color="#000"
      />
    </>
  );
}

export function AtelierWorld() {
  const { quality, isMobile } = useExperience();
  const low = useMemo(() => {
    if (quality === "low") return true;
    if (quality === "high") return false;
    return isMobile;
  }, [quality, isMobile]);

  return (
    <group>
      <Floor />
      <AtelierShell />

      <Suspense fallback={null}>
        <ProfileHub />
      </Suspense>

      <Suspense fallback={null}>
        <DiagnosticBay />
        <SkillsZone />
        <ProjectsBench />
        <PassionStations />
        <CvStation />
        <ContactZone />
      </Suspense>

      <Atmosphere low={low} />

      <ambientLight intensity={low ? 0.4 : 0.18} />
      <hemisphereLight args={["#8a9bb8", "#0a0c12", low ? 0.45 : 0.3]} />
      <directionalLight
        position={[9, 15, 7]}
        intensity={low ? 0.95 : 1.35}
        color="#f4f0e6"
        castShadow={!low}
        shadow-mapSize={[low ? 512 : 2048, low ? 512 : 2048]}
        shadow-camera-far={55}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-bias={-0.0003}
      />
      <WarmSpot position={[0, 8.5, 5]} intensity={low ? 7 : 12} />
      <pointLight position={[-6, 4.2, -10]} color="#4ecdc4" intensity={low ? 3.5 : 6} distance={17} />
      <pointLight position={[6, 3.5, -13]} color="#e8a54b" intensity={low ? 2.5 : 4} distance={12} />
    </group>
  );
}
