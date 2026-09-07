"use client";

import { Physics } from "@react-three/rapier";
import type { ReactNode } from "react";

/** Rapier world — gravity Mediterranean outdoor scale. */
export function PhysicsWorld({ children, interpolate = true }: { children: ReactNode; interpolate?: boolean }) {
  return (
    <Physics gravity={[0, -18, 0]} timeStep="vary" interpolate={interpolate}>
      {children}
    </Physics>
  );
}
