'use strict';
const { execFileSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const fs = require('fs');

const fontPaths = {
  'calibri (quoted)': ['fontfile=\'C\\:/Windows/Fonts/calibri.ttf\''],
  'calibri (bare)': ['fontfile=C\\:/Windows/Fonts/calibri.ttf'],
  'font.ttf (bare)': ['fontfile=C\\:/Users/New/Desktop/poss/video-tools/font.ttf'],
};

const emdash = '\u2014';
const cyr = '\u0420\u0443\u0441\u0441\u043A\u0438\u0439';

// Method A: inline text via -vf
for (const [name, fpath] of Object.entries(fontPaths)) {
  const vf = `drawtext=${fpath}:fontsize=100:fontcolor=0xFFFFFF:text='${emdash}':x=10:y=10`;
  try {
    execFileSync(ffmpeg, ['-y', '-f', 'lavfi', '-i', 'color=c=0x10162E:s=400x200', '-vf', vf, '-frames:v', '1', 'tmp/_e.png'], { stdio: ['pipe', 'pipe', 'pipe'] });
    execFileSync(ffmpeg, ['-y', '-i', 'tmp/_e.png', '-vf', 'format=gray,scale=80:20', '-f', 'rawvideo', '-pix_fmt', 'gray', 'tmp/_e.gray'], { stdio: ['pipe', 'pipe', 'pipe'] });
    const b = fs.readFileSync('tmp/_e.gray');
    let minX = 80, maxX = 0, minY = 20, maxY = 0;
    for (let y = 0; y < 20; y++) for (let x = 0; x < 80; x++) if (b[y * 80 + x] > 50) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    const bw = maxX - minX + 1, bh = maxY - minY + 1;
    console.log('EMDASH inline ' + name + ': bbox ' + bw + 'x' + bh + (bh <= 3 && bw >= 4 ? '  => REAL BAR' : '  => TOFU?'));
  } catch (e) {
    console.log('EMDASH inline ' + name + ': FAIL ' + (e.stderr || '').toString().split('\n').filter(Boolean).slice(-1)[0]);
  }
}

// Method B: textfile (UTF-8 file with em dash)
fs.writeFileSync('tmp/_t.txt', emdash, 'utf8');
for (const [name, fpath] of Object.entries(fontPaths)) {
  const vf = `drawtext=${fpath}:fontsize=100:fontcolor=0xFFFFFF:textfile=tmp/_t.txt:x=10:y=10`;
  try {
    execFileSync(ffmpeg, ['-y', '-f', 'lavfi', '-i', 'color=c=0x10162E:s=400x200', '-vf', vf, '-frames:v', '1', 'tmp/_e.png'], { stdio: ['pipe', 'pipe', 'pipe'] });
    execFileSync(ffmpeg, ['-y', '-i', 'tmp/_e.png', '-vf', 'format=gray,scale=80:20', '-f', 'rawvideo', '-pix_fmt', 'gray', 'tmp/_e.gray'], { stdio: ['pipe', 'pipe', 'pipe'] });
    const b = fs.readFileSync('tmp/_e.gray');
    let minX = 80, maxX = 0, minY = 20, maxY = 0;
    for (let y = 0; y < 20; y++) for (let x = 0; x < 80; x++) if (b[y * 80 + x] > 50) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    const bw = maxX - minX + 1, bh = maxY - minY + 1;
    console.log('EMDASH textfile ' + name + ': bbox ' + bw + 'x' + bh + (bh <= 3 && bw >= 4 ? '  => REAL BAR' : '  => TOFU?'));
  } catch (e) {
    console.log('EMDASH textfile ' + name + ': FAIL ' + (e.stderr || '').toString().split('\n').filter(Boolean).slice(-1)[0]);
  }
}

// Method C: Cyrillic via textfile
fs.writeFileSync('tmp/_t2.txt', cyr, 'utf8');
for (const [name, fpath] of Object.entries(fontPaths)) {
  const vf = `drawtext=${fpath}:fontsize=100:fontcolor=0xFFFFFF:textfile=tmp/_t2.txt:x=10:y=10`;
  try {
    execFileSync(ffmpeg, ['-y', '-f', 'lavfi', '-i', 'color=c=0x10162E:s=600x200', '-vf', vf, '-frames:v', '1', 'tmp/_e.png'], { stdio: ['pipe', 'pipe', 'pipe'] });
    execFileSync(ffmpeg, ['-y', '-i', 'tmp/_e.png', '-vf', 'format=gray,scale=120:25', '-f', 'rawvideo', '-pix_fmt', 'gray', 'tmp/_e.gray'], { stdio: ['pipe', 'pipe', 'pipe'] });
    const b = fs.readFileSync('tmp/_e.gray');
    let minX = 120, maxX = 0, minY = 25, maxY = 0;
    for (let y = 0; y < 25; y++) for (let x = 0; x < 120; x++) if (b[y * 120 + x] > 50) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    const bw = maxX - minX + 1, bh = maxY - minY + 1;
    // hollow check
    let inner = 0;
    for (let y = minY + 1; y < maxY; y++) for (let x = minX + 1; x < maxX; x++) if (b[y * 120 + x] > 50) inner++;
    const textFileFree = 'textfile';
    void textFileFree;
    console.log('CYR textfile ' + name + ': bbox ' + bw + 'x' + bh + ' innerDark=' + inner + (inner === 0 ? '  => TOFU' : '  => REAL'));
  } catch (e) {
    console.log('CYR textfile ' + name + ': FAIL');
  }
}