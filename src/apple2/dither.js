import { RGB } from "./hires.js";

// Convert a full-color picture into hi-res bits, the way an artist squeezes a scene
// into six colors: each 7-dot byte picks its palette (violet/green or blue/orange),
// dots are chosen one at a time by simulating what the monitor will show, and the
// remaining error is diffused Floyd–Steinberg style.

const PHASE = [
  [RGB.violet, RGB.green],
  [RGB.blue, RGB.orange],
];

function shown(l, c, r, hi, x) {
  if (c) return l || r ? RGB.white : PHASE[hi][x & 1];
  return l && r ? PHASE[hi][(x - 1) & 1] : RGB.black;
}

function dist(t, i, c) {
  const r1 = t[i];
  const g1 = t[i + 1];
  const b1 = t[i + 2];
  const rm = (r1 + c[0]) / 2;
  const dr = r1 - c[0];
  const dg = g1 - c[1];
  const db = b1 - c[2];
  return (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
}

// Tone the source so it survives the tiny palette: lift shadows, boost saturation.
export function prepare(imageData, { saturation = 1.35, contrast = 1.12, brightness = 8, gamma = 0.92, maxGain = 2.4 } = {}) {
  const d = imageData.data;
  const out = new Float32Array((d.length / 4) * 3);
  // Auto-levels: stretch the 1st–99th luminance percentiles so night scenes keep detail.
  const hist = new Uint32Array(256);
  for (let i = 0; i < d.length; i += 4) hist[Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2])]++;
  const total = d.length / 4;
  let lo = 0;
  let hi = 255;
  for (let acc = 0; lo < 255 && acc + hist[lo] < total * 0.01; lo++) acc += hist[lo];
  for (let acc = 0; hi > 0 && acc + hist[hi] < total * 0.01; hi--) acc += hist[hi];
  const gain = Math.min(maxGain, 255 / Math.max(32, hi - lo));
  for (let i = 0, j = 0; i < d.length; i += 4, j += 3) {
    const level = (v) => Math.max(0, Math.min(255, (v - lo) * gain));
    let r = 255 * Math.pow(level(d[i]) / 255, gamma);
    let g = 255 * Math.pow(level(d[i + 1]) / 255, gamma);
    let b = 255 * Math.pow(level(d[i + 2]) / 255, gamma);
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    r = y + (r - y) * saturation;
    g = y + (g - y) * saturation;
    b = y + (b - y) * saturation;
    out[j] = (r - 128) * contrast + 128 + brightness;
    out[j + 1] = (g - 128) * contrast + 128 + brightness;
    out[j + 2] = (b - 128) * contrast + 128 + brightness;
  }
  return out;
}

// target: Float32Array of w*h*3 (from prepare). Writes into fb at (x0, y0); x0 and w
// should be multiples of 7 so bytes line up with the screen.
export function ditherInto(fb, target, w, h, x0 = 0, y0 = 0, { diffusion = 0.82 } = {}) {
  const T = target;
  const bits = new Uint8Array(w);
  const his = new Uint8Array(Math.ceil(w / 7));
  const stride = w * 3;
  const clamp = (v) => (v < -80 ? -80 : v > 335 ? 335 : v);

  const push = (x, y, er, eg, eb, f) => {
    if (x < 0 || x >= w || y >= h) return;
    const i = y * stride + x * 3;
    T[i] = clamp(T[i] + er * f);
    T[i + 1] = clamp(T[i + 1] + eg * f);
    T[i + 2] = clamp(T[i + 2] + eb * f);
  };

  const hiAt = (x) => his[(x / 7) | 0];

  const finalize = (x, y, right) => {
    const c = shown(x > 0 ? bits[x - 1] : 0, bits[x], right, hiAt(x), x);
    const i = y * stride + x * 3;
    const cost = dist(T, i, c);
    const er = (T[i] - c[0]) * diffusion;
    const eg = (T[i + 1] - c[1]) * diffusion;
    const eb = (T[i + 2] - c[2]) * diffusion;
    push(x + 1, y, er, eg, eb, 7 / 16);
    push(x - 1, y + 1, er, eg, eb, 3 / 16);
    push(x, y + 1, er, eg, eb, 5 / 16);
    push(x + 1, y + 1, er, eg, eb, 1 / 16);
    return cost;
  };

  // Save/restore the part of the error buffer one byte can touch.
  const saveRegion = (xs, y) => {
    const a = Math.max(0, xs - 2);
    const b = Math.min(w, xs + 9);
    const rows = [];
    for (let yy = y; yy <= Math.min(h - 1, y + 1); yy++) rows.push([yy, T.slice(yy * stride + a * 3, yy * stride + b * 3)]);
    return { a, rows, bits: bits.slice(xs, xs + 7) };
  };
  const restoreRegion = (s, xs) => {
    for (const [yy, data] of s.rows) T.set(data, yy * stride + s.a * 3);
    bits.set(s.bits, xs);
  };

  const runByte = (xs, y, hb) => {
    his[(xs / 7) | 0] = hb;
    let cost = 0;
    for (let x = xs; x < Math.min(w, xs + 7); x++) {
      const i = y * stride + x * 3;
      let best = 0;
      let bestCost = Infinity;
      for (let b = 0; b < 2; b++) {
        let c1 = 0;
        if (x > 0) {
          const col = shown(x > 1 ? bits[x - 2] : 0, bits[x - 1], b, hiAt(x - 1), x - 1);
          c1 = dist(T, i - 3, col);
        }
        const c2a = dist(T, i, shown(x > 0 ? bits[x - 1] : 0, b, 0, hb, x));
        const c2b = dist(T, i, shown(x > 0 ? bits[x - 1] : 0, b, 1, hb, x));
        const total = c1 + Math.min(c2a, c2b);
        if (total < bestCost) {
          bestCost = total;
          best = b;
        }
      }
      bits[x] = best;
      if (x > 0) cost += finalize(x - 1, y, best);
    }
    return cost;
  };

  for (let y = 0; y < h; y++) {
    bits.fill(0);
    for (let xs = 0; xs < w; xs += 7) {
      const before = saveRegion(xs, y);
      const cost0 = runByte(xs, y, 0);
      const after0 = saveRegion(xs, y);
      restoreRegion(before, xs);
      const cost1 = runByte(xs, y, 1);
      if (cost0 <= cost1) {
        restoreRegion(after0, xs);
        his[(xs / 7) | 0] = 0;
      }
    }
    finalize(w - 1, y, 0);
    for (let x = 0; x < w; x++) {
      fb.set(x0 + x, y0 + y, bits[x]);
      if (x % 7 === 0) for (let k = 0; k < 7; k++) fb.setHi(x0 + x + k, y0 + y, his[(x / 7) | 0]);
    }
  }
}
