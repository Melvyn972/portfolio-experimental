"use client";

import { useMemo } from "react";
import * as THREE from "three";

type Props = {
  title: string;
  lines: string[];
  width?: number;
  height?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  lit?: boolean;
};

/**
 * Brass museum plate — canvas ink on metal, never a white UI card.
 */
export function MuseumPlaque({
  title,
  lines,
  width = 1.05,
  height = 0.58,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  lit = false,
}: Props) {
  const texture = useMemo(() => makePlaqueTexture(title, lines), [title, lines]);

  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width + 0.06, height + 0.06, 0.035]} />
        <meshStandardMaterial color="#6a4e2a" metalness={0.62} roughness={0.38} />
      </mesh>
      <mesh position={[0, 0, 0.02]} castShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.55}
          metalness={0.28}
          emissive="#3a2a14"
          emissiveIntensity={lit ? 0.22 : 0.06}
        />
      </mesh>
    </group>
  );
}

function makePlaqueTexture(title: string, lines: string[]) {
  if (typeof document === "undefined") {
    const data = new THREE.DataTexture(new Uint8Array([44, 33, 22, 255]), 1, 1);
    data.needsUpdate = true;
    return data;
  }
  const c = document.createElement("canvas");
  c.width = 768;
  c.height = 420;
  const ctx = c.getContext("2d");
  if (!ctx) {
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
  ctx.fillStyle = "#2c2116";
  ctx.fillRect(0, 0, c.width, c.height);
  const g = ctx.createLinearGradient(0, 0, 0, c.height);
  g.addColorStop(0, "#3a2c1c");
  g.addColorStop(1, "#24180f");
  ctx.fillStyle = g;
  ctx.fillRect(12, 12, c.width - 24, c.height - 24);

  ctx.strokeStyle = "#c4a46a";
  ctx.lineWidth = 6;
  ctx.strokeRect(22, 22, c.width - 44, c.height - 44);

  ctx.fillStyle = "#e8d4a8";
  ctx.font = "600 42px Georgia, serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  wrapText(ctx, title, 48, 48, c.width - 96, 48);

  ctx.fillStyle = "#c4b08a";
  ctx.font = "28px Georgia, serif";
  let y = 118;
  for (const line of lines) {
    y = wrapText(ctx, line, 48, y, c.width - 96, 36) + 10;
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
) {
  const words = text.split(" ");
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y);
      y += lineH;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, y);
    y += lineH;
  }
  return y;
}
