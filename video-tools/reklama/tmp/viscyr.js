'use strict';
const { execFileSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const fs = require('fs');

const fonts = {
  'font.ttf': 'C\\:/Users/New/Desktop/poss/video-tools/font.ttf',
  'arialbd.ttf': 'C\\:/Windows/Fonts/arialbd.ttf',
  'calibri.ttf': 'C\\:/Windows/Fonts/calibri.ttf',
  'arial.ttf': 'C\\:/Windows/Fonts/arial.ttf',
};
const text = '\u0420\u0443\u0441\u0441\u043A\u0438\u0439'; // Русский

// Simple tofu detector using scanlines: tofu boxes have a hollow rectangle outline
// We render at high res and count how many distinct vertical runs exist AND interior emptiness
for (const [fn, fontpath] of Object.entries(fonts)) {
  execFileSync(ffmpeg, [
    '-y', '-f', 'lavfi', '-i', 'color=c=0x10162E:s=1000x250',
    '-vf', `drawtext=fontfile=${fontpath}:fontsize=140:fontcolor=0xFFFFFF:text='${text}':x=20:y=20`,
    '-frames:v', '1', 'tmp/_vis.png',
  ], { stdio: ['pipe', 'pipe', 'pipe'] });
  execFileSync(ffmpeg, ['-y', '-i', 'tmp/_vis.png', '-vf', 'format=gray,scale=200:50', '-f', 'rawvideo', '-pix_fmt', 'gray', 'tmp/_vis.gray'], { stdio: ['pipe', 'pipe', 'pipe'] });
  const b = fs.readFileSync('tmp/_vis.gray');
  // binarize
  const bin = [];
  for (let y = 0; y < 50; y++) { const row = []; for (let x = 0; x < 200; x++) row.push(b[y * 200 + x] > 60); bin.push(row); }
  // Find connected dark columns
  const colDark = [];
  for (let x = 0; x < 200; x++) colDark.push(bin.some(r => r[x]));
  let segStart = -1;
  const segments = [];
  for (let x = 0; x <= 200; x++) {
    if (x < 200 && colDark[x]) { if (segStart < 0) segStart = x; }
    else { if (segStart >= 0) { segments.push([segStart, x - 1]); segStart = -1; } }
  }
  // For each segment compute rows that are fully dark (solid horizontal line => wrong), and hollow detection
  console.log('=== ' + fn + ' → segments: ' + JSON.stringify(segments));
  console.log('=== ASCII (threshold: dark→#/+/.) ===');
  for (let y = 0; y < 50; y++) {
    let line = '';
    // crop x0..x1 of segments
    const x0 = segments.length ? segments[0][0] : 0;
    const x1 = segments.length ? segments[segments.length - 1][1] : 199;
    line += '|';
    for (let x = 0; x < 200; x++) {
      const v = b[y * 200 + x];
      line += v > 170 ? '#' : v > 100 ? '+' : v > 45 ? '.' : ' ';
    }
    line += '|';
    if (line.trim() !== '||') console.log(line);
    // limit output
    if (y > 40) break;
  }
  // Center-band interior emptiness along segment midlines
  let hollow = true;
  for (const [s, e] of segments) {
    const w = e - s + 1;
    if (w < 2) { hollow = false; break; }
    const midX = Math.floor((s + e) / 2);
    let darkCount = 0, tot = 0;
    for (let y = 10; y < 40; y++) { if (bin[y][midX]) darkCount++; tot++; }
    const frac = darkCount / tot;
    if (frac > 0.25) { hollow = false; break; } // fills middle => real glyph
  }
  console.log('HOLLOW-TOFU: ' + hollow);
  console.log('');
}