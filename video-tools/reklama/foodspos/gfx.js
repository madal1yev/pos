// gfx.js — pure-Node PNG asset renderer for MaxPOS v3 commercial.
// No external deps: hand-rolled PNG encoder (zlib + CRC32) + anti-aliased shapes.
'use strict';
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// ---------- PNG encode ----------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function writePng(file, w, h, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    raw.set(rgba.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  fs.writeFileSync(file, Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]));
  return file;
}

// ---------- RGBA buffer helpers ----------
function make(w, h, fill) {
  const d = new Uint8ClampedArray(w * h * 4);
  if (fill) for (let i = 0; i < w * h; i++) { d[i * 4] = fill[0]; d[i * 4 + 1] = fill[1]; d[i * 4 + 2] = fill[2]; d[i * 4 + 3] = fill[3]; }
  return { w, h, d };
}

function hex(c, a = 255) {
  if (Array.isArray(c)) return [c[0], c[1], c[2], c.length > 3 ? c[3] * 255 | 0 : a];
  const n = parseInt(String(c).replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
}

// ---------- fancy math for AA ----------
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

// Rounded-rect coverage (0..1) at pixel (x,y). r = radius.
function rrCoverage(px, py, w, h, r) {
  const cx = clamp(px, r, w - 1 - r);
  const cy = clamp(py, r, h - 1 - r);
  const dx = px - cx, dy = py - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return clamp(r + 0.5 - dist, 0, 1);
}

function shape(w, h, cf) {
  const b = make(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const cov = cf(x, y);
    if (cov <= 0) continue;
    const i = (y * w + x) * 4;
    b.d[i] = 255; b.d[i + 1] = 255; b.d[i + 2] = 255; b.d[i + 3] = Math.round(cov * 255);
  }
  return b;
}

// ---------- composites ----------
function tint(im, rgb) {
  const [r, g, b] = hex(rgb);
  for (let i = 0; i < im.w * im.h; i++) {
    const a = im.d[i * 4 + 3] / 255;
    im.d[i * 4] = r * a;
    im.d[i * 4 + 1] = g * a;
    im.d[i * 4 + 2] = b * a;
  }
  return im;
}

// separable box blur (approx gaussian) — iterate rows then cols.
function blurImpl(im, radius) {
  const { w, h, d } = im;
  const o = new Uint8ClampedArray(d.length);
  const r = Math.max(1, Math.round(radius));
  for (let pass = 0; pass < 2; pass++) {
    const src = pass === 0 ? d : o;
    if (pass === 1) { for (let i = 0; i < o.length; i++) o[i] = src[i]; }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let rs = [0, 0, 0, 0], cnt = 0;
        for (let k = -r; k <= r; k++) {
          const nx = x + k;
          if (nx < 0 || nx >= w) continue;
          const i = (y * w + nx) * 4;
          rs[0] += src[i]; rs[1] += src[i + 1]; rs[2] += src[i + 2]; rs[3] += src[i + 3]; cnt++;
        }
        const i = (y * w + x) * 4;
        o[i] = rs[0] / cnt | 0; o[i + 1] = rs[1] / cnt | 0; o[i + 2] = rs[2] / cnt | 0; o[i + 3] = rs[3] / cnt | 0;
      }
    }
    // vertical
    const tmp = new Uint8ClampedArray(o.length);
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        let rs = [0, 0, 0, 0], cnt = 0;
        for (let k = -r; k <= r; k++) {
          const ny = y + k;
          if (ny < 0 || ny >= h) continue;
          const i = (ny * w + x) * 4;
          rs[0] += o[i]; rs[1] += o[i + 1]; rs[2] += o[i + 2]; rs[3] += o[i + 3]; cnt++;
        }
        const i = (y * w + x) * 4;
        tmp[i] = rs[0] / cnt | 0; tmp[i + 1] = rs[1] / cnt | 0; tmp[i + 2] = rs[2] / cnt | 0; tmp[i + 3] = rs[3] / cnt | 0;
      }
    }
    o.set(tmp);
  }
  im.d = o;
  return im;
}

// ---------- public asset builders ----------
// Rounded-rect alpha mask (white shape, RGBA alpha).
function roundedRectMask(w, h, r) {
  return shape(w, h, (x, y) => rrCoverage(x, y, w, h, r));
}

// Rounded pill (full height radius).
function pillMask(w, h) {
  return roundedRectMask(w, h, h / 2);
}

// Soft circle (radial falloff) for glow/blob.
function glowMask(w, h, sigma) {
  // gaussian falloff inside the bounds
  const b = make(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = x - w / 2, dy = y - h / 2;
    const dist = Math.sqrt(dx * dx + dy * dy) / (Math.min(w, h) / 2);
    const a = clamp(Math.exp(-(dist * dist) / (2 * (sigma || 0.5) ** 2)), 0, 1);
    const i = (y * w + x) * 4;
    b.d[i + 3] = Math.round(a * 255);
  }
  return b;
}

// Vertical linear gradient image.
function vGradient(w, h, stops) {
  // stops: [{pos:0..1, color:hex}]
  const b = make(w, h);
  for (let y = 0; y < h; y++) {
    const frac = h === 1 ? 0 : y / (h - 1);
    let a = stops[0], c = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
      if (frac >= stops[i].pos && frac <= stops[i + 1].pos) {
        a = stops[i]; c = stops[i + 1];
        break;
      }
    }
    const t = (frac - a.pos) / Math.max(1e-6, c.pos - a.pos);
    const ca = hex(a.color), cb = hex(c.color);
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      b.d[i] = ca[0] + (cb[0] - ca[0]) * t | 0;
      b.d[i + 1] = ca[1] + (cb[1] - ca[1]) * t | 0;
      b.d[i + 2] = ca[2] + (cb[2] - ca[2]) * t | 0;
      b.d[i + 3] = 255;
    }
  }
  return b;
}

// Composed helpers ---------------------------------------------------------
const OUT = path.join(__dirname, 'gfx');

function ensure() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
}

let cache = {};
function gen(name, fn) {
  if (cache[name]) return path.join(OUT, name);
  ensure();
  const fp = path.join(OUT, name);
  if (!fs.existsSync(fp)) {
    const im = fn();
    writePng(fp, im.w, im.h, im.d);
  }
  cache[name] = true;
  return fp;
}

// phone rounded mask (alpha-only, white)
function phoneMask(w, h, r) {
  return gen(`phone_${w}_${h}_${r}.png`, () => roundedRectMask(w, h, r));
}

// soft drop shadow PNG (black rounded rect, blurred) — overlay with low alpha
function phoneShadow(w, h, r, blur, alpha) {
  return gen(`shadow_${w}_${h}_${r}_${blur}_${alpha}.png`, () => {
    const im = roundedRectMask(w, h, r);
    const rgba = make(w, h);
    for (let i = 0; i < w * h; i++) {
      const a = im.d[i * 4 + 3] / 255;
      rgba.d[i * 4] = 12; rgba.d[i * 4 + 1] = 20; rgba.d[i * 4 + 2] = 40;
      rgba.d[i * 4 + 3] = Math.round(a * alpha * 255);
    }
    return blurImpl(rgba, blur);
  });
}

// glow blob (indigo soft circle) as RGBA
function blob(size, sigmaMul, color, alpha) {
  return gen(`blob_${size}_${Math.round(sigmaMul * 100)}_${String(color).replace('#', '')}_${alpha}.png`, () => {
    const im = glowMask(size, size, sigmaMul);
    const ca = hex(color);
    for (let i = 0; i < size * size; i++) {
      const a = im.d[i * 4 + 3] / 255;
      im.d[i * 4] = ca[0]; im.d[i * 4 + 1] = ca[1]; im.d[i * 4 + 2] = ca[2];
      im.d[i * 4 + 3] = Math.round(a * alpha * 255);
    }
    return im;
  });
}

// light/dark vertical gradient background
function bg(w, h, theme) {
  if (theme === 'dark') return gen(`bg_dark_${w}_${h}.png`, () => vGradient(w, h, [
    { pos: 0, color: '#10162E' }, { pos: 0.55, color: '#0A0F22' }, { pos: 1, color: '#05070F' },
  ]));
  return gen(`bg_light_${w}_${h}.png`, () => vGradient(w, h, [
    { pos: 0, color: '#FFFFFF' }, { pos: 0.6, color: '#FBFBFF' }, { pos: 1, color: '#F0F3FF' },
  ]));
}

// solid-color rounded pill with subtle border, big enough for text overlay
function pill(w, h, color, border) {
  return gen(`pill_${w}_${h}_${String(color).replace('#', '')}_${border || 0}.png`, () => {
    const mask = pillMask(w, h);
    const ca = hex(color);
    const b = make(w, h);
    for (let i = 0; i < w * h; i++) {
      const a = mask.d[i * 4 + 3] / 255;
      b.d[i * 4] = ca[0]; b.d[i * 4 + 1] = ca[1]; b.d[i * 4 + 2] = ca[2];
      b.d[i * 4 + 3] = ca[3] === undefined ? a * 255 : a * ca[3];
    }
    if (border) {
      // thin lighter edge
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const c = rrCoverage(x, y, w, h, h / 2);
        const c2 = rrCoverage(x, y, w - 2, h - 2, (h - 2) / 2);
        if (c > 0.5 && c2 < 0.5) {
          const i = (y * w + x) * 4;
          b.d[i] = 255; b.d[i + 1] = 255; b.d[i + 2] = 255;
        }
      }
    }
    return b;
  });
}

// white rounded "glass" card for analytics
function card(w, h, r) {
  return gen(`card_${w}_${h}_${r}.png`, () => {
    const mask = roundedRectMask(w, h, r);
    const b = make(w, h);
    for (let i = 0; i < w * h; i++) {
      const a = mask.d[i * 4 + 3] / 255;
      b.d[i * 4] = 255; b.d[i * 4 + 1] = 255; b.d[i * 4 + 2] = 255;
      b.d[i * 4 + 3] = Math.round(a * 0.92 * 255);
    }
    return b;
  });
}

// tiny 18px favicon square (indigo rounded square w/ white glyph bar) for "app icon"
function appIcon(size) {
  return gen(`icon_${size}.png`, () => {
    const mask = roundedRectMask(size, size, Math.round(size * 0.22));
    const b = make(size, size);
    for (let i = 0; i < size * size; i++) {
      const a = mask.d[i * 4 + 3] / 255;
      const gr = vGradient(size, size, [
        { pos: 0, color: '#7C6CFF' }, { pos: 1, color: '#4F46E5' },
      ]);
      b.d[i * 4] = gr.d[i * 4]; b.d[i * 4 + 1] = gr.d[i * 4 + 1]; b.d[i * 4 + 2] = gr.d[i * 4 + 2];
      b.d[i * 4 + 3] = Math.round(a * 255 * gr.d[i * 4 + 3] / 255);
    }
    // white rounded bar in center (logo sliver)
    const barR = Math.round(size * 0.05);
    const barW = Math.round(size * 0.42), barH = Math.round(size * 0.16);
    const bx = Math.round((size - barW) / 2), by = Math.round((size - barH) / 2);
    for (let y = by; y < by + barH; y++) for (let x = bx; x < bx + barW; x++) {
      if (rrCoverage(x - bx, y - by, barW, barH, barR) > 0.5) {
        const i = (y * size + x) * 4;
        b.d[i] = 255; b.d[i + 1] = 255; b.d[i + 2] = 255; b.d[i + 3] = 255;
      }
    }
    return b;
  });
}

module.exports = {
  writePng, roundedRectMask, pillMask, glowMask, vGradient, blurImpl, make, hex,
  gen, phoneMask, phoneShadow, blob, bg, pill, card, appIcon, OUT,
};