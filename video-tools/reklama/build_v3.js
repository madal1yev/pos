// build_v3.js — MaxPOS premium minimal commercial renderer (9:16 + 16:9)
// Design system: Apple/Stripe minimal; Uzbek; ~23.7s; 13 scenes.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const gfx = require('./gfx');
const T = require('./timeline_v3');

const FPS = T.FPS;
const FFMPEG = require('ffmpeg-static');
const ROOT = path.join(__dirname, '..', '..');
const SHOTS = path.join(ROOT, 'shots');
const TMP = path.join(__dirname, 'tmp');
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

const FONT = `'C\\:/Users/New/Desktop/poss/video-tools/font.ttf'`;
const COLORS = {
  ink: '0x0B1020', inkDim: '0x526078', white: '0xFFFFFF', whiteSoft: '0xC7D2FE',
  indigo: '0x4F46E5', indigoBright: '0x6366F1',
};

const FORMATS = {
  '9x16': {
    W: 1080, H: 1920, bs: 1200,
    phone: { w: 664, h: 1180, x: 208, y: 470 },
    cap: { x: 108, y: 340, fs: 66, subFs: 32 },
    dark: { y1: 700, y2: 892, center: true, fs: 88, subFs: 32 },
    chart: { w: 900, h: 560, x: 90, y: 640, capY: 340 },
    chipsFs: 34, chipH: 92,
  },
  '16x9': {
    W: 1920, H: 1080, bs: 880,
    phone: { w: 470, h: 836, x: 1310, y: 122 },
    cap: { x: 120, y: 300, fs: 92, subFs: 42 },
    dark: { y1: 410, y2: 570, center: true, fs: 116, subFs: 44 },
    chart: { w: 780, h: 560, x: 1010, y: 270, capY: 300 },
    chipsFs: 40, chipH: 82,
  },
};

let seq = 0;
const L = () => `x${(++seq).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

function escDrawText(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, `\\\u2019`)
    .replace(/:/g, '\\:')
    .replace(/%/g, '\\%');
}

function dt(text, size, color, x, y, extra = '') {
  return `drawtext=fontfile=${FONT}:text='${escDrawText(text)}':fontsize=${size}:fontcolor=${color}:x=${x}:y=${y}:${extra}`;
}

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

function run(args, label) {
  try {
    execFileSync(FFMPEG, ['-hide_banner', '-y', '-loglevel', 'error', ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    const err = new Error(`${label || 'ffmpeg'} failed`);
    err.stderr = (e.stderr || '').toString();
    throw err;
  }
}

function mkScene() {
  const inputs = [];
  const F = [];
  let sid = 0;
  const A = (args) => { inputs.push(args); return `[${sid++}:v]`; };
  A.file = (p) => A(['-i', p]);
  A.loopFile = (p) => A(['-loop', '1', '-i', p]);
  A.lavfi = (spec) => A(['-f', 'lavfi', '-i', spec]);
  A.imgs = (pat) => A(['-framerate', String(FPS), '-i', pat]);
  const chain = (src, filter, out) => { F.push(`${src}${filter}[${out}]`); return `[${out}]`; };
  const overlay = (a, b, o, out) => { F.push(`${a}${b}overlay=${o}[${out}]`); return `[${out}]`; };
  return { inputs, F, A, chain, overlay };
}

function addTextLayer(S, text, size, color, xExpr, yExpr, fadeIn, fadeOut, dur, extra = '') {
  const lay = S.A.lavfi(`color=s=${FORMATS[curFmt].W}x${FORMATS[curFmt].H}:c=black:r=${FPS}`);
  let t = S.chain(lay, 'format=rgba,colorchannelmixer=aa=0', L());
  t = S.chain(t, dt(text, size, color, xExpr, yExpr, extra), L());
  let fx = `format=rgba`;
  if (fadeIn > 0) fx += `,fade=t=in:st=${fadeIn.toFixed(2)}:d=0.32:alpha=1`;
  if (fadeOut > 0) fx += `,fade=t=out:st=${(dur - fadeOut).toFixed(2)}:d=${fadeOut.toFixed(2)}:alpha=1`;
  t = S.chain(t, fx, L());
  return t;
}

let curFmt = '9x16';
const curFmtName = () => curFmt;
const fmtNow = () => FORMATS[curFmt];

// overlay full-canvas text layer with a soft slide-up entrance (ease-out cubic over ~0.5s)
// rises risePx pixels from below and settles at y=0 (correct position baked into layer)
function rise(S, main, layer, risePx, durRise = 0.5) {
  const expr = `y='${risePx}*pow(max(0,1-t/${durRise}),3)'`;
  return S.overlay(main, layer, `x=0:${expr}`, L());
}

function captions(S, main, fmt, scene, opts = {}) {
  const dark = opts.dark || scene.kind === 'dark';
  const dur = scene.dur;

  if (scene.big) {
    const fs = opts.fs || fmt.cap.fs;
    const capColor = dark ? COLORS.white : (opts.capColor || COLORS.ink);
    const cx = opts.center ? '(w-text_w)/2' : fmt.cap.x;
    const cy = opts.y || fmt.cap.y;
    const tl = addTextLayer(S, scene.big, fs, capColor, cx, cy, 0.12, 0, dur,
      dark ? 'shadowcolor=0x00000099:shadowx=0:shadowy=5' : '');
    main = rise(S, main, tl, 36, 0.5);
  }

  if (scene.chip) {
    const fs = fmt.chipsFs;
    const text = scene.chip;
    const pw = Math.round(text.length * fs * 0.58 + 92);
    const pimg = gfx.pill(pw, fmt.chipH, COLORS.indigoBright, 1);
    let p = S.A.loopFile(pimg);
    p = S.chain(p, dt(text, fs, COLORS.white, '(w-text_w)/2', '(h-text_h)/2'), L());
    p = S.chain(p, `format=rgba,fade=t=in:st=0.2:d=0.28:alpha=1`, L());
    const cx = Math.round(fmt.phone.x + (fmt.phone.w - pw) / 2);
    const cy = fmt.phone.y + fmt.phone.h + 30;
    main = S.overlay(main, p, `${cx}:${cy}`, L());
  }
  return main;
}

function base(S, scene) {
  const fmt = fmtNow();
  const isDark = scene.kind === 'dark' || scene.kind === 'shotdark';
  let main = S.A.loopFile(gfx.bg(fmt.W, fmt.H, isDark ? 'dark' : 'light'));
  main = S.chain(main, `scale=${fmt.W}:${fmt.H}`, L());
  const blobFile = gfx.blob(fmt.bs, 0.42, isDark ? '#4F46E5' : '#6366F1', 0.10);
  let bl = S.A.loopFile(blobFile);
  bl = S.chain(bl, `scale=${fmt.bs}:${fmt.bs}`, L());
  const bx = Math.round(fmt.W * 0.8), by = Math.round(fmt.H * 0.1);
  main = S.overlay(main, bl, `${bx}:${by}`, L());
  return main;
}

function phoneInto(S, main, scene, dark) {
  const fmt = fmtNow();
  const { w, h, x, y } = fmt.phone;
  const r = Math.round(w * 0.13);
  let p = S.A.file(path.join(ROOT, scene.file));
  p = S.chain(p, `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},eq=saturation=1.05:contrast=1.02`, L());
  const m = S.A.loopFile(gfx.phoneMask(w, h, r));
  p = S.chain(`${p}${m[0] === '[' ? '' : ''}${m}`, 'alphamerge', L());
  // NOTE: alphamerge needs two inputs written as [a][b]
  const sh = S.A.loopFile(gfx.phoneShadow(w, h, r, 40, 0.30));
  main = S.overlay(main, sh, `${x}:${y + 18}`, L());
  main = S.overlay(main, p, `${x}:${y}`, L());
  return main;
}

function hookScene(S, main, out, frames, fmtName, scene) {
  const fmt = fmtNow();
  // giant wordmark centered
  const wmY = fmtName === '9x16' ? 470 : 360;
  main = S.overlay(main, (() => {
    const tl = addTextLayer(S, scene.big, fmtName === '9x16' ? 150 : 190, COLORS.indigo,
      '(w-text_w)/2', wmY, 0.05, 0, T.CLIPS[0].dur, 'shadowcolor=0x00000018:shadowx=0:shadowy=6');
    return tl;
  })(), '0:0', L());

  if (scene.tag) {
    const fs = fmtName === '9x16' ? 36 : 44;
    const text = scene.tag;
    const pw = Math.round(text.length * fs * 0.62 + 100);
    let p = S.A.loopFile(gfx.pill(pw, fmtName === '9x16' ? 96 : 92, COLORS.indigo, 0));
    p = S.chain(p, dt(text, fs, COLORS.white, '(w-text_w)/2', '(h-text_h)/2'), L());
    p = S.chain(p, 'format=rgba,fade=t=in:st=0.5:d=0.35:alpha=1', L());
    const py = fmtName === '9x16' ? 640 : 520;
    main = S.overlay(main, p, `${Math.round(fmt.W / 2 - pw / 2)}:${py}`, L());
  }
  return S.chain(main, 'format=yuv420p', 'out');
}

function renderScene(scene, fmtName) {
  curFmt = fmtName;
  const fmt = fmtNow();
  const frames = Math.max(1, Math.round(scene.dur * FPS));
  const out = path.join(TMP, `${fmtName}_${scene.name}.mp4`);
  const S = mkScene();

  let main = base(S, scene);
  const dur = scene.dur;
  let finalMain;

  switch (scene.kind) {
    case 'hook': {
      finalMain = hookScene(S, main, out, frames, fmtName, scene);
      break;
    }
    case 'dark': {
      main = captions(S, main, fmt, scene, { dark: true, center: true, fs: fmt.dark.fs });
      if (scene.sub) {
        const sl = addTextLayer(S, scene.sub, fmt.dark.subFs, COLORS.whiteSoft, '(w-text_w)/2', fmt.dark.y2, 0.25, 0, dur);
        main = rise(S, main, sl, 30, 0.5);
      }
      finalMain = S.chain(main, 'format=yuv420p', 'out');
      break;
    }
    case 'shot': case 'shotdark': {
      main = phoneInto(S, main, scene, scene.kind === 'shotdark');
      main = captions(S, main, fmt, scene, { dark: scene.kind === 'shotdark' });
      finalMain = S.chain(main, 'format=yuv420p', 'out');
      break;
    }
    case 'chart': {
      const framesJs = genChartFrames(fmt.chart.w, fmt.chart.h, frames, dur);
      let ch = S.A.imgs(framesJs);
      ch = S.chain(ch, 'format=rgba', L());
      main = S.overlay(main, ch, `${fmt.chart.x}:${fmt.chart.y}`, L());
      main = captions(S, main, fmt, scene, { y: fmt.chart.capY });
      if (scene.sub) {
        const sl = addTextLayer(S, scene.sub, fmt.cap.subFs, COLORS.inkDim, fmt.cap.x, fmt.chart.capY + 110, 0.2, 0, dur);
        main = rise(S, main, sl, 24, 0.5);
      }
      finalMain = S.chain(main, 'format=yuv420p', 'out');
      break;
    }
    case 'cta': {
      const fsW = fmtName === '9x16' ? 150 : 190;
      const wmY = fmtName === '9x16' ? 320 : 220;
      const wmL = addTextLayer(S, 'MaxPOS', fsW, COLORS.indigo, '(w-text_w)/2', wmY, 0.05, 0, dur, 'shadowcolor=0x00000018:shadowx=0:shadowy=6');
      main = rise(S, main, wmL, 30, 0.5);
      const tlY = fmtName === '9x16' ? 520 : 420;
      const tl = addTextLayer(S, scene.tagline, fmtName === '9x16' ? 62 : 84, COLORS.ink, '(w-text_w)/2', tlY, 0.25, 0, dur);
      main = rise(S, main, tl, 30, 0.5);
      const fsP = fmtName === '9x16' ? 34 : 40;
      const pw = Math.round(scene.sub.length * fsP * 0.58 + 96);
      let p = S.A.loopFile(gfx.pill(pw, 84, '#EEF2FF', 1));
      p = S.chain(p, dt(scene.sub, fsP, COLORS.indigo, '(w-text_w)/2', '(h-text_h)/2'), L());
      p = S.chain(p, 'format=rgba,fade=t=in:st=0.55:d=0.3:alpha=1', L());
      main = S.overlay(main, p, `${Math.round(fmt.W / 2 - pw / 2)}:${fmtName === '9x16' ? 640 : 530}`, L());
      const llY = fmtName === '9x16' ? 770 : 640;
      const ll = addTextLayer(S, scene.langs, fmtName === '9x16' ? 26 : 30, COLORS.indigoBright, '(w-text_w)/2', llY, 0.85, 0, dur);
      main = rise(S, main, ll, 20, 0.5);
      finalMain = S.chain(main, 'format=yuv420p', 'out');
      break;
    }
    default:
      throw new Error('unknown kind ' + scene.kind);
  }

  return flush(S, finalMain, out, frames);
}

function flush(S, main, out, frames) {
  const scriptFile = path.join(TMP, path.basename(out).replace(/\W/g, '_') + '.script');
  fs.writeFileSync(scriptFile, S.F.join(';'));
  const args = [];
  for (const inp of S.inputs) args.push(...inp);
  args.push('-filter_complex_script', scriptFile, '-map', main, '-frames:v', frames, '-r', FPS,
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out);
  run(args, 'scene ' + path.basename(out));
  return out;
}

// ---------- chart frames (pure JS) ----------
function genChartFrames(W, H, frames, dur) {
  const dir = path.join(TMP, 'chart_' + L());
  fs.mkdirSync(dir, { recursive: true });
  const R = Math.round(H * 0.08);
  const bars = 7;
  const heights = [0.5, 0.72, 0.4, 0.6, 0.9, 0.68, 0.82];
  const gap = Math.round(W * 0.024);
  const barW = Math.round((W - gap * (bars + 1)) / bars);
  const baseY = H - Math.round(H * 0.16);
  const maxH = Math.round(H * 0.46);
  const stagger = 0.06;
  const growth = 0.5;

  for (let f = 0; f < frames; f++) {
    const t = frames <= 1 ? 1 : f / (frames - 1);
    const img = gfx.make(W, H);
    // card
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const c0 = rrCov(x, y, W, H, R);
      if (c0 > 0) {
        const i = (y * W + x) * 4;
        img.d[i] = 252; img.d[i + 1] = 253; img.d[i + 2] = 255;
        img.d[i + 3] = Math.round(c0 * 255);
      }
    }
    // border + header chip
    const hw = Math.round(W * 0.34), hh = Math.round(H * 0.09);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const c1 = rrCov(x, y, W - 2, H - 2, R);
      if (c0in(x, y, W, H, R) > 0.5 && c1 < 0.5) {
        const i = (y * W + x) * 4;
        img.d[i] = 222; img.d[i + 1] = 229; img.d[i + 2] = 242; img.d[i + 3] = 255;
      }
      if (rrCov(x - gap, y - gap, hw, hh, hh / 2) > 0.5) {
        const i = (y * W + x) * 4;
        img.d[i] = 79; img.d[i + 1] = 70; img.d[i + 2] = 229; img.d[i + 3] = 255;
      }
    }
    // gridlines
    for (let g = 1; g <= 3; g++) {
      const gy = baseY - Math.round(maxH * g / 4);
      for (let x = gap; x < W - gap; x++) {
        const i = (gy * W + x) * 4;
        img.d[i] = 235; img.d[i + 1] = 239; img.d[i + 2] = 248; img.d[i + 3] = 255;
      }
    }
    // bars
    for (let b = 0; b < bars; b++) {
      const st = b * stagger;
      const p = clamp01((t - st) / growth);
      const hNow = Math.round(maxH * heights[b] * easeOutCubic(p));
      if (hNow <= 0) continue;
      const bx = gap + b * (barW + gap);
      for (let y = baseY - hNow; y < baseY; y++) {
        for (let x = bx; x < bx + barW; x++) {
          if (rrCov(x - bx, y - (baseY - hNow), barW, hNow, Math.min(14, hNow / 2)) > 0.5) {
            const i = (y * W + x) * 4;
            const g2 = 1 - 0.16 * ((y - (baseY - hNow)) / Math.max(1, hNow));
            img.d[i] = Math.round(103 * g2); img.d[i + 1] = Math.round(92 * g2); img.d[i + 2] = Math.round(241 * g2);
            img.d[i + 3] = 255;
          }
        }
      }
    }
    gfx.writePng(path.join(dir, 'f' + String(f).padStart(3, '0') + '.png'), W, H, img.d);
  }
  return path.join(dir, 'f%03d.png');
}

function c0in(x, y, w, h, r) {
  const cx = Math.max(r, Math.min(w - 1 - r, x));
  const cy = Math.max(r, Math.min(h - 1 - r, y));
  const cov = r + 0.5 - Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
  return cov > 0 ? (cov > 1 ? 1 : cov) : 0;
}
const rrCov = c0in;

// ---------- assemble ----------
function build(fmtName) {
  curFmt = fmtName;
  const fmt = FORMATS[fmtName];
  console.log('▶ Render ' + fmtName + '  (' + fmt.W + 'x' + fmt.H + ')');
  const clips = T.CLIPS.map((sc, i) => {
    const out = renderScene(sc, fmtName);
    console.log('  scene ' + (i + 1) + '/' + T.CLIPS.length + ' (' + sc.name + ')... ok');
    return out;
  });
  console.log('  concat + transitions...');
  const offs = T.computeOffsets();
  const parts = [];
  let prev = '[0:v]';
  for (let i = 0; i < T.TRANSITIONS.length; i++) {
    parts.push(`${prev}[${i + 1}:v]xfade=transition=${T.TRANSITIONS[i]}:duration=${T.XF}:offset=${offs[i].toFixed(3)}[x${i}]`);
    prev = `[x${i}]`;
  }
  fs.writeFileSync(path.join(TMP, fmtName + '_xfade.script'), parts.join(';'));
  const concat = path.join(TMP, fmtName + '_concat.mp4');
  run([...clips.flatMap((c) => ['-i', c]), '-filter_complex_script', path.join(TMP, fmtName + '_xfade.script'),
    '-map', prev, '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', concat],
  'concat');

  console.log('  mux audio...');
  const hasVO = fs.existsSync(path.join(__dirname, 'voiceover.wav'));
  const maps = ['-i', concat, '-i', path.join(__dirname, 'bgm_reklama.wav')];
  if (hasVO) maps.push('-i', path.join(__dirname, 'voiceover.wav'));
  const finalFilter = hasVO
    ? `[1:a]volume=0.85[m];[2:a]volume=1.0[v];[m][v]amix=inputs=2:duration=longest[aout]`
    : `[1:a]anull[aout]`;
  const outFile = path.join(__dirname, 'reklama-' + fmtName + '.mp4');
  run([...maps, '-filter_complex', finalFilter, '-map', '0:v', '-map', '[aout]',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', outFile],
  'mux');
  console.log('✅ reklama-' + fmtName + '.mp4  (' + T.totalDuration().toFixed(2) + 's)');
  return outFile;
}

module.exports = { renderScene, build, FORMATS, T, gfx, dt, escDrawText };

if (require.main === module) {
  const args = process.argv.slice(2);
  const targets = args.filter((a) => FORMATS[a]);
  if (targets.length) for (const f of targets) build(f);
  if (!targets.length) { build('16x9'); build('9x16'); }
}