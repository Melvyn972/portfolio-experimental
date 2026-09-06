"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { getRoadCurve } from "@/lib/road";

function cliffProfile(z: number) {
  return 14 + Math.sin(z * 0.03) * 4 + Math.cos(z * 0.017) * 3;
}

export function Terrain() {
  const land = useMemo(() => {
    const geo = new THREE.PlaneGeometry(90, 240, 70, 90);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const curve = getRoadCurve();
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      let y = 0;

      if (x < -8) {
        y = THREE.MathUtils.smoothstep(-8, -28, x) * -1.8 + Math.sin(z * 0.04) * 0.15;
      }
      if (x > 6) {
        const rise = THREE.MathUtils.smoothstep(6, 6 + cliffProfile(z), x);
        y = rise * (4.5 + Math.sin(z * 0.05) * 1.8 + Math.cos(x * 0.08) * 0.8);
        y += Math.pow(rise, 2) * 2.2;
      }

      const tApprox = THREE.MathUtils.clamp((-z + 40) / 200, 0, 1);
      const nearest = curve.getPointAt(tApprox);
      const dx = x - nearest.x;
      const roadInfluence = Math.exp(-(dx * dx) / 28);
      y = THREE.MathUtils.lerp(y, 0.02, roadInfluence * 0.85);

      if (x > 12 && z < -30 && z > -50) y = Math.max(y, 1.6);
      if (x > 14 && z < -110 && z > -130) y = Math.max(y, 1.8);

      pos.setY(i, y);

      if (x < -10 && y < 0.2) c.set("#d8c4a0");
      else if (y > 2.8) c.set("#b5a18a");
      else if (y > 1.2) c.set("#c2b196");
      else c.set("#9aaa6e");
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    pos.needsUpdate = true;
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  const walls = useMemo(() => {
    const curve = getRoadCurve();
    return Array.from({ length: 18 }, (_, i) => {
      const t = 0.15 + i * 0.04;
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const pos = p.clone().addScaledVector(side, 5.2);
      pos.y = 0.55;
      return {
        pos: [pos.x, pos.y, pos.z] as [number, number, number],
        yaw: Math.atan2(tangent.x, tangent.z),
        h: 0.9 + (i % 3) * 0.15,
      };
    });
  }, []);

  return (
    <group>
      <mesh geometry={land} receiveShadow castShadow position={[8, 0, -60]}>
        <meshStandardMaterial vertexColors roughness={0.95} metalness={0} />
      </mesh>
      {walls.map((w, i) => (
        <mesh key={i} position={w.pos} rotation={[0, w.yaw, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.45, w.h, 3.2]} />
          <meshStandardMaterial color="#d7cbb8" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}
