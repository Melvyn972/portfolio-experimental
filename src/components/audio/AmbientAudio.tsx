"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/hooks/useGameStore";
import { setGameState, getGameState } from "@/lib/gameStore";

/**
 * Procedural ambient audio via Web Audio API —
 * waves, wind, birds chirps, idle engine, tire hiss.
 */
export function AmbientAudio() {
  const { muted, phase } = useGameStore();
  const ctxRef = useRef<AudioContext | null>(null);
  const nodes = useRef<{
    master: GainNode;
    waves: GainNode;
    wind: GainNode;
    engine: GainNode;
    tires: GainNode;
    engineOsc?: OscillatorNode;
    engineOsc2?: OscillatorNode;
  } | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    ctxRef.current = ctx;
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const waves = ctx.createGain();
    waves.gain.value = 0.22;
    waves.connect(master);
    createNoiseLoop(ctx, waves, "waves");

    const wind = ctx.createGain();
    wind.gain.value = 0.1;
    wind.connect(master);
    createNoiseLoop(ctx, wind, "wind");

    const engine = ctx.createGain();
    engine.gain.value = 0;
    engine.connect(master);
    const engineOsc = ctx.createOscillator();
    engineOsc.type = "sawtooth";
    engineOsc.frequency.value = 48;
    const engineFilter = ctx.createBiquadFilter();
    engineFilter.type = "lowpass";
    engineFilter.frequency.value = 280;
    const engGain = ctx.createGain();
    engGain.gain.value = 0.08;
    engineOsc.connect(engineFilter);
    engineFilter.connect(engGain);
    engGain.connect(engine);
    engineOsc.start();

    const engineOsc2 = ctx.createOscillator();
    engineOsc2.type = "triangle";
    engineOsc2.frequency.value = 72;
    const engGain2 = ctx.createGain();
    engGain2.gain.value = 0.04;
    engineOsc2.connect(engGain2);
    engGain2.connect(engine);
    engineOsc2.start();

    const tires = ctx.createGain();
    tires.gain.value = 0;
    tires.connect(master);
    createNoiseLoop(ctx, tires, "tires");

    // Occasional bird chirps
    const birdTimer = window.setInterval(() => {
      if (ctx.state === "closed" || master.gain.value < 0.01) return;
      if (Math.random() > 0.55) chirp(ctx, master);
    }, 3200);

    nodes.current = { master, waves, wind, engine, tires, engineOsc, engineOsc2 };

    return () => {
      clearInterval(birdTimer);
      engineOsc.stop();
      engineOsc2.stop();
      ctx.close();
    };
  }, []);

  useEffect(() => {
    const ctx = ctxRef.current;
    const n = nodes.current;
    if (!ctx || !n) return;

    const resume = () => {
      if (ctx.state === "suspended") ctx.resume();
    };
    window.addEventListener("pointerdown", resume);
    window.addEventListener("keydown", resume);

    const target = muted ? 0 : phase === "boot" ? 0 : 0.55;
    n.master.gain.setTargetAtTime(target, ctx.currentTime, 0.4);

    return () => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
  }, [muted, phase]);

  useEffect(() => {
    const ctx = ctxRef.current;
    const n = nodes.current;
    if (!ctx || !n) return;

    let raf = 0;
    const tick = () => {
      const { mode, phase, speed, engineOn } = getGameState();
      const driving = mode === "driving" && phase === "playing";
      const engineLevel = engineOn || driving ? (driving ? 0.7 + Math.min(1, speed / 22) * 0.5 : 0.35) : 0;
      n.engine.gain.setTargetAtTime(engineLevel * 0.5, ctx.currentTime, 0.25);
      n.tires.gain.setTargetAtTime(driving ? Math.min(0.35, speed * 0.02) : 0, ctx.currentTime, 0.2);
      n.wind.gain.setTargetAtTime(0.08 + (driving ? speed * 0.004 : 0.02), ctx.currentTime, 0.3);
      if (n.engineOsc) n.engineOsc.frequency.setTargetAtTime(48 + speed * 3.2, ctx.currentTime, 0.15);
      if (n.engineOsc2) n.engineOsc2.frequency.setTargetAtTime(72 + speed * 4.5, ctx.currentTime, 0.15);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return null;
}

function createNoiseLoop(ctx: AudioContext, dest: AudioNode, kind: "waves" | "wind" | "tires") {
  const bufferSize = ctx.sampleRate * 3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    if (kind === "waves") {
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    } else if (kind === "wind") {
      last = (last + 0.05 * white) / 1.05;
      data[i] = last * 2.2;
    } else {
      data[i] = white * 0.35;
    }
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = kind === "tires" ? "bandpass" : "lowpass";
  filter.frequency.value = kind === "waves" ? 420 : kind === "wind" ? 900 : 1200;
  src.connect(filter);
  filter.connect(dest);
  src.start();
}

function chirp(ctx: AudioContext, dest: AudioNode) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 1800 + Math.random() * 900;
  g.gain.value = 0.0001;
  osc.connect(g);
  g.connect(dest);
  const t = ctx.currentTime;
  g.gain.exponentialRampToValueAtTime(0.04, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  osc.frequency.exponentialRampToValueAtTime(osc.frequency.value * 1.2, t + 0.15);
  osc.start(t);
  osc.stop(t + 0.2);
}

/** Drives intro → playing handoff + explorer hint. */
export function IntroDirector() {
  const { phase } = useGameStore();
  const done = useRef(false);

  useEffect(() => {
    if (phase !== "intro" || done.current) return;
    const engineAt = window.setTimeout(() => setGameState({ engineOn: true }), 4200);
    const playAt = window.setTimeout(() => {
      done.current = true;
      setGameState({ phase: "playing", engineOn: true, showExplorerHint: true });
      window.setTimeout(() => setGameState({ showExplorerHint: false }), 3800);
    }, 5600);
    return () => {
      clearTimeout(engineAt);
      clearTimeout(playAt);
    };
  }, [phase]);

  return null;
}
