import { Link, useEffect, useMemo, useRef, useState } from "./canvas-shim";
import type { CSSProperties, StackProps } from "./canvas-shim";

type Kids = StackProps["children"];
type Reels = [number, number, number];
type Flags = [boolean, boolean, boolean];

const C = {
  bg: "#0e0a10",
  ink: "#1a1216",
  felt: "#0f4a35",
  feltLine: "#1f6b4f",
  gold: "#f2c14e",
  goldDim: "#a8832f",
  red: "#d62f45",
  redDeep: "#5e0f1d",
  cream: "#f7eedb",
  creamDim: "#cbbd9f",
  muted: "#8a8070",
  line: "#2c2230",
  led: "#ffb23e",
  ledDim: "#b07a2a",
  ledBg: "#160c05",
  green: "#4be08c",
  reel: "#fbf3e0",
};

const SERIF = "'Playfair Display', Didot, 'Bodoni 72', 'Bodoni MT', Georgia, 'Times New Roman', serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
const CELL = 88;

const CARPET = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='56' height='56'><path d='M28 6 L50 28 L28 50 L6 28 Z' fill='none' stroke='#1d1520' stroke-width='1.2'/><circle cx='28' cy='28' r='2.4' fill='#24192a'/><circle cx='0' cy='0' r='2.4' fill='#24192a'/><circle cx='56' cy='0' r='2.4' fill='#24192a'/><circle cx='0' cy='56' r='2.4' fill='#24192a'/><circle cx='56' cy='56' r='2.4' fill='#24192a'/></svg>",
)}")`;

const CSS = `
.wcis, .wcis * { box-sizing: border-box; }
.wcis ::selection { background: ${C.gold}; color: ${C.ink}; }
.wcis button { font-family: inherit; }
.wcis button:focus-visible, .wcis input:focus-visible { outline: 2px solid ${C.gold}; outline-offset: 3px; }
@keyframes wcis-chase { 0% { opacity: 1 } 50% { opacity: .16 } 100% { opacity: 1 } }
.wcis-bulb { animation: wcis-chase .9s steps(1, end) infinite; }
.wcis-bulb-fast { animation-duration: .2s; }
@keyframes wcis-spin { from { transform: translateY(0) } to { transform: translateY(-${CELL * 5}px) } }
.wcis-strip { animation: wcis-spin .3s linear infinite; filter: blur(1.4px); }
@keyframes wcis-land { 0% { transform: translateY(-36px) } 55% { transform: translateY(7px) } 80% { transform: translateY(-2px) } 100% { transform: translateY(0) } }
.wcis-land { animation: wcis-land .34s ease-out; }
@keyframes wcis-coin { 0% { transform: translate(0, -40px) rotateY(0deg); opacity: 1 } 85% { opacity: 1 } 100% { transform: translate(var(--dx), var(--fall)) rotateY(900deg); opacity: 0 } }
.wcis-coin { position: absolute; top: 0; border-radius: 50%; background: ${C.gold}; border: 2px solid ${C.goldDim}; animation: wcis-coin var(--dur) cubic-bezier(.4,.05,.75,1) var(--delay) both; pointer-events: none; }
.wcis-coin::after { content: ""; position: absolute; inset: 3px; border-radius: 50%; border: 1.5px solid ${C.goldDim}; }
@keyframes wcis-shake { 0%,100% { transform: translateX(0) } 20% { transform: translateX(-6px) } 40% { transform: translateX(6px) } 60% { transform: translateX(-4px) } 80% { transform: translateX(3px) } }
.wcis-shake { animation: wcis-shake .45s ease; }
@keyframes wcis-float { 0% { opacity: 0; transform: translateY(12px) scale(.7) } 20% { opacity: 1; transform: translateY(0) scale(1.15) } 100% { opacity: 0; transform: translateY(-46px) scale(1) } }
.wcis-float { animation: wcis-float 1.4s ease-out forwards; pointer-events: none; }
@keyframes wcis-blink { 0%,100% { opacity: 1 } 50% { opacity: .15 } }
.wcis-blink { animation: wcis-blink .26s steps(1, end) infinite; }
@keyframes wcis-in { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }
.wcis-in { animation: wcis-in .6s ease both; }
@keyframes wcis-flicker { 0%, 17%, 21%, 24%, 52%, 57%, 100% { opacity: 1 } 19%, 23%, 55% { opacity: .3 } }
.wcis-flicker { animation: wcis-flicker 4.5s linear infinite; }
@keyframes wcis-pulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.06) } }
.wcis-pulse { animation: wcis-pulse 1.4s ease-in-out infinite; }
@keyframes wcis-eq { 0%,100% { transform: scaleY(.25) } 50% { transform: scaleY(1) } }
.wcis-eq { transform-origin: bottom; animation: wcis-eq .8s ease-in-out infinite; }
@keyframes wcis-pop { 0% { transform: scale(.6); opacity: 0 } 60% { transform: scale(1.06); opacity: 1 } 100% { transform: scale(1) } }
.wcis-pop { animation: wcis-pop .5s cubic-bezier(.2,.9,.3,1.2) both; }
@keyframes wcis-glow { 0%,100% { box-shadow: 0 0 0 0 rgba(214,47,69,0) } 50% { box-shadow: 0 0 22px 2px rgba(214,47,69,.55) } }
.wcis-you { animation: wcis-in .6s ease both, wcis-glow 2s ease-in-out .6s infinite; }
@keyframes wcis-bob { 0%,100% { transform: rotate(-2deg) translateY(0) } 50% { transform: rotate(5deg) translateY(2px) } }
.wcis-bob { transform-box: fill-box; transform-origin: center; animation: wcis-bob 3s ease-in-out infinite; }
@keyframes wcis-wave { from { transform: translateX(0) } to { transform: translateX(-16px) } }
.wcis-wave { animation: wcis-wave 1.6s linear infinite; }
@keyframes wcis-rise { 0%,100% { transform: translateY(14px) rotate(-6deg) } 50% { transform: translateY(0) rotate(5deg) } }
.wcis-rise { transform-box: fill-box; transform-origin: bottom center; animation: wcis-rise 2.2s ease-in-out infinite; }
@keyframes wcis-pound-l { 0%,100% { transform: translate(0,0) } 50% { transform: translate(9px,-2px) } }
@keyframes wcis-pound-r { 0%,100% { transform: translate(0,0) } 50% { transform: translate(-9px,-2px) } }
.wcis-pound-l { animation: wcis-pound-l .5s ease-in-out infinite; }
.wcis-pound-r { animation: wcis-pound-r .5s ease-in-out .25s infinite; }
@keyframes wcis-huff { 0%,100% { transform: scale(1) } 50% { transform: scale(1.03) } }
.wcis-huff { transform-box: fill-box; transform-origin: center bottom; animation: wcis-huff .5s ease-in-out infinite; }
@keyframes wcis-rot { to { transform: rotate(360deg) } }
.wcis-spin-cw { transform-box: fill-box; transform-origin: center; animation: wcis-rot 5s linear infinite; }
.wcis-spin-ccw { transform-box: fill-box; transform-origin: center; animation: wcis-rot 8s linear infinite reverse; }
@keyframes wcis-pinkglow { 0%,100% { opacity: 1 } 50% { opacity: .55 } }
.wcis-glowpink { animation: wcis-pinkglow 1.8s ease-in-out infinite; }
@keyframes wcis-glint { 0%,100% { transform: rotate(-4deg) } 50% { transform: rotate(4deg) } }
.wcis-glint { animation: wcis-glint 1.6s ease-in-out infinite; }
@keyframes wcis-slap { 0%, 70%, 100% { transform: scale(1); opacity: .92 } 76% { transform: scale(1.18); opacity: 1 } 84% { transform: scale(.97) } }
.wcis-slap { transform-box: fill-box; transform-origin: center; animation: wcis-slap 3s ease-out infinite; }
@keyframes wcis-shine { 0%, 55% { transform: skewX(-20deg) translateX(0) } 100% { transform: skewX(-20deg) translateX(140px) } }
.wcis-shine { animation: wcis-shine 3.2s ease-in-out infinite; }
@keyframes wcis-cursor { 50% { opacity: 0 } }
.wcis-cursor { animation: wcis-cursor 1s steps(1, end) infinite; }
.wcis-btn { cursor: pointer; border-radius: 999px; padding: 10px 22px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; font-size: 12.5px; line-height: 1; transition: transform .08s ease, background .15s ease, color .15s ease, border-color .15s ease; }
.wcis-btn:hover:not(:disabled) { transform: translateY(-1px); }
.wcis-btn:active:not(:disabled) { transform: translateY(1px); }
.wcis-btn:disabled { opacity: .4; cursor: not-allowed; }
.wcis-red { background: ${C.red}; color: ${C.cream}; border: 2px solid ${C.gold}; }
.wcis-red:hover:not(:disabled) { background: #ea4a60; }
.wcis-gold { background: transparent; color: ${C.gold}; border: 2px solid ${C.gold}; }
.wcis-gold:hover:not(:disabled) { background: ${C.gold}; color: ${C.ink}; }
.wcis-ghost { background: transparent; color: ${C.creamDim}; border: 1px solid #4a3d45; padding: 9px 16px; }
.wcis-ghost:hover:not(:disabled) { color: ${C.cream}; border-color: ${C.creamDim}; }
.wcis-social { border-radius: 9px; transition: transform .15s ease, box-shadow .15s ease; }
.wcis-social:hover { transform: translateY(-2px) scale(1.08); box-shadow: 0 4px 14px rgba(0,0,0,.45); }
.wcis-toggle { display: inline-flex; align-items: center; gap: 8px; background: transparent; border: none; color: ${C.creamDim}; cursor: pointer; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; padding: 4px 2px; }
.wcis-toggle:hover { color: ${C.cream}; }
.wcis-knob { transition: bottom .18s cubic-bezier(.3,.7,.4,1), transform .15s ease; }
.wcis-lever:hover:not(:disabled) .wcis-knob { transform: translateY(-5px); }
.wcis-range { accent-color: ${C.gold}; width: 96px; cursor: pointer; }
@media (prefers-reduced-motion: reduce) {
  .wcis-bulb, .wcis-flicker, .wcis-pulse, .wcis-eq, .wcis-cursor, .wcis-blink, .wcis-bob, .wcis-wave, .wcis-rise, .wcis-pound-l, .wcis-pound-r, .wcis-huff, .wcis-spin-cw, .wcis-spin-ccw, .wcis-glowpink, .wcis-glint, .wcis-slap, .wcis-shine { animation: none; }
}
`;

/* ---------------------------------------------------------------- sound */

const mtof = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);
const rand = (a: number, b: number): number => a + Math.random() * (b - a);
const BEAT = 60 / 112;

type Chord = { root: number; third: number; voicing: number[] };
const PROG: Chord[] = [
  { root: 38, third: 3, voicing: [65, 69, 72, 76] },
  { root: 43, third: 4, voicing: [65, 71, 76] },
  { root: 36, third: 4, voicing: [64, 67, 71, 74] },
  { root: 45, third: 4, voicing: [67, 70, 73, 76] },
  { root: 38, third: 3, voicing: [65, 69, 72, 76] },
  { root: 43, third: 4, voicing: [65, 71, 76] },
  { root: 40, third: 3, voicing: [67, 71, 74, 78] },
  { root: 45, third: 4, voicing: [67, 73, 76, 79] },
];
const COMP: Array<Array<[number, number]>> = [
  [[0, 0], [1, 1]],
  [[1, 0], [3, 0]],
  [[0, 0], [2, 1]],
  [[1, 1], [3, 0]],
];

type ToneOpts = { type?: OscillatorType; attack?: number; glide?: number; lp?: number; pan?: number; send?: number };
type NoiseOpts = { q?: number; attack?: number; pan?: number; send?: number };

class CasinoAudio {
  sfxOn = true;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private floor: GainNode | null = null;
  private fx: GainNode | null = null;
  private verb: GainNode | null = null;
  private white: AudioBuffer | null = null;
  private brown: AudioBuffer | null = null;
  private volume = 0.7;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private floorTimer: ReturnType<typeof setTimeout> | null = null;
  private floorNodes: AudioScheduledSourceNode[] = [];
  private floorOn = false;
  private nextBeat = 0;
  private beat = 0;
  private mel = 76;

  private ensure(): AudioContext | null {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return this.ctx;
    }
    try {
      const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
      const Ctor = w.AudioContext ?? w.webkitAudioContext;
      if (!Ctor) return null;
      const ctx = new Ctor();
      const master = ctx.createGain();
      master.gain.value = this.volume;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.ratio.value = 4;
      master.connect(comp);
      comp.connect(ctx.destination);
      const conv = ctx.createConvolver();
      conv.buffer = this.impulse(ctx, 2.4, 2.6);
      const verb = ctx.createGain();
      verb.gain.value = 0.5;
      verb.connect(conv);
      conv.connect(master);
      const music = ctx.createGain();
      music.gain.value = 0;
      music.connect(master);
      const floor = ctx.createGain();
      floor.gain.value = 0;
      floor.connect(master);
      const fx = ctx.createGain();
      fx.gain.value = 0.9;
      fx.connect(master);
      this.ctx = ctx;
      this.master = master;
      this.verb = verb;
      this.music = music;
      this.floor = floor;
      this.fx = fx;
      this.white = this.makeNoise(ctx, 3, false);
      this.brown = this.makeNoise(ctx, 5, true);
      if (ctx.state === "suspended") void ctx.resume();
      return ctx;
    } catch {
      return null;
    }
  }

  private impulse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch += 1) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  private makeNoise(ctx: AudioContext, seconds: number, brown: boolean): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i += 1) {
      const w = Math.random() * 2 - 1;
      if (brown) {
        last = (last + 0.02 * w) / 1.02;
        data[i] = last * 3.5;
      } else {
        data[i] = w;
      }
    }
    return buf;
  }

  private env(p: AudioParam, t: number, peak: number, attack: number, decay: number): void {
    p.setValueAtTime(0.0001, t);
    p.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
    p.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  private route(ctx: AudioContext, node: AudioNode, dest: AudioNode, pan?: number, send?: number): void {
    let out = node;
    if (pan !== undefined && typeof ctx.createStereoPanner === "function") {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      out.connect(p);
      out = p;
    }
    out.connect(dest);
    if (send && this.verb) {
      const s = ctx.createGain();
      s.gain.value = send;
      out.connect(s);
      s.connect(this.verb);
    }
  }

  private tone(dest: AudioNode, t: number, f: number, dur: number, peak: number, o: ToneOpts = {}): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const attack = o.attack ?? 0.005;
    const osc = ctx.createOscillator();
    osc.type = o.type ?? "sine";
    osc.frequency.setValueAtTime(f, t);
    if (o.glide) osc.frequency.exponentialRampToValueAtTime(o.glide, t + attack + dur);
    const g = ctx.createGain();
    this.env(g.gain, t, peak, attack, dur);
    let node: AudioNode = osc;
    if (o.lp) {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = o.lp;
      node.connect(lp);
      node = lp;
    }
    node.connect(g);
    this.route(ctx, g, dest, o.pan, o.send);
    osc.start(t);
    osc.stop(t + attack + dur + 0.05);
  }

  private noise(dest: AudioNode, t: number, dur: number, peak: number, type: BiquadFilterType, freq: number, o: NoiseOpts = {}): void {
    const ctx = this.ctx;
    const buf = this.white;
    if (!ctx || !buf) return;
    const attack = o.attack ?? 0.002;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    if (o.q !== undefined) f.Q.value = o.q;
    const g = ctx.createGain();
    this.env(g.gain, t, peak, attack, dur);
    src.connect(f);
    f.connect(g);
    this.route(ctx, g, dest, o.pan, o.send);
    src.start(t, Math.random() * Math.max(0, buf.duration - dur - 0.2));
    src.stop(t + attack + dur + 0.05);
  }

  private bell(d: AudioNode, t: number, f: number, peak: number, dur: number, pan?: number, send?: number): void {
    this.tone(d, t, f, dur, peak, { attack: 0.002, pan, send });
    this.tone(d, t, f * 2.76, dur * 0.45, peak * 0.3, { attack: 0.001, pan, send });
    this.tone(d, t, f * 5.4, dur * 0.2, peak * 0.1, { attack: 0.001, pan, send });
  }

  private coin(d: AudioNode, t: number, peak: number, pan?: number, send?: number): void {
    const f = rand(3200, 5400);
    this.tone(d, t, f, 0.09, peak, { attack: 0.001, pan, send });
    this.tone(d, t, f * 1.47, 0.06, peak * 0.5, { attack: 0.001, pan, send });
    this.tone(d, t + rand(0.04, 0.09), f * 0.94, 0.12, peak * 0.6, { attack: 0.001, pan, send });
    this.noise(d, t, 0.015, peak * 0.6, "highpass", 6000, { pan });
  }

  private bellRing(d: AudioNode, t: number, dur: number, peak: number, pan?: number, send?: number): void {
    for (let s = 0; s < dur; s += 0.045) {
      this.tone(d, t + s, 2093, 0.05, peak * rand(0.8, 1), { attack: 0.001, pan, send });
      this.tone(d, t + s, 2093 * 2.4, 0.03, peak * 0.3, { attack: 0.001, pan, send });
    }
  }

  private fxStart(): { t: number; d: AudioNode } | null {
    if (!this.sfxOn) return null;
    const ctx = this.ensure();
    if (!ctx || !this.fx) return null;
    return { t: ctx.currentTime + 0.01, d: this.fx };
  }

  click(): void {
    const s = this.fxStart();
    if (!s) return;
    this.noise(s.d, s.t, 0.012, 0.08, "bandpass", 3500, { q: 4 });
  }

  lever(): void {
    const s = this.fxStart();
    if (!s) return;
    for (let i = 0; i < 5; i += 1) this.noise(s.d, s.t + i * 0.034, 0.02, 0.13, "bandpass", 2400, { q: 4 });
    this.tone(s.d, s.t + 0.19, 140, 0.2, 0.5, { glide: 45 });
    this.noise(s.d, s.t + 0.19, 0.05, 0.2, "lowpass", 900);
  }

  spin(dur: number): void {
    const s = this.fxStart();
    if (!s) return;
    for (let x = 0; x < dur; x += 0.055) this.noise(s.d, s.t + x, 0.012, 0.05, "bandpass", rand(2800, 3400), { q: 5 });
    this.noise(s.d, s.t, dur, 0.035, "bandpass", 620, { q: 1.2, attack: 0.08 });
  }

  reelStop(i: number): void {
    const s = this.fxStart();
    if (!s) return;
    this.tone(s.d, s.t, 210 - i * 25, 0.1, 0.32, { glide: 70 });
    this.noise(s.d, s.t, 0.03, 0.18, "lowpass", 1800);
  }

  win(): void {
    const s = this.fxStart();
    if (!s) return;
    [72, 76, 79, 84, 88].forEach((m, i) => this.bell(s.d, s.t + i * 0.075, mtof(m), 0.14, 0.9, 0, 0.3));
    for (let i = 0; i < 16; i += 1) this.coin(s.d, s.t + 0.35 + i * 0.06 + rand(0, 0.03), 0.07, rand(-0.6, 0.6), 0.2);
    this.bellRing(s.d, s.t + 0.35, 0.9, 0.05, 0, 0.3);
  }

  jackpot(): void {
    const s = this.fxStart();
    if (!s) return;
    const stab = (t: number, dur: number, notes: number[], peak: number) => {
      for (const m of notes) this.tone(s.d, t, mtof(m), dur, peak, { type: "sawtooth", lp: 2400, attack: 0.02, send: 0.25 });
    };
    stab(s.t, 0.12, [60, 64, 67], 0.06);
    stab(s.t + 0.16, 0.12, [60, 64, 67], 0.06);
    stab(s.t + 0.32, 0.12, [62, 65, 69], 0.06);
    stab(s.t + 0.5, 1.8, [60, 64, 67, 72, 76], 0.055);
    [72, 76, 79, 84, 88, 91, 96].forEach((m, i) => this.bell(s.d, s.t + 0.5 + i * 0.06, mtof(m), 0.1, 1.1, 0, 0.3));
    for (let i = 0; i < 55; i += 1) this.coin(s.d, s.t + 0.55 + i * 0.055 + rand(0, 0.03), 0.06, rand(-0.8, 0.8), 0.2);
    this.bellRing(s.d, s.t + 0.55, 2.4, 0.05, 0, 0.3);
  }

  near(): void {
    const s = this.fxStart();
    if (!s) return;
    const o: ToneOpts = { type: "sawtooth", lp: 1100, attack: 0.02, send: 0.2 };
    this.tone(s.d, s.t, mtof(67), 0.26, 0.1, o);
    this.tone(s.d, s.t + 0.28, mtof(66), 0.26, 0.1, o);
    this.tone(s.d, s.t + 0.56, mtof(65), 0.85, 0.1, { ...o, glide: mtof(62) });
  }

  miss(): void {
    const s = this.fxStart();
    if (!s) return;
    this.tone(s.d, s.t, 200, 0.09, 0.08, { type: "triangle", glide: 140 });
  }

  batch(dur: number): void {
    const s = this.fxStart();
    if (!s) return;
    const n = 70;
    for (let i = 0; i < n; i += 1) {
      const x = dur * Math.pow(i / n, 0.8);
      this.noise(s.d, s.t + x, 0.01, 0.06, "bandpass", 2600 + i * 12, { q: 5 });
    }
    this.noise(s.d, s.t, dur, 0.04, "bandpass", 700, { q: 1.2, attack: 0.1 });
  }

  chips(): void {
    const s = this.fxStart();
    if (!s) return;
    for (let i = 0; i < 9; i += 1) this.noise(s.d, s.t + i * 0.035 + rand(0, 0.02), 0.035, 0.14, "bandpass", rand(2400, 3600), { q: 9 });
  }

  setVolume(v: number): void {
    this.volume = v;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  setMusic(on: boolean): void {
    if (!on && !this.ctx) return;
    const ctx = this.ensure();
    if (!ctx || !this.music) return;
    const g = this.music.gain;
    const now = ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(on ? 0.6 : 0, now + (on ? 0.8 : 0.5));
    if (on && this.musicTimer === null) {
      this.nextBeat = now + 0.12;
      this.beat = 0;
      this.musicTimer = setInterval(() => this.pump(), 40);
    }
    if (!on && this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private pump(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    if (this.nextBeat < ctx.currentTime - 0.05) this.nextBeat = ctx.currentTime + 0.05;
    while (this.nextBeat < ctx.currentTime + 0.25) {
      this.playBeat(this.beat, this.nextBeat);
      this.nextBeat += BEAT;
      this.beat += 1;
    }
  }

  private playBeat(b: number, t: number): void {
    const d = this.music;
    if (!d) return;
    const bar = Math.floor(b / 4);
    const pos = b % 4;
    const ch = PROG[bar % PROG.length];
    const nx = PROG[(bar + 1) % PROG.length];
    if (!ch || !nx) return;
    const sw = (BEAT * 2) / 3;

    const walk = [ch.root, ch.root + ch.third, ch.root + 7, nx.root + (bar % 2 === 0 ? 1 : -1)];
    const bn = pos === 2 && bar % 3 === 2 ? ch.root + 12 : walk[pos] ?? ch.root;
    this.tone(d, t, mtof(bn), BEAT * 0.95, 0.3, { type: "triangle", lp: 650, attack: 0.012 });
    this.tone(d, t, mtof(bn), BEAT * 0.9, 0.22, { attack: 0.012 });

    const ride = (tt: number, acc: number) => {
      this.noise(d, tt, 0.35, 0.035 * acc, "highpass", 7000, { q: 0.5, send: 0.1 });
      this.noise(d, tt, 0.1, 0.03 * acc, "bandpass", 5200, { q: 3 });
    };
    ride(t, pos % 2 === 1 ? 1.15 : 0.9);
    if (pos % 2 === 1) {
      ride(t + sw, 0.7);
      this.noise(d, t, 0.04, 0.05, "highpass", 9000);
    } else {
      this.tone(d, t, 72, 0.16, 0.12, { glide: 45 });
    }

    const pat = COMP[bar % COMP.length] ?? [];
    for (const [p, off] of pat) {
      if (p === pos) this.rhodes(d, t + (off ? sw : 0), ch.voicing, off ? 0.7 : 0.9);
    }

    if (bar % 16 !== 15) {
      const density = bar % 8 < 4 ? 0.5 : 0.3;
      if (Math.random() < density) this.vibe(d, t, ch);
      if (Math.random() < density * 0.7) this.vibe(d, t + sw, ch);
    }
  }

  private rhodes(d: AudioNode, t: number, notes: number[], vel: number): void {
    for (const m of notes) {
      const f = mtof(m);
      this.tone(d, t, f, 1.0, 0.04 * vel, { attack: 0.004, send: 0.15 });
      this.tone(d, t, f * 2, 0.35, 0.01 * vel, { attack: 0.002 });
      this.tone(d, t, f, 0.12, 0.012 * vel, { type: "triangle", attack: 0.002 });
    }
  }

  private vibe(d: AudioNode, t: number, ch: Chord): void {
    const pool = Array.from(new Set(ch.voicing.map((n) => n + 12).concat(ch.voicing.filter((n) => n >= 72)))).sort(
      (a, b) => a - b,
    );
    let idx = 0;
    let best = 999;
    pool.forEach((n, i) => {
      const dist = Math.abs(n - this.mel);
      if (dist < best) {
        best = dist;
        idx = i;
      }
    });
    const steps = [-2, -1, -1, 1, 1, 2];
    idx = Math.max(0, Math.min(pool.length - 1, idx + (steps[Math.floor(Math.random() * steps.length)] ?? 1)));
    const n = pool[idx] ?? 76;
    this.mel = n;
    this.tone(d, t, mtof(n), 1.3, 0.05, { attack: 0.003, send: 0.35 });
    this.tone(d, t, mtof(n) * 4, 0.18, 0.008, { attack: 0.001 });
  }

  setFloor(on: boolean): void {
    if (!on && !this.ctx) return;
    const ctx = this.ensure();
    if (!ctx || !this.floor || !this.brown) return;
    this.floorOn = on;
    const g = this.floor.gain;
    const now = ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(on ? 0.55 : 0, now + (on ? 1.2 : 0.5));
    if (on && this.floorNodes.length === 0) {
      const src = ctx.createBufferSource();
      src.buffer = this.brown;
      src.loop = true;
      const b1 = ctx.createBiquadFilter();
      b1.type = "bandpass";
      b1.frequency.value = 420;
      b1.Q.value = 0.8;
      const b2 = ctx.createBiquadFilter();
      b2.type = "bandpass";
      b2.frequency.value = 1100;
      b2.Q.value = 1.6;
      const g1 = ctx.createGain();
      g1.gain.value = 0.7;
      const g2 = ctx.createGain();
      g2.gain.value = 0.35;
      src.connect(b1);
      b1.connect(g1);
      g1.connect(this.floor);
      src.connect(b2);
      b2.connect(g2);
      g2.connect(this.floor);
      const l1 = ctx.createOscillator();
      l1.frequency.value = 0.11;
      const l1g = ctx.createGain();
      l1g.gain.value = 300;
      l1.connect(l1g);
      l1g.connect(b2.frequency);
      const l2 = ctx.createOscillator();
      l2.frequency.value = 0.27;
      const l2g = ctx.createGain();
      l2g.gain.value = 0.2;
      l2.connect(l2g);
      l2g.connect(g1.gain);
      src.start();
      l1.start();
      l2.start();
      this.floorNodes = [src, l1, l2];
      this.floorTick();
    }
    if (!on) {
      if (this.floorTimer !== null) {
        clearTimeout(this.floorTimer);
        this.floorTimer = null;
      }
      const nodes = this.floorNodes;
      this.floorNodes = [];
      setTimeout(() => {
        for (const n of nodes) {
          try {
            n.stop();
          } catch {
            /* already stopped */
          }
        }
      }, 700);
    }
  }

  private floorTick(): void {
    this.floorTimer = setTimeout(() => {
      this.floorEvent();
      if (this.floorOn) this.floorTick();
    }, rand(600, 2400));
  }

  private floorEvent(): void {
    const ctx = this.ctx;
    const d = this.floor;
    if (!ctx || !d) return;
    const t = ctx.currentTime + 0.02;
    const pan = rand(-0.8, 0.8);
    const r = Math.random();
    if (r < 0.5) {
      const scale = [79, 81, 84, 86, 88, 91, 93, 96];
      let i = Math.floor(Math.random() * scale.length);
      const n = 4 + Math.floor(Math.random() * 6);
      for (let k = 0; k < n; k += 1) {
        this.tone(d, t + k * 0.075, mtof(scale[i] ?? 84), 0.07, 0.014, { type: "square", lp: 3200, pan, send: 0.55 });
        i = Math.max(0, Math.min(scale.length - 1, i + Math.floor(Math.random() * 5) - 2));
      }
    } else if (r < 0.75) {
      const n = 3 + Math.floor(Math.random() * 6);
      for (let k = 0; k < n; k += 1) this.coin(d, t + k * 0.07 + rand(0, 0.04), 0.02, pan, 0.5);
    } else if (r < 0.87) {
      this.bellRing(d, t, rand(0.9, 1.7), 0.012, pan, 0.6);
    } else {
      for (let k = 0; k < 6; k += 1) this.noise(d, t + k * 0.04 + rand(0, 0.02), 0.035, 0.05, "bandpass", rand(2400, 3600), { q: 9, pan });
    }
  }

  shutdown(): void {
    this.setMusic(false);
    this.setFloor(false);
  }
}

const audio = new CasinoAudio();

/* ---------------------------------------------------------------- game model */

type Result = "offer" | "interview" | "rejected" | "ghosted";

const P_OFFER = 0.004;
const P_INTERVIEW = 0.04;
const P_REJECTED = 0.3;
const NEAR_MISS = 0.12;

const BRIEFCASE = 0;
const PHONE = 1;
const CROSS = 2;
const GHOST = 3;
const ENVELOPE = 4;
const SYMBOLS = 5;
const IDLE_REELS: Reels = [BRIEFCASE, PHONE, ENVELOPE];
const STRIP = [0, 1, 2, 3, 4, 0, 1, 2, 3, 4];

type Batch = { n: number; offers: number; interviews: number; nothing: number };

type Stats = {
  apps: number;
  nothing: number;
  interviews: number;
  offers: number;
  sinceOffer: number;
  last: Result | null;
  near: boolean;
  batch: Batch | null;
  reels: Reels;
};

function freshStats(): Stats {
  return { apps: 0, nothing: 0, interviews: 0, offers: 0, sinceOffer: 0, last: null, near: false, batch: null, reels: IDLE_REELS };
}

const randInt = (n: number): number => Math.floor(Math.random() * n);

function roll(): Result {
  const r = Math.random();
  if (r < P_OFFER) return "offer";
  if (r < P_OFFER + P_INTERVIEW) return "interview";
  if (r < P_OFFER + P_INTERVIEW + P_REJECTED) return "rejected";
  return "ghosted";
}

function reelsFor(result: Result, near: boolean): Reels {
  if (result === "offer") return [BRIEFCASE, BRIEFCASE, BRIEFCASE];
  if (result === "interview") return [PHONE, PHONE, PHONE];
  if (result === "rejected") return [CROSS, CROSS, CROSS];
  if (near) return [BRIEFCASE, BRIEFCASE, 1 + randInt(SYMBOLS - 1)];
  const a = randInt(SYMBOLS);
  const b = (a + 1 + randInt(SYMBOLS - 1)) % SYMBOLS;
  return [a, b, randInt(SYMBOLS)];
}

function record(s: Stats, result: Result): Stats {
  const offer = result === "offer";
  return {
    ...s,
    apps: s.apps + 1,
    nothing: s.nothing + (result === "rejected" || result === "ghosted" ? 1 : 0),
    interviews: s.interviews + (result === "interview" ? 1 : 0),
    offers: s.offers + (offer ? 1 : 0),
    sinceOffer: offer ? 0 : s.sinceOffer + 1,
  };
}

const atLeastOne = (p: number, n: number): number => 1 - Math.pow(1 - p, n);

function pick(list: string[], i: number): string {
  return list[i % list.length] ?? "";
}

function cssVars(v: Record<string, string>): CSSProperties {
  return v as unknown as CSSProperties;
}

/* ---------------------------------------------------------------- pieces */

function Sym({ id, size = 50 }: { id: number; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 48 48", "aria-hidden": true } as const;
  if (id === BRIEFCASE) {
    return (
      <svg {...common}>
        <path d="M17 13 V9 a3 3 0 0 1 3 -3 h8 a3 3 0 0 1 3 3 V13" fill="none" stroke={C.goldDim} strokeWidth="3.5" />
        <rect x="4" y="13" width="40" height="28" rx="5" fill={C.gold} stroke={C.goldDim} strokeWidth="2" />
        <rect x="4" y="22" width="40" height="3" fill={C.goldDim} />
        <rect x="20" y="20" width="8" height="8" rx="1.5" fill="#7a5a1c" />
        <path d="M9 17 h10" stroke="#fff3c4" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === PHONE) {
    return (
      <svg {...common}>
        <path d="M33 8 a12 12 0 0 1 7 7 M33 2 a18 18 0 0 1 13 13" fill="none" stroke="#2fa56a" strokeWidth="2.5" strokeLinecap="round" />
        <path
          d="M10 6 l7 0 l3 9 l-4.5 3 a24 24 0 0 0 14.5 14.5 l3 -4.5 l9 3 l0 7 a4 4 0 0 1 -4 4 C 20 42, 6 28, 6 10 a4 4 0 0 1 4 -4 Z"
          fill="#2fbf72"
          stroke="#1b7a47"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (id === CROSS) {
    return (
      <svg {...common}>
        <circle cx="24" cy="24" r="19" fill="none" stroke={C.red} strokeWidth="4" />
        <path d="M16 16 L32 32 M32 16 L16 32" stroke={C.red} strokeWidth="5.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === GHOST) {
    return (
      <svg {...common}>
        <path
          d="M10 42 V22 a14 14 0 0 1 28 0 V42 l-4.7 -4 l-4.6 4 l-4.7 -4 l-4.7 4 l-4.6 -4 Z"
          fill="#eef0f6"
          stroke="#8f95a6"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <ellipse cx="19" cy="22" rx="2.8" ry="3.8" fill="#2a2d38" />
        <ellipse cx="29" cy="22" rx="2.8" ry="3.8" fill="#2a2d38" />
        <ellipse cx="24" cy="31" rx="3" ry="2" fill="#2a2d38" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="5" y="11" width="38" height="27" rx="4" fill="#5aa9e6" stroke="#2b6ea3" strokeWidth="2" />
      <path d="M6 13 L24 27 L42 13" fill="none" stroke="#2b6ea3" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

function Reel({ symbol, spinning, win, speed }: { symbol: number; spinning: boolean; win: boolean; speed: number }) {
  return (
    <div
      style={{
        width: 78,
        height: CELL,
        overflow: "hidden",
        background: C.reel,
        borderRadius: 8,
        position: "relative",
        border: `2px solid ${win ? C.gold : "#3a2a2e"}`,
        transition: "border-color .2s ease",
      }}
    >
      {spinning ? (
        <div className="wcis-strip" style={{ animationDuration: `${speed}s` }}>
          {STRIP.map((s, i) => (
            <div key={i} style={{ height: CELL, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sym id={s} />
            </div>
          ))}
        </div>
      ) : (
        <div className="wcis-land" style={{ height: CELL, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sym id={symbol} />
        </div>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 12, background: "rgba(40,20,20,0.14)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 12, background: "rgba(40,20,20,0.14)" }} />
    </div>
  );
}

function Bulbs({ n, color, lit, fast }: { n: number; color: string; lit: boolean; fast: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          className={lit ? (fast ? "wcis-bulb wcis-bulb-fast" : "wcis-bulb") : undefined}
          style={{
            display: "inline-block",
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: lit ? color : "#454a52",
            animationDelay: lit ? `${(i % 2) * (fast ? 0.1 : 0.45)}s` : undefined,
          }}
        />
      ))}
    </div>
  );
}

function Lever({ down, onPull, disabled }: { down: boolean; onPull: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      className="wcis-lever"
      aria-label="Pull the lever to apply"
      title="Pull to apply"
      onClick={onPull}
      disabled={disabled}
      style={{
        position: "relative",
        width: 44,
        height: 196,
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: disabled ? "default" : "pointer",
        alignSelf: "center",
        flex: "0 0 44px",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 19,
          width: 6,
          bottom: 34,
          height: down ? 24 : 140,
          background: "#bcc1c8",
          borderRadius: 3,
          transition: "height .18s cubic-bezier(.3,.7,.4,1)",
        }}
      />
      <div
        className="wcis-knob"
        style={{
          position: "absolute",
          left: 7,
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: C.red,
          border: `2px solid ${C.ink}`,
          bottom: down ? 44 : 160,
        }}
      >
        <div style={{ position: "absolute", left: 6, top: 5, width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.55)" }} />
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 6, width: 32, height: 40, borderRadius: 8, background: "#3b3f46", border: `2px solid ${C.ink}` }} />
    </button>
  );
}

function CoinBurst({ n }: { n: number }) {
  const coins = useMemo(
    () =>
      Array.from({ length: n }, () => ({
        left: rand(4, 94),
        dx: rand(-60, 60),
        fall: rand(280, 460),
        delay: rand(0, 0.55),
        dur: rand(0.9, 1.5),
        size: rand(16, 26),
      })),
    [n],
  );
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", perspective: 400 }}>
      {coins.map((c, i) => (
        <span
          key={i}
          className="wcis-coin"
          style={{
            left: `${c.left}%`,
            width: c.size,
            height: c.size,
            ...cssVars({ "--dx": `${c.dx}px`, "--fall": `${c.fall}px`, "--delay": `${c.delay}s`, "--dur": `${c.dur}s` }),
          }}
        />
      ))}
    </div>
  );
}

function LedStat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: C.ledBg, border: "1px solid #3a2410", borderRadius: 10, padding: "9px 12px 8px" }}>
      <div style={{ fontFamily: MONO, fontSize: 24, lineHeight: "28px", color: color ?? C.led, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: C.creamDim, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Paytable() {
  const rows: Array<{ syms: number[] | null; label: string; odds: string; color: string }> = [
    { syms: [BRIEFCASE, BRIEFCASE, BRIEFCASE], label: "Offer", odds: "1 in 250", color: C.gold },
    { syms: [PHONE, PHONE, PHONE], label: "Interview", odds: "1 in 25", color: C.green },
    { syms: [CROSS, CROSS, CROSS], label: "Rejected", odds: "1 in 3", color: "#ff8a9a" },
    { syms: null, label: "Ghosted", odds: "the rest", color: C.creamDim },
  ];
  return (
    <div style={{ background: C.ink, border: `2px solid ${C.goldDim}`, borderRadius: 14, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 10.5, letterSpacing: ".2em", textTransform: "uppercase", color: C.gold, fontWeight: 800, textAlign: "center" }}>Paytable</div>
      {rows.map((r) => (
        <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 2, width: 72, justifyContent: "center", background: C.reel, borderRadius: 6, padding: "2px 0" }}>
            {r.syms ? (
              r.syms.map((s, i) => <Sym key={i} id={s} size={22} />)
            ) : (
              <span style={{ fontSize: 10.5, color: "#5a4a40", lineHeight: "22px", fontWeight: 700 }}>ANY OTHER</span>
            )}
          </div>
          <span style={{ fontWeight: 800, fontSize: 13.5, color: r.color, flex: 1 }}>{r.label}</span>
          <span style={{ fontFamily: MONO, fontSize: 12, color: C.creamDim }}>{r.odds}</span>
        </div>
      ))}
    </div>
  );
}

const MESSAGES: Record<Result, string[]> = {
  offer: ["Offer! We'd like to move forward."],
  interview: ["Interview! ...then ghosted.", "Interview! ...then rejected.", "Final round! ...then silence."],
  rejected: ["Rejected.", "Moving forward with other candidates.", "Position filled.", "We'll keep your resume on file."],
  ghosted: ["No reply.", "Ghosted.", "Still nothing.", "Seen. No reply."],
};

function Machine({
  stats,
  setStats,
  resetToken,
  onOffer,
}: {
  stats: Stats;
  setStats: (update: (s: Stats) => Stats) => void;
  resetToken: number;
  onOffer: (tries: number) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [batching, setBatching] = useState(0);
  const [reelSpin, setReelSpin] = useState<Flags>([false, false, false]);
  const [display, setDisplay] = useState<Reels>(stats.reels);
  const [flash, setFlash] = useState(false);
  const [lever, setLever] = useState(false);
  const [burst, setBurst] = useState<{ id: number; n: number } | null>(null);
  const [floatText, setFloatText] = useState<{ id: number; text: string } | null>(null);
  const [shake, setShake] = useState(false);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };
  const clearTimers = () => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
  };

  useEffect(() => () => clearTimers(), []);
  useEffect(() => {
    if (resetToken === 0) return;
    clearTimers();
    setBusy(false);
    setBatching(0);
    setReelSpin([false, false, false]);
    setDisplay(IDLE_REELS);
    setFlash(false);
    setLever(false);
    setBurst(null);
    setFloatText(null);
    setShake(false);
  }, [resetToken]);

  const pullLever = () => {
    setLever(true);
    later(() => setLever(false), 300);
    audio.lever();
  };

  const celebrate = (best: Result, near: boolean, tries: number) => {
    if (best === "offer") {
      audio.jackpot();
      setFloatText({ id: Date.now(), text: "OFFER!" });
      setBurst({ id: Date.now(), n: 40 });
      setFlash(true);
      later(() => setFlash(false), 1800);
      later(() => onOffer(tries), 650);
    } else if (best === "interview") {
      audio.win();
      setFloatText({ id: Date.now(), text: "Interview!" });
      setBurst({ id: Date.now(), n: 14 });
      setFlash(true);
      later(() => setFlash(false), 1400);
    } else if (near) {
      audio.near();
      setShake(true);
      later(() => setShake(false), 500);
    } else {
      audio.miss();
    }
  };

  const apply = () => {
    if (busy) return;
    const result = roll();
    const near = result === "ghosted" && Math.random() < NEAR_MISS;
    const finalReels = reelsFor(result, near);
    const tries = stats.sinceOffer + 1;
    setBusy(true);
    setFlash(false);
    setFloatText(null);
    pullLever();
    const stops: [number, number, number] = [560, 800, near ? 1500 : 1040];
    later(() => {
      setReelSpin([true, true, true]);
      audio.spin(stops[2] / 1000 - 0.2);
    }, 160);
    ([0, 1, 2] as const).forEach((i) =>
      later(() => {
        setReelSpin((prev) => {
          const next: Flags = [prev[0], prev[1], prev[2]];
          next[i] = false;
          return next;
        });
        setDisplay((prev) => {
          const next: Reels = [prev[0], prev[1], prev[2]];
          next[i] = finalReels[i];
          return next;
        });
        audio.reelStop(i);
      }, stops[i]),
    );
    later(() => {
      setStats((s) => ({ ...record(s, result), last: result, near, batch: null, reels: finalReels }));
      setBusy(false);
      celebrate(result, near, tries);
    }, stops[2] + 80);
  };

  const applyMany = (n: number) => {
    if (busy) return;
    let cur = stats;
    let offers = 0;
    let interviews = 0;
    let triesAtOffer = 0;
    for (let i = 0; i < n; i += 1) {
      const r = roll();
      if (r === "offer" && offers === 0) triesAtOffer = cur.sinceOffer + 1;
      if (r === "offer") offers += 1;
      if (r === "interview") interviews += 1;
      cur = record(cur, r);
    }
    const best: Result = offers > 0 ? "offer" : interviews > 0 ? "interview" : "rejected";
    const finalReels = reelsFor(best, false);
    const next: Stats = { ...cur, last: best, near: false, batch: { n, offers, interviews, nothing: n - offers - interviews }, reels: finalReels };
    const dur = n >= 100 ? 1750 : 1200;
    setBusy(true);
    setBatching(n);
    setFlash(false);
    setFloatText(null);
    pullLever();
    later(() => {
      setReelSpin([true, true, true]);
      audio.batch(dur / 1000 - 0.25);
    }, 160);
    later(() => {
      setStats(() => next);
      setDisplay(finalReels);
      setReelSpin([false, false, false]);
      setBusy(false);
      setBatching(0);
      audio.reelStop(2);
      celebrate(best, false, triesAtOffer);
    }, dur);
  };

  let msg = "Pull the lever to send an application";
  let msgColor = C.ledDim;
  if (busy) {
    msg = batching > 0 ? `Sending ${batching} applications...` : "Waiting for a reply...";
    msgColor = C.led;
  } else if (stats.batch !== null) {
    const b = stats.batch;
    msg = `${b.n} sent: ${b.offers} offer${b.offers === 1 ? "" : "s"}, ${b.interviews} interview${b.interviews === 1 ? "" : "s"}, ${b.nothing} nothing`;
    msgColor = b.offers > 0 ? C.gold : b.interviews > 0 ? C.green : C.led;
  } else if (stats.last !== null) {
    msg = stats.near ? "So close... no reply." : pick(MESSAGES[stats.last], stats.apps);
    msgColor = stats.last === "offer" ? C.gold : stats.last === "interview" ? C.green : stats.near ? "#ff9a6b" : C.led;
  }

  return (
    <div
      className={shake ? "wcis-shake" : undefined}
      style={{ position: "relative", background: "#6a1222", border: `3px solid ${C.gold}`, borderRadius: 24, padding: "14px 18px 20px", overflow: "hidden" }}
    >
      <Bulbs n={24} color={C.gold} lit fast={flash} />

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-start", marginTop: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: "1 1 300px", minWidth: 0 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ position: "relative", background: C.ink, border: `2px solid ${C.gold}`, borderRadius: 16, padding: 12, display: "flex", gap: 8 }}>
              <Reel symbol={display[0]} spinning={reelSpin[0]} win={flash} speed={0.28} />
              <Reel symbol={display[1]} spinning={reelSpin[1]} win={flash} speed={0.24} />
              <Reel symbol={display[2]} spinning={reelSpin[2]} win={flash} speed={0.21} />
              <div
                className={flash ? "wcis-blink" : undefined}
                style={{ position: "absolute", left: 4, right: 4, top: "50%", height: 2, background: C.red, opacity: flash ? 1 : 0.4, pointerEvents: "none" }}
              />
              {floatText && (
                <div
                  key={floatText.id}
                  className="wcis-float"
                  style={{ position: "absolute", left: 0, right: 0, top: 22, textAlign: "center", fontFamily: SERIF, fontWeight: 900, fontSize: 38, color: C.gold, textShadow: `0 2px 0 ${C.ink}` }}
                >
                  {floatText.text}
                </div>
              )}
            </div>
            <Lever down={lever} onPull={apply} disabled={busy} />
          </div>

          <div
            style={{
              background: C.ledBg,
              border: "1px solid #3a2410",
              borderRadius: 8,
              padding: "8px 12px",
              fontFamily: MONO,
              fontSize: 13,
              letterSpacing: ".04em",
              textTransform: "uppercase",
              color: msgColor,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {msg}
            <span className="wcis-cursor">▌</span>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="wcis-btn wcis-red" onClick={apply} disabled={busy}>
              Apply
            </button>
            <button type="button" className="wcis-btn wcis-gold" onClick={() => applyMany(10)} disabled={busy}>
              Apply ×10
            </button>
            <button type="button" className="wcis-btn wcis-gold" onClick={() => applyMany(100)} disabled={busy}>
              Apply ×100
            </button>
          </div>
        </div>

        <div style={{ flex: "1 1 240px", minWidth: 0 }}>
          <Paytable />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginTop: 16 }}>
        <LedStat label="Applications" value={stats.apps} />
        <LedStat label="Ghosted / rejected" value={stats.nothing} color={stats.nothing > 0 ? "#ff7b7b" : undefined} />
        <LedStat label="Interviews" value={stats.interviews} color={stats.interviews > 0 ? C.green : undefined} />
        <LedStat label="Offers" value={stats.offers} color={stats.offers > 0 ? C.gold : undefined} />
      </div>

      {burst && <CoinBurst key={burst.id} n={burst.n} />}
    </div>
  );
}

/* ---------------------------------------------------------------- page sections */

function Heading({ children }: { children: Kids }) {
  return <h2 style={{ margin: 0, fontFamily: SERIF, fontSize: 30, lineHeight: 1.15, fontWeight: 800, color: C.cream, textAlign: "center" }}>{children}</h2>;
}

type PopIcon = "titanic" | "zombie" | "you" | "squid" | "gorilla" | "strange";

function IconTitanic() {
  const font = "'Trajan Pro', 'Cinzel', Optima, 'Times New Roman', Georgia, serif";
  return (
    <svg width="96" height="64" viewBox="0 0 96 64" aria-hidden="true">
      <defs>
        <linearGradient id="wcis-ti-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#efe1cc" />
          <stop offset=".5" stopColor="#b8c5d2" />
          <stop offset="1" stopColor="#5d7690" />
        </linearGradient>
        <linearGradient id="wcis-ti-gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9c6b22" />
          <stop offset=".5" stopColor="#fff0bf" />
          <stop offset="1" stopColor="#9c6b22" />
        </linearGradient>
        <linearGradient id="wcis-ti-left" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#141b27" />
          <stop offset="1" stopColor="#2a374b" />
        </linearGradient>
        <linearGradient id="wcis-ti-right" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#56657c" />
          <stop offset="1" stopColor="#a9b6c7" />
        </linearGradient>
        <clipPath id="wcis-ti-text">
          <text x="48" y="44.5" textAnchor="middle" fontSize="14" fontWeight={700} letterSpacing="2.4" fontFamily={font}>
            TITANIC
          </text>
        </clipPath>
      </defs>
      <rect width="96" height="64" fill="url(#wcis-ti-sky)" />
      <ellipse cx="48" cy="2" rx="40" ry="12" fill="#f6c9a4" opacity=".55" />
      <polygon points="48,9 48,64 2,64" fill="url(#wcis-ti-left)" />
      <polygon points="48,9 94,64 48,64" fill="url(#wcis-ti-right)" />
      <path d="M48 9 L2 64 M48 9 L94 64" stroke="#e8edf3" strokeWidth=".9" />
      <path d="M48 5 L0 56 M48 5 L96 56" stroke="#1d2430" strokeWidth=".6" />
      <path d="M48 5 V9" stroke="#1d2430" strokeWidth=".8" />
      {[10, 18, 26, 34, 40].map((d) => (
        <g key={d} stroke="#1d2430" strokeWidth=".45">
          <line x1={48 - d} y1={5 + d * 1.06} x2={48 - d} y2={9 + d * 1.2} />
          <line x1={48 + d} y1={5 + d * 1.06} x2={48 + d} y2={9 + d * 1.2} />
        </g>
      ))}
      <path d="M48 9 V64" stroke="#0c1119" strokeWidth=".8" />
      <rect x="0" y="31.5" width="96" height="16.5" fill="#0d1420" opacity=".6" />
      <path d="M9 31.5 H87 M9 48 H87" stroke="url(#wcis-ti-gold)" strokeWidth=".9" />
      <text x="48" y="44.5" textAnchor="middle" fontSize="14" fontWeight={700} letterSpacing="2.4" fill="url(#wcis-ti-gold)" stroke="#3b2a0e" strokeWidth=".3" fontFamily={font}>
        TITANIC
      </text>
      <g clipPath="url(#wcis-ti-text)">
        <rect className="wcis-shine" x="-20" y="28" width="10" height="22" fill="#fff" opacity=".85" transform="skewX(-20)" />
      </g>
      <ellipse cx="48" cy="63" rx="30" ry="3.5" fill="#fff" opacity=".35" />
    </svg>
  );
}

function IconZombie() {
  return (
    <svg width="96" height="64" viewBox="0 0 96 64" aria-hidden="true">
      <rect width="96" height="64" fill="#f4f1ea" />
      <g className="wcis-slap" fill="#9b1118">
        <g transform="rotate(-14 30 26)">
          <ellipse cx="30" cy="30" rx="9" ry="10" />
          <rect x="20" y="9" width="4.5" height="15" rx="2.2" />
          <rect x="25.5" y="5" width="4.5" height="17" rx="2.2" />
          <rect x="31" y="6" width="4.5" height="16" rx="2.2" />
          <rect x="36.5" y="10" width="4" height="13" rx="2" />
          <rect x="37" y="28" width="9" height="4.5" rx="2.2" transform="rotate(-35 41 30)" />
          <rect x="28" y="38" width="2" height="9" rx="1" />
          <rect x="33" y="37" width="1.6" height="6" rx=".8" />
          <circle cx="44" cy="12" r="1.3" />
          <circle cx="16" cy="20" r="1" />
        </g>
      </g>
      <text x="9" y="33.5" fontSize="6.5" fontWeight={900} fill="#111" fontFamily="Impact, 'Arial Narrow', 'Helvetica Neue', sans-serif">
        THE
      </text>
      <text x="48" y="47" textAnchor="middle" fontSize="15" fontWeight={900} fill="#111" letterSpacing="-.3" fontFamily="Impact, 'Arial Narrow', 'Helvetica Neue', sans-serif">
        WALKING
      </text>
      <text x="48" y="60" textAnchor="middle" fontSize="13" fontWeight={900} fill="#111" letterSpacing=".5" fontFamily="Impact, 'Arial Narrow', 'Helvetica Neue', sans-serif">
        DEAD
      </text>
    </svg>
  );
}

function IconSquid() {
  const font = "Futura, 'Century Gothic', 'Avenir Next', 'Trebuchet MS', sans-serif";
  const letter = (ch: string, x: number, y: number) => (
    <text key={`${ch}${x}${y}`} x={x} y={y} textAnchor="middle" fontSize="18" fontWeight={500} fill="#111" fontFamily={font}>
      {ch}
    </text>
  );
  return (
    <svg width="96" height="64" viewBox="0 0 96 64" aria-hidden="true">
      <rect width="96" height="64" fill="#fff" />
      <rect x="29" y="2.5" width="2.6" height="9" fill="#b1060f" />
      <rect x="34" y="2.5" width="2.6" height="9" fill="#b1060f" />
      <path d="M29 2.5 H31.6 L36.6 11.5 H34 Z" fill="#e50914" />
      <text x="39" y="11" fontSize="9" fontWeight={900} fill="#e50914" letterSpacing=".4" fontFamily="Impact, 'Arial Narrow', 'Bebas Neue', sans-serif">
        NETFLIX
      </text>
      <g transform="translate(12 15) scale(.75)">
        <g className="wcis-glowpink">
          <circle cx="31" cy="20" r="6.5" fill="#ef1f78" />
          <path d="M43 38 L50 51 H36 Z" fill="#ef1f78" />
          <rect x="70" y="38" width="13" height="13" fill="#ef1f78" />
        </g>
        <path d="M-16 26.5 H8" stroke="#111" strokeWidth="2" />
        {letter("S", 15, 27)}
        <circle cx="31" cy="20" r="6.5" fill="none" stroke="#111" strokeWidth="2" />
        <path d="M31 20 L39 35" stroke="#111" strokeWidth="2" />
        {letter("U", 47, 27)}
        {letter("I", 59, 27)}
        <path d="M59 4 V14" stroke="#111" strokeWidth="2" />
        {letter("D", 72, 27)}
        {letter("G", 23, 51)}
        <path d="M43 38 L50 51 H36 Z" fill="none" stroke="#111" strokeWidth="2" strokeLinejoin="round" />
        {letter("M", 60, 51)}
        <path d="M83 38 H70 V51 H83" fill="none" stroke="#111" strokeWidth="2" />
        <path d="M76 44.5 H110" stroke="#111" strokeWidth="2" />
      </g>
    </svg>
  );
}

function IconGorilla() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" fill="#2f6b3c" />
      <path d="M0 58 Q20 52 32 56 T64 54 V64 H0 Z" fill="#24502e" />
      <g className="wcis-huff">
        <ellipse cx="32" cy="46" rx="19" ry="15" fill="#4a4a55" />
        <ellipse cx="32" cy="45" rx="10" ry="9" fill="#7a7a86" />
        <circle cx="32" cy="22" r="11" fill="#4a4a55" />
        <rect x="23" y="16" width="18" height="4" rx="2" fill="#383842" />
        <ellipse cx="32" cy="25" rx="7.5" ry="6" fill="#857469" />
        <circle cx="28.5" cy="20.5" r="1.6" fill="#fff" />
        <circle cx="35.5" cy="20.5" r="1.6" fill="#fff" />
        <circle cx="28.5" cy="20.8" r=".8" fill="#000" />
        <circle cx="35.5" cy="20.8" r=".8" fill="#000" />
        <ellipse cx="30" cy="25" rx="1.2" ry=".9" fill="#3a2e28" />
        <ellipse cx="34" cy="25" rx="1.2" ry=".9" fill="#3a2e28" />
        <path d="M28.5 28.5 Q32 30.5 35.5 28.5" stroke="#3a2e28" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      </g>
      <circle className="wcis-pound-l" cx="15" cy="43" r="6.5" fill="#383842" />
      <circle className="wcis-pound-r" cx="49" cy="43" r="6.5" fill="#383842" />
    </svg>
  );
}

function IconStrange() {
  const font = "Copperplate, 'Copperplate Gothic Bold', Papyrus, 'Trajan Pro', Georgia, serif";
  return (
    <svg width="96" height="64" viewBox="0 0 96 64" aria-hidden="true">
      <rect width="96" height="64" fill="#050505" />
      <g className="wcis-spin-cw" opacity=".35">
        <circle cx="48" cy="38" r="25" fill="none" stroke="#ff9a2e" strokeWidth="1.5" strokeDasharray="6 3 2 3" />
      </g>
      <rect x="35" y="4" width="26" height="9" fill="#ec1d24" />
      <rect x="35.6" y="4.6" width="24.8" height="7.8" fill="none" stroke="#fff" strokeWidth=".5" />
      <text x="48" y="11.2" textAnchor="middle" fontSize="7" fontWeight={900} fill="#fff" letterSpacing="-.2" fontFamily="Impact, 'Arial Narrow', sans-serif">
        MARVEL
      </text>
      <text x="48" y="30" textAnchor="middle" fontSize="13" fontWeight={700} fill="#0b0805" stroke="#d3a35c" strokeWidth=".8" letterSpacing="1.5" fontFamily={font}>
        DOCTOR
      </text>
      <text x="48" y="53" textAnchor="middle" fontSize="16.5" fontWeight={700} fill="#0b0805" stroke="#d3a35c" strokeWidth="1" letterSpacing=".5" fontFamily={font}>
        STRANGE
      </text>
    </svg>
  );
}

function PopIconView({ icon }: { icon: PopIcon }) {
  const wide = icon === "titanic" || icon === "zombie" || icon === "squid" || icon === "strange";
  const inner =
    icon === "titanic" ? (
      <IconTitanic />
    ) : icon === "zombie" ? (
      <IconZombie />
    ) : icon === "squid" ? (
      <IconSquid />
    ) : icon === "gorilla" ? (
      <IconGorilla />
    ) : icon === "strange" ? (
      <IconStrange />
    ) : (
      <div style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", background: C.reel }}>
        <div className="wcis-glint" style={{ display: "flex" }}>
          <Sym id={BRIEFCASE} size={46} />
        </div>
      </div>
    );
  const w = wide ? 96 : 64;
  return <div style={{ width: w, height: 64, borderRadius: 12, overflow: "hidden", flex: `0 0 ${w}px`, border: "1px solid #3a2e36" }}>{inner}</div>;
}

function PopOdds() {
  const rows: Array<{ icons: PopIcon[]; odds: string; title: string; quote: string; tag: string; color: string; you?: boolean }> = [
    { icons: ["titanic"], odds: "1 in 3", title: "Surviving the Titanic", quote: "“There was room on that door.”", tag: "80× your odds", color: "#5aa9e6" },
    { icons: ["zombie"], odds: "1 in 50", title: "Surviving a zombie outbreak", quote: "“Rule #1: Cardio.”", tag: "5× your odds", color: "#7cc066" },
    { icons: ["you"], odds: "1 in 250", title: "Getting an internship offer", quote: "One application.", tag: "You are here", color: C.red, you: true },
    { icons: ["squid"], odds: "1 in 456", title: "Winning Squid Game", quote: "456 players. One survivor.", tag: "Barely worse", color: "#ff2e7e" },
    { icons: ["gorilla"], odds: "1 in 1,000", title: "Beating a gorilla in a fight", quote: "Not even with 99 friends.", tag: "4× harder", color: "#a3abb5" },
    { icons: ["strange"], odds: "1 in 14,000,605", title: "Doctor Strange's winning future", quote: "“We win in one.”", tag: "Okay, you win this one", color: "#ff9a2e" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((r, i) => (
        <div
          key={r.title}
          className={r.you ? "wcis-in wcis-you" : "wcis-in"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            background: r.you ? "#3a0f1a" : "#130e15",
            border: `${r.you ? 2 : 1}px solid ${r.you ? C.red : C.line}`,
            borderLeft: `6px solid ${r.color}`,
            borderRadius: 14,
            padding: "12px 16px",
            animationDelay: `${i * 0.08}s`,
          }}
        >
          <div style={{ display: "flex", gap: 6, width: 96, justifyContent: "center" }}>
            {r.icons.map((ic) => (
              <PopIconView key={ic} icon={ic} />
            ))}
          </div>
          <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: r.odds.length > 11 ? 16 : 21, color: r.color, minWidth: 130, fontVariantNumeric: "tabular-nums" }}>{r.odds}</div>
          <div style={{ flex: "1 1 180px", minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: C.cream }}>{r.title}</div>
            <div style={{ fontSize: 13.5, color: C.creamDim, fontStyle: "italic", marginTop: 2 }}>{r.quote}</div>
          </div>
          <span
            style={{
              fontSize: 10.5,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              fontWeight: 800,
              padding: "5px 11px",
              borderRadius: 999,
              color: r.you ? C.cream : r.color,
              background: r.you ? C.red : "transparent",
              border: `1px solid ${r.color}`,
              whiteSpace: "nowrap",
            }}
          >
            {r.tag}
          </span>
        </div>
      ))}
      <div style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 4 }}>Movie and meme odds are just for fun.</div>
    </div>
  );
}

function IconInstagram() {
  return (
    <svg width={34} height={34} viewBox="0 0 64 64" aria-label="Instagram">
      <defs>
        <radialGradient id="wcis-ig" cx="0.3" cy="1.07" r="1.25">
          <stop offset="0" stopColor="#fdd56b" />
          <stop offset="0.12" stopColor="#fdbf4c" />
          <stop offset="0.35" stopColor="#f2593a" />
          <stop offset="0.6" stopColor="#d6246e" />
          <stop offset="0.85" stopColor="#9b2fb0" />
          <stop offset="1" stopColor="#5b4fd0" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#wcis-ig)" />
      <rect x="13" y="13" width="38" height="38" rx="11" fill="none" stroke="#fff" strokeWidth="4.5" />
      <circle cx="32" cy="32" r="9" fill="none" stroke="#fff" strokeWidth="4.5" />
      <circle cx="43.5" cy="20.5" r="2.8" fill="#fff" />
    </svg>
  );
}

function IconLinkedIn() {
  return (
    <svg width={34} height={34} viewBox="0 0 64 64" aria-label="LinkedIn">
      <rect x="2" y="2" width="60" height="60" rx="12" fill="#2867b2" />
      <circle cx="17" cy="16.5" r="5" fill="#fff" />
      <rect x="12.5" y="25" width="9" height="27" rx="0.8" fill="#fff" />
      <path
        d="M27 25h8.6v3.8c1.7-2.7 4.6-4.4 8.4-4.4 6.3 0 8.9 4 8.9 10.8V52h-9V37.4c0-3.4-1-5.6-4-5.6-3.2 0-4.9 2.4-4.9 5.9V52h-8z"
        fill="#fff"
      />
    </svg>
  );
}

function SoundBar({
  started,
  music,
  floor,
  sfx,
  volume,
  onStart,
  onMusic,
  onFloor,
  onSfx,
  onVolume,
}: {
  started: boolean;
  music: boolean;
  floor: boolean;
  sfx: boolean;
  volume: number;
  onStart: () => void;
  onMusic: () => void;
  onFloor: () => void;
  onSfx: () => void;
  onVolume: (v: number) => void;
}) {
  const Switch = ({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) => (
    <button type="button" className="wcis-toggle" onClick={onClick} aria-pressed={on}>
      <span style={{ position: "relative", width: 30, height: 17, borderRadius: 9, background: on ? C.gold : "#3a3036", transition: "background .15s" }}>
        <span
          style={{ position: "absolute", top: 2, left: on ? 15 : 2, width: 13, height: 13, borderRadius: "50%", background: on ? C.ink : C.creamDim, transition: "left .15s ease" }}
        />
      </span>
      {label}
    </button>
  );
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(14,10,16,0.94)", borderBottom: `1px solid #3d3024`, padding: "10px 20px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        {!started ? (
          <button type="button" className="wcis-btn wcis-red wcis-pulse" onClick={onStart}>
            Turn on casino sound
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 18, width: 26 }} aria-hidden="true">
            {[0.9, 0.6, 1, 0.75].map((h, i) => (
              <span
                key={i}
                className="wcis-eq"
                style={{ width: 4, height: 18 * h, background: music ? C.gold : "#4a3d45", animationDelay: `${i * 0.17}s`, animationPlayState: music ? "running" : "paused" }}
              />
            ))}
          </div>
        )}
        <Switch on={music} label="Music" onClick={onMusic} />
        <Switch on={floor} label="Crowd" onClick={onFloor} />
        <Switch on={sfx} label="Effects" onClick={onSfx} />
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: C.creamDim }}>
          Vol
          <input className="wcis-range" type="range" min={0} max={100} value={volume} onChange={(e: { target: { value: string } }) => onVolume(Number(e.target.value))} />
        </label>
      </div>
    </div>
  );
}

function Marquee() {
  return (
    <div style={{ background: C.ink, border: `3px solid ${C.gold}`, borderRadius: 26, padding: "16px 22px" }}>
      <Bulbs n={30} color={C.gold} lit fast={false} />
      <div style={{ textAlign: "center", padding: "22px 8px 18px" }}>
        <h1 style={{ margin: "0 0 12px", fontFamily: SERIF, fontWeight: 900, fontSize: 52, lineHeight: 1.04, color: C.cream, letterSpacing: "-.01em" }}>
          The Internship{" "}
          <span className="wcis-flicker" style={{ color: C.red }}>
            Slot Machine
          </span>
        </h1>
        <div style={{ fontSize: 19, color: C.cream, fontWeight: 600 }}>Each pull = one internship application.</div>
        <div style={{ fontSize: 19, color: C.gold, fontWeight: 800, marginTop: 4 }}>Can you land an offer?</div>
      </div>
      <Bulbs n={30} color={C.gold} lit fast={false} />
    </div>
  );
}

function OfferOverlay({ tries, onClose }: { tries: number; onClose: () => void }) {
  const coins = useMemo(
    () =>
      Array.from({ length: 70 }, () => ({
        left: rand(0, 98),
        dx: rand(-80, 80),
        delay: rand(0, 1.4),
        dur: rand(1.6, 2.8),
        size: rand(18, 32),
      })),
    [],
  );
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(8,5,10,0.86)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", perspective: 500 }}>
        {coins.map((c, i) => (
          <span
            key={i}
            className="wcis-coin"
            style={{
              left: `${c.left}%`,
              width: c.size,
              height: c.size,
              ...cssVars({ "--dx": `${c.dx}px`, "--fall": "110vh", "--delay": `${c.delay}s`, "--dur": `${c.dur}s` }),
            }}
          />
        ))}
      </div>
      <div
        className="wcis-pop"
        onClick={(e: { stopPropagation: () => void }) => e.stopPropagation()}
        style={{ position: "relative", maxWidth: 520, width: "100%", background: C.ink, border: `3px solid ${C.gold}`, borderRadius: 26, padding: "16px 24px 22px", textAlign: "center" }}
      >
        <Bulbs n={20} color={C.gold} lit fast />
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
          <Sym id={BRIEFCASE} size={44} />
          <Sym id={BRIEFCASE} size={44} />
          <Sym id={BRIEFCASE} size={44} />
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 46, fontWeight: 900, lineHeight: 1.05, color: C.gold, margin: "10px 0 8px" }}>You got an offer!</div>
        <p style={{ margin: "0 0 18px", color: C.cream, fontSize: 17 }}>{`It took ${tries} application${tries === 1 ? "" : "s"}.`}</p>
        <button type="button" className="wcis-btn wcis-red" onClick={onClose}>
          Accept
        </button>
        <div style={{ height: 18 }} />
        <Bulbs n={20} color={C.gold} lit fast />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- page */

export default function InternshipSlotMachine() {
  const [stats, setStats] = useState<Stats>(freshStats);
  const [resetToken, setResetToken] = useState(0);
  const [offer, setOffer] = useState<number | null>(null);
  const [sound, setSound] = useState({ started: false, music: false, floor: false, sfx: true, volume: 70 });

  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = C.bg;
    return () => {
      document.body.style.background = prev;
      audio.shutdown();
    };
  }, []);

  const startSound = () => {
    audio.sfxOn = true;
    audio.setVolume(sound.volume / 100);
    audio.setMusic(true);
    audio.setFloor(true);
    setSound((s) => ({ ...s, started: true, music: true, floor: true, sfx: true }));
  };
  const toggleMusic = () => {
    const on = !sound.music;
    audio.setVolume(sound.volume / 100);
    audio.setMusic(on);
    setSound((s) => ({ ...s, started: true, music: on }));
  };
  const toggleFloor = () => {
    const on = !sound.floor;
    audio.setVolume(sound.volume / 100);
    audio.setFloor(on);
    setSound((s) => ({ ...s, started: true, floor: on }));
  };
  const toggleSfx = () => {
    const on = !sound.sfx;
    audio.sfxOn = on;
    if (on) audio.click();
    setSound((s) => ({ ...s, sfx: on }));
  };
  const changeVolume = (v: number) => {
    audio.setVolume(v / 100);
    setSound((s) => ({ ...s, volume: v }));
  };

  const reset = () => {
    audio.chips();
    setStats(freshStats());
    setOffer(null);
    setResetToken((t) => t + 1);
  };

  const chance = Math.round(atLeastOne(P_OFFER, stats.apps) * 100);

  return (
    <div className="wcis" style={{ background: C.bg, backgroundImage: CARPET, color: C.cream, minHeight: "100vh" }}>
      <style>{CSS}</style>
      <SoundBar
        started={sound.started}
        music={sound.music}
        floor={sound.floor}
        sfx={sound.sfx}
        volume={sound.volume}
        onStart={startSound}
        onMusic={toggleMusic}
        onFloor={toggleFloor}
        onSfx={toggleSfx}
        onVolume={changeVolume}
      />

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px 70px", display: "flex", flexDirection: "column", gap: 40 }}>
        <Marquee />

        <Machine stats={stats} setStats={setStats} resetToken={resetToken} onOffer={(tries) => setOffer(tries)} />

        {stats.apps >= 20 && (
          <section className="wcis-in" style={{ display: "flex", flexDirection: "column", gap: 14, background: C.felt, border: `1px solid ${C.feltLine}`, borderRadius: 18, padding: "22px 24px", textAlign: "center" }}>
            <Heading>Why can't you stop?</Heading>
            <div style={{ fontSize: 17, lineHeight: 1.6 }}>
              {`${stats.apps} applications. ${stats.interviews} interview${stats.interviews === 1 ? "" : "s"}. ${stats.offers} offer${stats.offers === 1 ? "" : "s"}.`}
              <br />
              Almost every pull gives you nothing. The rare win is what keeps you pulling. Slot machines work the same way.
            </div>
            {stats.offers === 0 && <div style={{ fontSize: 14, color: C.creamDim }}>{`Chance you'd have an offer by now: ${chance}%`}</div>}
          </section>
        )}

        <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Heading>Worse odds than a zombie apocalypse.</Heading>
          <PopOdds />
        </section>

        <div style={{ textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 18, lineHeight: 1.5, color: C.creamDim }}>
          “I used to gamble. Now I apply to internships. Same dopamine. Worse odds.”
        </div>

        <div style={{ borderTop: `1px solid #3d3024`, paddingTop: 20, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <button type="button" className="wcis-btn wcis-ghost" onClick={reset}>
            Reset
          </button>
          <span style={{ marginLeft: "auto", fontSize: 12.5, color: C.muted }}>Just a game. No real applications are sent.</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: -8 }}>
          <span style={{ fontFamily: SERIF, fontSize: 15, color: C.creamDim }}>
            Made by <span style={{ color: C.gold, fontWeight: 700 }}>Tanmay</span>
          </span>
          <Link href="https://www.instagram.com/tanmay_4115/" style={{ display: "inline-flex", lineHeight: 0 }}>
            <span className="wcis-social" title="Instagram @tanmay_4115" style={{ display: "inline-flex" }}>
              <IconInstagram />
            </span>
          </Link>
          <Link href="https://www.linkedin.com/in/tanmaysarfare" style={{ display: "inline-flex", lineHeight: 0 }}>
            <span className="wcis-social" title="LinkedIn: Tanmay Sarfare" style={{ display: "inline-flex" }}>
              <IconLinkedIn />
            </span>
          </Link>
        </div>
      </div>

      {offer !== null && <OfferOverlay tries={offer} onClose={() => setOffer(null)} />}
    </div>
  );
}
