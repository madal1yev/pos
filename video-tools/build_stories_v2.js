// build_stories_v2.js — MaxPOS modern commercial 9:16 (1080x1920)
// Kinetic typography (slide/rise/pulse), phone mockups, giant bg words,
// light sweeps, whip stingers, flash into CTA, beat-synced SFX, ducked BGM.
// Usage: node video-tools/build_stories_v2.js
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ffmpegPath from 'ffmpeg-static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FFMPEG = ffmpegPath.replace(/\\/g, '/');
const SHOTS = path.join(__dirname, '..', 'shots');
const VOICE = path.join(__dirname, 'voice_pro');
const TMP = path.join(__dirname, 'clips_v2');
const OUT = path.join(__dirname, '..', 'MaxPOS-STORIES-PRO-9x16.mp4');
// NOTE: relative font path (no drive colon) — absolute C:/ paths silently fall back to serif
const FONT = 'video-tools/arialbd.ttf';
fs.mkdirSync(TMP, { recursive: true });

const W = 1080, H = 1920, FPS = 30, XF = 0.32;
const S6_TEMPO = 1.4; // stinger voice speedup (energetic)

function run(args) {
  execFileSync(FFMPEG, ['-y', ...args], { stdio: ['ignore', 'ignore', 'pipe'] });
}
function probeDur(file) {
  try {
    execFileSync(FFMPEG, ['-i', file], { stdio: ['ignore', 'pipe', 'pipe'] });
    return 0;
  } catch (e) {
    const m = String(e.stderr || '').match(/Duration: (\d+):(\d+):([\d.]+)/);
    if (!m) return 0;
    return (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]);
  }
}
const qt = (t) => "'" + String(t).replace(/'/g, "'\\''") + "'";
const clean = (t) => String(t).replace(/'/g, '’').replace(/✕/g, '×').replace(/▶/g, '»');
const ease = (A, E) => `(1-pow(1-min(1,max(0,(t-${A})/${E})),3))`;

// ---- text primitives ----
function T({ text, size, color, y, appear = 0, box = null, bw = 22 }) {
  const a = appear > 0 ? `alpha='if(lt(t,${appear}),0,min(1,(t-${appear})/0.22))'` : 'alpha=1';
  const b = box ? `:box=1:boxcolor=${box}:boxborderw=${bw}` : ':box=0';
  return `drawtext=fontfile=${FONT}:text=${qt(clean(text))}:fontsize=${size}:fontcolor=${color}:x=(w-text_w)/2:y=${y}${b}:${a}`;
}
function slideR({ text, size, color, y, appear, E = 0.45, box = null, bw = 22 }) {
  const b = box ? `:box=1:boxcolor=${box}:boxborderw=${bw}` : ':box=0';
  return `drawtext=fontfile=${FONT}:text=${qt(clean(text))}:fontsize=${size}:fontcolor=${color}:x='w-(w-(w-text_w)/2)*${ease(appear, E)}':y=${y}${b}:alpha='min(1,(t-${appear})/0.18)'`;
}
function slideL({ text, size, color, y, appear, E = 0.45, box = null, bw = 22 }) {
  const b = box ? `:box=1:boxcolor=${box}:boxborderw=${bw}` : ':box=0';
  return `drawtext=fontfile=${FONT}:text=${qt(clean(text))}:fontsize=${size}:fontcolor=${color}:x='(0-w+text_w)+(w-(w-text_w)/2-(0-w+text_w))*${ease(appear, E)}':y=${y}${b}:alpha='min(1,(t-${appear})/0.18)'`;
}
function rise({ text, size, color, y, appear, E = 0.4, box = null, bw = 22 }) {
  const b = box ? `:box=1:boxcolor=${box}:boxborderw=${bw}` : ':box=0';
  return `drawtext=fontfile=${FONT}:text=${qt(clean(text))}:fontsize=${size}:fontcolor=${color}:x=(w-text_w)/2:y='${y}-70*(1-${ease(appear, E)})'${b}:alpha='min(1,(t-${appear})/0.18)'`;
}
function giant(word, y, drift = 40) {
  return `drawtext=fontfile=${FONT}:text=${qt(clean(word))}:fontsize=230:fontcolor=white@0.055:x='(w-text_w)/2-${drift}*t/5':y=${y}`;
}
function sweep(dur, delay = 0) {
  return `drawbox=x='-500+2000*(t-${delay})/${dur}':y=0:w=260:h=${H}:color=white@0.06:t=fill`;
}
function progress(k, total) {
  const frac = ((k + 1) / total).toFixed(3);
  return `drawbox=x=60:y=110:w=960:h=10:color=white@0.22:t=fill,drawbox=x=60:y=110:w=${(960 * (k + 1) / total).toFixed(0)}:h=10:color=0x6366f1:t=fill`;
}

// ---- phone mockup card (sources are 900x1600 portrait) ----
function cardClip(file, dur, o) {
  const { caption, sub = '', giantWord = '', capColor = 'white', idx, total, k, zoom = 'in' } = o;
  const frames = Math.round(dur * FPS);
  const zExpr = zoom === 'in' ? `min(1.0+${0.16 / frames}*on,1.2)` : `max(1.18-${0.16 / frames}*on,1.0)`;
  const PH = 1000, PW = Math.round(PH * 900 / 1600); // 562x1000
  const px = Math.round((W - PW) / 2), py = 560;
  const vf = [
    `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=42:2,eq=brightness=-0.24:saturation=0.85[bg]`,
    giantWord ? `[bg]${giant(giantWord, 880)}[bgg]` : `[bg]null[bgg]`,
    `[0:v]scale=-1:${PH},format=yuv420p[phone]`,
    `[bgg]drawbox=x=${px - 12}:y=${py - 56}:w=${PW + 24}:h=${PH + 120}:color=0x1e293b:t=fill[v0]`,
    `[v0][phone]overlay=${px}:${py}[v1]`,
    `[v1]drawbox=x=${px - 12}:y=${py - 56}:w=${PW + 24}:h=${PH + 120}:color=white@0.3:t=4[v2]`,
    `[v2]drawbox=x=${px + PW / 2 - 70}:y=${py - 48}:w=140:h=22:color=black:t=fill[v3]`,
    `[v3]zoompan=z='${zExpr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}[v4]`,
    `[v4]${slideR({ text: caption, size: 62, color: capColor, y: 300, appear: 0.12, E: 0.4, box: '0x0f172a@0.78', bw: 22 })}[v5]`,
    sub ? `[v5]${rise({ text: sub, size: 42, color: '#c7d2fe', y: 1670, appear: 0.45, box: '0x1e293b@0.9', bw: 20 })}[v6]` : `[v5]null[v6]`,
    `[v6]${sweep(dur.toFixed(2))},${progress(k, total)},format=yuv420p[vout]`,
  ].join(';');
  const out = path.join(TMP, `card${idx}.mp4`);
  fs.writeFileSync(path.join(TMP, `vf_card${idx}.txt`), vf);
  run(['-i', path.join(SHOTS, file), '-filter_complex_script', path.join(TMP, `vf_card${idx}.txt`), '-map', '[vout]', '-frames:v', frames, '-r', FPS, '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', out]);
  return out;
}

// ---- solid kinetic scene ----
function solidScene({ dur, idx, total, k, bg = '0x0f172a', gradient = false, giantWord = '', lines = [], sweepDur = null }) {
  const frames = Math.round(dur * FPS);
  const base = gradient
    ? `gradients=s=${W}x${H}:c0=0x4f46e5:c1=0x17103f:x0=0:y0=0:x1=${W}:y1=${H}:r=${FPS}[v0]`
    : `color=c=${bg}:s=${W}x${H}:r=${FPS}[v0]`;
  const chain = [base];
  let cur = 'v0', n = 1;
  const put = (f) => { chain.push(`[${cur}]${f}[v${n}]`); cur = `v${n}`; n++; };
  if (giantWord) put(giant(giantWord, 880));
  for (const L of lines) {
    if (L.k === 'slideR') put(slideR(L));
    else if (L.k === 'slideL') put(slideL(L));
    else if (L.k === 'rise') put(rise(L));
    else if (L.k === 'pulse') put(`drawtext=fontfile=${FONT}:text=${qt(clean(L.text))}:fontsize=${L.size}:fontcolor=${L.color}:x=(w-text_w)/2:y=${L.y}:box=1:boxcolor=${L.box || 'black@0.4'}:boxborderw=${L.bw || 22}:alpha='0.78+0.22*sin(2*PI*t*1.8)'`);
    else put(T(L));
  }
  put(sweep(sweepDur || dur.toFixed(2)));
  put(progress(k, total));
  chain.push(`[${cur}]format=yuv420p[vout]`);
  const out = path.join(TMP, `solid${idx}.mp4`);
  fs.writeFileSync(path.join(TMP, `vf_solid${idx}.txt`), chain.join(';'));
  run(['-filter_complex_script', path.join(TMP, `vf_solid${idx}.txt`), '-map', '[vout]', '-frames:v', frames, '-r', FPS, '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', out]);
  return out;
}

// ---- stinger (whip word card) ----
function stinger({ word, sub, dur, idx, total, k, color = 'white' }) {
  const frames = Math.round(dur * FPS);
  const vf = [
    `color=c=0x0f172a:s=${W}x${H}:r=${FPS}[v0]`,
    `[v0]${giant(word, 800, 90)}[v1]`,
    `[v1]${slideR({ text: word + '.', size: 190, color, y: 780, appear: 0.05, E: 0.3 })}[v2]`,
    `[v2]${rise({ text: sub, size: 46, color: '#c7d2fe', y: 1120, appear: 0.25, E: 0.3, box: '0x4f46e5@0.9', bw: 22 })}[v3]`,
    `[v3]${sweep(dur.toFixed(2))},${progress(k, total)},format=yuv420p[vout]`,
  ].join(';');
  const out = path.join(TMP, `sting${idx}.mp4`);
  fs.writeFileSync(path.join(TMP, `vf_sting${idx}.txt`), vf);
  run(['-filter_complex_script', path.join(TMP, `vf_sting${idx}.txt`), '-map', '[vout]', '-frames:v', frames, '-r', FPS, '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', out]);
  return out;
}

// ================= TIMELINE =================
const vd = {};
for (const s of ['s1', 's2', 's3', 's4', 's5', 's6']) vd[s] = probeDur(path.join(VOICE, `${s}.mp3`));
const s6eff = vd.s6 / S6_TEMPO;
console.log('Voice:', vd, 's6eff:', s6eff.toFixed(2));

const s3t = vd.s3 + 1.2, s4t = vd.s4 + 0.9, stingT = s6eff + 0.5;
const D = {
  s1: vd.s1 + 0.9, s2: vd.s2 + 0.9,
  s3: [0.26, 0.24, 0.25, 0.25].map((f) => (s3t * f)),
  s4: [0.26, 0.25, 0.25, 0.24].map((f) => (s4t * f)),
  st: [0.25, 0.25, 0.25, 0.25].map((f) => (stingT * f)),
  s5: vd.s5 + 2.2,
};
const TOTAL_CLIPS = 2 + 4 + 4 + 4 + 1; // 15
let K = 0;
const kk = () => K++;

console.log('Building hook...');
const c1 = solidScene({ dur: D.s1, idx: 's1', total: TOTAL_CLIPS, k: kk(), giantWord: 'PUL', lines: [
  { k: 'slideR', text: 'QANCHA PUL', size: 100, color: 'white', y: 400, appear: 0.4 },
  { k: 'slideR', text: "YO'QOTYAPSIZ?", size: 92, color: '#a5b4fc', y: 550, appear: 0.7 },
  { k: 'rise', text: 'Kassa navbati · Daftar hisobi', size: 44, color: '#fbbf24', y: 770, appear: 1.2, box: '0x1e293b@0.9', bw: 20 },
  { k: 'rise', text: 'MaxPOS', size: 56, color: 'white', y: 1560, appear: 0.2, box: '0x4f46e5@0.95', bw: 24 },
]});
console.log('Building problem...');
const c2 = solidScene({ dur: D.s2, idx: 's2', total: TOTAL_CLIPS, k: kk(), giantWord: 'XATO', lines: [
  { k: 'slideL', text: 'Daftar hisobi', size: 92, color: 'white', y: 460, appear: 0.3 },
  { k: 'slideR', text: "o'tmishda", size: 92, color: '#fbbf24', y: 600, appear: 0.6 },
  { k: 'rise', text: '× Navbat', size: 58, color: 'white', y: 880, appear: 1.3, box: '0x7f1d1d@0.92', bw: 26 },
  { k: 'rise', text: '× Xato hisob', size: 58, color: 'white', y: 1020, appear: 1.9, box: '0x7f1d1d@0.92', bw: 26 },
  { k: 'rise', text: "× Yo'qolgan cheklar", size: 58, color: 'white', y: 1160, appear: 2.5, box: '0x7f1d1d@0.92', bw: 26 },
]});
console.log('Building solution...');
let ci = 0;
const S3 = [
  ['07_pos_search.png', 'Skanerlang — 1 soniyada', 'Shtrix · QR kod', 'SKANER', '#a5b4fc', 'in'],
  ['04_cart.png', 'Bir bosishda savatda', 'Promo-kod · Chegirma', 'SAVAT', 'white', 'out'],
  ['05b_checkout.png', "Qaytimni o'zi hisoblaydi", 'Naqd · Karta · Avto-qaytim', 'QAYTIM', '#6ee7b7', 'in'],
  ['06_receipt.png', 'Chek bir zumda chiqadi', '80 mm termal chek', 'CHEK', 'white', 'out'],
].map(([f, cap, sub, gw, col, z], i) => cardClip(f, D.s3[i], { caption: cap, sub, giantWord: gw, capColor: col, zoom: z, idx: ++ci, total: TOTAL_CLIPS, k: kk() }));
console.log('Building benefits...');
const S4 = [
  ['02_dashboard.png', 'Daromad — real vaqtda', 'Bugun · Hafta · Oy', 'DAROMAD', '#6ee7b7', 'in'],
  ['10_products.png', "Kam qolgan — ko'z oldingizda", 'Ombor signali', 'OMBOR', '#fbbf24', 'out'],
  ['08b_reports_chart.png', 'Hisobotlar — bir tugmada', 'Kunlik · Oylik · TOP', 'HISOBOT', 'white', 'in'],
  ['09_debtors.png', 'Qarzdorlar — to’liq nazorat', 'Qarz hisobi · Smenalar', 'QARZ', '#fca5a5', 'out'],
].map(([f, cap, sub, gw, col, z], i) => cardClip(f, D.s4[i], { caption: cap, sub, giantWord: gw, capColor: col, zoom: z, idx: ++ci, total: TOTAL_CLIPS, k: kk() }));
console.log('Building stingers...');
const ST = [
  ['TEZ', '1 skaner — 1 soniya', '#6ee7b7'],
  ['OSON', 'Bitta tizim — hamma ish', 'white'],
  ['AQILLI', "Avto-qaytim · Kam qoldi signali", '#a5b4fc'],
  ['ZAMONAVIY', 'PWA · Dark · 3 til', '#fbbf24'],
].map(([w, sub, col], i) => stinger({ word: w, sub, color: col, dur: D.st[i], idx: i, total: TOTAL_CLIPS, k: kk() }));
console.log('Building CTA...');
const c5 = solidScene({ dur: D.s5, idx: 's5', total: TOTAL_CLIPS, k: kk(), gradient: true, giantWord: 'POS', sweepDur: '2.5', lines: [
  { k: 'slideR', text: 'MaxPOS', size: 180, color: 'white', y: 480, appear: 0.25, E: 0.4 },
  { k: 'rise', text: "Do'koningiz bitta tizimda", size: 54, color: '#e0e7ff', y: 780, appear: 0.7 },
  { k: 'pulse', text: '» Bugun boshlang', size: 74, color: '#4f46e5', y: 980, box: 'white@0.95', bw: 34 },
  { k: 'rise', text: 'Kassa · Ombor · Qarzdorlar · Hisobotlar', size: 40, color: '#c7d2fe', y: 1190, appear: 1.6 },
  { k: 'rise', text: "O'zbek · Русский · English", size: 36, color: '#818cf8', y: 1290, appear: 2.0 },
]});

const clips = [c1, c2, ...S3, ...S4, ...ST, c5];
const durs = [D.s1, D.s2, ...D.s3, ...D.s4, ...D.st, D.s5];
const nT = clips.length - 1;
const totalDur = durs.reduce((a, b) => a + b, 0) - nT * XF;
console.log('Clips:', clips.length, 'total ~', totalDur.toFixed(2), 's');

// xfade: whip (smoothleft) between stingers, flash (fadewhite) into CTA
const inputs = [];
clips.forEach((c) => inputs.push('-i', c));
const trans = ['fade', 'fade', 'slideleft', 'slideup', 'fade', 'slideleft', 'fade', 'slideup', 'fade', 'fade',
  'smoothleft', 'smoothleft', 'smoothleft', 'fadewhite'];
let filter = '', acc = durs[0];
for (let k = 0; k < nT; k++) {
  const off = acc - XF;
  filter += `${k === 0 ? '[0:v]' : `[v${k - 1}]`}[${k + 1}:v]xfade=transition=${trans[k]}:duration=${XF}:offset=${off.toFixed(3)}[v${k}];`;
  acc += durs[k + 1] - XF;
}
filter += `[v${nT - 1}]format=yuv420p[vout]`;
fs.writeFileSync(path.join(TMP, 'xfade.txt'), filter);
const noAudio = path.join(TMP, 'video_noaudio.mp4');
console.log('Concat + xfade...');
run([...inputs, '-filter_complex_script', path.join(TMP, 'xfade.txt'), '-map', '[vout]', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-r', FPS, '-pix_fmt', 'yuv420p', noAudio]);

// ---- voice starts on final timeline ----
const starts = [0];
for (let k = 1; k < durs.length; k++) starts[k] = starts[k - 1] + durs[k - 1] - XF;
const vStarts = { s1: 0.35, s2: starts[1] + 0.3, s3: starts[2] + 0.25, s4: starts[6] + 0.25, s6: starts[10] + 0.15, s5: starts[14] + 0.4 };
console.log('Voice starts:', vStarts);
fs.writeFileSync(path.join(TMP, 'mix.json'), JSON.stringify({ vd, s6eff, durs, starts, vStarts, totalDur }, null, 2));

// ---- voice prep (s6 sped up) ----
const vWavs = [];
for (const s of ['s1', 's2', 's3', 's4', 's5', 's6']) {
  const tempo = s === 's6' ? `atempo=${S6_TEMPO},` : '';
  const wav = path.join(TMP, `v_${s}.wav`);
  run(['-i', path.join(VOICE, `${s}.mp3`), '-ar', '44100', '-ac', '1', '-af', `${tempo}highpass=f=75,lowpass=f=12000,acompressor=threshold=-18dB:ratio=3:attack=8:release=120,loudnorm=I=-16:TP=-1.5:LRA=11,volume=4dB`, '-c:a', 'pcm_s16le', wav]);
  vWavs.push(wav);
}

// ---- energetic BGM synth ----
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
for (let ci = 0; ci * 2.4 < totalDur; ci++) {
  const ch = chords[ci % 4], from = ci * 2.4;
  for (const f of ch.notes) addMix(from, 2.6, 0.05, (t) => {
    const a = Math.min(1, t / 0.5) * Math.min(1, (2.6 - t) / 0.6);
    return (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) * a;
  });
  for (let b = 0; b < 4; b++) {
    const bt = from + b * 0.6; if (bt > totalDur) break;
    addMix(bt, 0.16, 0.42, (t) => Math.sin(2 * Math.PI * (55 + 45 * Math.exp(-t * 20)) * t) * Math.exp(-t * 16));
    addMix(bt, 0.3, 0.12, (t) => Math.sin(2 * Math.PI * ch.root * t) * Math.exp(-t * 9));
    if (from > 7 && b % 2 === 1) addMix(bt, 0.12, 0.1, (t) => (Math.random() * 2 - 1) * Math.exp(-t * 30)); // clap
  }
  for (let h = 0; h < 8; h++) {
    const ht = from + h * 0.3; if (ht > totalDur || ht < 6) continue;
    addMix(ht, 0.03, 0.05, (t) => (Math.random() * 2 - 1) * Math.exp(-t * 110));
  }
  if (from > starts[9]) for (let h = 0; h < 16; h++) { // 16th hats in stingers+CTA
    const ht = from + h * 0.15; if (ht > totalDur) break;
    addMix(ht, 0.02, 0.045, (t) => (Math.random() * 2 - 1) * Math.exp(-t * 130));
  }
}
function riser(at, dur = 1.4) {
  addMix(Math.max(0, at), dur, 0.09, (t, d) => Math.sin(2 * Math.PI * (250 * Math.pow(10, t / d)) * t) * Math.pow(t / d, 2));
}
riser(starts[10] - 1.4); riser(starts[14] - 1.6, 1.6);
function whoosh(at, vol = 0.22) {
  addMix(at, 0.4, vol, (t, d) => (Math.sin(2 * Math.PI * (400 + 2200 * (t / d)) * t) * 0.5 + (Math.random() * 2 - 1) * 0.5) * Math.sin(Math.PI * t / d));
}
starts.forEach((s, i) => { if (i > 0) whoosh(s - 0.1, i >= 10 && i <= 13 ? 0.3 : 0.2); });
function impact(at, vol = 0.5) {
  addMix(at, 0.5, vol, (t) => (Math.sin(2 * Math.PI * (70 + 60 * Math.exp(-t * 14)) * t) * 1.2 + (Math.random() * 2 - 1) * 0.3) * Math.exp(-t * 9));
}
impact(0.05, 0.55);
for (let i = 10; i <= 13; i++) impact(starts[i] + 0.02, 0.5);
impact(starts[14] + 0.02, 0.65);
function tone(f, dur, at, vol = 0.15) { addMix(at, dur, vol, (t) => Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 12)); }
tone(880, 0.25, starts[2] + 0.5); tone(1320, 0.35, starts[4] + 0.4);
tone(1760, 0.2, starts[5] + 0.4); tone(2093, 0.6, starts[14] + 1.0); tone(1568, 0.4, starts[14] + 1.3);
for (let i = 10; i <= 13; i++) tone(1200 + i * 150, 0.3, starts[i] + 0.1, 0.14);
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
const bgmWav = path.join(TMP, 'bgm_pro.wav');
fs.writeFileSync(bgmWav, Buffer.concat([hdr, pcm]));
console.log('BGM done', (pcm.length / 4 / SR).toFixed(1) + 's');

// ---- final mix ----
const amap = ['-i', noAudio];
vWavs.forEach((w) => amap.push('-i', w));
amap.push('-i', bgmWav);
const vNames = ['s1', 's2', 's3', 's4', 's5', 's6'];
const fparts = [];
vNames.forEach((s, k) => {
  const ms = Math.round(vStarts[s] * 1000);
  fparts.push(`[${k + 1}:a]adelay=${ms}|${ms}[v${k}]`);
});
fparts.push(`${vNames.map((_, k) => `[v${k}]`).join('')}amix=inputs=6:normalize=0[voice]`);
fparts.push(`[voice]asplit=2[voice_out][voice_key]`);
fparts.push(`[7:a]volume=0.3[bgm_in];[bgm_in][voice_key]sidechaincompress=threshold=0.02:ratio=8:attack=15:release=400:makeup=1[bgm_duck]`);
fparts.push(`[voice_out][bgm_duck]amix=inputs=2:normalize=0[mixpre]`);
fparts.push(`[mixpre]loudnorm=I=-14:TP=-1.0:LRA=11,aresample=48000,aformat=channel_layouts=stereo[aout]`);
fs.writeFileSync(path.join(TMP, 'amix.txt'), fparts.join(';'));
console.log('Final mux + master...');
run([...amap, '-filter_complex_script', path.join(TMP, 'amix.txt'), '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', totalDur.toFixed(2), '-shortest', OUT]);
console.log('DONE:', OUT);
