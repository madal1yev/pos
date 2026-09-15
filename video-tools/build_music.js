// build_music.js — MaxPOS music-only commercial (BKT-template style, no voice)
// iPhone frame, floating badges, slide screen-swaps, springy captions.
// Audio: soft pleasant music ONLY (no voice, no harsh SFX).
// Usage: node video-tools/build_music.js
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ffmpegPath from 'ffmpeg-static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FFMPEG = ffmpegPath.replace(/\\/g, '/');
const SHOTS = path.join(__dirname, '..', 'shots');
const TMP = path.join(__dirname, 'clips_music');
const OUT = path.join(__dirname, '..', 'MaxPOS-STORIES-PRO-9x16.mp4');
const FONT = 'video-tools/arialbd.ttf';
fs.mkdirSync(TMP, { recursive: true });

const W = 1080, H = 1920, FPS = 30, XF = 0.28;
const INDIGO = '0x4f46e5';

function run(args) {
  execFileSync(FFMPEG, ['-y', ...args], { stdio: ['ignore', 'ignore', 'pipe'] });
}
const qt = (t) => "'" + String(t).replace(/'/g, "'\\''") + "'";
const clean = (t) => String(t).replace(/'/g, '’');
const ease = (A, E) => `(1-pow(1-min(1,max(0,(t-${A})/${E})),3))`;

const logoHdr = () =>
  `drawtext=fontfile=${FONT}:text='MaxPOS':fontsize=62:fontcolor=white:x=80:y=100,` +
  `drawtext=fontfile=${FONT}:text='MODERN POS SYSTEM':fontsize=24:fontcolor=white@0.75:x=84:y=175`;
const cap = (text, appear = 0.15) =>
  `drawtext=fontfile=${FONT}:text=${qt(clean(text))}:fontsize=54:fontcolor=white:x='w-(w-(w-text_w)/2)*${ease(appear, 0.4)}':y=1560:alpha='min(1,(t-${appear})/0.18)'`;
// floating badge chip at screen edge (gently bobbing, like BKT floating QRs)
const chip = (text, side, y, appear, phase, color = 'white', size = 32) => {
  const x = side === 'L' ? '20' : '(w-text_w-20)';
  return `drawtext=fontfile=${FONT}:text=${qt(clean(text))}:fontsize=${size}:fontcolor=${color}:x=${x}:y='${y}+14*sin(2*PI*t/2.6+${phase})':box=1:boxcolor=0x0f172a@0.85:boxborderw=16:alpha='min(1,(t-${appear})/0.25)'`;
};
// tap dot (silent finger-tap hint)
const tap = (x, y, A, D = 0.55) => {
  const a = parseFloat(A).toFixed(2), b = (parseFloat(A) + D).toFixed(2);
  return `drawtext=fontfile=${FONT}:text='●':fontsize=100:fontcolor=white:x=${x}:y=${y}:box=1:boxcolor=black@0.45:boxborderw=20:alpha='if(lt(t,${a}),0,if(gt(t,${b}),0,0.5+0.5*abs(sin(6*PI*(t-${a})/${D}))))'`;
};
const sweep = (dur) => `drawbox=x='-500+2000*t/${dur}':y=0:w=260:h=${H}:color=white@0.06:t=fill`;
const progress = (k, total) =>
  `drawbox=x=60:y=230:w=960:h=8:color=white@0.25:t=fill,drawbox=x=60:y=230:w=${(960 * (k + 1) / total).toFixed(0)}:h=8:color=white:t=fill`;

// ---- iPhone frame geometry (shots 900x1600) ----
const PH = 940, PW = Math.round(PH * 900 / 1600);
const PX = Math.round((W - PW) / 2), PY = 420;
const iphoneFrame =
  `drawbox=x=${PX - 16}:y=${PY - 60}:w=${PW + 32}:h=${PH + 128}:color=0x0b0b15:t=fill,` +
  `drawbox=x=${PX - 16}:y=${PY - 60}:w=${PW + 32}:h=${PH + 128}:color=white@0.4:t=4,` +
  `drawbox=x=${PX - 20}:y=${PY + 130}:w=6:h=80:color=0x2a2a3d:t=fill,` +   // left button 1
  `drawbox=x=${PX - 20}:y=${PY + 230}:w=6:h=130:color=0x2a2a3d:t=fill,` +  // left button 2
  `drawbox=x=${PX + PW + 14}:y=${PY + 170}:w=6:h=150:color=0x2a2a3d:t=fill,` + // right button
  `drawbox=x=${PX + PW / 2 - 78}:y=${PY - 50}:w=156:h=28:color=black:t=fill`; // Dynamic Island

function stepClip(file, dur, o) {
  const { caption, idx, total, k, tapAt = null, chips = [], zoom = 'in' } = o;
  const frames = Math.round(dur * FPS);
  const z = zoom === 'in' ? `min(1.0+${0.12 / frames}*on,1.14)` : `max(1.12-${0.12 / frames}*on,1.0)`;
  const vf = [
    `color=c=${INDIGO}:s=${W}x${H}:r=${FPS}[v0]`,
    `[v0]${sweep(dur.toFixed(2))}[v1]`,
    `[0:v]scale=-1:${PH},format=yuv420p[phone]`,
    `[v1]${iphoneFrame}[v2]`,
    `[v2][phone]overlay=${PX}:${PY}[v3]`,
    `[v3]zoompan=z='${z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}[v4]`,
    `[v4]${logoHdr()}[v5]`,
    `[v5]${cap(caption)}[v6]`,
    ...chips.map((c, i) => { const L = `[v${6 + i}]${chip(c[0], c[1], c[2], 0.5 + i * 0.25, (k * 1.3 + i * 2.1).toFixed(2), c[3] || 'white', c[4] || 32)}[v${7 + i}]`; return L; }),
    `[v${6 + chips.length}]${tapAt ? tap(tapAt[0], tapAt[1], (dur - 0.75).toFixed(2)) : 'null'}[vx]`,
    `[vx]${progress(k, total)},format=yuv420p[vout]`,
  ].join(';');
  const out = path.join(TMP, `step${idx}.mp4`);
  fs.writeFileSync(path.join(TMP, `vf_step${idx}.txt`), vf);
  run(['-i', path.join(SHOTS, file), '-filter_complex_script', path.join(TMP, `vf_step${idx}.txt`), '-map', '[vout]', '-frames:v', frames, '-r', FPS, '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', out]);
  return out;
}

function solidClip({ dur, idx, total, k, gradient = false, parts = [] }) {
  const frames = Math.round(dur * FPS);
  const base = gradient
    ? `gradients=s=${W}x${H}:c0=0x4f46e5:c1=0x17103f:x0=0:y0=0:x1=${W}:y1=${H}:r=${FPS}[v0]`
    : `color=c=${INDIGO}:s=${W}x${H}:r=${FPS}[v0]`;
  const chain = [base, `[v0]${sweep(dur.toFixed(2))}[v1]`, `[v1]${logoHdr()}[v2]`];
  let cur = 'v2', n = 3;
  for (const p of parts) { chain.push(`[${cur}]${p}[v${n}]`); cur = `v${n}`; n++; }
  chain.push(`[${cur}]${progress(k, total)},format=yuv420p[vout]`);
  const out = path.join(TMP, `solid${idx}.mp4`);
  fs.writeFileSync(path.join(TMP, `vf_solid${idx}.txt`), chain.join(';'));
  run(['-filter_complex_script', path.join(TMP, `vf_solid${idx}.txt`), '-map', '[vout]', '-frames:v', frames, '-r', FPS, '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', out]);
  return out;
}
const big = (text, size, color, y, A, E = 0.4) =>
  `drawtext=fontfile=${FONT}:text=${qt(clean(text))}:fontsize=${size}:fontcolor=${color}:x='w-(w-(w-text_w)/2)*${ease(A, E)}':y=${y}:alpha='min(1,(t-${A})/0.18)'`;
const rise = (text, size, color, y, A, box = null, bw = 22) => {
  const b = box ? `:box=1:boxcolor=${box}:boxborderw=${bw}` : ':box=0';
  return `drawtext=fontfile=${FONT}:text=${qt(clean(text))}:fontsize=${size}:fontcolor=${color}:x=(w-text_w)/2:y='${y}-60*(1-${ease(A, 0.35)})'${b}:alpha='min(1,(t-${A})/0.18)'`;
};
const pulseBtn = (text, size, color, y, box) =>
  `drawtext=fontfile=${FONT}:text=${qt(clean(text))}:fontsize=${size}:fontcolor=${color}:x=(w-text_w)/2:y=${y}:box=1:boxcolor=${box}:boxborderw=34:alpha='0.8+0.2*sin(2*PI*t*1.8)'`;

// ================= TIMELINE =================
const TOTAL = 9;
let K = 0; const kk = () => K++;
console.log('Intro...');
const c0 = solidClip({ dur: 2.8, idx: 'intro', total: TOTAL, k: kk(), parts: [
  big('MaxPOS', 170, 'white', 640, 0.3),
  rise("Do'koningiz bitta tizimda", 56, 'white@0.92', 950, 0.8),
  rise('» Tez   » Oson   » Aqlli', 44, '#c7d2fe', 1100, 1.2, '0x0f172a@0.7', 20),
]});
console.log('Demo steps...');
let si = 0;
const steps = [
  ['01_login.png', 2.6, 'Ilovani oching', [545, 1013], [['» Oson', 'L', 700, '#6ee7b7'], ['Naqd·Karta', 'R', 1000, 'white']], 'in'],
  ['03_pos.png', 2.6, 'Mahsulotni tanlang', [457, 831], [['» Tez', 'L', 720, '#6ee7b7'], ['SALE', 'R', 1020, '#fbbf24', 36]], 'out'],
  ['07_pos_search.png', 2.4, 'Skanerlang', [692, 702], [['Shtrix·QR', 'L', 700, 'white'], ['» 1 soniya', 'R', 1000, '#a5b4fc']], 'in'],
  ['04_cart.png', 2.6, "Savatga qo'shing", [692, 1272], [['Promo-kod', 'L', 700, '#fbbf24'], ['» Chegirma', 'R', 1000, 'white']], 'out'],
  ['05b_checkout.png', 3.0, 'To’lov — bir zumda', [545, 1184], [['» Qaytim', 'L', 700, '#6ee7b7'], ['Naqd·Karta', 'R', 1000, 'white']], 'in'],
  ['06_receipt.png', 2.6, 'Chek tayyor', null, [['» Tasdiqlandi', 'L', 700, '#6ee7b7'], ['80mm chek', 'R', 1000, 'white']], 'out'],
  ['02_dashboard.png', 3.0, 'Daromad — real vaqtda', null, [['» Real vaqt', 'L', 700, '#6ee7b7'], ['Kun·Oy·Yil', 'R', 1000, 'white']], 'in'],
].map(([f, d, caption, tapAt, chips, z]) => stepClip(f, d, { caption, idx: ++si, total: TOTAL, k: kk(), tapAt, chips, zoom: z }));
console.log('CTA...');
const c8 = solidClip({ dur: 4.4, idx: 'cta', total: TOTAL, k: kk(), gradient: true, parts: [
  rise('● TASDIQLANDI', 54, '#6ee7b7', 300, 0.3, '0x0f172a@0.8', 20),
  big('MaxPOS', 180, 'white', 560, 0.5),
  rise("Do'koningiz bitta tizimda", 54, '#e0e7ff', 850, 1.0),
  pulseBtn('» Bugun boshlang', 74, '#4f46e5', 1040, 'white@0.95'),
  rise('Kassa · Ombor · Qarzdorlar · Hisobotlar', 40, '#c7d2fe', 1230, 1.8),
  rise("O'zbek · Русский · English", 36, '#818cf8', 1320, 2.2),
]});

const clips = [c0, ...steps, c8];
const durs = [2.8, 2.6, 2.6, 2.4, 2.6, 3.0, 2.6, 3.0, 4.4];
const nT = clips.length - 1;
const totalDur = durs.reduce((a, b) => a + b, 0) - nT * XF;
console.log('Clips:', clips.length, 'total ~', totalDur.toFixed(2));

const inputs = [];
clips.forEach((c) => inputs.push('-i', c));
let filter = '', acc = durs[0];
for (let k = 0; k < nT; k++) {
  const off = acc - XF;
  const tr = k === nT - 1 ? 'fadewhite' : (k % 2 ? 'slideleft' : 'smoothleft');
  filter += `${k === 0 ? '[0:v]' : `[v${k - 1}]`}[${k + 1}:v]xfade=transition=${tr}:duration=${XF}:offset=${off.toFixed(3)}[v${k}];`;
  acc += durs[k + 1] - XF;
}
filter += `[v${nT - 1}]format=yuv420p[vout]`;
fs.writeFileSync(path.join(TMP, 'xfade.txt'), filter);
const noAudio = path.join(TMP, 'video_noaudio.mp4');
console.log('Concat...');
run([...inputs, '-filter_complex_script', path.join(TMP, 'xfade.txt'), '-map', '[vout]', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-r', FPS, '-pix_fmt', 'yuv420p', noAudio]);

// ---- SOFT music only (warm pads + gentle plucks, zero noise sources) ----
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
  for (const f of notes) addMix(from, 2.8, 0.045, (t) => {
    const a = Math.min(1, t / 0.8) * Math.min(1, (2.8 - t) / 0.8);
    return (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(4 * Math.PI * f * t)) * a;
  });
}
// gentle pentatonic plucks
const pluckScale = [523.25, 587.33, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33];
for (let i = 0; i * 0.65 < totalDur; i++) {
  const at = 1.2 + i * 0.65; if (at > totalDur - 0.5) break;
  const f = pluckScale[i % pluckScale.length];
  const vol = (i % 4 === 0) ? 0.075 : 0.05;
  addMix(at, 0.9, vol, (t) => (Math.sin(2 * Math.PI * f * t) + 0.4 * Math.sin(4 * Math.PI * f * t) + 0.15 * Math.sin(6 * Math.PI * f * t)) * Math.exp(-t * 4));
}
// feather-soft kick on 1 & 3 + warm bass
for (let ci = 0; ci * 2.6 < totalDur; ci++) {
  const from = ci * 2.6, roots = [110.0, 87.31, 130.81, 98.0], r = roots[ci % 4];
  for (const b of [0, 1.3]) {
    const bt = from + b; if (bt > totalDur) continue;
    addMix(bt, 0.22, 0.16, (t) => Math.sin(2 * Math.PI * (48 + 30 * Math.exp(-t * 18)) * t) * Math.exp(-t * 12));
    addMix(bt, 0.5, 0.07, (t) => Math.sin(2 * Math.PI * r * t) * Math.exp(-t * 6));
  }
}
let peak = 0;
for (let k = 0; k < N; k++) peak = Math.max(peak, Math.abs(L[k]));
const g = peak > 0 ? 0.8 / peak : 1;
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
const bgmWav = path.join(TMP, 'bgm_soft.wav');
fs.writeFileSync(bgmWav, Buffer.concat([hdr, pcm]));
console.log('Soft BGM done', (pcm.length / 4 / SR).toFixed(1) + 's');

console.log('Mux...');
run(['-i', noAudio, '-i', bgmWav, '-filter_complex', '[1:a]loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,aformat=channel_layouts=stereo[aout]', '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-t', totalDur.toFixed(2), '-shortest', OUT]);
console.log('DONE:', OUT);
