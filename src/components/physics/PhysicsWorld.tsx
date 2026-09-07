"use client";

import { Physics } from "@react-three/rapier";
import type { ReactNode } from "react";

/** Rapier world — gravity Mediterranean outdoor scale. */
export function PhysicsWorld({
  children,
  interpolate = true,
  lite = false,
}: {
  children: ReactNode;
  interpolate?: boolean;
  lite?: boolean;
}) {
  return (
    <Physics gravity={[0, -18, 0]} timeStep={lite ? 1 / 30 : "vary"} interpolate={interpolate}>
      {children}
    </Physics>
  );
}
