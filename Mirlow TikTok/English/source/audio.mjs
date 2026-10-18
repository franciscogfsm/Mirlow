// node audio.mjs -> mix.wav: synthesised score + sound design, ducked under the voice-over.
// node audio.mjs voice -> voice.wav: the voice-over alone.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
await import("./timeline.js");
const { T, VO, at, atEnd } = globalThis.TL;

const SR = 48000, DUR = T.end, N = Math.ceil(SR * DUR);
const L = new Float32Array(N), R = new Float32Array(N);
const add = (i, v, pan = 0) => { if (i >= 0 && i < N) { L[i] += v * (1 - Math.max(0, pan)); R[i] += v * (1 + Math.min(0, pan)); } };
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

// Pad: A major add9, soft, slow tremolo; opens up at the logo.
const notes = [110, 164.81, 220, 246.94, 277.18, 329.63];
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const env = Math.min(1, t / 2.0) * Math.min(1, (DUR - t) / 1.8);
  const lift = t > T.s3 ? 1 : 0.65;
  let v = 0;
  notes.forEach((f, k) => { v += Math.sin(2 * Math.PI * f * t + k) + 0.5 * Math.sin(2 * Math.PI * f * 1.003 * t); });
  v *= 0.011 * env * lift * (0.85 + 0.15 * Math.sin(t * 1.3));
  add(i, v, Math.sin(t * 0.5) * 0.3);
}
function kick(at, gain = 0.5, len = 0.35) {
  const s = Math.floor(at * SR);
  let ph = 0;
  for (let j = 0; j < len * SR; j++) {
    const x = j / SR, f = 45 + 95 * Math.exp(-x * 28);
    ph += (2 * Math.PI * f) / SR;
    add(s + j, Math.sin(ph) * Math.exp(-x * 9) * gain);
  }
}
let prev = 0;
function hat(at, gain = 0.05) {
  const s = Math.floor(at * SR);
  for (let j = 0; j < 0.05 * SR; j++) { const n = rnd(); const h = n - prev; prev = n; add(s + j, h * Math.exp(-j / SR * 90) * gain, 0.2); }
}
function whoosh(at, len = 0.6, gain = 0.09) {
  const s = Math.floor((at - len * 0.7) * SR); let lp = 0, lp2 = 0;
  for (let j = 0; j < len * SR; j++) {
    const x = j / (len * SR), env = Math.sin(Math.PI * x) ** 2;
    const a = 0.02 + 0.25 * x;
    lp += a * (rnd() - lp); lp2 += a * (lp - lp2);
    add(s + j, (lp - lp2) * env * gain * 6, (x - 0.5) * 0.8);
  }
}
function click(at, gain = 0.18) {
  const s = Math.floor(at * SR);
  for (let j = 0; j < 0.03 * SR; j++) { const x = j / SR; add(s + j, Math.sin(2 * Math.PI * 2600 * x) * Math.exp(-x * 220) * gain + Math.sin(2 * Math.PI * 900 * x) * Math.exp(-x * 120) * gain * 0.6); }
}
function pop(at, gain = 0.12) {
  const s = Math.floor(at * SR); let ph = 0;
  for (let j = 0; j < 0.12 * SR; j++) { const x = j / SR; ph += 2 * Math.PI * (380 + 900 * Math.exp(-x * 40)) / SR; add(s + j, Math.sin(ph) * Math.exp(-x * 30) * gain); }
}
function boom(at, gain = 0.6) {
  kick(at, gain, 1.4);
  const s = Math.floor(at * SR);
  for (let j = 0; j < 2.2 * SR; j++) { const x = j / SR; add(s + j, Math.sin(2 * Math.PI * 55 * x) * Math.exp(-x * 2.2) * gain * 0.35); }
}
function chime(at, gain = 0.05) {
  const s = Math.floor(at * SR);
  [880, 1318.5, 1760].forEach((f, k) => { for (let j = 0; j < 1.6 * SR; j++) { const x = j / SR; add(s + j + k * 2400, Math.sin(2 * Math.PI * f * x) * Math.exp(-x * 3) * gain, k * 0.3 - 0.3); } });
}
// Rising noise into a moment.
function riser(from, to, gain = 0.05) {
  const s = Math.floor(from * SR), n = Math.floor((to - from) * SR); let lp = 0;
  for (let j = 0; j < n; j++) { const x = j / n; lp += (0.01 + 0.3 * x * x) * (rnd() - lp); add(s + j, lp * x * x * gain * 4, Math.sin(x * 9) * 0.3); }
}

// Beat at 120 bpm from the first cut. It drops out for the logo and for
// "What's the catch?", then lands back in on "free".
const FREE = at("free", "free");
const BEAT = 0.5;
for (let t = T.s2; t < T.s7 - 0.2; t += BEAT) {
  if (t > T.s3 - 0.2 && t < T.s3 + 0.9) continue;
  if (t > T.s6 - 0.2 && t < FREE - 0.05) continue;
  if (t > T.sc - 0.2 && t < T.scw - 0.05) continue;
  kick(t, 0.32);
  hat(t + BEAT / 2, 0.06);
}
[T.s2, T.s3, T.s4, T.sc, T.scw, T.s5, T.s6, T.s7].forEach((c) => whoosh(c));
// Hook: the button pops in, then gets pressed on "PC".
pop(at("hook", "button") - 0.02, 0.1);
click(at("hook", "PC"), 0.16); chime(at("hook", "PC") + 0.05, 0.03);
// Strikes, each on the end of its noun.
["cable", "phone", "account", "subscription"].forEach((w) => click(atEnd("no", w) - 0.08, 0.09));
boom(T.s3, 0.55); chime(T.s3 + 0.35);
click(T.tap1); click(T.tap2); chime(T.tap2 + 0.4, 0.045);
whoosh(T.mirror + 0.6, 0.8, 0.07);
[at("feats", "full"), at("feats", "private"), at("feats", "iPhone")].forEach((t) => pop(t - 0.1, 0.07));
// Control scene: the beat holds its breath for the re-hook, then lands with the window.
riser(T.sc + 0.3, T.scw - 0.05, 0.045);
boom(T.scw - 0.05, 0.5);
click(at("ctlB", "mouse"), 0.17);
click(at("ctlC", "Click") + 0.05, 0.12);
whoosh(at("ctlC", "Scroll") + 0.45, 0.5, 0.05);
click(at("ctlC", "Type") + 0.1, 0.1);
// A soft mechanical key per letter.
function key(at, gain = 0.07) {
  const s = Math.floor(at * SR); let lp = 0;
  for (let j = 0; j < 0.06 * SR; j++) { const x = j / SR; lp += 0.35 * (rnd() - lp); add(s + j, (lp * Math.exp(-x * 120) + Math.sin(2 * Math.PI * 1700 * x) * Math.exp(-x * 260) * 0.5) * gain, 0.15); }
}
for (let i = 0; i < 6; i++) key(at("ctlC", "Type") + 0.3 + i * 0.13);
riser(T.s6 + 0.2, FREE - 0.05, 0.05);
click(at("free", "one") - 0.02, 0.1);
boom(FREE - 0.1, 0.75);
[at("free", "No"), at("free", "no", 1), at("free", "open")].forEach((t) => click(t, 0.05));
boom(T.s7, 0.5); chime(T.s7 + 0.2, 0.06);

// Voice: each line decoded by ffmpeg and laid in at its start.
const V = new Float32Array(N);
for (const k in VO) {
  const raw = execFileSync("ffmpeg", ["-v", "error", "-i", `vo/${k}.mp3`, "-f", "f32le", "-ac", "1", "-ar", String(SR), "-"], { maxBuffer: 1 << 28 });
  const x = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
  const s = Math.floor(VO[k] * SR);
  for (let j = 0; j < x.length; j++) if (s + j < N) V[s + j] += x[j];
}
let vpeak = 0; for (let i = 0; i < N; i++) vpeak = Math.max(vpeak, Math.abs(V[i]));
let mpeak = 0; for (let i = 0; i < N; i++) mpeak = Math.max(mpeak, Math.abs(L[i]), Math.abs(R[i]));

// Duck the music under the voice: fast attack, slow release.
let env = 0;
const aA = Math.exp(-1 / (0.01 * SR)), aR = Math.exp(-1 / (0.35 * SR));
const ONLY_VOICE = process.argv[2] === "voice";
const MUSIC = ONLY_VOICE ? 0 : 0.5 / mpeak, VOICE = 0.92 / vpeak;
const out = Buffer.alloc(44 + N * 4);
out.write("RIFF", 0); out.writeUInt32LE(36 + N * 4, 4); out.write("WAVEfmt ", 8);
out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22); out.writeUInt32LE(SR, 24);
out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write("data", 36); out.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const a = Math.abs(V[i] * VOICE);
  env = a > env ? aA * env + (1 - aA) * a : aR * env + (1 - aR) * a;
  const duck = 1 - 0.55 * Math.min(1, env / 0.12);
  const v = V[i] * VOICE;
  const l = Math.tanh(L[i] * MUSIC * duck + v), r = Math.tanh(R[i] * MUSIC * duck + v);
  out.writeInt16LE(Math.round(l * 32767), 44 + i * 4); out.writeInt16LE(Math.round(r * 32767), 46 + i * 4);
}
const file = ONLY_VOICE ? "voice.wav" : "mix.wav";
fs.writeFileSync(file, out);
console.log("wrote", file, DUR.toFixed(2) + "s");
