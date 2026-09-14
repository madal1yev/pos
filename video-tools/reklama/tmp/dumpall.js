'use strict';
const { execFileSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const fs = require('fs');
const T = require('../timeline_v3');

const FONT = 'C\\:/Users/New/Desktop/poss/video-tools/font.ttf';
function esc(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, `\\\u2019`).replace(/:/g, '\\:').replace(/%/g, '\\%');
}

const strings = [];
for (const c of T.CLIPS) {
  if (c.big) strings.push(c.big);
  if (c.tag) strings.push(c.tag);
  if (c.sub) strings.push(c.sub);
  if (c.chip) strings.push(c.chip);
  if (c.tagline) strings.push(c.tagline);
  if (c.langs) strings.push(c.langs);
}
const uniq = [...new Set(strings)];

for (const s of uniq) {
  const file = 'tmp/_s.png';
  const vf = `drawtext=fontfile=${FONT}:fontsize=80:fontcolor=0xFFFFFF:text='${esc(s)}':x=20:y=20`;
  execFileSync(ffmpeg, ['-y', '-f', 'lavfi', '-i', 'color=c=0x10162E:s=1600x400', '-vf', vf, '-frames:v', '1', file], { stdio: ['pipe', 'pipe', 'pipe'] });
  execFileSync(ffmpeg, ['-y', '-i', file, '-vf', 'format=gray,scale=200:50,negate', '-f', 'rawvideo', '-pix_fmt', 'gray', 'tmp/_s.gray'], { stdio: ['pipe', 'pipe', 'pipe'] });
  const b = fs.readFileSync('tmp/_s.gray');
  console.log('=== [' + JSON.stringify(s) + '] ===');
  for (let y = 0; y < 50; y++) {
    let line = '';
    for (let x = 0; x < 200; x++) {
      const v = b[y * 200 + x];
      line += v > 170 ? '#' : v > 110 ? '+' : v > 50 ? '.' : ' ';
    }
    // strip leading/trailing all-space
    if (/[^ \n]/.test(line)) console.log(line);
  }
}