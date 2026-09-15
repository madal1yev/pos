// build_pos_final.js — MaxPOS Professional Promo Video (BKT-template style)
// iPhone mockup, screen-swaps, floating chips, smooth transitions, soft BGM
// Output: POS/MaxPOS-Reklama.mp4 (1080x1920, 9:16 Stories/Reels)
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ffmpegPath from 'ffmpeg-static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FFMPEG = ffmpegPath.replace(/\\/g, '/');
const SHOTS = path.join(__dirname, '..', 'shots');
const TMP = path.join(__dirname, 'clips_final');
const OUT = path.join(__dirname, '..', 'POS', 'MaxPOS-Reklama.mp4');
const FONT = 'video-tools/arialbd.ttf';
fs.mkdirSync(TMP, { recursive: true });

const W = 1080, H = 1920, FPS = 30, XF = 0.32;
const INDIGO = '0x4f46e5', DARK = '0x0f172a';

function run(args) {
  execFileSync(FFMPEG, ['-y', ...args], { stdio: ['ignore', 'ignore', 'pipe'] });
}
const qt = (t) => "'" + String(t).replace(/'/g, "'\\''") + "'";
const clean = (t) => String(t).replace(/'/g, '\u2019').replace(/\u2713/g, '\u25cf');
const ease = (A, E) => `(1-pow(1-min(1,max(0,(t-${A})/${E})),3))`;

// ── iPhone frame ──
const PH = 940, PW = Math.round(PH * 900 / 1600);
const PX = Math.round((W - PW) / 2), PY = 420;
const iphoneFrame = [
  `drawbox=x=${PX - 18}:y=${PY - 64}:w=${PW + 36}:h=${PH + 136}:color=0x080812:t=fill`,
  `drawbox=x=${PX - 18}:y=${PY - 64}:w=${PW + 36}:h=${PH + 136}:color=white@0.35:t=4`,
  `drawbox=x=${PX - 22}:y=${PY + 120}:w=5:h=70:color=0x2a2a3d:t=fill`,
  `drawbox=x=${PX - 22}:y=${PY + 215}:w=5:h=120:color=0x2a2a3d:t=fill`,
  `drawbox=x=${PX + PW + 17}:y=${PY + 160}:w=5:h=140:color=0x2a2a3d:t=fill`,
  `drawbox=x=${PX + PW / 2 - 80}:y=${PY - 54}:w=160:h=30:color=black:t=fill`,
].join(',');

// ── helpers (all x/y values properly quoted) ──
const sweep = (dur) => `drawbox=x='-400+1800*t/${dur}':y=0:w=240:h=${H}:color=white@0.05:t=fill`;
const progress = (k, total) =>
  `drawbox=x=60:y=220:w=960:h=8:color=white@0.22:t=fill,` +
  `drawbox=x=60:y=220:w=${(960 * (k + 1) / total).toFixed(0)}:h=8:color=white:t=fill`;
const logoHdr = () =>
  `drawtext=fontfile=${FONT}:text='MaxPOS':fontsize=58:fontcolor=white:x=82:y=95,` +
  `drawtext=fontfile=${FONT}:text='SMART POS SYSTEM':fontsize=22:fontcolor=white@0.7:x=86:y=162`;
const big = (text, size, color, y, A, E = 0.45) =>
  `drawtext=fontfile=${FONT}:text=${qt(clean(text))}:fontsize=${size}:fontcolor=${color}` +
  `:x='w-(w-(w-text_w)/2)*${ease(A, E)}':y=${y}:alpha='min(1,(t-${A})/0.2)'`;
const rise = (text, size, color, y, A, box = null, bw = 22) => {
  const b = box ? `:box=1:boxcolor=${box}:boxborderw=${bw}` : '';
  return `drawtext=fontfile=${FONT}:text=${qt(clean(text))}:fontsize=${size}:fontcolor=${color}` +
    `:x=(w-text_w)/2:y='${y}-55*(1-${ease(A, 0.35)})'${b}:alpha='min(1,(t-${A})/0.2)'`;
};
const chip = (text, side, y, appear, phase, color = 'white', size = 30) => {
  const x = side === 'L' ? '28' : '(w-text_w-28)';
  return `drawtext=fontfile=${FONT}:text=${qt(clean(text))}:fontsize=${size}:fontcolor=${color}` +
    `:x=${x}:y='${y}+12*sin(2*PI*t/2.4+${phase})':box=1:boxcolor=${DARK}@0.88:boxborderw=14:alpha='min(1,(t-${appear})/0.2)'`;
};
const tap = (x, y, A, D = 0.5) => {
  const a = parseFloat(A).toFixed(2), b = (parseFloat(A) + D).toFixed(2);
  return `drawtext=fontfile=${FONT}:text=${qt('\u25cf')}:fontsize=90:fontcolor=white` +
    `:x=${x}:y=${y}:box=1:boxcolor=black@0.4:boxborderw=18` +
    `:alpha='if(lt(t,${a}),0,if(gt(t,${b}),0,0.5+0.5*abs(sin(6*PI*(t-${a})/${D}))))'`;
};
const solidBg = `color=c=${INDIGO}:s=${W}x${H}:r=${FPS}`;
const gradBg = `gradients=s=${W}x${H}:c0=${INDIGO}:c1=0x17103f:x0=0:y0=0:x1=${W}:y1=${H}:r=${FPS}`;

// ═══════════════════════════════════════
//  STEP CLIP (screenshot inside iPhone mockup)
// ═══════════════════════════════════════
function stepClip(file, dur, o) {
  const { caption, idx, total, k, tapAt = null, chips = [], zoom = 'in' } = o;
  const frames = Math.round(dur * FPS);
  const z = zoom === 'in'
    ? `min(1.0+${0.14 / frames}*on,1.16)`
    : `max(1.14-${0.14 / frames}*on,1.0)`;

  const vf = [
    `${gradBg}[v0]`,
    `[v0]${sweep(dur.toFixed(2))}[v1]`,
    `[0:v]scale=-1:${PH},format=yuv420p[phone]`,
    `[v1]${iphoneFrame}[v2]`,
    `[v2][phone]overlay=${PX}:${PY}[v3]`,
    `[v3]zoompan=z='${z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}[v4]`,
    `[v4]${logoHdr()}[v5]`,
    `[v5]drawtext=fontfile=${FONT}:text=${qt(clean(caption))}:fontsize=52:fontcolor=white:x=(w-text_w)/2:y=1530:alpha='min(1,(t-0.12)/0.2)'[v6]`,
  ];

  let last = 'v6', n = 7;
  for (let i = 0; i < chips.length; i++) {
    const c = chips[i];
    vf.push(`[${last}]${chip(c[0], c[1], c[2], 0.4 + i * 0.2, (k * 1.5 + i * 2.3).toFixed(2), c[3] || 'white', c[4] || 30)}[v${n}]`);
    last = `v${n}`; n++;
  }
  if (tapAt) {
    vf.push(`[${last}]${tap(tapAt[0], tapAt[1], (dur - 0.65).toFixed(2))}[v${n}]`);
    last = `v${n}`; n++;
  }
  vf.push(`[${last}]${progress(k, total)},format=yuv420p[vout]`);

  const out = path.join(TMP, `step${idx}.mp4`);
  fs.writeFileSync(path.join(TMP, `vf_step${idx}.txt`), vf.join(';'));
  run(['-i', path.join(SHOTS, file), '-filter_complex_script', path.join(TMP, `vf_step${idx}.txt`),
    '-map', '[vout]', '-frames:v', frames, '-r', FPS, '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', out]);
  return out;
}

// ═══════════════════════════════════════
//  SOLID TEXT CLIP
// ═══════════════════════════════════════
function solidClip({ dur, idx, total, k, gradient = false, parts = [] }) {
  const frames = Math.round(dur * FPS);
  const chain = [
    `${gradient ? gradBg : solidBg}[v0]`,
    `[v0]${sweep(dur.toFixed(2))}[v1]`,
    `[v1]${logoHdr()}[v2]`,
  ];
  let cur = 'v2', n = 3;
  for (const p of parts) { chain.push(`[${cur}]${p}[v${n}]`); cur = `v${n}`; n++; }
  chain.push(`[${cur}]${progress(k, total)},format=yuv420p[vout]`);
  const out = path.join(TMP, `solid${idx}.mp4`);
  fs.writeFileSync(path.join(TMP, `vf_solid${idx}.txt`), chain.join(';'));
  run(['-filter_complex_script', path.join(TMP, `vf_solid${idx}.txt`),
    '-map', '[vout]', '-frames:v', frames, '-r', FPS, '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', out]);
  return out;
}

const pulseBtn = (text, size, color, y, box) =>
  `drawtext=fontfile=${FONT}:text=${qt(clean(text))}:fontsize=${size}:fontcolor=${color}` +
  `:x=(w-text_w)/2:y=${y}:box=1:boxcolor=${box}:boxborderw=34` +
  `:alpha='0.8+0.2*sin(2*PI*t*1.8)'`;

// ═══════════════════════════════════════
//  TIMELINE
// ═══════════════════════════════════════
const TOTAL = 10;
let K = 0;
const kk = () => K++;

console.log('S0 \u2014 Intro...');
const c0 = solidClip({ dur: 3.0, idx: 'intro', total: TOTAL, k: kk(), gradient: true, parts: [
  big('MaxPOS', 175, 'white', 620, 0.3),
  rise("Do\u2019koningiz bitta tizimda", 54, 'white@0.92', 900, 0.8),
  rise('\u00bb Tez   \u00bb Oson   \u00bb Aqlli', 42, '#c7d2fe', 1060, 1.3, `${DARK}@0.7`, 18),
]});

console.log('S1-S7 \u2014 Demo steps...');
let si = 0;
const steps = [
  ['01_login.png',       2.8, 'Ilovani oching',              [545, 1013], [['\u00bb Oson', 'L', 690, '#6ee7b7'], ['Naqd\u00b7Karta', 'R', 990, 'white']], 'in'],
  ['03_pos.png',         2.8, 'Mahsulotni tanlang',          [457, 831],  [['\u00bb Tez', 'L', 710, '#6ee7b7'], ['SALE', 'R', 1010, '#fbbf24', 34]], 'out'],
  ['07_pos_search.png',  2.5, 'Skanerlang',                  [692, 702],  [['Shtrix\u00b7QR', 'L', 700, 'white'], ['\u00bb 1 soniya', 'R', 1000, '#a5b4fc']], 'in'],
  ['04_cart.png',        2.8, 'Savatga qo\u2019shing',       [692, 1272], [['Promo-kod', 'L', 700, '#fbbf24'], ['\u00bb Chegirma', 'R', 1000, 'white']], 'out'],
  ['05b_checkout.png',   3.2, "To'lov \u2014 bir zumda",     [545, 1184], [['\u00bb Qaytim', 'L', 700, '#6ee7b7'], ['Naqd\u00b7Karta', 'R', 1000, 'white']], 'in'],
  ['06_receipt.png',     2.8, 'Chek tayyor',                 null,       [['\u00bb Tasdiqlandi', 'L', 700, '#6ee7b7'], ['80mm chek', 'R', 1000, 'white']], 'out'],
  ['02_dashboard.png',   3.2, 'Daromad \u2014 real vaqtda',  null,       [['\u00bb Real vaqt', 'L', 700, '#6ee7b7'], ['Kun\u00b7Oy\u00b7Yil', 'R', 1000, 'white']], 'in'],
].map(([f, d, caption, tapAt, chips, z]) => stepClip(f, d, { caption, idx: ++si, total: TOTAL, k: kk(), tapAt, chips, zoom: z }));

console.log('S8 \u2014 Benefits...');
const c8 = solidClip({ dur: 3.0, idx: 'benefits', total: TOTAL, k: kk(), gradient: true, parts: [
  big('MaxPOS', 160, 'white', 440, 0.3),
  rise('\u25cf Kassa', 48, '#6ee7b7', 660, 0.7, `${DARK}@0.6`, 16),
  rise('\u25cf Ombor', 48, '#6ee7b7', 760, 1.0, `${DARK}@0.6`, 16),
  rise('\u25cf Qarzdorlar', 48, '#6ee7b7', 860, 1.3, `${DARK}@0.6`, 16),
  rise('\u25cf Hisobotlar', 48, '#6ee7b7', 960, 1.6, `${DARK}@0.6`, 16),
  rise("O'zbek \u00b7 Русский \u00b7 English", 34, '#818cf8', 1120, 2.0),
]});

console.log('S9 \u2014 CTA...');
const c9 = solidClip({ dur: 4.6, idx: 'cta', total: TOTAL, k: kk(), gradient: true, parts: [
  rise('\u25cf TASDIQLANDI', 50, '#6ee7b7', 280, 0.3, `${DARK}@0.8`, 18),
  big('MaxPOS', 185, 'white', 520, 0.5),
  rise("Do\u2019koningiz bitta tizimda", 52, '#e0e7ff', 830, 1.0),
  pulseBtn('\u00bb Bugun boshlang', 72, '#4f46e5', 1020, 'white@0.95'),
  rise('Kassa \u00b7 Ombor \u00b7 Qarzdorlar \u00b7 Hisobotlar', 38, '#c7d2fe', 1210, 1.8),
  rise("O'zbek \u00b7 Русский \u00b7 English", 34, '#818cf8', 1310, 2.2),
]});

// ═══════════════════════════════════════
//  CONCAT with xfade
// ═══════════════════════════════════════
const clips = [c0, ...steps, c8, c9];
const durs = [3.0, 2.8, 2.8, 2.5, 2.8, 3.2, 2.8, 3.2, 3.0, 4.6];
const nT = clips.length - 1;
const totalDur = durs.reduce((a, b) => a + b, 0) - nT * XF;
console.log('Clips:', clips.length, 'total ~', totalDur.toFixed(2));

const inputs = [];
clips.forEach((c) => inputs.push('-i', c));
let filter = '', acc = durs[0];
for (let k = 0; k < nT; k++) {
  const off = acc - XF;
  const tr = k === nT - 1 ? 'fadewhite' : (k % 3 === 0 ? 'slideleft' : k % 3 === 1 ? 'smoothleft' : 'fade');
  filter += `${k === 0 ? '[0:v]' : `[v${k - 1}]`}[${k + 1}:v]xfade=transition=${tr}:duration=${XF}:offset=${off.toFixed(3)}[v${k}];`;
  acc += durs[k + 1] - XF;
}
filter += `[v${nT - 1}]format=yuv420p[vout]`;
fs.writeFileSync(path.join(TMP, 'xfade.txt'), filter);
const noAudio = path.join(TMP, 'video_noaudio.mp4');
console.log('Concat + xfade...');
run([...inputs, '-filter_complex_script', path.join(TMP, 'xfade.txt'),
  '-map', '[vout]', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-r', FPS, '-pix_fmt', 'yuv420p', noAudio]);

// ═══════════════════════════════════════
//  SOFT BGM
// ═══════════════════════════════════════
const SR = 44100, N = Math.ceil(totalDur * SR);
const L = new Float32Array(N);
function addMix(from, dur, amp, gen) {
  const s0 = Math.floor(from * SR), len = Math.floor(dur * SR);
  for (let k = 0; k < len; k++) {
    const idx = s0 + k; if (idx >= N) break;
    L[idx] += gen(k / SR, dur) * amp;
  }
}
const chords = [
  [220.0, 261.63, 329.63, 440.0],
  [174.61, 220.0, 261.63, 349.23],
  [261.63, 329.63, 392.0, 523.25],
  [196.0, 246.94, 293.66, 392.0],
];
for (let ci = 0; ci * 2.6 < totalDur; ci++) {
  const notes = chords[ci % 4], from = ci * 2.6;
  for (const f of notes) addMix(from, 2.8, 0.042, (t) => {
    const a = Math.min(1, t / 0.8) * Math.min(1, (2.8 - t) / 0.8);
    return (Math.sin(2 * Math.PI * f * t) + 0.22 * Math.sin(4 * Math.PI * f * t)) * a;
  });
}
const pluckScale = [523.25, 587.33, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33];
for (let i = 0; i * 0.62 < totalDur; i++) {
  const at = 1.0 + i * 0.62; if (at > totalDur - 0.5) break;
  const f = pluckScale[i % pluckScale.length];
  addMix(at, 0.85, 0.055, (t) => (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(4 * Math.PI * f * t) + 0.12 * Math.sin(6 * Math.PI * f * t)) * Math.exp(-t * 4.2));
}
for (let ci = 0; ci * 2.6 < totalDur; ci++) {
  const from = ci * 2.6, roots = [110.0, 87.31, 130.81, 98.0], r = roots[ci % 4];
  for (const b of [0, 1.3]) {
    const bt = from + b; if (bt > totalDur) continue;
    addMix(bt, 0.2, 0.14, (t) => Math.sin(2 * Math.PI * (46 + 28 * Math.exp(-t * 18)) * t) * Math.exp(-t * 12));
    addMix(bt, 0.45, 0.06, (t) => Math.sin(2 * Math.PI * r * t) * Math.exp(-t * 6));
  }
}
let peak = 0;
for (let k = 0; k < N; k++) peak = Math.max(peak, Math.abs(L[k]));
const g = peak > 0 ? 0.82 / peak : 1;
const pcm = Buffer.alloc(N * 4);
for (let k = 0; k < N; k++) {
  const s = Math.round(Math.max(-1, Math.min(1, L[k] * g)) * 32767);
  pcm.writeInt16LE(s, k * 4); pcm.writeInt16LE(s, k * 4 + 2);
}
const hdr = Buffer.alloc(44);
hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + pcm.length, 4); hdr.write('WAVE', 8);
hdr.write('fmt ', 12); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22);
hdr.writeUInt32LE(SR, 24); hdr.writeUInt32LE(SR * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34);
hdr.write('data', 36); hdr.writeUInt32LE(pcm.length, 40);
const bgmWav = path.join(TMP, 'bgm_final.wav');
fs.writeFileSync(bgmWav, Buffer.concat([hdr, pcm]));
console.log('Soft BGM done', (pcm.length / 4 / SR).toFixed(1) + 's');

// ═══════════════════════════════════════
//  FINAL MUX
// ═══════════════════════════════════════
console.log('Final mux...');
run(['-i', noAudio, '-i', bgmWav,
  '-filter_complex', '[1:a]loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,aformat=channel_layouts=stereo[aout]',
  '-map', '0:v', '-map', '[aout]',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000',
  '-t', totalDur.toFixed(2), '-shortest', OUT]);
console.log('DONE:', OUT);
