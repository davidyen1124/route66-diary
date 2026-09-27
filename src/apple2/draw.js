import { CURSOR, LINE, drawCentered, drawText, measure, wrap } from "./text.js";

// The blue divider that frames the game's text screens: an arrow-tipped double rule
// with a cartouche in the middle. Drawn symmetrically, 14 rows tall.
export function ornament(fb, y, color = "blue") {
  const W = fb.w;
  const span = (x0, x1, row) => {
    fb.fill(x0, y + row, x1 - x0 + 1, 1, color);
    fb.fill(W - 1 - x1, y + row, x1 - x0 + 1, 1, color);
  };
  // arrow tips
  span(2, 9, 6);
  span(2, 9, 7);
  span(6, 13, 5);
  span(6, 13, 8);
  span(12, 15, 4);
  span(12, 15, 9);
  // main double rule
  span(8, 106, 6);
  span(8, 106, 7);
  // fine rules above and below, curling into the cartouche
  span(40, 100, 3);
  span(40, 100, 10);
  span(34, 39, 4);
  span(34, 39, 9);
  span(101, 104, 2);
  span(101, 104, 11);
  // cartouche with rounded corners
  for (let row = 2; row <= 11; row++) span(107, 110, row);
  span(109, 124, 1);
  span(109, 124, 12);
  span(111, 124, 6);
  span(111, 124, 7);
  // central diamond
  const half = [0, 2, 5, 8, 11, 14, 16, 16, 14, 11, 8, 5, 2, 0];
  for (let row = 0; row < 14; row++) {
    const h = half[row];
    if (!h) continue;
    fb.fill(140 - h, y + row, h * 2, 1, color);
  }
  // hollow center so the diamond reads as a jewel, not a blob
  for (let row = 4; row <= 9; row++) {
    const h = Math.max(0, half[row] - 8);
    if (h) fb.fill(140 - h, y + row, h * 2, 1, "black");
  }
}

// A black message box with the game's thick white border and rounded corners.
// (x, y) is the outer one-pixel black margin; text starts at x + 8, y + 6.
export function messageBox(fb, x, y, w, h) {
  fb.fill(x, y, w, h, "black");
  const x1 = x + w - 1;
  const y1 = y + h - 1;
  // top and bottom borders with two-step rounding
  for (let i = 0; i < 3; i++) {
    fb.fill(x + 3 - i, y + 1 + i, w - 2 * (3 - i), 1, "white");
    fb.fill(x + 3 - i, y1 - 1 - i, w - 2 * (3 - i), 1, "white");
  }
  fb.fill(x + 1, y + 4, 3, h - 8, "white");
  fb.fill(x1 - 3, y + 4, 3, h - 8, "white");
}

// White band behind inverse text (the status box and landmark captions).
export function whiteBand(fb, y, h, x = 0, w = fb.w) {
  fb.fill(x, y, w, h, "white");
}

// Centered inverse header, like the fort name and date at the top of the store.
export function inverseHeader(fb, lines, y = 1) {
  const width = Math.max(...lines.map((l) => measure(l)));
  const w = width + 18;
  const x = Math.round((fb.w - w) / 2);
  const h = lines.length * LINE + 4;
  fb.fill(x, y, w, h, "white");
  lines.forEach((line, i) => drawCentered(fb, y + 3 + i * LINE, line, { invert: true }));
  return { x, y, w, h };
}

export function drawCursor(fb, x, y, on = true) {
  if (on) drawText(fb, x, y, CURSOR);
  else fb.fill(x, y, 6, 8, "black");
}

// "What is your choice?" followed by the checkered cursor.
export function prompt(fb, x, y, text, cursorOn) {
  const end = drawText(fb, x, y, text);
  drawCursor(fb, end + 8, y, cursorOn);
  return end;
}

// Numbered options with hanging indents. Returns a hotspot rectangle per option.
export function menu(fb, x, y, items, { pitch = LINE, width = fb.w - x - 8, gapAfter = 0, hover = -1, numberWidth } = {}) {
  const hotspots = [];
  let cy = y;
  const labelX = x + (numberWidth ?? measure("0.") + 11);
  items.forEach((item, index) => {
    const number = `${item.key}.`;
    const lines = wrap(item.label, width - (labelX - x));
    const top = cy;
    const inverse = hover === index;
    if (inverse) fb.fill(x - 3, cy - 1, Math.max(...lines.map((l) => measure(l))) + (labelX - x) + 6, lines.length * pitch + (item.sub ? LINE : 0), "white");
    drawText(fb, x + (measure("0.") - measure(number)), cy, number, { invert: inverse });
    lines.forEach((line, i) => drawText(fb, labelX, cy + i * pitch, line, { invert: inverse }));
    cy += lines.length * pitch;
    if (item.sub) {
      drawText(fb, labelX, cy, item.sub, { invert: inverse });
      cy += LINE;
    }
    hotspots.push({ x: x - 3, y: top - 1, w: fb.w - x - 2, h: cy - top + 1, index });
    cy += gapAfter;
  });
  return { hotspots, bottom: cy };
}
