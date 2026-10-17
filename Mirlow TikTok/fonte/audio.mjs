import fs from "node:fs";
const SR = 48000, DUR = 26, N = SR * DUR;
const L = new Float32Array(N), R = new Float32Array(N);
const add = (i, v, pan = 0) => { if (i >= 0 && i < N) { L[i] += v * (1 - Math.max(0, pan)); R[i] += v * (1 + Math.min(0, pan)); } };
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

// Pad: A major add9, soft, slow tremolo, swells in from the hook.
const notes = [110, 164.81, 220, 246.94, 277.18, 329.63];
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const env = Math.min(1, t / 2.5) * Math.min(1, (DUR - t) / 1.5);
  const lift = t > 5.75 ? 1 : 0.6;
  let v = 0;
  notes.forEach((f, k) => { v += Math.sin(2 * Math.PI * f * t + k) + 0.5 * Math.sin(2 * Math.PI * f * 1.003 * t); });
  v *= 0.011 * env * lift * (0.85 + 0.15 * Math.sin(t * 1.3));
  add(i, v, Math.sin(t * 0.5) * 0.3);
}
// Kick: soft sine drop.
function kick(at, gain = 0.5, len = 0.35) {
  const s = Math.floor(at * SR);
  let ph = 0;
  for (let j = 0; j < len * SR; j++) {
    const x = j / SR, f = 45 + 95 * Math.exp(-x * 28);
    ph += (2 * Math.PI * f) / SR;
    add(s + j, Math.sin(ph) * Math.exp(-x * 9) * gain);
  }
}
// Hat: short high noise.
let hp = 0, prev = 0;
function hat(at, gain = 0.05) {
  const s = Math.floor(at * SR);
  for (let j = 0; j < 0.05 * SR; j++) { const n = rnd(); const h = n - prev; prev = n; add(s + j, h * Math.exp(-j / SR * 90) * gain, 0.2); }
}
// Whoosh: band of noise rising then falling, before each cut.
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
function boom(at, gain = 0.6) {
  kick(at, gain, 1.4);
  const s = Math.floor(at * SR);
  for (let j = 0; j < 2.2 * SR; j++) { const x = j / SR; add(s + j, Math.sin(2 * Math.PI * 55 * x) * Math.exp(-x * 2.2) * gain * 0.35); }
}
function chime(at, gain = 0.05) {
  const s = Math.floor(at * SR);
  [880, 1318.5, 1760].forEach((f, k) => { for (let j = 0; j < 1.6 * SR; j++) { const x = j / SR; add(s + j + k * 2400, Math.sin(2 * Math.PI * f * x) * Math.exp(-x * 3) * gain, k * 0.3 - 0.3); } });
}

// Beat at 120 bpm from the first cut, pausing for the reveal and the ending.
const BEAT = 0.5;
for (let t = 2.75; t < 22.4; t += BEAT) {
  if (t > 5.6 && t < 6.6) continue;
  if (t > 19.4 && t < 19.9) continue;
  kick(t, 0.32);
  hat(t + BEAT / 2, 0.06);
}
[2.75, 5.75, 8.55, 15.9, 19.55, 22.6].forEach((c) => whoosh(c));
// Strikes in scene 2
[0, 1, 2, 3].forEach((i) => click(2.75 + 0.25 + i * 0.38 + 0.3, 0.08));
boom(5.75, 0.55); chime(6.1);
click(10.95); click(11.75); chime(12.2, 0.045);
[16.35, 16.67, 16.99, 17.31].forEach((t) => click(t, 0.06));
boom(19.55, 0.7);
boom(22.6, 0.5); chime(22.8, 0.06);

// Normalise and write 16-bit WAV.
let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const g = 0.89 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVEfmt ", 8);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(Math.tanh(L[i] * g) * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(Math.tanh(R[i] * g) * 32767), 46 + i * 4); }
fs.writeFileSync("music.wav", buf);
console.log("peak", peak.toFixed(3));
