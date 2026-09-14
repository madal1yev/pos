'use strict';
const { execFileSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const fs = require('fs');

const fonts = {
  'font.ttf': 'C\\:/Users/New/Desktop/poss/video-tools/font.ttf',
  'arialbd.ttf': 'C\\:/Windows/Fonts/arialbd.ttf',
  'calibri.ttf': 'C\\:/Windows/Fonts/calibri.ttf',
  'segoeui.ttf': 'C\\:/Windows/Fonts/segoeui.ttf',
};

const chrs = [
  'A', 'a', 'o', '\u00B7', '\u2018', '\u2019', '\u2014', '\u0420', '\u0443', '\u0439',
];

for (const [fn, font] of Object.entries(fonts)) {
  console.log('\n########## ' + fn + ' ##########');
  for (const ch of chrs) {
    const arr = [
      '-y', '-f', 'lavfi', '-i', 'color=c=0x10162E:s=300x200',
      '-vf', `drawtext=fontfile=${font}:fontsize=150:fontcolor=0xFFFFFF:text='${ch}':x=20:y=20`,
      '-frames:v', '1', 'tmp/_isc.png',
    ];
    try { execFileSync(ffmpeg, arr, { stdio: ['pipe', 'pipe', 'pipe'] }); }
    catch (e) { console.log(' ' + JSON.stringify(ch) + ': FAIL'); continue; }
    execFileSync(ffmpeg, ['-y', '-i', 'tmp/_isc.png', '-vf', 'format=gray,scale=50:25', '-f', 'rawvideo', '-pix_fmt', 'gray', 'tmp/_isc.gray'], { stdio: ['pipe', 'pipe', 'pipe'] });
    const b = fs.readFileSync('tmp/_isc.gray');
    // Count interior-dark for box detection: if there's a solid border with hollow center => tofu
    let minX = 50, maxX = 0, minY = 25, maxY = 0;
    for (let y = 0; y < 25; y++) for (let x = 0; x < 50; x++) if (b[y * 50 + x] > 50) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    const bw = maxX - minX + 1, bh = maxY - minY + 1;
    let inner = 0;
    if (bw >= 6 && bh >= 6) {
      for (let y = minY + 1; y <= maxY - 1; y++) for (let x = minX + 1; x <= maxX - 1; x++) if (b[y * 50 + x] > 50) inner++;
    }
    const tofu = (bw >= 6 && bh >= 6 && inner <= 1);
    console.log(' ' + JSON.stringify(ch) + (ch.codePointAt(0) > 127 ? '(' + ch.codePointAt(0).toString(16) + ')' : '') + ': bbox ' + bw + 'x' + bh + ' TOFU=' + tofu);
  }
}