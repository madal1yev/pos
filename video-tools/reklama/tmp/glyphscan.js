'use strict';
const fs = require('fs');

function getTables(buf) {
  const num = buf.readUInt16BE(4);
  const t = {};
  for (let i = 0; i < num; i++) {
    const tag = buf.toString('ascii', 12 + i * 16, 12 + i * 16 + 4);
    t[tag] = { off: buf.readUInt32BE(12 + i * 16 + 8), len: buf.readUInt32BE(12 + i * 16 + 12) };
  }
  return t;
}

function cmapGlyph(buf, tbl, cp) {
  // returns set of glyph ids
  const base = tbl.off;
  const n = buf.readUInt16BE(base + 2);
  const out = [];
  for (let i = 0; i < n; i++) {
    const sub = buf.readUInt32BE(base + 4 + i * 8 + 4);
    const st = base + sub;
    const fmt = buf.readUInt16BE(st);
    if (fmt === 4) {
      const segX2 = buf.readUInt16BE(st + 6);
      const seg = segX2 / 2;
      const endC = st + 14;
      const startC = endC + segX2 + 2;
      const delta = startC + segX2 + 2;
      const ro = delta + segX2;
      const ga = st + ro + segX2;
      for (let s = 0; s < seg; s++) {
        const e = buf.readUInt16BE(endC + s * 2);
        const stc = buf.readUInt16BE(startC + s * 2);
        if (cp < stc || cp > e) continue;
        const d = buf.readInt16BE(delta + s * 2);
        const r = buf.readUInt16BE(ro + s * 2);
        let g;
        if (r === 0) g = (cp + d) & 0xffff;
        else {
          const idx = buf.readUInt16BE(ga + r + (cp - stc) * 2);
          g = idx ? (idx + d) & 0xffff : 0;
        }
        out.push(g);
      }
    } else if (fmt === 12) {
      const ng = buf.readUInt32BE(st + 12);
      for (let g2 = 0; g2 < ng; g2++) {
        const sc = buf.readUInt32BE(st + 16 + g2 * 12);
        const ec = buf.readUInt32BE(st + 16 + g2 * 12 + 4);
        const sg = buf.readUInt32BE(st + 16 + g2 * 12 + 8);
        if (cp >= sc && cp <= ec) out.push(sg + (cp - sc));
      }
    }
  }
  return out;
}

function glyphNumContours(buf, glyfOff, id, loca, indexToLocFormat) {
  if (id === 0) return 'gid0(notdef)';
  if (id >= loca.length - 1) return 'out-of-range';
  const s = loca[id];
  const e = loca[id + 1];
  if (e <= s) return 'empty-length';
  const gs = glyfOff + s;
  if (gs + 2 > buf.length) return 'oob';
  return 'contours=' + buf.readInt16BE(gs);
}

function main(file) {
  const buf = fs.readFileSync(file);
  const T = getTables(buf);
  const maxp = T['maxp'];
  const numGlyphs = buf.readUInt16BE(maxp.off + 4);
  const hmtx = T['hmtx'];
  const indexToLocFormat = buf.readInt16BE(T['head'].off + 50);
  const loca = T['loca'];
  const nLoc = indexToLocFormat === 1 ? numGlyphs + 1 : numGlyphs + 1;
  const locaArr = [];
  for (let i = 0; i < nLoc; i++) {
    locaArr.push(indexToLocFormat === 1 ? buf.readUInt32BE(loca.off + i * 4) : buf.readUInt16BE(loca.off + i * 2) * 2);
  }
  const glyf = T['glyf'];
  const cmap = T['cmap'];
  const checks = [0x41, 0x61, 0x00b7, 0x2018, 0x2019, 0x2014, 0x0420, 0x0443, 0x0439];
  console.log('=== ' + file.split('/').pop() + ' numGlyphs=' + numGlyphs + ' indexToLocFormat=' + indexToLocFormat + ' ===');
  for (const cp of checks) {
    const gids = cmapGlyph(buf, cmap, cp);
    const parts = gids.map((g) => g + '->' + glyphNumContours(buf, glyf.off, g, locaArr, indexToLocFormat));
    console.log('  U+' + cp.toString(16).toUpperCase().padStart(4, '0') + ' glyph=' + gids.join(',') + ' ' + parts.join(' | ') + (gids.length ? '' : ' NO-MAPPING'));
  }
}

main('C:/Users/New/Desktop/poss/video-tools/font.ttf');
main('C:/Windows/Fonts/arialbd.ttf');
main('C:/Windows/Fonts/calibri.ttf');