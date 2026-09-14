// make_audio_v3.js — premium-minimal music + SFX for MaxPOS (Uzbek, ~23.4s)
// All SFX times derive from timeline_v3 segment starts so they stay in sync.
'use strict';
const T = require('./timeline_v3');
const starts = T.segmentStarts(); // [0, ...]
const ends = T.segmentTimes().map((s) => s.end);
const DUR = ends[ends.length - 1];
const SR = 44100;
const BPM = 100; // beat = 0.6s
const BEAT = 60 / BPM;

const N = Math.ceil(DUR * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);

function mix(rr, t, amp) {
  const i = Math.round(t * SR);
  if (i >= N) return;
  rr[i + 0] = (rr[i + 0] || 0) + amp;
}

// ---- tiny synthesizers ----
function envAd(n, a, d) {
  // attack/release envelope across [0,n]
  const out = new Float32Array(n);
  const aS = Math.max(1, Math.round(a * SR));
  const dS = Math.max(1, Math.round(d * SR));
  for (let i = 0; i < n; i++) {
    let e = 1;
    if (i < aS) e = i / aS;
    if (i > n - dS) e = Math.max(0, (n - i) / dS);
    out[i] = e;
  }
  return out;
}

function tone(freq, dur, vol, shape = 'sine', attack = 0.005, decay = 0.3) {
  const n = Math.max(1, Math.round(dur * SR));
  const env = envAd(n, attack, decay);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const ph = 2 * Math.PI * freq * (i / SR) + 0.5 * Math.sin(2 * Math.PI * freq * 0.5 * (i / SR));
    let v;
    if (shape === 'sine') v = Math.sin(ph);
    else if (shape === 'square') v = Math.sin(ph) > 0 ? 1 : -1;
    else if (shape === 'saw') v = 2 * ((freq * i / SR) % 1) - 1;
    else v = (Math.random() * 2 - 1);
    buf[i] = v * env[i] * vol;
  }
  return buf;
}

function add(buf, t, vol = 1, rr = null) {
  const n = buf.length;
  const i0 = Math.round(t * SR);
  if (i0 >= N) return;
  const end = Math.min(n, N - i0);
  const dst = rr || L;
  for (let i = 0; i < end; i++) dst[i0 + i] += buf[i] * vol;
}

// soft pad (sine + slight detune)
function padNote(freq, dur, vol) {
  const buf = new Float32Array(Math.round(dur * SR));
  for (let i = 0; i < buf.length; i++) {
    const t = i / SR;
    const e = Math.min(1, i / (0.6 * SR)) * Math.min(1, (buf.length - i) / (0.5 * SR));
    buf[i] = (Math.sin(2 * Math.PI * freq * t) + 0.35 * Math.sin(2 * Math.PI * freq * 1.005 * t)) * e * vol * 0.5;
  }
  return buf;
}

function kick(vol) {
  const n = Math.round(0.22 * SR);
  const buf = new Float32Array(n);
  let f = 150;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    f = 60 + 90 * Math.exp(-t * 22);
    buf[i] = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 18) * vol;
  }
  return buf;
}

function hat(vol, open = false) {
  const n = Math.round((open ? 0.18 : 0.045) * SR);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) buf[i] = (Math.random() * 2 - 1) * Math.exp(-i / SR * (open ? 30 : 90)) * vol;
  return buf;
}

function clap(vol) {
  const n = Math.round(0.22 * SR);
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

// ---- SFX builders ----
function whoosh(dur = 0.5, vol = 0.5) {
  const n = Math.round(dur * SR);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const e = Math.sin(Math.PI * i / n);
    const f = 300 + 2200 * (i / n);
    buf[i] = (Math.sin(2 * Math.PI * f * t) * 0.5 + Math.random() * 0.5) * e * vol;
  }
  return buf;
}

function riser(dur = 1.2, vol = 0.35, f0 = 200, f1 = 3200) {
  const n = Math.round(dur * SR);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const p = i / n;
    const f = f0 * Math.pow(f1 / f0, p);
    const e = Math.pow(p, 2);
    buf[i] = (Math.sin(2 * Math.PI * f * t) * 0.6 + Math.random() * 0.4) * e * vol;
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

function beep(vol = 0.4) {
  const buf = tone(2200, 0.06, vol, 'sine', 0.002, 0.04);
  return buf;
}

function chaChing(vol = 0.5) {
  const a = tone(880, 0.14, vol, 'sine', 0.003, 0.1);
  const b = tone(1320, 0.3, vol * 0.8, 'sine', 0.005, 0.24);
  const buf = new Float32Array(Math.max(a.length, b.length));
  for (let i = 0; i < buf.length; i++) {
    buf[i] = (a[i] || 0) + (b[i] || 0) * Math.min(1, i / (0.02 * SR));
  }
  return buf;
}

function printer(vol = 0.35) {
  const n = Math.round(0.35 * SR);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const e = Math.exp(-t * 8);
    buf[i] = (Math.random() * 2 - 1) * e * vol * 0.5 + Math.sin(2 * Math.PI * 120 * t) * e * vol * 0.4;
  }
  return buf;
}

function tickS(vol = 0.3) {
  const buf = tone(1600, 0.035, vol, 'sine', 0.001, 0.02);
  return buf;
}

function sparkle(vol = 0.35) {
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

function piano(freq, dur, vol) {
  const n = Math.round(dur * SR);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const e = Math.exp(-t * 3.2);
    let v = 0;
    for (let h = 1; h <= 6; h++) v += Math.sin(2 * Math.PI * freq * h * 0.996 * t) / (h * h) * (h === 1 ? 1 : 0.5);
    buf[i] = v * e * vol;
  }
  return buf;
}

function addSFX(t, sfx, rr, vol) { if (sfx) add(sfx, t, vol || 1, rr); }

// ---- build the track ----
const padProg = [220.0, 174.61, 261.63, 196.0]; // A3, F3, C4, G3 (Am F C G rooted low)
const chordOff = [[0, 3, 7], [0, 4, 7], [0, 4, 7], [2, 4, 7]]; // Am, F, C, G triads vs root
// melody (piano) for hook & cta
const hookMelody = [
  [0.0, 880, 0.6], [0.6, 987.77, 0.5], [0.9, 1046.5, 0.9],
  [1.7, 880, 0.5], [2.0, 783.99, 0.6],
];
const ctaMelody = [
  [0.0, 659.25, 0.6], [0.6, 783.99, 0.6], [1.0, 880, 1.0],
  [1.8, 1046.5, 0.7], [2.2, 1318.5, 0.9],
];

// drums schedule: kick on every beat, clap on 2/4, hats 8ths
for (let b = 0; b * BEAT < DUR + 0.5; b++) {
  const t = b * BEAT;
  if (b >= Math.round(2.2 / BEAT)) { // start after hook for punch; actually start at 1s
    if (b % 2 === 0) addSFX(t, kick(0.8), L);
    if (b % 4 === 2) addSFX(t, clap(0.35), L);
    if (b % 1 === 0) addSFX(t, hat(0.12), L);
  }
}

// bass line (root notes follow Am F C G, 2 beats each → 2.4s cycle)
const bassRoots = [110, 87.31, 130.81, 98.0]; // A2 F2 C3 G2
for (let cy = 0; cy * 2.4 < DUR + 1; cy++) {
  const base = cy * 2.4;
  for (let k = 0; k < 4; k++) {
    const root = bassRoots[cy % 4] * (k === 2 ? 1 : 0.5);
    addSFX(base + k * 0.6, bassFreq(root, 0.5, 0.45), L);
  }
}

// pads — Am F C G, one chord per 2.4s with soft cross
const cycleRoots = [0, 1, 2, 3];
for (let cy = 0; cy * 2.4 < DUR + 1; cy++) {
  const ci = cy % 4;
  const root = padProg[ci];
  const center = cy * 2.4;
  chordOff[ci].forEach((s) => {
    const f = root * Math.pow(2, s / 12);
    addSFX(center, padNote(f, 2.6, 0.10), L);
  });
}

// melody hook (0-1.9) and cta (19.x)
hookMelody.forEach(([t, f, v]) => addSFX(t, piano(f, 0.7, 0.16 * v), L));
ctaMelody.forEach(([t, f, v]) => addSFX(starts[12] + t, piano(f, 0.9, 0.18 * v), L));

// SFX map — times derived from segment starts (hook, p1..p3, s1..s4, m1..m2, a1, a2, cta)
const [H0, P1, P2, P3, S1, S2, S3, S4, M1, M2, A1, A2, CTA] = starts;
const whooshes = [H0 + 0.0, P1, P2, P3, S1, S2, S3, S4, M1, M2, A1, A2, CTA];
whooshes.forEach((t, i) => {
  if (i === 0) return; // hook has its own impact
  addSFX(t, whoosh(0.45, 0.5), L);
});
const sfxMap = [
  [H0 + 0.05, impact(0.7)],
  [H0 + 1.0, sparkle(0.3)],
  [H0 + 1.2, sparkle(0.22)],
  [P1 + 0.12, tickS()], [P2 + 0.12, tickS()], [P3 + 0.12, tickS()],
  [S1 + 0.25, beep()],
  [S2 + 0.25, chaChing()],
  [S3 + 0.25, chaChing()],
  [S4 + 0.25, printer()],
  [M1 + 0.25, tickS()], [M2 + 0.25, tickS()],
  [A1 + 0.25, tickS()],
  [A2 - 0.6, riser(1.6, 0.3, 250, 3400)],
  [A2 + 0.25, impact(0.45)],
  [A2 + 0.8, sparkle(0.3)],
  [CTA + 0.05, impact(0.8)],
  [CTA + 1.1, sparkle(0.4)],
  [CTA + 1.4, sparkle(0.3)],
  [DUR - 0.1, impact(0.5)],
];
sfxMap.forEach(([t, s]) => add(s, t, 1, L));

// stereo: light stereo widening (delayed copy in R)
for (let i = 0; i < N; i++) {
  R[i] = 0.95 * (i >= 300 ? L[i - 300] : 0) + 0.05 * L[i];
}

// normalize
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const g = 0.9 / Math.max(0.001, peak);
const samples = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  samples.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(L[i] * g * 32767))), i * 4);
  samples.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(R[i] * g * 32767))), i * 4 + 2);
}

// WAV header
const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + samples.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);   // PCM
header.writeUInt16LE(2, 22);   // stereo
header.writeUInt32LE(SR, 24);
header.writeUInt32LE(SR * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(samples.length, 40);

const out = pathJoin(__dirname, 'bgm_reklama.wav');
require('fs').writeFileSync(out, Buffer.concat([header, samples]));
console.log('✅ bgm_reklama.wav  ' + DUR.toFixed(2) + 's  ' + require('fs').statSync(out).size + ' bytes');

function pathJoin(a, b) { return require('path').join(a, b); }