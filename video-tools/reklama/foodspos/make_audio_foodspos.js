// make_audio_foodspos.js — foodsPOS Reels uchun 122 BPM upbeat elektron trek + SFX.
// Beat-drop 3s (wipe), climax 20s (payoff), sting + fade-out CTA da.
// Vaqtlar timeline_foodspos.js dan olinadi — montaj bilan sinxron.
'use strict';
const path = require('path');
const fs = require('fs');
const T = require('./timeline_foodspos');

const starts = T.segmentStarts();
const DUR = T.totalDuration();
const SR = 44100;
const BPM = 122;
const BEAT = 60 / BPM;

const N = Math.ceil(DUR * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);

function tone(freq, dur, vol, shape = 'sine', attack = 0.005, decay = 0.3) {
  const n = Math.max(1, Math.round(dur * SR));
  const aS = Math.max(1, Math.round(attack * SR));
  const dS = Math.max(1, Math.round(decay * SR));
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let e = 1;
    if (i < aS) e = i / aS;
    if (i > n - dS) e = Math.max(0, (n - i) / dS);
    const ph = 2 * Math.PI * freq * (i / SR);
    let v;
    if (shape === 'square') v = Math.sin(ph) > 0 ? 1 : -1;
    else if (shape === 'saw') v = 2 * ((freq * i / SR) % 1) - 1;
    else if (shape === 'noise') v = Math.random() * 2 - 1;
    else v = Math.sin(ph);
    buf[i] = v * e * vol;
  }
  return buf;
}

function add(buf, t, vol = 1, rr = null) {
  const i0 = Math.round(t * SR);
  if (i0 >= N) return;
  const end = Math.min(buf.length, N - i0);
  const dst = rr || L;
  for (let i = 0; i < end; i++) dst[i0 + i] += buf[i] * vol;
}

function padNote(freq, dur, vol) {
  const buf = new Float32Array(Math.round(dur * SR));
  for (let i = 0; i < buf.length; i++) {
    const t = i / SR;
    const e = Math.min(1, i / (0.5 * SR)) * Math.min(1, (buf.length - i) / (0.5 * SR));
    buf[i] = (Math.sin(2 * Math.PI * freq * t) + 0.35 * Math.sin(2 * Math.PI * freq * 1.005 * t)) * e * vol * 0.5;
  }
  return buf;
}

function kick(vol) {
  const n = Math.round(0.22 * SR);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 60 + 90 * Math.exp(-t * 22);
    buf[i] = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 18) * vol;
  }
  return buf;
}

function hat(vol, open = false) {
  const n = Math.round((open ? 0.16 : 0.04) * SR);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) buf[i] = (Math.random() * 2 - 1) * Math.exp(-i / SR * (open ? 30 : 90)) * vol;
  return buf;
}

function clap(vol) {
  const n = Math.round(0.2 * SR);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const e = Math.exp(-i / SR * 25);
    buf[i] = ((Math.random() * 2 - 1) * 0.7 + 0.3 * Math.sin(2 * Math.PI * 180 * i / SR)) * e * vol;
  }
  return buf;
}

function bassFreq(freq, dur, vol) {
  const n = Math.round(dur * SR);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const e = Math.min(1, i / (0.02 * SR)) * Math.min(1, (n - i) / (0.03 * SR));
    buf[i] = (Math.sin(2 * Math.PI * freq * t) * 0.7 + 0.3 * Math.sin(2 * Math.PI * freq * 2 * t)) * e * vol;
  }
  return buf;
}

function whoosh(dur = 0.4, vol = 0.5) {
  const n = Math.round(dur * SR);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const e = Math.sin(Math.PI * i / n);
    const f = 300 + 2400 * (i / n);
    buf[i] = (Math.sin(2 * Math.PI * f * t) * 0.5 + Math.random() * 0.5) * e * vol;
  }
  return buf;
}

function riser(dur = 1.2, vol = 0.32, f0 = 220, f1 = 3400) {
  const n = Math.round(dur * SR);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const p = i / n;
    const f = f0 * Math.pow(f1 / f0, p);
    buf[i] = (Math.sin(2 * Math.PI * f * t) * 0.6 + Math.random() * 0.4) * Math.pow(p, 2) * vol;
  }
  return buf;
}

function impact(vol = 0.7) {
  const n = Math.round(0.55 * SR);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    buf[i] = (Math.sin(2 * Math.PI * (70 + 60 * Math.exp(-t * 14)) * t) * 1.2 + Math.random() * 0.3) * Math.exp(-t * 9) * vol;
  }
  return buf;
}

function tickS(vol = 0.28) { return tone(1700, 0.035, vol, 'sine', 0.001, 0.02); }
function beep(vol = 0.4) { return tone(2200, 0.07, vol, 'sine', 0.002, 0.05); }
function ding(vol = 0.45) {
  const a = tone(880, 0.14, vol, 'sine', 0.003, 0.1);
  const b = tone(1318, 0.3, vol * 0.8, 'sine', 0.005, 0.24);
  const buf = new Float32Array(Math.max(a.length, b.length));
  for (let i = 0; i < buf.length; i++) buf[i] = (a[i] || 0) + (b[i] || 0);
  return buf;
}
function sparkle(vol = 0.32) {
  const n = Math.round(0.8 * SR);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const e = Math.sin(Math.PI * i / n);
    const f = 2400 + 3400 * (i / n);
    buf[i] = (Math.sin(2 * Math.PI * f * t) + 0.4 * Math.sin(2 * Math.PI * f * 1.5 * t)) * e * vol;
  }
  return buf;
}
function notif(vol = 0.4) { // telegram "pop" — ikki ohangli
  const a = tone(990, 0.08, vol, 'sine', 0.002, 0.06);
  const b = tone(1567, 0.12, vol * 0.9, 'sine', 0.002, 0.1);
  const buf = new Float32Array(a.length + b.length);
  buf.set(a, 0); buf.set(b, a.length);
  return buf;
}

// ---- groove: kick har beatda (0-3s past temp — faqat kick+bass, 3s dan to'liq) ----
for (let b = 0; b * BEAT < DUR + 0.5; b++) {
  const t = b * BEAT;
  if (t < 3.0) {
    if (b % 2 === 0) add(kick(0.55), t);
  } else {
    if (b % 2 === 0) add(kick(0.85), t);
    if (b % 4 === 2) add(clap(0.36), t);
    add(hat(0.11), t);
    if ((t + BEAT / 2) < DUR) add(hat(0.07), t + BEAT / 2);
  }
}

// ---- bass: Am F C G (har biri ~2s) ----
const bassRoots = [110, 87.31, 130.81, 98.0];
for (let cy = 0; cy * 2.0 < DUR + 1; cy++) {
  const base = cy * 2.0;
  for (let k = 0; k < 4; k++) add(bassFreq(bassRoots[cy % 4] * (k === 2 ? 1 : 0.5), 0.45, 0.42), base + k * 0.5);
}

// ---- padlar ----
const padProg = [220.0, 174.61, 261.63, 196.0];
for (let cy = 0; cy * 2.0 < DUR + 1; cy++) {
  const root = padProg[cy % 4];
  [0, 3, 7].forEach((s) => add(padNote(root * Math.pow(2, s / 12), 2.2, 0.09), cy * 2.0));
}

// ---- SFX xaritasi (segment boshlariga) ----
const [HOOK, WIPE, P0, P1, P2, P3, TG1, TG2, PAY, CTA] = starts;
const sfx = [
  [HOOK + 0.05, impact(0.75)],          // hook zarbasi
  [HOOK + 1.15, tickS(0.35)],           // X animatsiyasi
  [WIPE - 0.5, riser(0.6, 0.3)],        // drop oldidan riser
  [WIPE + 0.02, impact(0.9)],           // BASS DROP — beat switch
  [WIPE + 0.05, whoosh(0.4, 0.55)],
  [P0 + 0.1, beep(0.35)],               // kassa tap
  [P0 + 0.9, ding(0.4)],                // chek
  [P1 + 0.1, whoosh(0.3, 0.4)],
  [P1 + 0.5, tickS()],
  [P2 + 0.1, whoosh(0.3, 0.4)],
  [P2 + 0.9, tickS()],                  // chart chizilishi
  [P3 + 0.1, whoosh(0.3, 0.4)],
  [TG1 + 0.35, notif(0.42)],            // telegram xabari!
  [TG1 + 1.2, notif(0.35)],
  [TG2 + 0.35, notif(0.42)],            // admin bildirishnoma
  [PAY - 0.7, riser(1.0, 0.34)],        // climax riser
  [PAY + 0.05, impact(0.85)],           // payoff zarbasi
  [PAY + 1.2, ding(0.4)],
  [CTA + 0.05, impact(0.8)],            // logo sting
  [CTA + 0.9, sparkle(0.36)],           // logo glow
  [CTA + 2.2, sparkle(0.25)],
  [DUR - 0.6, riser(0.5, 0.2, 3200, 400)], // fade-out bilan pastga
];
sfx.forEach(([t, s]) => add(s, t));

// ---- outro fade (oxirgi 0.8s) ----
{
  const fN = Math.round(0.8 * SR);
  for (let i = 0; i < fN; i++) {
    const idx = N - fN + i;
    if (idx < 0 || idx >= N) continue;
    const g = 1 - i / fN;
    L[idx] *= g; R[idx] *= 0; // mono-safe: R keyin qayta hisoblanadi
    R[idx] = 0;
  }
}

// ---- stereo kengaytirish ----
for (let i = 0; i < N; i++) R[i] = 0.95 * (i >= 300 ? L[i - 300] : 0) + 0.05 * L[i];

// ---- normalize + WAV ----
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const g = 0.89 / Math.max(0.001, peak);
const samples = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  samples.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(L[i] * g * 32767))), i * 4);
  samples.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(R[i] * g * 32767))), i * 4 + 2);
}
const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + samples.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(2, 22);
header.writeUInt32LE(SR, 24);
header.writeUInt32LE(SR * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(samples.length, 40);

const out = path.join(__dirname, 'bgm_foodspos.wav');
fs.writeFileSync(out, Buffer.concat([header, samples]));
console.log('bgm_foodspos.wav  ' + DUR.toFixed(2) + 's  ' + fs.statSync(out).size + ' bytes');
