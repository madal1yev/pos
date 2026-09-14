'use strict';
const fs = require('fs');

function parseCMAP(buf) {
  const off = buf.readUInt32BE(4);
  const numTables = buf.readUInt16BE(off + 2);
  let fmt4 = null, fmt12 = null;
  for (let i = 0; i < numTables; i++) {
    const t = buf.toString('ascii', off + 12 + i * 16, off + 12 + i * 16 + 4);
    if (t !== 'cmap') continue;
    const to = buf.readUInt32BE(off + 12 + i * 16 + 8);
    const nsub = buf.readUInt16BE(to);
    for (let s = 0; s < nsub; s++) {
      const pid = buf.readUInt16BE(to + 4 + s * 8);
      const eid = buf.readUInt16BE(to + 4 + s * 8 + 2);
      const soff = buf.readUInt32BE(to + 4 + s * 8 + 4);
      const st = buf.readUInt16BE(to + soff);
      if (st === 4 && (pid === 3 || pid === 0)) fmt4 = to + soff;
      if (st === 12) fmt12 = to + soff;
    }
  }
  return { fmt4, fmt12 };
}

function listFmt4(buf, o) {
  const segX2 = buf.readUInt16BE(o + 6);
  const seg = segX2 / 2;
  const endC = o + 14;
  const startC = endC + segX2 + 2;
  const deltas = startC + segX2 + 2;
  const ranges = deltas + segX2;
  const idRangeOff = ranges + segX2;
  const glyphArr = o + idRangeOff + segX2;
  const present = [];
  for (let i = 0; i < seg; i++) {
    const end = buf.readUInt16BE(endC + i * 2);
    const start = buf.readUInt16BE(startC + i * 2);
    const delta = buf.readUInt16BE(deltas + i * 2);
    const ro = buf.readUInt16BE(ranges + i * 2);
    if (end === 0xffff && start === 0xffff) continue;
    for (let c = start; c <= end; c++) {
      let g;
      if (ro === 0) {
        g = (c + delta) & 0xffff;
      } else {
        const gi = glyphArr + ro + (c - start) * 2;
        if (gi + 2 > buf.length) continue;
        const idx = buf.readUInt16BE(gi);
        g = idx === 0 ? 0 : (idx + delta) & 0xffff;
      }
      if (g !== 0) present.push(c);
    }
  }
  return present;
}

function listFmt12(buf, o) {
  const ng = buf.readUInt32BE(o + 12);
  const present = [];
  for (let g = 0; g < ng; g++) {
    const sc = buf.readUInt32BE(o + 16 + g * 12);
    const ec = buf.readUInt32BE(o + 16 + g * 12 + 4);
    const sg = buf.readUInt32BE(o + 16 + g * 12 + 8);
    const count = ec - sc + 1;
    if (sg === 0) { for (let c = sc; c <= ec; c++) { if (present.length % 100000 === 0 && sg === 0) {} } continue; }
    for (let i = 0; i < count; i++) present.push(sc + i);
    // group range [sc..ec] -> glyph sc-groupStartOffset... encode contiguous glyphs as present if startGlyph != 0 generally the range maps 1:1
  }
  // fmt12 parsing via distinct per-glyph unknown simple approach - redo
  return present;
}

function listFmt12b(buf, o) {
  const ng = buf.readUInt32BE(o + 12);
  const present = [];
  for (let g = 0; g < ng; g++) {
    const sc = buf.readUInt32BE(o + 16 + g * 12);
    const ec = buf.readUInt32BE(o + 16 + g * 12 + 4);
    const sg = buf.readUInt32BE(o + 16 + g * 12 + 8);
    // glyphs mapped 1:1 from sg, if sg!=0 then for consecutive triplets all c in [sc,ec] map to real glyphs
    const count = Math.min(ec - sc + 1, 200000);
    for (let i = 0; i < count; i++) present.push(sc + i);
    const skip = Math.max(count - 200000, 0);
    void skip;
  }
  return present;
}

const files = process.argv.slice(2) || ['C:/Users/New/Desktop/poss/video-tools/font.ttf'];
const checks = [0x41, 0x61, 0x2018, 0x2019, 0x2014, 0x00b7, 0x0420, 0x0443, 0x0439, 0x0411, 0x043e, 0x0493, 0x04d3];

for (const file of files) {
  try {
    const buf = fs.readFileSync(file);
    const sig = buf.toString('hex', 0, 4);
    if (sig !== '00010000' && buf.toString('ascii', 0, 4) !== 'OTTO' && sig !== '74746366') { console.log(file, ': not ttf/otf (' + sig + ')'); continue; }
    const { fmt4, fmt12 } = parseCMAP(buf);
    const present = new Set();
    if (fmt4) for (const c of listFmt4(buf, fmt4)) present.add(c);
    if (fmt12) for (const c of listFmt12b(buf, fmt12)) present.add(c);
    console.log('=== ' + file + ' (' + (buf.length / 1024 | 0) + 'KB) ===');
    for (const c of checks) {
      console.log('  U+' + c.toString(16).toUpperCase().padStart(4, '0') + '  ' + (present.has(c) ? 'COVERED' : 'MISSING'));
    }
  } catch (e) {
    console.log(file, 'ERROR', e.message);
  }
}