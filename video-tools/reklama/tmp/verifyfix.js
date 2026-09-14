'use strict';
const { execFileSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const fs = require('fs');

// verify: p1 headline at ~2.7 (9x16 big text y~340), cta langs at ~18.5 (y~770)
const zones = [
  { name: 'p1 headline t=2.7', t: 2.7, crop: '1080:160:0:330', scale: '108:16' },
  { name: 'cta langs t=18.8', t: 18.8, crop: '1080:70:0:760', scale: '108:7' },
];
for (const z of zones) {
  execFileSync(ffmpeg, ['-y', '-ss', String(z.t), '-i', 'reklama-9x16.mp4', '-frames:v', '1', '-vf', `crop=${z.crop},format=gray,scale=${z.scale}`, '-f', 'rawvideo', '-pix_fmt', 'gray', 'tmp/_v.gray'], { stdio: ['ignore', 'pipe', 'pipe'] });
  const b = fs.readFileSync('tmp/_v.gray');
  const [sw, sh] = z.scale.split(':').map(Number);
  console.log('=== ' + z.name + ' ===');
  for (let y = 0; y < sh; y++) {
    let line = '';
    for (let x = 0; x < sw; x++) {
      const v = b[y * sw + x];
      line += v > 160 ? '#' : v > 90 ? '+' : v > 45 ? '.' : ' ';
    }
    if (line.trim()) console.log(line);
  }
}