'use strict';
const fs = require('fs');

function parseFontCmap(file) {
  const buf = fs.readFileSync(file);
  // numTables at offset 4
  const numTables = buf.readUInt16BE(4);
  // Table records start at offset 12: tag(4), checksum(4), offset(4), length(4)
  let cmapOff = -1, cmapLen = 0;
  for (let i = 0; i < numTables; i++) {
    const t = buf.toString('ascii', 12 + i * 16, 12 + i * 16 + 4);
    if (t === 'cmap') {
      cmapOff = buf.readUInt32BE(12 + i * 16 + 8);
      cmapLen = buf.readUInt32BE(12 + i * 16 + 12);
      break;
    }
  }
  if (cmapOff < 0) throw new Error('no cmap');
  const base = cmapOff;
  const version = buf.readUInt16BE(base);
  const numSub = buf.readUInt16BE(base + 2);
  const subtables = [];
  for (let i = 0; i < numSub; i++) {
    const pid = buf.readUInt16BE(base + 4 + i * 8);
    const eid = buf.readUInt16BE(base + 4 + i * 8 + 2);
    const off = buf.readUInt32BE(base + 4 + i * 8 + 4);
    subtables.push({ pid, eid, off: base + off });
  }
  const glyphs = new Set();
  for (const st of subtables) {
    const fmt = buf.readUInt16BE(st.off);
    if (fmt === 4) {
      const len = buf.readUInt16BE(st.off + 2);
      const lang = buf.readUInt16BE(st.off + 4);
      const segCountX2 = buf.readUInt16BE(st.off + 6);
      const sc = segCountX2 / 2;
      const base2 = st.off + 14;
      const endCode = (o) => buf.readUInt16BE(o);
      const startCode = (o) => buf.readUInt16BE(o + sc * 2 + 2);
      const idDelta = (o) => buf.readUInt16BE(o + sc * 4 + 2);
      const idRange = (o) => buf.readUInt16BE(o + sc * 6 + 2);
      const gRange = st.off + sc * 8 + 16;
      for (let i = 0; i < sc; i++) {
        const end = endCode(base2 + i * 2);
        const start = startCode(base2 + i * 2);
        const delta = idDelta(base2 + i * 2);
        const rng = idRange(base2 + i * 2);
        if (end === 0xffff && start === 0xffff) continue;
        for (let c = start; c <= end; c++) {
          let g;
          if (rng === 0) {
            g = (c + delta) & 0xffff;
          } else {
            const ri = gRange + rng + (c - start) * 2;
            if (ri + 2 > buf.length) continue;
            const val = buf.readUInt16BE(ri);
            g = val ? (val + delta) & 0xffff : 0;
          }
          if (g !== 0) glyphs.add(c);
        }
      }
    } else if (fmt === 12 || fmt === 13) {
      const nGroups = buf.readUInt32BE(st.off + 12);
      for (let i = 0; i < nGroups; i++) {
        const sc2 = buf.readUInt32BE(st.off + 16 + i * 12);
        const ec = buf.readUInt32BE(st.off + 16 + i * 12 + 4);
        const sg = buf.readUInt32BE(st.off + 16 + i * 12 + 8);
        if (fmt === 12) {
          for (let c = sc2; c <= ec; c++) {
            const g = sg + (c - sc2);
            if (g !== 0) glyphs.add(c);
          }
        } else {
          for (let c = sc2; c <= ec; c++) glyphs.add(c);
        }
      }
    }
  }
  return glyphs;
}

const checks = [
  [0x0041, 'A'], [0x0061, 'a'], [0x00B7, '·(middot)'],
  [0x2018, "'(left)"], [0x2019, "'(right)"], [0x2014, '—(em)'],
  [0x0420, 'Р'], [0x0443, 'у'], [0x0439, 'й'], [0x0411, 'Б'],
  [0x043E, 'о'], [0x04D3, 'ӓ'], [0x0493, 'ғ'],
  [0x201C, '\u201C'], [0x201D, '\u201D'],
];

const files = [
  'C:/Users/New/Desktop/poss/video-tools/font.ttf',
  'C:/Windows/Fonts/arialbd.ttf',
  'C:/Windows/Fonts/arial.ttf',
  'C:/Windows/Fonts/calibrib.ttf',
];

for (const file of files) {
  try {
    const g = parseFontCmap(file);
    console.log('=== ' + file.split('/').pop() + ' (' + g.size + ' glyphs) ===');
    for (const [cp, desc] of checks) {
      console.log('  U+' + cp.toString(16).toUpperCase().padStart(4, '0') + ' ' + desc.padEnd(10) + (g.has(cp) ? 'OK' : 'MISSING'));
    }
  } catch (e) {
    console.log(file.split('/').pop(), 'ERROR:', e.message);
  }
}