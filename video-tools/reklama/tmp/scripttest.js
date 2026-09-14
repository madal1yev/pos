'use strict';
const { execFileSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const fs = require('fs');

const cyr = '\u0420\u0443\u0441\u0441\u043A\u0438\u0439';
const emd = '\u2014';
const lq = '\u2018X\u2019';

const variants = {
  'bare path, inline args': `color=s=800x200:c=0x10162E:r=30,drawtext=fontfile=C\\:/Windows/Fonts/calibri.ttf:fontsize=100:fontcolor=0xFFFFFF:text='${cyr}':x=10:y=10`,
  'quoted path, inline args': `color=s=800x200:c=0x10162E:r=30,drawtext=fontfile='C\\:/Windows/Fonts/calibri.ttf':fontsize=100:fontcolor=0xFFFFFF:text='${cyr}':x=10:y=10`,
  'double backslash path': `color=s=800x200:c=0x10162E:r=30,drawtext=fontfile=C\\\\:/Windows/Fonts/calibri.ttf:fontsize=100:fontcolor=0xFFFFFF:text='${cyr}':x=10:y=10`,
};

for (const [name, fil] of Object.entries(variants)) {
  const script = 'tmp/_mtest.script';
  fs.writeFileSync(script, fil);
  try {
    execFileSync(ffmpeg, ['-y', '-f', 'lavfi', '-i', 'null', '-filter_complex_script', script, '-frames:v', '1', 'tmp/_m.png'], { stdio: ['pipe', 'pipe', 'pipe'] });
    // note: lavfi null then filter chain needs [0:v]; fix below
  } catch (e) {
    // retry with true input
  }
}

// time-based script: first input color, then drawtext
for (const [name, fil] of Object.entries(variants)) {
  // need input label
  const script = 'tmp/_m.script';
  fs.writeFileSync(script, fil.replace(/^color/, 'color'));
  try {
    execFileSync(ffmpeg, ['-y', '-f', 'lavfi', '-i', 'color=c=0x10162E:s=800x200:r=30', '-filter_complex_script', script, '-frames:v', '1', 'tmp/_m.png'], { stdio: ['pipe', 'pipe', 'pipe'] });
    execFileSync(ffmpeg, ['-y', '-i', 'tmp/_m.png', '-vf', 'format=gray,scale=160:25', '-f', 'rawvideo', '-pix_fmt', 'gray', 'tmp/_m.gray'], { stdio: ['pipe', 'pipe', 'pipe'] });
    const b = fs.readFileSync('tmp/_m.gray');
    console.log('=== ' + name + ' ===');
    for (let y = 0; y < 25; y++) {
      let line = '';
      for (let x = 0; x < 160; x++) {
        const v = b[y * 160 + x];
        line += v > 150 ? '#' : v > 80 ? '+' : v > 40 ? '.' : ' ';
      }
      if (line.trim()) console.log(line);
    }
  } catch (e) {
    console.log('=== ' + name + ' === FAILED: ' + (e.stderr || '').toString().split('\n').filter(Boolean).slice(-2).join(' | '));
  }
}