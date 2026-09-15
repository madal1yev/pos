// build_stories_pro.js — MaxPOS PRO Stories 9:16 (1080x1920) + professional voice + ducked BGM + SFX
// Usage: node video-tools/build_stories_pro.js
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ffmpegPath from 'ffmpeg-static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FFMPEG = ffmpegPath.replace(/\\/g, '/');
const SHOTS = path.join(__dirname, '..', 'shots');
const VOICE = path.join(__dirname, 'voice_pro');
const TMP = path.join(__dirname, 'clips_pro');
const OUT = path.join(__dirname, '..', 'MaxPOS-STORIES-PRO-9x16.mp4');
// NOTE: relative font path (no drive colon) — absolute C:/ paths silently fall back to serif in this ffmpeg build
const FONT = 'video-tools/arialbd.ttf';
fs.mkdirSync(TMP, { recursive: true });

const W = 1080, H = 1920, FPS = 30;
const FONTESC = FONT.replace(/\\/g, '/').replace(/:/g, '\\:');
const XF = 0.35;

function run(args, opts = {}) {
  execFileSync(FFMPEG, ['-y', ...args], { stdio: ['ignore', 'ignore', 'pipe'], ...opts });
}
function probeDur(file) {
  try {
    const out = execFileSync(FFMPEG, ['-i', file], { stdio: ['ignore', 'pipe', 'pipe'] });
    return 0;
  } catch (e) {
    const msg = String(e.stderr || '');
    const m = msg.match(/Duration: (\d+):(\d+):([\d.]+)/);
    if (!m) return 0;
    return (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]);
  }
}
const qt = (t) => "'" + String(t).replace(/'/g, "'\\''") + "'";
const ALPHA = 0.3;
function dtext({ text, size, color, y, appear = 0, box = 'black@0.45', bw = 26, x = '(w-text_w)/2' }) {
  // ’ (U+2019) renders fine in Arial Bold and needs no escaping; sanitize risky glyphs
  const safe = String(text).replace(/'/g, '’').replace(/✕/g, '×').replace(/▶/g, '»');
  const alpha = appear > 0 ? `alpha='if(lt(t,${appear}),0,min(1,(t-${appear})/${ALPHA}))'` : 'alpha=1';
  return `drawtext=fontfile=${FONTESC}:text=${qt(safe)}:fontsize=${size}:fontcolor=${color}:x=${x}:y=${y}:box=1:boxcolor=${box}:boxborderw=${bw}:${alpha}`;
}
// Vertical phone-card clip: blurred bg from same shot + sharp centered card + caption top + sub-chip bottom
function cardClip(file, dur, { caption, sub = '', zoom = 'in', capColor = 'white', idx }) {
  const frames = Math.round(dur * FPS);
  const zExpr = zoom === 'in' ? `min(1.0+${0.14 / frames}*on,1.18)` : `max(1.16-${0.14 / frames}*on,1.0)`;
  // Card: landscape screenshots shown large in vertical frame; text drawn AFTER zoom stays crisp
  const CW = 980, CH = 640;
  const cx = Math.round((W - CW) / 2);
  const cy = 720; // center band (safe zone)
  // plain overlay + white border, then zoom the composited frame, then crisp text on top
  const vfBody = [
    `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=40:2,eq=brightness=-0.22:saturation=0.85[bg]`,
    `[0:v]scale=${CW}:${CH}:force_original_aspect_ratio=increase,crop=${CW}:${CH},format=yuv420p[card]`,
    `[bg][card]overlay=${cx}:${cy}[v0]`,
    `[v0]drawbox=x=${cx - 3}:y=${cy - 3}:w=${CW + 6}:h=${CH + 6}:color=white@0.25:t=3,zoompan=z='${zExpr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}[v2]`,
    `[v2]${dtext({ text: caption, size: 64, color: capColor, y: 330, appear: 0.15 })}[v3]`,
  ];
  let last = '[v3]';
  let n = 4;
  if (sub) {
    vfBody.push(`[${last.slice(1, -1)}]${dtext({ text: sub, size: 40, color: '#c7d2fe', y: 1420, appear: 0.45, box: '0x1e293b@0.85', bw: 20 })}[v${n}]`);
    last = `[v${n}]`; n++;
  }
  // progress bar (top) + brand badge
  vfBody.push(`[${last.slice(1, -1)}]drawbox=x=60:y=120:w=960:h=10:color=white@0.25:t=fill[pb0]`);
  last = '[pb0]';
  const vf = vfBody.join(';') + `;${last}format=yuv420p[vout]`;
  const out = path.join(TMP, `card${idx}.mp4`);
  fs.writeFileSync(path.join(TMP, `vf_card${idx}.txt`), vf);
  run(['-i', path.join(SHOTS, file), '-filter_complex_script', path.join(TMP, `vf_card${idx}.txt`), '-map', '[vout]', '-frames:v', frames, '-r', FPS, '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', out]);
  return out;
}
function solidScene({ dur, idx, lines, bg = '0x0f172a', gradient = false }) {
  const frames = Math.round(dur * FPS);
  const base = gradient
    ? `gradients=s=${W}x${H}:c0=0x4f46e5:c1=0x17103f:x0=0:y0=0:x1=${W}:y1=${H}:r=${FPS}[v0]`
    : `color=c=${bg}:s=${W}x${H}:r=${FPS}[v0]`;
  const chain = [base];
  let cur = 'v0', n = 1;
  for (const L of lines) {
    chain.push(`[${cur}]${dtext(L)}[v${n}]`);
    cur = `v${n}`; n++;
  }
  chain.push(`[${cur}]format=yuv420p[vout]`);
  const vf = chain.join(';');
  const out = path.join(TMP, `solid${idx}.mp4`);
  fs.writeFileSync(path.join(TMP, `vf_solid${idx}.txt`), vf);
  run(['-filter_complex_script', path.join(TMP, `vf_solid${idx}.txt`), '-map', '[vout]', '-frames:v', frames, '-r', FPS, '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', out]);
  return out;
}

// ---- 1. voice durations ----
const vd = {};
for (const s of ['s1', 's2', 's3', 's4', 's5']) vd[s] = probeDur(path.join(VOICE, `${s}.mp3`));
console.log('Voice durations:', vd);
const PAD = 0.9, CTA_HOLD = 2.2;
const D = {
  s1: vd.s1 + PAD,
  s2: vd.s2 + PAD,
  s3a: vd.s3 * 0.26 + 0.3, s3b: vd.s3 * 0.24 + 0.3, s3c: vd.s3 * 0.25 + 0.3, s3d: vd.s3 * 0.25 + 0.3,
  s4a: vd.s4 * 0.34 + 0.3, s4b: vd.s4 * 0.33 + 0.3, s4c: vd.s4 * 0.33 + 0.3,
  s5: vd.s5 + CTA_HOLD,
};
// normalize s3 parts to sum = vd.s3 + 1.2
const s3sum = D.s3a + D.s3b + D.s3c + D.s3d, s3t = vd.s3 + 1.2;
for (const k of ['s3a', 's3b', 's3c', 's3d']) D[k] *= s3t / s3sum;
const s4sum = D.s4a + D.s4b + D.s4c, s4t = vd.s4 + 0.9;
for (const k of ['s4a', 's4b', 's4c']) D[k] *= s4t / s4sum;
console.log('Scene durations:', D);

// ---- 2. video scenes ----
console.log('S1 hook...');
const c1 = solidScene({ dur: D.s1, idx: 's1', lines: [
  { text: 'QANCHA PUL', size: 96, color: 'white', y: 420, appear: 0.5, box: '0x0f172a@0.55' },
  { text: 'YO’QOTYAPSIZ?', size: 96, color: '#a5b4fc', y: 560, appear: 0.9, box: '0x0f172a@0.55' },
  { text: 'Kassa navbati · Daftar hisobi', size: 42, color: '#fbbf24', y: 760, appear: 1.4, box: '0x1e293b@0.9', bw: 20 },
  { text: 'MaxPOS', size: 54, color: 'white', y: 1600, appear: 0.2, box: '0x4f46e5@0.9', bw: 22 },
]});
console.log('S2 problem...');
const c2 = solidScene({ dur: D.s2, idx: 's2', lines: [
  { text: 'Daftar hisobi', size: 92, color: 'white', y: 480, appear: 0.3, box: '0x0f172a@0.5' },
  { text: 'o’tmishda', size: 92, color: '#fbbf24', y: 620, appear: 0.6, box: '0x0f172a@0.5' },
  { text: '✕ Navbat', size: 56, color: 'white', y: 900, appear: 1.2, box: '0x7f1d1d@0.9', bw: 24 },
  { text: '✕ Xato hisob', size: 56, color: 'white', y: 1040, appear: 1.8, box: '0x7f1d1d@0.9', bw: 24 },
  { text: '✕ Yo’qolgan cheklar', size: 56, color: 'white', y: 1180, appear: 2.4, box: '0x7f1d1d@0.9', bw: 24 },
]});
console.log('S3 solution cards...');
let i = 0;
const c3a = cardClip('07_pos_search.png', D.s3a, { caption: '1 skaner — 1 soniya', sub: 'Shtrix · QR kod', zoom: 'in', capColor: '#a5b4fc', idx: ++i });
const c3b = cardClip('04_cart.png', D.s3b, { caption: 'Bir bosishda savatda', sub: 'Promo-kod · Chegirma', zoom: 'out', capColor: 'white', idx: ++i });
const c3c = cardClip('05b_checkout.png', D.s3c, { caption: 'Qaytim avtomatik', sub: 'Naqd · Karta · Avto-qaytim', zoom: 'in', capColor: '#6ee7b7', idx: ++i });
const c3d = cardClip('06_receipt.png', D.s3d, { caption: 'Chek bir zumda', sub: '80 mm termal chek', zoom: 'out', capColor: 'white', idx: ++i });
console.log('S4 benefits...');
const c4a = cardClip('02_dashboard.png', D.s4a, { caption: 'Daromad — real vaqtda', sub: 'Bugun · Hafta · Oy', zoom: 'in', capColor: '#6ee7b7', idx: ++i });
const c4b = cardClip('10_products.png', D.s4b, { caption: 'Kam qolgan — ko’z oldingizda', sub: 'Ombor signali', zoom: 'out', capColor: '#fbbf24', idx: ++i });
const c4c = cardClip('08b_reports_chart.png', D.s4c, { caption: 'Hisobotlar — bir tugmada', sub: 'Qarzdorlar · Smenalar', zoom: 'in', capColor: 'white', idx: ++i });
console.log('S5 CTA...');
const c5 = solidScene({ dur: D.s5, idx: 's5', gradient: true, lines: [
  { text: 'MaxPOS', size: 170, color: 'white', y: 520, appear: 0.3, box: '0x17103f@0.35', bw: 26 },
  { text: 'Do’koningiz bitta tizimda', size: 52, color: '#e0e7ff', y: 800, appear: 0.8, box: '0x17103f@0.4', bw: 18 },
  { text: '▶ Bugun boshlang', size: 72, color: '#4f46e5', y: 1000, appear: 1.2, box: 'white@0.95', bw: 32 },
  { text: 'Kassa · Ombor · Qarzdorlar · Hisobotlar', size: 38, color: '#c7d2fe', y: 1200, appear: 1.8, box: '0x17103f@0.4', bw: 14 },
  { text: 'O’zbek · Русский · English', size: 34, color: '#818cf8', y: 1300, appear: 2.2, box: '0x17103f@0.35', bw: 10 },
]});

const clips = [c1, c2, c3a, c3b, c3c, c3d, c4a, c4b, c4c, c5];
const durs = [D.s1, D.s2, D.s3a, D.s3b, D.s3c, D.s3d, D.s4a, D.s4b, D.s4c, D.s5];
const nT = clips.length - 1;
const totalDur = durs.reduce((a, b) => a + b, 0) - nT * XF;
console.log('Total video ~', totalDur.toFixed(2), 's');

// xfade chain
const inputs = [];
clips.forEach((c) => inputs.push('-i', c));
let filter = '';
let acc = durs[0];
const trans = ['fade', 'fade', 'slideleft', 'fade', 'fade', 'slideleft', 'fade', 'fade', 'fade'];
for (let k = 0; k < nT; k++) {
  const off = acc - XF;
  const prev = k === 0 ? '[0:v]' : `[v${k - 1}]`;
  filter += `${prev}[${k + 1}:v]xfade=transition=${trans[k % trans.length]}:duration=${XF}:offset=${off.toFixed(3)}[v${k}];`;
  acc += durs[k + 1] - XF;
}
filter += `[v${nT - 1}]format=yuv420p[vout]`;
fs.writeFileSync(path.join(TMP, 'xfade.txt'), filter);
const noAudio = path.join(TMP, 'video_noaudio.mp4');
console.log('Concat + xfade...');
run([...inputs, '-filter_complex_script', path.join(TMP, 'xfade.txt'), '-map', '[vout]', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-r', FPS, '-pix_fmt', 'yuv420p', noAudio]);

// ---- 3. PRO audio: voice chain + BGM synth + SFX + ducking ----
// voice offsets = scene starts in final timeline (after xfade overlap)
const starts = [0];
for (let k = 1; k < durs.length; k++) starts[k] = starts[k - 1] + durs[k - 1] - XF;
// voice mapping: s1->clip0, s2->clip1, s3->clip2 start, s4->clip6 start, s5->clip9 start
const vStarts = { s1: 0.35, s2: starts[1] + 0.3, s3: starts[2] + 0.25, s4: starts[6] + 0.25, s5: starts[9] + 0.4 };
console.log('Voice starts:', vStarts, 'total', totalDur.toFixed(2));
fs.writeFileSync(path.join(TMP, 'mix.json'), JSON.stringify({ vd, D, durs, starts, vStarts, totalDur }, null, 2));

// normalize each voice mp3 -> wav (mono 44100, pro chain)
const vWavs = [];
for (const s of ['s1', 's2', 's3', 's4', 's5']) {
  const src = path.join(VOICE, `${s}.mp3`);
  const wav = path.join(TMP, `v_${s}.wav`);
  run(['-i', src, '-ar', '44100', '-ac', '1', '-af', 'highpass=f=75,lowpass=f=12000,acompressor=threshold=-18dB:ratio=3:attack=8:release=120,loudnorm=I=-16:TP=-1.5:LRA=11,volume=4dB', '-c:a', 'pcm_s16le', wav]);
  vWavs.push(wav);
}
// BGM synth (JS, warm corporate Am-F-C-G) — written to wav via node PCM
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
    addMix(bt, 0.16, 0.4, (t) => Math.sin(2 * Math.PI * (55 + 45 * Math.exp(-t * 20)) * t) * Math.exp(-t * 16));
    addMix(bt, 0.3, 0.12, (t) => Math.sin(2 * Math.PI * ch.root * t) * Math.exp(-t * 9));
  }
  for (let h = 0; h < 8; h++) {
    const ht = from + h * 0.3; if (ht > totalDur || ht < 6) continue;
    addMix(ht, 0.03, 0.05, (t) => (Math.random() * 2 - 1) * Math.exp(-t * 110));
  }
}
// riser into CTA
{
  const rs = starts[9] - 1.6;
  addMix(Math.max(0, rs), 1.6, 0.08, (t, d) => Math.sin(2 * Math.PI * (250 * Math.pow(10, t / d)) * t) * (t / d));
}
// SFX: beep / pop / chaching / sparkle layered gently
function tone(f, dur, at) { addMix(at, dur, 0.16, (t) => Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 14)); }
tone(880, 0.25, starts[2] + 0.5); tone(1320, 0.35, starts[4] + 0.4);
tone(1760, 0.2, starts[5] + 0.4); tone(2093, 0.6, starts[9] + 1.0);
tone(1568, 0.4, starts[9] + 1.3);
let peak = 0;
for (let k = 0; k < N; k++) peak = Math.max(peak, Math.abs(L[k]));
const g = peak > 0 ? 0.85 / peak : 1;
const pcm = Buffer.alloc(N * 4);
for (let k = 0; k < N; k++) {
  const v = Math.max(-1, Math.min(1, L[k] * g));
  const s = Math.round(v * 32767);
  pcm.writeInt16LE(s, k * 4); pcm.writeInt16LE(s, k * 4 + 2);
}
const hdr = Buffer.alloc(44);
hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + pcm.length, 4); hdr.write('WAVE', 8);
hdr.write('fmt ', 12); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22);
hdr.writeUInt32LE(SR, 24); hdr.writeUInt32LE(SR * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34);
hdr.write('data', 36); hdr.writeUInt32LE(pcm.length, 40);
const bgmWav = path.join(TMP, 'bgm_pro.wav');
fs.writeFileSync(bgmWav, Buffer.concat([hdr, pcm]));
console.log('BGM synth done', (pcm.length / 4 / SR).toFixed(1) + 's');

// final mix: voice adelay + amix, bgm ducked via sidechaincompress keyed by voice
const amap = ['-i', noAudio];
const fparts = [];
vWavs.forEach((w, k) => amap.push('-i', w));
amap.push('-i', bgmWav);
const vNames = ['s1', 's2', 's3', 's4', 's5'];
vNames.forEach((s, k) => {
  const ms = Math.round(vStarts[s] * 1000);
  fparts.push(`[${k + 1}:a]adelay=${ms}|${ms},volume=1.0[v${k}]`);
});
fparts.push(`${vNames.map((_, k) => `[v${k}]`).join('')}amix=inputs=5:normalize=0[voice]`);
fparts.push(`[voice]asplit=2[voice_out][voice_key]`);
fparts.push(`[6:a]volume=0.32[bgm_in];[bgm_in][voice_key]sidechaincompress=threshold=0.02:ratio=8:attack=15:release=400:makeup=1[bgm_duck]`);
fparts.push(`[voice_out][bgm_duck]amix=inputs=2:normalize=0[mixpre]`);
fparts.push(`[mixpre]loudnorm=I=-14:TP=-1.0:LRA=11,aresample=48000,aformat=channel_layouts=stereo[aout]`);
fs.writeFileSync(path.join(TMP, 'amix.txt'), fparts.join(';'));
console.log('Final mux + master...');
run([...amap, '-filter_complex_script', path.join(TMP, 'amix.txt'), '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', totalDur.toFixed(2), '-shortest', OUT]);
console.log('DONE:', OUT);
