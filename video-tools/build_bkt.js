// build_bkt.js — MaxPOS in BKT-template style (show-don't-tell demo)
// Solid brand bg, logo top-left always, phone center with swapping screens,
// bottom step captions, tap dots + clicks, ding on receipt, pulse CTA.
// On-screen: "MaxPOS" | Voice: "MaksPOS". Usage: node video-tools/build_bkt.js
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ffmpegPath from 'ffmpeg-static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FFMPEG = ffmpegPath.replace(/\\/g, '/');
const SHOTS = path.join(__dirname, '..', 'shots');
const VOICE = path.join(__dirname, 'voice_bkt');
const TMP = path.join(__dirname, 'clips_bkt');
const OUT = path.join(__dirname, '..', 'MaxPOS-STORIES-PRO-9x16.mp4');
const FONT = 'video-tools/arialbd.ttf';
fs.mkdirSync(TMP, { recursive: true });

const W = 1080, H = 1920, FPS = 30, XF = 0.25;
const INDIGO = '0x4f46e5';

function run(args) {
  execFileSync(FFMPEG, ['-y', ...args], { stdio: ['ignore', 'ignore', 'pipe'] });
}
function probeDur(file) {
  try { execFileSync(FFMPEG, ['-i', file], { stdio: ['ignore', 'pipe', 'pipe'] }); return 0; }
  catch (e) {
    const m = String(e.stderr || '').match(/Duration: (\d+):(\d+):([\d.]+)/);
    return m ? (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]) : 0;
  }
}
const qt = (t) => "'" + String(t).replace(/'/g, "'\\''") + "'";
const clean = (t) => String(t).replace(/'/g, '’');
const ease = (A, E) => `(1-pow(1-min(1,max(0,(t-${A})/${E})),3))`;

// persistent brand header
const logoHdr = () =>
  `drawtext=fontfile=${FONT}:text='MaxPOS':fontsize=62:fontcolor=white:x=80:y=100,` +
  `drawtext=fontfile=${FONT}:text='MODERN POS SYSTEM':fontsize=24:fontcolor=white@0.75:x=84:y=175`;
// bottom step caption (BKT style)
const cap = (text, appear = 0.15) =>
  `drawtext=fontfile=${FONT}:text=${qt(clean(text))}:fontsize=52:fontcolor=white:x=(w-text_w)/2:y=1560:alpha='min(1,(t-${appear})/0.18)'`;
// tap dot (finger tap hint) at x,y appearing at time A for D seconds
const tap = (x, y, A, D = 0.55) => {
  const a = parseFloat(A).toFixed(2), b = (parseFloat(A) + D).toFixed(2);
  return `drawtext=fontfile=${FONT}:text='●':fontsize=100:fontcolor=white:x=${x}:y=${y}:box=1:boxcolor=black@0.45:boxborderw=20:alpha='if(lt(t,${a}),0,if(gt(t,${b}),0,0.5+0.5*abs(sin(6*PI*(t-${a})/${D}))))'`;
};
// light sweep for solid bg life
const sweep = (dur) => `drawbox=x='-500+2000*t/${dur}':y=0:w=260:h=${H}:color=white@0.06:t=fill`;
// progress bar
const progress = (k, total) =>
  `drawbox=x=60:y=230:w=960:h=8:color=white@0.25:t=fill,drawbox=x=60:y=230:w=${(960 * (k + 1) / total).toFixed(0)}:h=8:color=white:t=fill`;

// phone geometry (shots are 900x1600)
const PH = 940, PW = Math.round(PH * 900 / 1600);
const PX = Math.round((W - PW) / 2), PY = 420;
const phoneOverlays =
  `drawbox=x=${PX - 12}:y=${PY - 54}:w=${PW + 24}:h=${PH + 118}:color=0x14142b:t=fill,` +
  `drawbox=x=${PX - 12}:y=${PY - 54}:w=${PW + 24}:h=${PH + 118}:color=white@0.35:t=5,` +
  `drawbox=x=${PX + PW / 2 - 70}:y=${PY - 46}:w=140:h=22:color=black:t=fill`;

// one demo step: same phone position every time (BKT screen-swap feel)
function stepClip(file, dur, o) {
  const { caption, idx, total, k, tapAt = null, zoom = 'in' } = o;
  const frames = Math.round(dur * FPS);
  const z = zoom === 'in' ? `min(1.0+${0.1 / frames}*on,1.12)` : `max(1.1-${0.1 / frames}*on,1.0)`;
  const vf = [
    `color=c=${INDIGO}:s=${W}x${H}:r=${FPS}[v0]`,
    `[v0]${sweep(dur.toFixed(2))}[v1]`,
    `[0:v]scale=-1:${PH},format=yuv420p[phone]`,
    `[v1]${phoneOverlays}[v2]`,
    `[v2][phone]overlay=${PX}:${PY}[v3]`,
    `[v3]zoompan=z='${z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}[v4]`,
    `[v4]${logoHdr()}[v5]`,
    `[v5]${cap(caption)}[v6]`,
    tapAt ? `[v6]${tap(tapAt[0], tapAt[1], (dur - 0.75).toFixed(2))}[v7]` : `[v6]null[v7]`,
    `[v7]${progress(k, total)},format=yuv420p[vout]`,
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
const rise = (text, size, color, y, A) =>
  `drawtext=fontfile=${FONT}:text=${qt(clean(text))}:fontsize=${size}:fontcolor=${color}:x=(w-text_w)/2:y='${y}-60*(1-${ease(A, 0.35)})':alpha='min(1,(t-${A})/0.18)'`;
const pulseBtn = (text, size, color, y, box) =>
  `drawtext=fontfile=${FONT}:text=${qt(clean(text))}:fontsize=${size}:fontcolor=${color}:x=(w-text_w)/2:y=${y}:box=1:boxcolor=${box}:boxborderw=34:alpha='0.8+0.2*sin(2*PI*t*1.8)'`;

// ================= TIMELINE (BKT beats) =================
const TOTAL = 9;
let K = 0; const kk = () => K++;
console.log('Intro...');
const c0 = solidClip({ dur: 2.6, idx: 'intro', total: TOTAL, k: kk(), parts: [
  big('MaxPOS', 170, 'white', 700, 0.3),
  rise("Do'koningiz bitta tizimda", 54, 'white@0.9', 1000, 0.8),
]});
console.log('Demo steps...');
let si = 0;
const steps = [
  ['01_login.png', 2.6, 'Ilovani oching', [545, 1013], 'in'],
  ['03_pos.png', 2.6, 'Mahsulotni tanlang', [457, 831], 'out'],
  ['07_pos_search.png', 2.4, 'Skanerlang', [692, 702], 'in'],
  ['04_cart.png', 2.6, "Savatga qo'shing", [692, 1272], 'out'],
  ['05b_checkout.png', 3.0, 'To’lov — bir zumda', [545, 1184], 'in'],
  ['06_receipt.png', 2.6, 'Chek tayyor', null, 'out'],
  ['02_dashboard.png', 3.0, 'Daromad — real vaqtda', null, 'in'],
].map(([f, d, caption, tapAt, z]) => stepClip(f, d, { caption, idx: ++si, total: TOTAL, k: kk(), tapAt, zoom: z }));
console.log('CTA...');
const c8 = solidClip({ dur: 4.2, idx: 'cta', total: TOTAL, k: kk(), gradient: true, parts: [
  big('MaxPOS', 180, 'white', 520, 0.25),
  rise("Do'koningiz bitta tizimda", 54, '#e0e7ff', 810, 0.7),
  pulseBtn('» Bugun boshlang', 74, '#4f46e5', 1010, 'white@0.95'),
  rise('Kassa · Ombor · Qarzdorlar · Hisobotlar', 40, '#c7d2fe', 1210, 1.6),
  rise("O'zbek · Русский · English", 36, '#818cf8', 1300, 2.0),
]});

const clips = [c0, ...steps, c8];
const durs = [2.6, 2.6, 2.6, 2.4, 2.6, 3.0, 2.6, 3.0, 4.2];
const nT = clips.length - 1;
const totalDur = durs.reduce((a, b) => a + b, 0) - nT * XF;
console.log('Clips:', clips.length, 'total ~', totalDur.toFixed(2));

const inputs = [];
clips.forEach((c) => inputs.push('-i', c));
let filter = '', acc = durs[0];
for (let k = 0; k < nT; k++) {
  const off = acc - XF;
  filter += `${k === 0 ? '[0:v]' : `[v${k - 1}]`}[${k + 1}:v]xfade=transition=fade:duration=${XF}:offset=${off.toFixed(3)}[v${k}];`;
  acc += durs[k + 1] - XF;
}
filter += `[v${nT - 1}]format=yuv420p[vout]`;
fs.writeFileSync(path.join(TMP, 'xfade.txt'), filter);
const noAudio = path.join(TMP, 'video_noaudio.mp4');
console.log('Concat...');
run([...inputs, '-filter_complex_script', path.join(TMP, 'xfade.txt'), '-map', '[vout]', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-r', FPS, '-pix_fmt', 'yuv420p', noAudio]);

// ---- voice ----
const starts = [0];
for (let k = 1; k < durs.length; k++) starts[k] = starts[k - 1] + durs[k - 1] - XF;
// v0 intro, v1 login..cart (clips 1-4), v2 checkout (5), v3 receipt+dashboard (6-7), v4 cta (8)
const vStarts = { v0: 0.3, v1: starts[1] + 0.2, v2: starts[5] + 0.25, v3: starts[6] + 0.2, v4: starts[8] + 0.4 };
console.log('Voice starts:', vStarts);
const vWavs = [];
for (const s of ['v0', 'v1', 'v2', 'v3', 'v4']) {
  const wav = path.join(TMP, `v_${s}.wav`);
  run(['-i', path.join(VOICE, `${s}.mp3`), '-ar', '44100', '-ac', '1', '-af', 'highpass=f=75,lowpass=f=12000,acompressor=threshold=-18dB:ratio=3:attack=8:release=120,loudnorm=I=-16:TP=-1.5:LRA=11,volume=4dB', '-c:a', 'pcm_s16le', wav]);
  vWavs.push(wav);
}

// ---- music + SFX ----
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
  { root: 110.0, notes: [220.0, 261.63, 329.63] },
  { root: 87.31, notes: [174.61, 220.0, 261.63] },
  { root: 130.81, notes: [261.63, 329.63, 392.0] },
  { root: 98.0, notes: [196.0, 246.94, 293.66] },
];
for (let ci = 0; ci * 2.2 < totalDur; ci++) {
  const ch = chords[ci % 4], from = ci * 2.2;
  for (const f of ch.notes) addMix(from, 2.4, 0.05, (t) => {
    const a = Math.min(1, t / 0.4) * Math.min(1, (2.4 - t) / 0.5);
    return (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) * a;
  });
  for (let b = 0; b < 4; b++) {
    const bt = from + b * 0.55; if (bt > totalDur) break;
    addMix(bt, 0.16, 0.42, (t) => Math.sin(2 * Math.PI * (55 + 45 * Math.exp(-t * 20)) * t) * Math.exp(-t * 16));
    addMix(bt, 0.3, 0.12, (t) => Math.sin(2 * Math.PI * ch.root * t) * Math.exp(-t * 9));
    if (from > 4 && b % 2 === 1) addMix(bt, 0.12, 0.1, (t) => (Math.random() * 2 - 1) * Math.exp(-t * 30));
  }
  for (let h = 0; h < 8; h++) {
    const ht = from + h * 0.275; if (ht > totalDur || ht < 2.5) continue;
    addMix(ht, 0.03, 0.05, (t) => (Math.random() * 2 - 1) * Math.exp(-t * 110));
  }
}
addMix(Math.max(0, starts[8] - 1.5), 1.5, 0.09, (t, d) => Math.sin(2 * Math.PI * (250 * Math.pow(10, t / d)) * t) * Math.pow(t / d, 2));
function whoosh(at, vol = 0.2) {
  addMix(at, 0.35, vol, (t, d) => (Math.sin(2 * Math.PI * (400 + 2200 * (t / d)) * t) * 0.5 + (Math.random() * 2 - 1) * 0.5) * Math.sin(Math.PI * t / d));
}
starts.forEach((s, i) => { if (i > 0) whoosh(s - 0.08, 0.2); });
function click(at) { // finger tap: short filtered tick
  addMix(at, 0.07, 0.3, (t) => Math.sin(2 * Math.PI * 2000 * t) * Math.exp(-t * 60));
  addMix(at, 0.05, 0.2, (t) => (Math.random() * 2 - 1) * Math.exp(-t * 90));
}
[starts[1] + 2.6 - 0.6, starts[2] + 2.6 - 0.6, starts[3] + 2.4 - 0.6, starts[4] + 2.6 - 0.6, starts[5] + 3.0 - 0.6].forEach(click);
function impact(at, vol = 0.55) {
  addMix(at, 0.5, vol, (t) => (Math.sin(2 * Math.PI * (70 + 60 * Math.exp(-t * 14)) * t) * 1.2 + (Math.random() * 2 - 1) * 0.3) * Math.exp(-t * 9));
}
impact(0.05, 0.5); impact(starts[8] + 0.02, 0.65);
function ding(at) { // receipt success
  addMix(at, 0.5, 0.22, (t) => (Math.sin(2 * Math.PI * 880 * t) + Math.sin(2 * Math.PI * 1320 * t)) * Math.exp(-t * 8));
}
ding(starts[6] + 0.5);
addMix(starts[8] + 1.0, 0.6, 0.12, (t) => Math.sin(2 * Math.PI * 2093 * t) * Math.exp(-t * 6));
let peak = 0;
for (let k = 0; k < N; k++) peak = Math.max(peak, Math.abs(L[k]));
const g = peak > 0 ? 0.85 / peak : 1;
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
const bgmWav = path.join(TMP, 'bgm.wav');
fs.writeFileSync(bgmWav, Buffer.concat([hdr, pcm]));

// ---- final mix ----
const amap = ['-i', noAudio];
vWavs.forEach((w) => amap.push('-i', w));
amap.push('-i', bgmWav);
const names = ['v0', 'v1', 'v2', 'v3', 'v4'];
const fp = [];
names.forEach((s, k) => {
  const ms = Math.round(vStarts[s] * 1000);
  fp.push(`[${k + 1}:a]adelay=${ms}|${ms}[v${k}]`);
});
fp.push(`${names.map((_, k) => `[v${k}]`).join('')}amix=inputs=5:normalize=0[voice]`);
fp.push(`[voice]asplit=2[voice_out][voice_key]`);
fp.push(`[6:a]volume=0.3[bgm_in];[bgm_in][voice_key]sidechaincompress=threshold=0.02:ratio=8:attack=15:release=400:makeup=1[bgm_duck]`);
fp.push(`[voice_out][bgm_duck]amix=inputs=2:normalize=0[mixpre]`);
fp.push(`[mixpre]loudnorm=I=-14:TP=-1.0:LRA=11,aresample=48000,aformat=channel_layouts=stereo[aout]`);
fs.writeFileSync(path.join(TMP, 'amix.txt'), fp.join(';'));
console.log('Mux...');
run([...amap, '-filter_complex_script', path.join(TMP, 'amix.txt'), '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', totalDur.toFixed(2), '-shortest', OUT]);
console.log('DONE:', OUT);
