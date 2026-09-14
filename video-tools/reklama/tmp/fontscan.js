'use strict';
const { execFileSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

const fonts = [
  'C:/Windows/Fonts/calibri.ttf',
  'C:/Windows/Fonts/calibrib.ttf',
  'C:/Windows/Fonts/segoeui.ttf',
  'C:/Windows/Fonts/segoeuib.ttf',
  'C:/Windows/Fonts/trebucbd.ttf',
  'C:/Windows/Fonts/arialbd.ttf',
  'C:/Users/New/Desktop/poss/video-tools/font.ttf',
];

const tests = [
  ['Cyrillic ' + '\u0420\u0443\u0441\u0441\u043A\u0438\u0439', '\u0420\u0443\u0441\u0441\u043A\u0438\u0439'],
  ['Olish ' + '\u043e\u043b\u0438\u0448', '\u043e\u043b\u0438\u0448'],
  ['Curly ' + '\u2018x\u2019', '\u2018x\u2019'],
  ['Emdash \u2014', '\u2014'],
  ['Middot \u00b7', '\u00b7'],
  ['Uzbek \u2018q', '\u2018q'],
];

for (const font of fonts) {
  console.log('\n########## ' + path.basename(font) + ' ##########');
  for (const [name, txt] of tests) {
    const file = 'tmp/_mt.png';
    // use -vf drawtext with escaping: colons need escape; single quote text wrapped
    const arr = [
      '-y', '-f', 'lavfi', '-i', 'color=c=0x10162E:s=900x200',
      '-vf', `drawtext=fontfile='${font.replace(/:/g, '\\:')}':fontsize=130:fontcolor=0xFFFFFF:text='${txt}':x=10:y=20`,
      '-frames:v', '1', file,
    ];
    try {
      execFileSync(ffmpeg, arr, { stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (e) {
      console.log('  ' + name + ': RENDER FAILED: ' + (e.stderr || '').toString().split('\n').filter(Boolean).slice(-2).join('; '));
      continue;
    }
    execFileSync(ffmpeg, ['-y', '-i', file, '-vf', 'format=gray,scale=90:25', '-f', 'rawvideo', '-pix_fmt', 'gray', 'tmp/_mt.gray'], { stdio: ['pipe', 'pipe', 'pipe'] });
    const b = fs.readFileSync('tmp/_mt.gray');
    let ox = 0;
    let oy = 0;
    // infer bounding box of glyph pixels
    let minX = 90, maxX = 0, minY = 25, maxY = 0;
    for (let y = 0; y < 25; y++) for (let x = 0; x < 90; x++) if (b[y * 90 + x] > 50) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    const boxW = maxX - minX + 1;
    const boxH = maxY - minY + 1;
    const density = (() => {
      let c = 0, tot = 0;
      for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) { const v = b[y * 90 + x]; if (v > 50) c++; else tot++; }
      return (c / Math.max(1, (boxW * boxH))).toFixed(2);
    })();
    // detect tofu: a big hollow rectangle => low interior fill with defined border
    let tofu = false;
    if (boxW >= 8 && boxH >= 10) {
      // sample inner region
      let inner = 0;
      for (let y = minY + 2; y <= maxY - 2; y++) for (let x = minX + 2; x <= maxX - 2; x++) if (b[y * 90 + x] > 50) inner++;
      const innerArea = Math.max(1, (boxW - 4) * (boxH - 4));
      tofu = inner / innerArea < 0.08;
    }
    console.log('  ' + name + ': bbox ' + boxW + 'x' + boxH + ' density ' + density + ' TOFU=' + tofu);
  }
}