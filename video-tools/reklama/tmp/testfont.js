'use strict';
const { execFileSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const fs = require('fs');

const FONT = 'C\\:/Users/New/Desktop/poss/video-tools/font.ttf';

const samples = [
  'Cheklar yo\u2018qoladi.',
  'Qo\u2018lda yozilgan cheklar \u2014 adashib ketadi.',
  'Da\u2019ftardagi qarzlar \u2014 hech qayerdan topilmaydi.',
  'Har kuni savdoga ketgan 2 soat \u2014 qaytmaydi.',
  'MaxPOS',
  'Savdo \u00B7 Ombor \u00B7 Nazorat',
  'To\u2018lov \u2014 bir zumda.',
  'Har bir so\u2018m \u2014 nazoratda.',
  'O\u2018zbek \u00B7 \u0420\u0443\u0441\u0441\u043A\u0438\u0439 \u00B7 English',
];

function cfg(s) {
  const file = 'tmp/_ss.png';
  const ff = 'filter_complex';
  const arr = [
    '-y', '-f', 'lavfi', '-i', 'color=c=0x10162E:s=1080x800',
    '-vf', `drawtext=fontfile=${FONT}:fontsize=88:fontcolor=0xFFFFFF:text='${s.replace(/'/g, '\\\u2019').replace(/:/g, '\\:')}':x=(w-text_w)/2:y=340`,
    '-frames:v', '1', file,
  ];
  execFileSync(ffmpeg, arr, { stdio: ['pipe', 'pipe', 'pipe'] });
  execFileSync(ffmpeg, ['-y', '-i', file, '-vf', 'crop=1000:150:40:330,format=gray,scale=200:30', '-f', 'rawvideo', '-pix_fmt', 'gray', 'tmp/_t.gray'], { stdio: ['pipe', 'pipe', 'pipe'] });
  const b = fs.readFileSync('tmp/_t.gray');
  console.log('=== ' + JSON.stringify(s) + ' ===');
  for (let y = 0; y < 30; y++) {
    let line = '';
    for (let x = 0; x < 200; x++) {
      const v = b[y * 200 + x];
      line += v > 170 ? '#' : v > 110 ? '+' : v > 50 ? '.' : ' ';
    }
    console.log(line);
  }
}

for (const s of samples) cfg(s);