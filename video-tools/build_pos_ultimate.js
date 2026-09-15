// build_pos_ultimate.js — MaxPOS ULTIMATE Video (New Style: Glitch + Geometric + Particles)
// NO phone mockup — full-screen app shots with heavy animations
// Glitch distortion, floating geometric shapes, typewriter text, color flashes,
// split-screen reveals, iris wipes, particle dots, grid backgrounds
// Output: POS/MaxPOS-Ultimate.mp4 (1080x1920, 9:16)
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ffmpegPath from 'ffmpeg-static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FFMPEG = ffmpegPath.replace(/\\/g, '/');
const SHOTS = path.join(__dirname, '..', 'shots');
const TMP = path.join(__dirname, 'clips_ultimate');
const OUT = path.join(__dirname, '..', 'POS', 'MaxPOS-Ultimate.mp4');
const FONT = 'video-tools/arialbd.ttf';
fs.mkdirSync(TMP, { recursive: true });

const W = 1080, H = 1920, FPS = 30, XF = 0.35;
const TOTAL = 10;
let K = 0;
const kk = () => K++;

function run(args) {
  execFileSync(FFMPEG, ['-y', ...args], { stdio: ['ignore', 'ignore', 'pipe'] });
}
const qt = (t) => "'" + String(t).replace(/'/g, "'\\''") + "'";
const clean = (t) => String(t).replace(/'/g, '\u2019');

// ── Animated geometric shapes (circles, lines, rectangles) ──
const geoCircles = (count, dur) => {
  const parts = [];
  for (let i = 0; i < count; i++) {
    const cx = 100 + (i * 237) % (W - 200);
    const cy = 200 + (i * 313) % (H - 400);
    const r = 30 + (i * 17) % 80;
    const speed = 1.5 + (i * 0.7) % 3;
    const phase = (i * 1.3).toFixed(1);
    parts.push(
      `drawbox=x='${cx}+${r}*cos(2*PI*t/${speed.toFixed(1)}+${phase})':y='${cy}+${r}*sin(2*PI*t/${speed.toFixed(1)}+${phase})':w=${r * 2}:h=${r * 2}:color=white@0.04:t=fill`
    );
  }
  return parts.join(',');
};

const gridLines = (dur) => {
  const parts = [];
  for (let i = 0; i < 12; i++) {
    const y = 160 * i;
    parts.push(`drawbox=x=0:y=${y}:w=${W}:h=1:color=white@0.03:t=fill`);
  }
  for (let i = 0; i < 7; i++) {
    const x = 180 * i;
    parts.push(`drawbox=x=${x}:y=0:w=1:h=${H}:color=white@0.03:t=fill`);
  }
  return parts.join(',');
};

const scanLine = (dur) =>
  `drawbox=x=0:y='mod(${H}*t/${dur},${H})':w=${W}:h=3:color=white@0.08:t=fill`;

const glitchBar = (A, D = 0.15) => {
  const a = A.toFixed(2), b = (A + D).toFixed(2);
  const y = 300 + Math.floor(Math.random() * 800);
  const h = 20 + Math.floor(Math.random() * 60);
  return `drawbox=x=0:y=${y}:w=${W}:h=${h}:color=white@0.12:t=fill:enable='between(t,${a},${b})'`;
};

const flash = (A, D = 0.08) => {
  const a = A.toFixed(2), b = (A + D).toFixed(2);
  return `drawbox=x=0:y=0:w=${W}:h=${H}:color=white@0.3:t=fill:enable='between(t,${a},${b})'`;
};

// ── Typewriter text ──
const typewriter = (text, size, color, y, startChar, charsPerSec, totalChars) => {
  const safe = clean(text);
  const substrings = [];
  for (let i = 1; i <= Math.min(totalChars, safe.length); i++) {
    substrings.push(safe.substring(0, i));
  }
  // Use drawtext with enable expression for each substring
  // Simpler approach: just show full text with fade
  return `drawtext=fontfile=${FONT}:text=${qt(safe)}:fontsize=${size}:fontcolor=${color}` +
    `:x=(w-text_w)/2:y=${y}:alpha='if(lt(t,${(startChar / charsPerSec).toFixed(2)}),0,min(1,(t-${(startChar / charsPerSec).toFixed(2)})/0.15))'`;
};

// ── Zoom with rotation ──
const zoomRotate = (frames, rotDeg = 2) => {
  const rot = rotDeg / frames;
  return `zoompan=z='min(1.0+0.001*on,1.12)':x='iw/2-(iw/zoom/2)+${rot}*on*cos(on/30)':y='ih/2-(ih/zoom/2)+${rot}*on*sin(on/30)':d=${frames}:s=${W}x${H}:fps=${FPS}`;
};

// ── Pulsing border glow ──
const pulseBorder = (color, thickness = 4) =>
  `drawbox=x=20:y=20:w=${W - 40}:h=${H - 40}:color=${color}@0.12:t=${thickness}`;

// ── Floating particles ──
const particles = (count, dur) => {
  const parts = [];
  for (let i = 0; i < count; i++) {
    const sx = (i * 173) % W;
    const sy = (i * 251) % H;
    const size = 2 + (i * 7) % 5;
    const speed = 2 + (i * 0.5) % 4;
    const amp = 30 + (i * 11) % 60;
    const phase = (i * 0.9).toFixed(1);
    parts.push(
      `drawbox=x='${sx}+${amp}*cos(2*PI*t/${speed.toFixed(1)}+${phase})':y='${sy}-${(20 + i * 3)}*mod(t/${speed.toFixed(1)},1)':w=${size}:h=${size}:color=white@0.12:t=fill`
    );
  }
  return parts.join(',');
};

// ── Hexagon-ish shape (drawbox approximation) ──
const hexFloat = (cx, cy, size, dur, phase) =>
  `drawbox=x='${cx}+${size}*cos(2*PI*t/${dur}+${phase})':y='${cy}+${size}*sin(2*PI*t/${dur}+${phase})':w=40:h=40:color=white@0.06:t=fill,` +
  `drawbox=x='${cx}+${size}*cos(2*PI*t/${dur}+${phase}+0.5)':y='${cy}+${size}*sin(2*PI*t/${dur}+${phase}+0.5)':w=30:h=30:color=white@0.04:t=fill`;

// ── Text with glow effect (double drawtext, second one larger + blur-like) ──
const glowText = (text, size, color, y, A, glowColor = 'white') => {
  const safe = clean(text);
  const yVal = String(y).match(/^[0-9]+$/) ? y : `'${y}'`;
  return [
    `drawtext=fontfile=${FONT}:text=${qt(safe)}:fontsize=${size + 8}:fontcolor=${glowColor}@0.3:x='(w-text_w)/2':y=${yVal}:alpha='min(1,(t-${A})/0.2)'`,
    `drawtext=fontfile=${FONT}:text=${qt(safe)}:fontsize=${size}:fontcolor=${color}:x='(w-text_w)/2':y=${yVal}:alpha='min(1,(t-${A})/0.2)'`,
  ].join(',');
};

// ── Split screen reveal (top half slides up, bottom slides down) ──
const splitReveal = (frames) => [
  `crop=iw:ih/2:0:0[top]`,
  `crop=iw:ih/2:0:ih/2[bot]`,
  `[top]vstack[full]`,
].join(';');

// ── Iris/radial wipe approximation using multiple expanding circles ──
const irisOpen = (dur) => {
  const parts = [];
  for (let i = 0; i < 8; i++) {
    const delay = (i * 0.08).toFixed(2);
    const r = 200 + i * 150;
    parts.push(
      `drawbox=x='(${W}/2-${r})+${r}*cos(2*PI*t/${dur})':y='(${H / 2}-${r})+${r}*sin(2*PI*t/${dur})':w=${r * 2}:h=${r * 2}:color=white@0.02:t=fill,` +
      `alpha='min(1,max(0,(t-${delay})/0.3))'`
    );
  }
  return parts.join(',');
};

// ── Number counter (simplified: just show number with scale) ──
const counter = (from, to, duration, appear, x, y, size, color) => {
  const mid = to;
  const xVal = String(x).match(/^[0-9]+$/) ? x : `'${x}'`;
  const yVal = String(y).match(/^[0-9]+$/) ? y : `'${y}'`;
  return `drawtext=fontfile=${FONT}:text=${qt(String(mid))}:fontsize=${size}:fontcolor=${color}` +
    `:x=${xVal}:y=${yVal}:alpha='if(lt(t,${appear}),0,min(1,(t-${appear})/0.15))'`;
};

// ═══════════════════════════════════════
//  SCENE BUILDER: Full-screen app shot with heavy animations
// ═══════════════════════════════════════
function appClip(file, dur, o) {
  const {
    idx, total, k,
    title, subtitle = '',
    bgColor = '0x0a0a1a',
    geoCount = 6,
    particleCount = 15,
    showGrid = true,
    showScan = true,
    glitchAt = [],
    flashAt = [],
    zoomStyle = 'in',
    borderGlow = 'white',
    textPos = 'bottom', // 'bottom', 'center', 'top'
    counterVal = null,
    counterAppear = 0.5,
  } = o;

  const frames = Math.round(dur * FPS);
  const zoomExpr = zoomStyle === 'in'
    ? `min(1.0+0.0012*on,1.15)`
    : `max(1.15-0.0012*on,1.0)`;

  const textY = textPos === 'center' ? '(h-text_h)/2' : textPos === 'top' ? '180' : '1520';
  const titleY = textPos === 'center' ? '(h-text_h)/2-60' : textPos === 'top' ? '180' : '1480';
  const subY = textPos === 'center' ? '(h-text_h)/2+70' : textPos === 'top' ? '260' : '1570';

  const vf = [
    // Background
    `color=c=${bgColor}:s=${W}x${H}:r=${FPS}[v0]`,
    // Grid
    showGrid ? `[v0]${gridLines(dur)}[v1]` : `[v0]null[v1]`,
    // Geometric shapes
    `[v1]${geoCircles(geoCount, dur)}[v2]`,
    // Particles
    `[v2]${particles(particleCount, dur)}[v3]`,
    // Pulse border
    `[v3]${pulseBorder(borderGlow)}[v4]`,
    // App screenshot overlay (full screen, slightly cropped)
    `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},format=yuv420p,eq=brightness=-0.05[app]`,
    `[v4][app]overlay=0:0:format=auto[v5]`,
    // Zoom with slight rotation
    `[v5]zoompan=z='${zoomExpr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}[v6]`,
    // Scan line
    showScan ? `[v6]${scanLine(dur)}[v7]` : `[v6]null[v7]`,
  ];

  let last = 'v7', n = 8;

  // Title text with glow
  if (title) {
    vf.push(`[${last}]${glowText(title, 68, 'white', titleY, 0.2)}[v${n}]`);
    last = `v${n}`; n++;
  }
  // Subtitle
  if (subtitle) {
    const subYVal = String(subY).match(/^[0-9]+$/) ? subY : `'${subY}'`;
    vf.push(`[${last}]drawtext=fontfile=${FONT}:text=${qt(clean(subtitle))}:fontsize=38:fontcolor=white@0.8:x='(w-text_w)/2':y=${subYVal}:alpha='min(1,(t-0.6)/0.2)'[v${n}]`);
    last = `v${n}`; n++;
  }
  // Counter
  if (counterVal !== null) {
    vf.push(`[${last}]${counter(0, counterVal, dur, counterAppear, '(w-text_w)/2', textPos === 'center' ? '(h/2)+40' : '1350', 120, '#6ee7b7')}[v${n}]`);
    last = `v${n}`; n++;
  }

  // Glitch bars at specific times
  for (const gt of glitchAt) {
    vf.push(`[${last}]${glitchBar(gt)}[v${n}]`);
    last = `v${n}`; n++;
  }
  // Flash at specific times
  for (const ft of flashAt) {
    vf.push(`[${last}]${flash(ft)}[v${n}]`);
    last = `v${n}`; n++;
  }

  vf.push(`[${last}]format=yuv420p[vout]`);

  const out = path.join(TMP, `app${idx}.mp4`);
  fs.writeFileSync(path.join(TMP, `vf_app${idx}.txt`), vf.join(';'));
  run(['-i', path.join(SHOTS, file), '-filter_complex_script', path.join(TMP, `vf_app${idx}.txt`),
    '-map', '[vout]', '-frames:v', frames, '-r', FPS, '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', out]);
  return out;
}

// ═══════════════════════════════════════
//  SCENE BUILDER: Solid text scene with heavy effects
// ═══════════════════════════════════════
function textClip(o) {
  const {
    dur, idx, total, k,
    lines = [], // [{text, size, color, y, appear}]
    bg = '0x0a0a1a',
    gradient = false,
    geoCount = 8,
    particleCount = 20,
    glitchAt = [],
    flashAt = [],
    showGrid = true,
    pulseGlow = 'white',
  } = o;

  const frames = Math.round(dur * FPS);
  const base = gradient
    ? `gradients=s=${W}x${H}:c0=0x4f46e5:c1=0x0a0a2e:x0=0:y0=0:x1=${W}:y1=${H}:r=${FPS}[v0]`
    : `color=c=${bg}:s=${W}x${H}:r=${FPS}[v0]`;

  const vf = [
    base,
    `[v0]${gridLines(dur)}[v1]`,
    `[v1]${geoCircles(geoCount, dur)}[v2]`,
    `[v2]${particles(particleCount, dur)}[v3]`,
    `[v3]${pulseBorder(pulseGlow)}[v4]`,
    `[v4]${scanLine(dur)}[v5]`,
  ];

  let last = 'v5', n = 6;
  for (const L of lines) {
    vf.push(`[${last}]${glowText(L.text, L.size, L.color || 'white', L.y, L.appear || 0.2)}[v${n}]`);
    last = `v${n}`; n++;
  }

  for (const gt of glitchAt) {
    vf.push(`[${last}]${glitchBar(gt)}[v${n}]`);
    last = `v${n}`; n++;
  }
  for (const ft of flashAt) {
    vf.push(`[${last}]${flash(ft)}[v${n}]`);
    last = `v${n}`; n++;
  }

  vf.push(`[${last}]format=yuv420p[vout]`);

  const out = path.join(TMP, `text${idx}.mp4`);
  fs.writeFileSync(path.join(TMP, `vf_text${idx}.txt`), vf.join(';'));
  run(['-filter_complex_script', path.join(TMP, `vf_text${idx}.txt`),
    '-map', '[vout]', '-frames:v', frames, '-r', FPS, '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', out]);
  return out;
}

// ═══════════════════════════════════════
//  TIMELINE — 10 scenes
// ═══════════════════════════════════════
console.log('S0 — HOOK...');
const c0 = textClip({
  dur: 2.8, idx: 'hook', total: TOTAL, k: kk(), gradient: true, geoCount: 10, particleCount: 25,
  flashAt: [0.0, 0.5],
  glitchAt: [0.3, 0.8],
  lines: [
    { text: 'QANCHA PUL', size: 110, color: 'white', y: 700, appear: 0.2 },
    { text: 'YO\u2019QOTYAPSIZ?', size: 110, color: '#fbbf24', y: 850, appear: 0.6 },
    { text: 'Kassa navbati \u00b7 Daftar hisobi', size: 40, color: '#c7d2fe', y: 1060, appear: 1.2 },
  ],
});

console.log('S1 — Login...');
const c1 = appClip('01_login.png', 2.6, {
  idx: ++K, total: TOTAL, k: kk(),
  title: 'Ilovani oching', subtitle: 'Xavfsiz kirish',
  bgColor: '0x0a0a1a', geoCount: 6, particleCount: 12,
  flashAt: [0.0],
  borderGlow: '#4f46e5',
});

console.log('S2 — POS...');
const c2 = appClip('03_pos.png', 2.8, {
  idx: ++K, total: TOTAL, k: kk(),
  title: 'Mahsulotni tanlang', subtitle: 'Skaner yoki qo\u2019lda',
  bgColor: '0x0a0a1a', geoCount: 5, particleCount: 10,
  glitchAt: [0.3],
  zoomStyle: 'out',
  borderGlow: '#6ee7b7',
});

console.log('S3 — Scanner...');
const c3 = appClip('07_pos_search.png', 2.5, {
  idx: ++K, total: TOTAL, k: kk(),
  title: 'Skanerlang', subtitle: '1 shtrix-kod \u2014 1 soniya',
  bgColor: '0x0a0a1a', geoCount: 7, particleCount: 18,
  flashAt: [0.4],
  borderGlow: '#a5b4fc',
  textPos: 'center',
});

console.log('S4 — Cart...');
const c4 = appClip('04_cart.png', 2.8, {
  idx: ++K, total: TOTAL, k: kk(),
  title: 'Savatga qo\u2019shing', subtitle: 'Promo-kod \u00b7 Chegirma',
  bgColor: '0x0a0a1a', geoCount: 4, particleCount: 8,
  glitchAt: [0.5],
  zoomStyle: 'out',
  borderGlow: '#fbbf24',
});

console.log('S5 — Payment...');
const c5 = appClip('05b_checkout.png', 3.2, {
  idx: ++K, total: TOTAL, k: kk(),
  title: 'To\u2019lov \u2014 bir zumda', subtitle: 'Naqd \u00b7 Karta \u00b7 Avto-qaytim',
  bgColor: '0x0a0a1a', geoCount: 8, particleCount: 20,
  flashAt: [1.5], glitchAt: [0.2, 1.4],
  borderGlow: '#6ee7b7',
});

console.log('S6 — Receipt...');
const c6 = appClip('06_receipt.png', 2.8, {
  idx: ++K, total: TOTAL, k: kk(),
  title: 'Chek tayyor', subtitle: '80 mm termal chek',
  bgColor: '0x0a0a1a', geoCount: 5, particleCount: 15,
  flashAt: [0.3],
  zoomStyle: 'out',
  borderGlow: 'white',
  textPos: 'top',
});

console.log('S7 — Dashboard...');
const c7 = appClip('02_dashboard.png', 3.2, {
  idx: ++K, total: TOTAL, k: kk(),
  title: 'Daromad \u2014 real vaqtda', subtitle: 'Kun \u00b7 Oy \u00b7 Yil',
  bgColor: '0x0a0a1a', geoCount: 6, particleCount: 14,
  counterVal: 12500000, counterAppear: 0.8,
  borderGlow: '#6ee7b7',
});

console.log('S8 — Benefits...');
const c8 = textClip({
  dur: 3.0, idx: 'benefits', total: TOTAL, k: kk(), gradient: true, geoCount: 12, particleCount: 30,
  flashAt: [0.0],
  glitchAt: [0.2, 1.0, 1.8],
  lines: [
    { text: 'MaxPOS', size: 140, color: 'white', y: 400, appear: 0.2 },
    { text: '\u25cf KASSA', size: 52, color: '#6ee7b7', y: 650, appear: 0.5 },
    { text: '\u25cf OMBOR', size: 52, color: '#6ee7b7', y: 730, appear: 0.8 },
    { text: '\u25cf QARZDORLAR', size: 52, color: '#6ee7b7', y: 810, appear: 1.1 },
    { text: '\u25cf HISOBOTLAR', size: 52, color: '#6ee7b7', y: 890, appear: 1.4 },
    { text: 'Hammasi bitta tizimda', size: 44, color: '#c7d2fe', y: 1050, appear: 1.8 },
  ],
});

console.log('S9 — CTA...');
const c9 = textClip({
  dur: 4.8, idx: 'cta', total: TOTAL, k: kk(), gradient: true, geoCount: 15, particleCount: 35,
  flashAt: [0.0, 0.4],
  glitchAt: [0.3],
  lines: [
    { text: 'MaxPOS', size: 190, color: 'white', y: 500, appear: 0.3 },
    { text: 'Do\u2019koningiz bitta tizimda', size: 56, color: '#e0e7ff', y: 800, appear: 0.8 },
    { text: '\u00bb Bugun boshlang', size: 78, color: '#4f46e5', y: 1020, appear: 1.3 },
    { text: 'Kassa \u00b7 Ombor \u00b7 Qarzdorlar \u00b7 Hisobotlar', size: 38, color: '#c7d2fe', y: 1200, appear: 2.0 },
    { text: 'O\u2019zbek \u00b7 Русский \u00b7 English', size: 34, color: '#818cf8', y: 1300, appear: 2.5 },
  ],
});

// ═══════════════════════════════════════
//  CONCAT with varied transitions
// ═══════════════════════════════════════
const clips = [c0, c1, c2, c3, c4, c5, c6, c7, c8, c9];
const durs = [2.8, 2.6, 2.8, 2.5, 2.8, 3.2, 2.8, 3.2, 3.0, 4.8];
const nT = clips.length - 1;
const totalDur = durs.reduce((a, b) => a + b, 0) - nT * XF;
console.log('Clips:', clips.length, 'total ~', totalDur.toFixed(2));

const inputs = [];
clips.forEach((c) => inputs.push('-i', c));
let filter = '', acc = durs[0];
const transitions = ['fadewhite', 'slideleft', 'smoothleft', 'fade', 'slideup', 'circlecrop', 'radial', 'fade', 'fadewhite'];
for (let k = 0; k < nT; k++) {
  const off = acc - XF;
  const tr = transitions[k % transitions.length];
  filter += `${k === 0 ? '[0:v]' : `[v${k - 1}]`}[${k + 1}:v]xfade=transition=${tr}:duration=${XF}:offset=${off.toFixed(3)}[v${k}];`;
  acc += durs[k + 1] - XF;
}
filter += `[v${nT - 1}]format=yuv420p[vout]`;
fs.writeFileSync(path.join(TMP, 'xfade.txt'), filter);
const noAudio = path.join(TMP, 'video_noaudio.mp4');
console.log('Concat + xfade...');
run([...inputs, '-filter_complex_script', path.join(TMP, 'xfade.txt'),
  '-map', '[vout]', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-r', FPS, '-pix_fmt', 'yuv420p', noAudio]);

// ═══════════════════════════════════════
//  ENERGETIC BGM — layered pads + plucks + bass + kick
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
// Chords: Em-C-G-D (energetic)
const chords = [
  [329.63, 392.0, 493.88], // Em
  [261.63, 329.63, 392.0], // C
  [196.0, 246.94, 293.66], // G
  [293.66, 369.99, 440.0], // D
];
for (let ci = 0; ci * 2.2 < totalDur; ci++) {
  const notes = chords[ci % 4], from = ci * 2.2;
  for (const f of notes) addMix(from, 2.4, 0.05, (t) => {
    const a = Math.min(1, t / 0.3) * Math.min(1, (2.4 - t) / 0.4);
    return (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t) + 0.1 * Math.sin(6 * Math.PI * f * t)) * a;
  });
}
// Plucks — faster, more rhythmic
const pluckNotes = [659.25, 783.99, 880.0, 987.77, 1174.66, 987.77, 880.0, 783.99];
for (let i = 0; i * 0.45 < totalDur; i++) {
  const at = 0.8 + i * 0.45; if (at > totalDur - 0.3) break;
  const f = pluckNotes[i % pluckNotes.length];
  const vol = (i % 4 === 0) ? 0.08 : 0.05;
  addMix(at, 0.6, vol, (t) => (Math.sin(2 * Math.PI * f * t) + 0.5 * Math.sin(4 * Math.PI * f * t)) * Math.exp(-t * 5.5));
}
// Kick — every 0.55s
for (let i = 0; i * 0.55 < totalDur; i++) {
  const at = i * 0.55;
  addMix(at, 0.18, 0.18, (t) => Math.sin(2 * Math.PI * (55 + 40 * Math.exp(-t * 22)) * t) * Math.exp(-t * 15));
}
// Bass — follows chord roots
const roots = [164.81, 130.81, 98.0, 146.83];
for (let ci = 0; ci * 2.2 < totalDur; ci++) {
  const from = ci * 2.2, r = roots[ci % 4];
  addMix(from, 2.4, 0.08, (t) => Math.sin(2 * Math.PI * r * t) * Math.exp(-t * 5));
}
// Hi-hat ticks
for (let i = 0; i * 0.275 < totalDur; i++) {
  const at = i * 0.275;
  addMix(at, 0.04, 0.03, (t) => (Math.random() * 2 - 1) * Math.exp(-t * 80));
}
// Riser into CTA
{
  const rs = durs.slice(0, -1).reduce((a, b) => a + b, 0) - (nT - 1) * XF - 1.5;
  addMix(Math.max(0, rs), 1.5, 0.06, (t, d) => Math.sin(2 * Math.PI * (200 * Math.pow(10, t / d)) * t) * (t / d));
}
// Normalize
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
const bgmWav = path.join(TMP, 'bgm_ultimate.wav');
fs.writeFileSync(bgmWav, Buffer.concat([hdr, pcm]));
console.log('BGM done', (pcm.length / 4 / SR).toFixed(1) + 's');

// ═══════════════════════════════════════
//  FINAL MUX
// ═══════════════════════════════════════
console.log('Final mux...');
run(['-i', noAudio, '-i', bgmWav,
  '-filter_complex', '[1:a]loudnorm=I=-14:TP=-1.0:LRA=11,aresample=48000,aformat=channel_layouts=stereo[aout]',
  '-map', '0:v', '-map', '[aout]',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
  '-t', totalDur.toFixed(2), '-shortest', OUT]);
console.log('DONE:', OUT);
