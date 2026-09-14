const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FFMPEG = require('ffmpeg-static');
const FONT = path.join(__dirname, 'font.ttf').replace(/\\/g, '/').replace(/:/g, '\\:');
const OUT = path.join(__dirname, '..', 'foodspos-reklama-noutbuk.mp4');
const SHOTS = path.join(__dirname, '..', 'shots');
const TMP = path.join(__dirname, 'clips');

fs.mkdirSync(TMP, { recursive: true });

// Eski formatdagi (masalan, portret) clip'lar qolib ketmasligi uchun tozalaymiz
for (const f of fs.readdirSync(TMP)) {
  if (f.endsWith('.mp4')) fs.unlinkSync(path.join(TMP, f));
}

// Noutbuk (16:9) formati — 1920x1080
const W = 1920, H = 1080, FPS = 30, XF = 0.35;
const SHOT_W = 900, SHOT_H = 1600; // manba suratlar nisbati (9:16)

// ---- helpers ----
const qt = (t) => "'" + String(t).replace(/'/g, "'\\''") + "'";   // filter-graph single-quote escaping
const esc = (t) => String(t).replace(/:/g, '\\:').replace(/'/g, "'\\''");

function run(args) {
  // -y: mavjud fayl ustiga yozishga majbur (aks holda stdin yopiq bo'lsa
  // ffmpeg "Overwrite? [y/N]" so'roviga N javob berib, eski faylni qoldiradi)
  execFileSync(FFMPEG, ['-y', ...args], { stdio: ['ignore', 'ignore', 'pipe'] });
}

function dtext({ text, size, color, y, appear = 0, box = 'black@0.35', bw = 22, x = 'w-tw/2', fontfile = FONT }) {
  const alpha = appear > 0
    ? `alpha='if(lt(t,${appear}),0,min(1,(t-${appear})/${alphaFade}))'`
    : 'alpha=1';
  return `drawtext=fontfile=${fontfile}:text=${qt(text)}:fontsize=${size}:fontcolor=${color}:x=${x}:y=${y}:box=1:boxcolor=${box}:boxborderw=${bw}:${alpha}`;
}
const alphaFade = 0.25;

// Screenshot clip: xira (blur) fon + markazda telefon surati + tepada matn
function imgClip(file, dur, { zoom = 'in', text, tsize = 66, tcolor = 'white', appear = 0.15 }) {
  const frames = Math.round(dur * FPS);
  const zExpr = zoom === 'in'
    ? `min(1.0+${0.12 / frames}*on,1.16)`
    : `max(1.14-${0.12 / frames}*on,1.0)`;
  const PH = 740; // telefon surati balandligi (1080 ning ~69%)
  const PW = Math.round(PH * SHOT_W / SHOT_H);
  const px = Math.round((W - PW) / 2);
  const py = 190; // tepadagi matn uchun joy qoldiramiz
  const vf = [
    `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=45:2,eq=brightness=-0.18:saturation=0.8[bgbg]`,
    `[0:v]scale=-1:${PH}[phone]`,
    `[bgbg][phone]overlay=${px}:${py},zoompan=z='${zExpr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}${text ? ',' + dtext({ text, size: tsize, color: tcolor, y: 70, appear }) : ''},format=yuv420p`,
  ].join(';');
  const out = path.join(TMP, path.basename(file, '.png') + '.mp4');
  fs.writeFileSync(path.join(TMP, 'vf_' + path.basename(file, '.png') + '.txt'), vf);
  run(['-i', path.join(SHOTS, file), '-filter_complex_script', path.join(TMP, 'vf_' + path.basename(file, '.png') + '.txt'), '-frames:v', frames, '-r', FPS, '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', out]);
  return out;
}

// ---- SAHNA 1: HOOK (0-3.2s) — ikkita telefon yonma-yon + katta sarlavha ----
function scene1() {
  const frames = Math.round(3.2 * FPS);
  const PH = 750;
  const PW = Math.round(PH * SHOT_W / SHOT_H);
  const gap = 50;
  const x0 = Math.round((W - PW * 2 - gap) / 2);
  const x1 = x0 + PW + gap;
  const py = 300;
  const vf = [
    `color=c=0x0f172a:s=${W}x${H}:r=30[bg]`,
    `[0:v]scale=-1:${PH}[p1]`,
    `[1:v]scale=-1:${PH}[p2]`,
    `[bg][p1]overlay=${x0}:${py}[v1]`,
    `[v1][p2]overlay=${x1}:${py}:enable='gte(t,0.55)'[v2]`,
    `[v2]${dtext({ text: 'QANCHA PUL', size: 84, color: 'white', y: 70, appear: 1.15, box: '0x0f172a@0.55' })}[v3]`,
    `[v3]${dtext({ text: "YO'QOTYAPSIZ?", size: 84, color: '#a5b4fc', y: 185, appear: 1.55, box: '0x0f172a@0.55' })}[v4]`,
    '[v4]format=yuv420p',
  ].join(';');
  const out = path.join(TMP, 's1.mp4');
  fs.writeFileSync(path.join(TMP, 'vf_s1.txt'), vf);
  run(['-i', path.join(SHOTS, '03_pos.png'), '-i', path.join(SHOTS, '05_checkout.png'), '-filter_complex_script', path.join(TMP, 'vf_s1.txt'), '-frames:v', frames, '-r', FPS, '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', out]);
  return out;
}

// ---- SAHNA 2: MUAMMO (3.2-8.0s) ----
function scene2() {
  const frames = Math.round(4.8 * FPS);
  const chip = (text, y, appear) => dtext({ text, size: 56, color: 'white', y, appear, box: '0x1e293b@0.9', bw: 24, x: 'w-tw/2' });
  const vf = [
    `color=c=0x0f172a:s=${W}x${H}:r=30[v0]`,
    `[v0]${dtext({ text: 'Daftar hisobi', size: 96, color: 'white', y: 280, appear: 0.3, box: '0x0f172a@0.5' })}[v1]`,
    `[v1]${dtext({ text: "o'tmishda", size: 96, color: '#fbbf24', y: 420, appear: 0.6, box: '0x0f172a@0.5' })}[v2]`,
    `[v2]${chip('Navbat', 660, 1.1)}[v3]`,
    `[v3]${chip('Xato hisob', 800, 1.9)}[v4]`,
    `[v4]${chip("Yo'qolgan cheklar", 940, 2.7)}[v5]`,
    '[v5]format=yuv420p',
  ].join(';');
  const out = path.join(TMP, 's2.mp4');
  fs.writeFileSync(path.join(TMP, 'vf_s2.txt'), vf);
  run(['-filter_complex_script', path.join(TMP, 'vf_s2.txt'), '-frames:v', frames, '-r', FPS, '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', out]);
  return out;
}

// ---- SAHNA 3: YECHIM (8.0-15.0s) ----
const SCENE3 = [
  ['03_pos.png', 1.4, '1 skaner - 1 soniya'],
  ['07_pos_search.png', 1.4, 'Mahsulot bir zumda topiladi'],
  ['04_cart.png', 1.4, 'Bir bosishda savatda'],
  ['05b_checkout.png', 1.4, 'Qaytim avtomatik hisoblanadi'],
  ['06_receipt.png', 1.4, 'Chek bir zumda chop etiladi'],
];

// ---- SAHNA 4: AFZALLIKLAR (15.0-21.0s) ----
const SCENE4 = [
  ['02_dashboard.png', 1.5, 'Daromad - real vaqtda'],
  ['10_products.png', 1.5, 'Kam qolgan - signal beradi'],
  ['08b_reports_chart.png', 1.5, 'Hisobotlar - bir tugmada'],
  ['09_debtors.png', 1.5, 'Qarzdorlar - to\'liq nazorat'],
];

// ---- SAHNA 5: CTA (21.0-26.0s) ----
function scene5() {
  const frames = Math.round(5.0 * FPS);
  const vf = [
    `gradients=s=${W}x${H}:c0=0x4f46e5:c1=0x17103f:x0=0:y0=0:x1=${W}:y1=${H}:r=30[v0]`,
    `[v0]${dtext({ text: 'MaxPOS', size: 150, color: 'white', y: 280, appear: 0.3, box: '0x17103f@0.35', bw: 26 })}[v1]`,
    `[v1]${dtext({ text: 'Bugun boshlang', size: 76, color: '#4f46e5', y: 540, appear: 1.0, box: 'white@0.95', bw: 30, x: 'w-tw/2' })}[v2]`,
    `[v2]${dtext({ text: 'Kassa | Ombor | Qarzdorlar | Hisobotlar', size: 44, color: '#c7d2fe', y: 700, appear: 1.7, box: '0x17103f@0.4', bw: 14 })}[v3]`,
    `[v3]${dtext({ text: "O'zbek | Русский | English", size: 34, color: '#818cf8', y: 800, appear: 2.3, box: '0x17103f@0.35', bw: 10 })}[v4]`,
    '[v4]format=yuv420p',
  ].join(';');
  const out = path.join(TMP, 's5.mp4');
  fs.writeFileSync(path.join(TMP, 'vf_s5.txt'), vf);
  run(['-filter_complex_script', path.join(TMP, 'vf_s5.txt'), '-frames:v', frames, '-r', FPS, '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', out]);
  return out;
}

// ---- render ----
console.log('Scene 1 (Hook)...');
const s1 = scene1();
console.log('Scene 2 (Muammo)...');
const s2 = scene2();
console.log('Scene 3 (Yechim)...');
const s3clips = SCENE3.map(([f, d, t], i) => imgClip(f, d, { zoom: i % 2 ? 'out' : 'in', text: t }));
console.log('Scene 4 (Afzalliklar)...');
const s4clips = SCENE4.map(([f, d, t], i) => imgClip(f, d, { zoom: i % 2 ? 'out' : 'in', text: t }));
console.log('Scene 5 (CTA)...');
const s5 = scene5();

const clips = [s1, s2, ...s3clips, ...s4clips, s5];
const durs = [3.2, 4.8, ...SCENE3.map((c) => c[1]), ...SCENE4.map((c) => c[1]), 5.0];
const nTrans = clips.length - 1; // 11 transitions
let totalDur = durs.reduce((a, b) => a + b, 0) - nTrans * XF;

// xfade chain: [0][1]xfade[v0]; [v0][2]xfade[v1]; ...
const inputs = [];
clips.forEach((c, i) => inputs.push('-i', c));
let filter = '';
let acc = durs[0];
const transitions = ['fade', 'fade', 'slideleft', 'slideleft', 'fade', 'fade', 'slideleft', 'slideleft', 'slideleft', 'fade', 'fade'];
for (let i = 0; i < nTrans; i++) {
  const off = acc - XF;
  const prev = i === 0 ? '[0:v]' : `[v${i - 1}]`;
  const next = `[${i + 1}:v]`;
  filter += `${prev}${next}xfade=transition=${transitions[i]}:duration=${XF}:offset=${off.toFixed(3)}[v${i}];`;
  acc += durs[i + 1] - XF;
}
filter += `[v${nTrans - 1}]format=yuv420p[vout]`;

console.log('Concat + xfade...');
const vfFile = path.join(TMP, 'concat.txt');
fs.writeFileSync(vfFile, filter);
const noAudio = path.join(TMP, 'video_noaudio.mp4');
run([...inputs, '-filter_complex_script', vfFile, '-map', '[vout]', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-r', FPS, '-pix_fmt', 'yuv420p', noAudio]);

console.log('Mux audio...');
run(['-i', noAudio, '-i', path.join(__dirname, 'bgm.wav'), '-t', totalDur.toFixed(2), '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-af', 'volume=0.85', '-shortest', OUT]);

console.log('✅ DONE:', OUT, '| duration ~' + totalDur.toFixed(1) + 's');
