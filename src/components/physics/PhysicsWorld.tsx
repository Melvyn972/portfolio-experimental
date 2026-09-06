"use client";

import { Physics } from "@react-three/rapier";
import type { ReactNode } from "react";

/** Rapier world — gravity Mediterranean outdoor scale. */
export function PhysicsWorld({ children }: { children: ReactNode }) {
  return (
    <Physics gravity={[0, -18, 0]} timeStep="vary" interpolate>
      {children}
    </Physics>
  );
}
