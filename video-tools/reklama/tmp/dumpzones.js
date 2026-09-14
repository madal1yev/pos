'use strict';
const { execFileSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const fs = require('fs');

const zones = [
  ['icon', 380, 430, 320, 200],
  ['wordmark', 90, 450, 900, 200],
  ['tagpill', 180, 618, 720, 130],
];

function dump(zone, t, inFile, outFile) {
  const [name, x, y, w, h] = zone;
  execFileSync(ffmpeg, ['-y', '-ss', String(t), '-i', inFile, '-frames:v', '1', 'tmp/_zonep.png'], { stdio: ['pipe', 'pipe', 'pipe'] });
  const sw = Math.max(4, Math.round(w / 6));
  const sh = Math.max(4, Math.round(h / 6));
  const vf = `crop=${w}:${h}:${x}:${y},format=gray,scale=${sw}:${sh}`;
  execFileSync(ffmpeg, ['-y', '-i', 'tmp/_zonep.png', '-vf', vf, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'gray', outFile], { stdio: ['pipe', 'pipe', 'pipe'] });
  const b = fs.readFileSync(outFile);
  console.log('=== ' + name + ' @t=' + t + ' ===');
  for (let yy = 0; yy < sh; yy++) {
    let line = '';
    for (let xx = 0; xx < sw; xx++) {
      const v = b[yy * sw + xx];
      line += v > 170 ? '#' : v > 110 ? '+' : v > 50 ? '.' : ' ';
    }
    console.log(line);
  }
}

function dumpArea(x, y, w, h, t, label, inFile) {
  const sw = Math.max(4, Math.round(w / 6));
  const sh = Math.max(4, Math.round(h / 6));
  console.log('=== ' + label + ' @t=' + t + ' ===');
  execFileSync(ffmpeg, ['-y', '-ss', String(t), '-i', inFile, '-frames:v', '1', 'tmp/_zonep.png'], { stdio: ['pipe', 'pipe', 'pipe'] });
  const vf = `crop=${w}:${h}:${x}:${y},format=gray,scale=${sw}:${sh}`;
  execFileSync(ffmpeg, ['-y', '-i', 'tmp/_zonep.png', '-vf', vf, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'gray', 'tmp/_z.gray'], { stdio: ['pipe', 'pipe', 'pipe'] });
  const b = fs.readFileSync('tmp/_z.gray');
  for (let yy = 0; yy < sh; yy++) {
    let line = '';
    for (let xx = 0; xx < sw; xx++) {
      const v = b[yy * sw + xx];
      line += v > 170 ? '#' : v > 110 ? '+' : v > 50 ? '.' : ' ';
    }
    console.log(line);
  }
}

// p1 dark headline (y1=700, fs=88 -> approx y 700..790) 9x16
dumpArea(140, 660, 800, 160, 2.7, 'p1-dark-headline', 'reklama-9x16.mp4');
// s1 shot caption (cap.y=340, fs=66 -> y 340..420)
dumpArea(140, 320, 800, 140, 7.2, 's1-caption', 'reklama-9x16.mp4');
// a1 shotdark caption
dumpArea(140, 320, 800, 140, 16.2, 'a1-caption', 'reklama-9x16.mp4');
// cta wordmark + tagline + langs (wordmark y=320 fs150, tagline y=520 fs62, langs y=770)
dumpArea(140, 300, 800, 200, 19.2, 'cta-wordmark', 'reklama-9x16.mp4');
dumpArea(140, 500, 800, 150, 19.2, 'cta-tagline', 'reklama-9x16.mp4');
dumpArea(140, 750, 800, 70, 19.2, 'cta-langs', 'reklama-9x16.mp4');