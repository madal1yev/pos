// build_foodspos_reels.js — foodsPOS Instagram Reels renderer (9:16, 1080x1920, 30fps)
// Timeline: timeline_foodspos.js | Audio: bgm_foodspos.wav | Screenshots: shots/
// Ishlatish: node build_foodspos_reels.js
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const gfx = require('./gfx');
const T = require('./timeline_foodspos');

const FPS = T.FPS;
// Gyan ffmpeg 9 (full freetype+fontconfig): `-filter_complex_script` olib tashlangan,
// shuning uchun filtergraflar inline `-filter_complex` orqali uzatiladi.
const FFMPEG = path.join(__dirname, 'gyan', 'ffmpeg-9.0.1-essentials_build', 'bin', 'ffmpeg.exe');
const ROOT = path.join(__dirname, '..', '..', '..');
const SHOTS = path.join(ROOT, 'shots');
const TMP = path.join(__dirname, 'tmp-reels');
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

// Shrift nisbiy yo'l bilan beriladi (C: dagi `:` v9 filter parserini buzadi).
// `node build_foodspos_reels.js` shu papkadan ishga tushirilishi shart.
const FONT = path.relative(process.cwd(), path.join(__dirname, 'arialbold.ttf')).replace(/\\/g, '/');

const W = 1080, H = 1920;
const PHONE = { w: 664, h: 1060, x: 208, y: 640 };
const CAP = { y: 300, fs: 64, subFs: 32 };
const COLORS = {
  ink: '0x0B1020', inkDim: '0x526078', white: '0xFFFFFF', whiteSoft: '0xC7D2FE',
  indigo: '0x4F46E5', indigoBright: '0x6366F1', red: '0xEF4444',
  amber: '0xF59E0B', emerald: '0x10B981', tgBlue: '0x0088CC',
};

let seq = 0;
const L = () => `x${(++seq).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

function escDrawText(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, '’')
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
    err.stderr = (e.stderr || '').toString().slice(-3000);
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

function addTextLayer(S, text, size, color, xExpr, yExpr, fadeIn, dur, extra = '') {
  const lay = S.A.lavfi(`color=s=${W}x${H}:c=black:r=${FPS}`);
  let t = S.chain(lay, 'format=rgba,colorchannelmixer=aa=0', L());
  t = S.chain(t, dt(text, size, color, xExpr, yExpr, extra), L());
  t = S.chain(t, `format=rgba,fade=t=in:st=${fadeIn.toFixed(2)}:d=0.3:alpha=1`, L());
  return t;
}

// slide-up kirish (0.5s ease-out)
function rise(S, main, layer, risePx = 36, durRise = 0.5) {
  return S.overlay(main, layer, `x=0:y='${risePx}*pow(max(0,1-t/${durRise}),3)'`, L());
}

function base(S, dark) {
  let main = S.A.loopFile(gfx.bg(W, H, dark ? 'dark' : 'light'));
  main = S.chain(main, `scale=${W}:${H}`, L());
  const blobFile = gfx.blob(1200, 0.42, dark ? '#4F46E5' : '#6366F1', 0.10);
  let bl = S.A.loopFile(blobFile);
  bl = S.chain(bl, 'scale=1200:1200', L());
  main = S.overlay(main, bl, `${Math.round(W * 0.8)}:${Math.round(H * 0.08)}`, L());
  return main;
}

// caption + chip (chip caption ostida, xavfsiz zonada) + ixtiyoriy sub
function captions(S, main, scene, dark) {
  const dur = scene.dur;
  if (scene.big) {
    const tl = addTextLayer(S, scene.big, CAP.fs, dark ? COLORS.white : COLORS.ink,
      '(w-text_w)/2', CAP.y, 0.12, dur,
      dark ? 'shadowcolor=0x00000099:shadowx=0:shadowy=5' : '');
    main = rise(S, main, tl, 36, 0.5);
  }
  if (scene.chip) {
    const fs = 34, hh = 92;
    const pw = Math.round(scene.chip.length * fs * 0.58 + 92);
    let p = S.A.loopFile(gfx.pill(pw, hh, '#6366F1', 1));
    p = S.chain(p, dt(scene.chip, fs, COLORS.white, '(w-text_w)/2', '(h-text_h)/2'), L());
    p = S.chain(p, 'format=rgba,fade=t=in:st=0.2:d=0.28:alpha=1', L());
    main = S.overlay(main, p, `${Math.round(W / 2 - pw / 2)}:${CAP.y + 120}`, L());
  }
  if (scene.sub) {
    const sl = addTextLayer(S, scene.sub, CAP.subFs, dark ? COLORS.whiteSoft : COLORS.inkDim,
      '(w-text_w)/2', CAP.y + 240, 0.3, dur);
    main = rise(S, main, sl, 24, 0.5);
  }
  return main;
}

function phoneInto(S, main, file) {
  const { w, h, x, y } = PHONE;
  const r = Math.round(w * 0.13);
  let p = S.A.file(path.join(ROOT, file));
  p = S.chain(p, `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},eq=saturation=1.05:contrast=1.02`, L());
  const m = S.A.loopFile(gfx.phoneMask(w, h, r));
  p = S.chain(`${p}${m}`, 'alphamerge', L());
  const sh = S.A.loopFile(gfx.phoneShadow(w, h, r, 40, 0.30));
  main = S.overlay(main, sh, `${x}:${y + 18}`, L());
  main = S.overlay(main, p, `${x}:${y}`, L());
  return main;
}

// ---- HOOK: qorong'u + qizil X + katta savol ----
function hookScene(S, scene) {
  let main = base(S, true);
  const dur = scene.dur;
  // qizil X (katta, markaz-yuqori)
  const xl = addTextLayer(S, 'X', 200, COLORS.red, '(w-text_w)/2', 560, 0.5, dur,
    'shadowcolor=0xEF444488:shadowx=0:shadowy=0');
  main = S.overlay(main, xl, '0:0', L());
  // ikki qator katta matn — typewriter o'rniga slide-up (0.3-0.5s)
  const l1 = addTextLayer(S, scene.big1, 78, COLORS.white, '(w-text_w)/2', 900, 0.9, dur,
    'shadowcolor=0x00000099:shadowx=0:shadowy=5');
  main = rise(S, main, l1, 40, 0.5);
  const l2 = addTextLayer(S, scene.big2, 78, '#a5b4fc', '(w-text_w)/2', 1010, 1.25, dur,
    'shadowcolor=0x00000099:shadowx=0:shadowy=5');
  main = rise(S, main, l2, 40, 0.5);
  const sl = addTextLayer(S, scene.sub, 32, COLORS.amber, '(w-text_w)/2', 1180, 1.7, dur);
  main = rise(S, main, sl, 24, 0.5);
  return S.chain(main, 'format=yuv420p', 'out');
}

// ---- WIPE: yorug' foodsPOS reveal ----
function wipeScene(S, scene) {
  let main = base(S, false);
  const dur = scene.dur;
  const wm = addTextLayer(S, 'foodsPOS', 130, COLORS.indigo, '(w-text_w)/2', 640, 0.1, dur,
    'shadowcolor=0x00000018:shadowx=0:shadowy=6');
  main = rise(S, main, wm, 44, 0.45);
  const tl = addTextLayer(S, scene.tag, 36, COLORS.ink, '(w-text_w)/2', 830, 0.5, dur);
  main = rise(S, main, tl, 30, 0.45);
  // pastda yorug' chiziq (glitch-wipe hissi)
  const pw = 760, ph = 10;
  let bar = S.A.loopFile(gfx.pill(pw, 60, '#4F46E5', 0));
  bar = S.chain(bar, 'format=rgba,fade=t=in:st=0.15:d=0.25:alpha=1', L());
  main = S.overlay(main, bar, `${Math.round(W / 2 - pw / 2)}:1000`, L());
  return S.chain(main, 'format=yuv420p', 'out');
}

// ---- TELEGRAM: telefon mockup ichida chat ----
function telegramScene(S, scene) {
  let main = base(S, false);
  const dur = scene.dur;
  const isClient = scene.bot === 'client';
  const botName = isClient ? '@foodsPOS_bot' : '@klentlarchek_bot';
  const botRole = isClient ? 'Mijoz boti · online' : 'Admin boti · online';

  const px = 210, py = 660, pw = 660, ph = 980;
  // telefon soyasi + korpusi
  const sh = S.A.loopFile(gfx.phoneShadow(pw, ph, 48, 40, 0.30));
  main = S.overlay(main, sh, `${px}:${py + 18}`, L());
  const body = S.A.lavfi(`color=s=${pw}x${ph}:c=0x0E1621:r=${FPS}`);
  main = S.overlay(main, body, `${px}:${py}`, L());
  // header
  const head = S.A.lavfi(`color=s=${pw}x110:c=0x17212b:r=${FPS}`);
  main = S.overlay(main, head, `${px}:${py}`, L());
  main = S.chain(main, dt(botName, 30, COLORS.white, px + 28, py + 18), L());
  main = S.chain(main, dt(botRole, 22, COLORS.emerald, px + 28, py + 58), L());

  // xabarlar
  const msgs = isClient ? [
    { text: '2x Osh + 1x Cola — #1241', color: '#FFFFFF', tc: COLORS.ink, y: py + 160, w: 540, fade: 0.4 },
    { text: 'Qabul qilindi!', color: '#D9FDD3', tc: COLORS.ink, y: py + 320, w: 420, fade: 0.85, right: true },
    { text: '20 daqiqada yetkazamiz', color: '#FFFFFF', tc: COLORS.ink, y: py + 480, w: 500, fade: 1.25 },
    { text: 'Rahmat, kutaman!', color: '#D9FDD3', tc: COLORS.ink, y: py + 640, w: 440, fade: 1.6, right: true },
  ] : [
    { text: 'Yangi buyurtma #1241', color: '#FFF4E0', tc: COLORS.ink, y: py + 160, w: 500, fade: 0.4 },
    { text: '2x Osh — 50 000 so‘m', color: '#FFFFFF', tc: COLORS.ink, y: py + 320, w: 520, fade: 0.85 },
    { text: 'Kuryerga topshirildi', color: '#DFF7E8', tc: COLORS.ink, y: py + 480, w: 500, fade: 1.25 },
    { text: 'Sotuv yopildi', color: '#FFFFFF', tc: COLORS.ink, y: py + 640, w: 420, fade: 1.6 },
  ];
  const bh = 110;
  for (const m of msgs) {
    let pill = S.A.loopFile(gfx.pill(m.w, bh, m.color, 1));
    pill = S.chain(pill, dt(m.text, 27, m.tc, '(w-text_w)/2', '(h-text_h)/2'), L());
    pill = S.chain(pill, `format=rgba,fade=t=in:st=${m.fade}:d=0.25:alpha=1`, L());
    const bx = m.right ? px + pw - 24 - m.w : px + 24;
    main = S.overlay(main, pill, `${bx}:${m.y}`, L());
  }

  main = captions(S, main, scene, false);
  // telefon ostiga kichik bot nomi
  const nl = addTextLayer(S, botName, 28, COLORS.tgBlue, '(w-text_w)/2', py + ph + 24, 0.5, dur);
  main = S.overlay(main, nl, '0:0', L());
  return S.chain(main, 'format=yuv420p', 'out');
}

// ---- CTA: indigo gradient + logo scale/glow + kontaktlar ----
function ctaScene(S, scene) {
  const dur = scene.dur;
  let main = S.A.lavfi(`gradients=s=${W}x${H}:c0=0x4f46e5:c1=0x17103f:x0=0:y0=0:x1=${W}:y1=${H}:r=${FPS}`);
  main = S.chain(main, 'format=yuv420p', L());
  // glow blob logo ortida
  let bl = S.A.loopFile(gfx.blob(700, 0.5, '#FFFFFF', 0.14));
  bl = S.chain(bl, 'scale=700:700', L());
  main = S.overlay(main, bl, `${Math.round(W / 2 - 350)}:330`, L());

  const brand = addTextLayer(S, scene.brand, 150, COLORS.white, '(w-text_w)/2', 560, 0.15, dur,
    'shadowcolor=0x00000066:shadowx=0:shadowy=8');
  main = rise(S, main, brand, 40, 0.5);
  const tag = addTextLayer(S, scene.tagline, 52, COLORS.whiteSoft, '(w-text_w)/2', 780, 0.6, dur);
  main = rise(S, main, tag, 30, 0.5);
  // oq tugma
  const fsP = 40;
  const btw = Math.round(scene.button.length * fsP * 0.58 + 110);
  let btn = S.A.loopFile(gfx.pill(btw, 108, '#FFFFFF', 0));
  btn = S.chain(btn, dt(scene.button, fsP, COLORS.indigo, '(w-text_w)/2', '(h-text_h)/2'), L());
  btn = S.chain(btn, 'format=rgba,fade=t=in:st=1.0:d=0.3:alpha=1', L());
  main = S.overlay(main, btn, `${Math.round(W / 2 - btw / 2)}:980`, L());
  // kontaktlar — oxirgi kadrda qoladi (logo bilan tugash)
  const ct = addTextLayer(S, scene.contacts, 30, '#a5b4fc', '(w-text_w)/2', 1160, 1.5, dur);
  main = S.overlay(main, ct, '0:0', L());
  const ft = addTextLayer(S, 'Kassa · Ombor · Hisobotlar · Telegram', 26, COLORS.whiteSoft, '(w-text_w)/2', 1230, 1.9, dur);
  main = S.overlay(main, ft, '0:0', L());
  return S.chain(main, 'format=yuv420p', 'out');
}

function renderScene(scene) {
  const frames = Math.max(1, Math.round(scene.dur * FPS));
  const out = path.join(TMP, `reels_${scene.name}.mp4`);
  const S = mkScene();
  let main;

  switch (scene.kind) {
    case 'hook': main = hookScene(S, scene); break;
    case 'wipe': main = wipeScene(S, scene); break;
    case 'shot': {
      let m = base(S, false);
      m = phoneInto(S, m, scene.file);
      m = captions(S, m, scene, false);
      main = S.chain(m, 'format=yuv420p', 'out');
      break;
    }
    case 'chart': {
      let m = base(S, false);
      const cw = 900, ch = 560, cx = 90, cy = 780;
      const framesJs = genChartFrames(cw, ch, frames, scene.dur);
      let chart = S.A.imgs(framesJs);
      chart = S.chain(chart, 'format=rgba', L());
      m = S.overlay(m, chart, `${cx}:${cy}`, L());
      m = captions(S, m, { ...scene, big: scene.big }, false);
      // caption chart ustida bo'lishi uchun capY ni yuqoriga — captions() allaqachon 300 da
      main = S.chain(m, 'format=yuv420p', 'out');
      break;
    }
    case 'telegram': main = telegramScene(S, scene); break;
    case 'cta': main = ctaScene(S, scene); break;
    default: throw new Error('unknown kind ' + scene.kind);
  }

  const scriptFile = path.join(TMP, `reels_${scene.name}.script`);
  const graph = S.F.join(';');
  fs.writeFileSync(scriptFile, graph); // debug uchun saqlanadi
  const args = [];
  for (const inp of S.inputs) args.push(...inp);
  args.push('-filter_complex', graph, '-map', main, '-frames:v', frames, '-r', FPS,
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out);
  run(args, 'scene ' + scene.name);
  return out;
}

// ---------- animatsiyali grafik (indigo barlar, pastdan o'sadi) ----------
function genChartFrames(cw, ch, frames, dur) {
  const dir = path.join(TMP, 'chart_' + L());
  fs.mkdirSync(dir, { recursive: true });
  const R = Math.round(ch * 0.08);
  const bars = 7;
  const heights = [0.5, 0.72, 0.4, 0.6, 0.9, 0.68, 0.82];
  const gap = Math.round(cw * 0.024);
  const barW = Math.round((cw - gap * (bars + 1)) / bars);
  const baseY = ch - Math.round(ch * 0.16);
  const maxH = Math.round(ch * 0.46);
  for (let f = 0; f < frames; f++) {
    const t = frames <= 1 ? 1 : f / (frames - 1);
    const img = gfx.make(cw, ch);
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const c0 = rrCov(x, y, cw, ch, R);
      if (c0 > 0) {
        const i = (y * cw + x) * 4;
        img.d[i] = 252; img.d[i + 1] = 253; img.d[i + 2] = 255;
        img.d[i + 3] = Math.round(c0 * 255);
      }
    }
    for (let b = 0; b < bars; b++) {
      const p = clamp01((t - b * 0.06) / 0.5);
      const hNow = Math.round(maxH * heights[b] * easeOutCubic(p));
      if (hNow <= 0) continue;
      const bx = gap + b * (barW + gap);
      for (let y = baseY - hNow; y < baseY; y++) {
        for (let x = bx; x < bx + barW; x++) {
          if (rrCov(x - bx, y - (baseY - hNow), barW, hNow, Math.min(14, hNow / 2)) > 0.5) {
            const i = (y * cw + x) * 4;
            img.d[i] = 99; img.d[i + 1] = 102; img.d[i + 2] = 241; img.d[i + 3] = 255;
          }
        }
      }
    }
    gfx.writePng(path.join(dir, 'f' + String(f).padStart(3, '0') + '.png'), cw, ch, img.d);
  }
  return path.join(dir, 'f%03d.png');
}

function rrCov(x, y, w, h, r) {
  const cx = Math.max(r, Math.min(w - 1 - r, x));
  const cy = Math.max(r, Math.min(h - 1 - r, y));
  const cov = r + 0.5 - Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
  return cov > 0 ? (cov > 1 ? 1 : cov) : 0;
}

// ---------- assemble: xfade + audio mux ----------
function build() {
  console.log('foodsPOS Reels 9:16  (' + W + 'x' + H + ', ' + FPS + 'fps)');
  const clips = T.CLIPS.map((sc, i) => {
    const out = renderScene(sc);
    console.log(`  [${i + 1}/${T.CLIPS.length}] ${sc.name} (${sc.dur}s)... ok`);
    return out;
  });

  console.log('Concat + xfade...');
  const offs = T.computeOffsets();
  const parts = [];
  let prev = '[0:v]';
  for (let i = 0; i < T.TRANSITIONS.length; i++) {
    parts.push(`${prev}[${i + 1}:v]xfade=transition=${T.TRANSITIONS[i]}:duration=${T.XF}:offset=${offs[i].toFixed(3)}[x${i}]`);
    prev = `[x${i}]`;
  }
  fs.writeFileSync(path.join(TMP, 'xfade.script'), parts.join(';'));
  const concat = path.join(TMP, 'concat.mp4');
  run([...clips.flatMap((c) => ['-i', c]), '-filter_complex', parts.join(';'),
    '-map', prev, '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', concat],
    'concat');

  console.log('Mux audio...');
  const totalDur = T.totalDuration();
  const bgm = path.join(__dirname, 'bgm_foodspos.wav');
  const outFile = path.join(ROOT, 'foodsPOS-reels-9x16.mp4');
  run(['-i', concat, '-i', bgm, '-t', totalDur.toFixed(2),
    '-filter_complex', '[1:a]volume=0.9[aout]',
    '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-shortest', outFile], 'mux');

  const size = fs.statSync(outFile).size;
  console.log(`DONE: ${outFile}  (${totalDur.toFixed(2)}s, ${(size / 1048576).toFixed(1)} MB)`);
  return outFile;
}

if (require.main === module) build();
module.exports = { build };
