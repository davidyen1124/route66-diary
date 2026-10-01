// A 280-pixel-wide Apple II hi-res framebuffer.
//
// Pixels are stored as raw bits plus one "high bit" per 7-pixel byte, exactly like
// hi-res memory. Colors are never stored: they emerge from the bit pattern when the
// frame is rendered, using the same rules a color monitor applies to the NTSC signal:
//   - a lit dot next to another lit dot is white;
//   - a lone lit dot takes the color of its column phase (even: violet/blue, odd: green/orange);
//   - a dark dot squeezed between two lit dots is filled with their color.
// The high bit of the byte picks the palette (0: violet/green, 1: blue/orange).

export const RGB = {
  black: [0, 0, 0],
  white: [255, 255, 255],
  green: [0x38, 0xcb, 0x00],
  violet: [0xc7, 0x34, 0xff],
  orange: [0xf2, 0x5e, 0x00],
  blue: [0x0d, 0xa1, 0xff],
};

const PHASE = [
  [RGB.violet, RGB.green],
  [RGB.blue, RGB.orange],
];

export const WIDTH = 280;
export const HEIGHT = 192;
const BYTES = 40;

export class HiRes {
  constructor(height = HEIGHT) {
    this.w = WIDTH;
    this.h = height;
    this.bits = new Uint8Array(WIDTH * height);
    this.hi = new Uint8Array(BYTES * height);
  }

  clear(color = "black") {
    this.fill(0, 0, this.w, this.h, color);
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  set(x, y, v = 1) {
    if (this.inBounds(x, y)) this.bits[y * this.w + x] = v ? 1 : 0;
  }

  setHi(x, y, v) {
    if (this.inBounds(x, y)) this.hi[y * BYTES + ((x / 7) | 0)] = v ? 1 : 0;
  }

  // Paint one pixel with a solid hi-res color. Colored areas are built from every
  // other dot, so a pixel of the wrong phase is simply left dark.
  paint(x, y, color) {
    if (!this.inBounds(x, y)) return;
    const i = y * this.w + x;
    switch (color) {
      case "black":
        this.bits[i] = 0;
        break;
      case "white":
        this.bits[i] = 1;
        break;
      case "violet":
      case "green":
        this.bits[i] = (x & 1) === (color === "green" ? 1 : 0) ? 1 : 0;
        this.hi[y * BYTES + ((x / 7) | 0)] = 0;
        break;
      case "blue":
      case "orange":
        this.bits[i] = (x & 1) === (color === "orange" ? 1 : 0) ? 1 : 0;
        this.hi[y * BYTES + ((x / 7) | 0)] = 1;
        break;
      default:
        break;
    }
  }

  fill(x, y, w, h, color) {
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(this.w, Math.floor(x + w));
    const y1 = Math.min(this.h, Math.floor(y + h));
    for (let yy = y0; yy < y1; yy++) {
      for (let xx = x0; xx < x1; xx++) this.paint(xx, yy, color);
    }
  }

  // Draw a bitmap given as rows of integers (bit i = column i).
  blitBits(rows, width, x, y, { invert = false, transparent = true } = {}) {
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = 0; c < width; c++) {
        const on = (row >> c) & 1;
        if (on) this.set(x + c, y + r, invert ? 0 : 1);
        else if (!transparent) this.set(x + c, y + r, invert ? 1 : 0);
      }
    }
  }

  // Draw a sprite described with characters:
  //  ' ' transparent, '.' black, '#' white, 'g' green, 'v' violet, 'o' orange, 'b' blue.
  // Colored characters light only the dots whose phase matches the color, and set the
  // byte's high bit so the monitor shows the intended hue.
  sprite(rows, x, y, { flip = false } = {}) {
    const map = { ".": "black", "#": "white", g: "green", v: "violet", o: "orange", b: "blue" };
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) {
        const ch = flip ? row[row.length - 1 - c] : row[c];
        if (ch === " ") continue;
        const color = map[ch];
        if (color) this.paint(x + c, y + r, color);
      }
    }
  }

  copyFrom(other, sx, sy, w, h, dx, dy) {
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const x = sx + c;
        const y = sy + r;
        if (!other.inBounds(x, y)) continue;
        this.set(dx + c, dy + r, other.bits[y * other.w + x]);
        this.setHi(dx + c, dy + r, other.hi[y * BYTES + ((x / 7) | 0)]);
      }
    }
  }

  // Render the frame through the color-monitor model into RGBA pixels.
  render(imageData, rowsVisible = this.h) {
    const out = imageData.data;
    const { w, bits, hi } = this;
    for (let y = 0; y < this.h; y++) {
      const base = y * w;
      const visible = typeof rowsVisible === "number" ? y < rowsVisible : rowsVisible(y);
      for (let x = 0; x < w; x++) {
        let rgb = RGB.black;
        if (visible) {
          const on = bits[base + x];
          const left = x > 0 ? bits[base + x - 1] : 0;
          const right = x < w - 1 ? bits[base + x + 1] : 0;
          const pal = PHASE[hi[y * BYTES + ((x / 7) | 0)]];
          if (on) rgb = left || right ? RGB.white : pal[x & 1];
          else if (left && right) rgb = pal[(x - 1) & 1];
        }
        const o = (base + x) * 4;
        out[o] = rgb[0];
        out[o + 1] = rgb[1];
        out[o + 2] = rgb[2];
        out[o + 3] = 255;
      }
    }
    return imageData;
  }
}

// Hi-res memory is interleaved, so a picture loaded from disk appears in bands:
// rows 0, 64, 128, 8, 72, 136, ... then the next scanline of every band.
export function loadOrder(height = HEIGHT) {
  const order = [];
  for (let line = 0; line < 8; line++) {
    for (let group = 0; group < 8; group++) {
      for (let third = 0; third < 3; third++) {
        const y = third * 64 + group * 8 + line;
        if (y < height) order.push(y);
      }
    }
  }
  for (let y = 192; y < height; y++) order.push(y);
  return order;
}
