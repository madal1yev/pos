// 26 soniyalik fon musiqa (120 BPM) — 16-bit PCM stereo WAV
const fs = require('fs');
const SR = 44100;
const DUR = 26;
const N = Math.floor(SR * DUR);

const beat = 0.5;          // 120 BPM
const chordLen = 4;        // 1 akkord = 2 bar = 4 soniya

// Am -> F -> C -> G (7 akkord = 28s, bizga 26s kerak: Am F C G Am F C)
const chords = [
  { root: 110.0,  notes: [110.0, 261.63, 329.63, 440.0] },   // Am
  { root: 87.31,  notes: [87.31, 220.0, 261.63, 349.23] },   // F
  { root: 130.81, notes: [130.81, 164.81, 196.0, 261.63] },  // C
  { root: 98.0,   notes: [98.0, 246.94, 293.66, 392.0] },    // G
];

const L = new Float32Array(N);
const R = new Float32Array(N);

function addMix(bufL, bufR, from, dur, amp, gen) {
  const start = Math.floor(from * SR);
  const len = Math.floor(dur * SR);
  for (let i = 0; i < len; i++) {
    const idx = start + i;
    if (idx >= N) break;
    const t = i / SR;
    const [l, r] = gen(t, dur);
    bufL[idx] += l * amp;
    bufR[idx] += r * amp;
  }
}

// Pad (akkord)
function pad(chord, from) {
  for (const f of chord.notes) {
    addMix(L, R, from, chordLen, 0.055, (t) => {
      const a = Math.min(1, t / 0.25) * Math.min(1, (chordLen - t) / 0.4);
      const v = Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(2 * Math.PI * f * 2 * t);
      return [v * a, v * a];
    });
  }
}

// Kick (sine 50->42 Hz decay)
function kick(from) {
  addMix(L, R, from, 0.14, 0.5, (t) => {
    const f = 50 - 8 * Math.min(1, t / 0.08);
    const a = Math.exp(-t * 28);
    return [Math.sin(2 * Math.PI * f * t) * a, Math.sin(2 * Math.PI * f * t) * a];
  });
}

// Hat (noise burst)
function hat(from, dur = 0.03) {
  addMix(L, R, from, dur, 0.07, (t) => {
    const a = Math.exp(-t * 130);
    const n = Math.random() * 2 - 1;
    return [n * a, n * a];
  });
}

// Clap (noise burst, beats 2 and 4)
function clap(from) {
  addMix(L, R, from, 0.09, 0.14, (t) => {
    const a = Math.exp(-t * 45);
    const n = Math.random() * 2 - 1;
    return [n * a, n * a];
  });
}

// Bass (root note, har beat)
function bass(f, from) {
  addMix(L, R, from, 0.28, 0.16, (t) => {
    const a = Math.exp(-t * 12);
    const v = Math.sin(2 * Math.PI * f * t);
    return [v * a, v * a];
  });
}

// Riser (20.0 -> 21.5s) — CTA ga
addMix(L, R, 19.8, 1.7, 0.1, (t) => {
  const f = 200 + 700 * (t / 1.7);
  const a = Math.min(1, t / 1.7);
  return [Math.sin(2 * Math.PI * f * t) * a, Math.sin(2 * Math.PI * f * t) * a];
});

for (let b = 0; b * beat < DUR; b++) {
  const t = b * beat;
  const chordIdx = Math.floor(t / chordLen);
  const ch = chords[chordIdx % chords.length];
  kick(t);
  bass(ch.root, t);
  if (t >= 8) {           // 8s dan keyin to'liq groove
    if (b % 4 === 1) clap(t);
    if (b % 4 === 3) clap(t);
  }
  // 8-lik hat — 3s dan keyin
  const off = t + beat / 2;
  if (off < DUR && off >= 3) hat(off, 0.02);
}
for (let ci = 0; ci * chordLen < DUR; ci++) {
  pad(chords[ci % chords.length], ci * chordLen);
}

// Normalizatsiya va stereo kengaytirish (simple)
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const gain = peak > 0.9 ? 0.9 / peak : 1;

const samples = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  const l = Math.max(-1, Math.min(1, L[i] * gain)) * 32767;
  const r = Math.max(-1, Math.min(1, R[i] * gain)) * 32767;
  samples.writeInt16LE(l, i * 4);
  samples.writeInt16LE(r, i * 4 + 2);
}

// WAV header
const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + samples.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);        // PCM
header.writeUInt16LE(2, 22);        // stereo
header.writeUInt32LE(SR, 24);
header.writeUInt32LE(SR * 4, 28);   // byte rate
header.writeUInt16LE(4, 32);        // block align
header.writeUInt16LE(16, 34);       // bits
header.write('data', 36);
header.writeUInt32LE(samples.length, 40);

fs.writeFileSync('bgm.wav', Buffer.concat([header, samples]));
console.log('bgm.wav yozildi:', (44 + samples.length), 'bayt,', DUR, 's');
