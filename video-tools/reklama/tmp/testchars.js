'use strict';
const { execFileSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const fs = require('fs');

const FONT = 'C\\:/Users/New/Desktop/poss/video-tools/font.ttf';

const chrs = [
  ['LEFT SINGLE ', '\u2018'],
  ['RIGHT SINGLE', '\u2019'],
  ['EM DASH     ', '\u2014'],
  ['MIDDLE DOT  ', '\u00B7'],
  ['CYRILLIC Р  ', '\u0420'],
  ['CYRILLIC у  ', '\u0443'],
  ['CYRILLIC й  ', '\u0439'],
  ['LATIN O     ', 'O'],
  ['LATIN a     ', 'a'],
];

for (const [name, ch] of chrs) {
  const file = 'tmp/_c.png';
  const arr = [
    '-y', '-f', 'lavfi', '-i', 'color=c=0x10162E:s=300x200',
    '-vf', `drawtext=fontfile=${FONT}:fontsize=150:fontcolor=0xFFFFFF:text='${ch}':x=30:y=20`,
    '-frames:v', '1', file,
  ];
  try {
    execFileSync(ffmpeg, arr, { stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (e) {
    console.log(name + ': FAILED');
    continue;
  }
  execFileSync(ffmpeg, ['-y', '-i', file, '-vf', 'format=gray,scale=80:40', '-f', 'rawvideo', '-pix_fmt', 'gray', 'tmp/_cc.gray'], { stdio: ['pipe', 'pipe', 'pipe'] });
  const b = fs.readFileSync('tmp/_cc.gray');
  console.log('=== ' + name + ' (U+' + ch.codePointAt(0).toString(16).toUpperCase() + ') ===');
  for (let y = 0; y < 40; y++) {
    let line = '';
    for (let x = 0; x < 80; x++) {
      const v = b[y * 80 + x];
      line += v > 170 ? '#' : v > 110 ? '+' : v > 50 ? '.' : ' ';
    }
    console.log(line);
  }
}