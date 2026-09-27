// "Look at map": Route 66 drawn the way the 1985 game draws the Oregon Trail —
// white land, blue water, black mountains, a heavy line for the route you traveled.
import { HiRes } from "./hires.js";
import { LINE, drawCentered, drawText, measure } from "./text.js";

// A view maps latitude/longitude onto a band of screen rows [top, top + height).
// North-south degrees are stretched 1.25x so the map keeps its shape at these latitudes.
const FULL_VIEW = { lon0: -121.5, lat0: 45, px: 280 / 36.5, top: 0, height: 182 };
let view = FULL_VIEW;

export function project(lat, lon) {
  return [Math.round((lon - view.lon0) * view.px), Math.round(view.top + (view.lat0 - lat) * view.px * 1.25)];
}

const bottom = () => view.top + view.height - 1;

const PACIFIC = [
  [46.6, -124.1], [46.2, -124.0], [44, -124.1], [42, -124.35], [40.4, -124.4], [38.9, -123.7], [38.3, -123], [37.8, -122.5],
  [37.2, -122.4], [36.6, -121.9], [35.6, -121.2], [34.6, -120.6], [34.45, -120.45], [34.4, -119.7], [34.0, -118.8],
  [33.75, -118.4], [33.4, -117.6], [32.7, -117.2], [31.8, -116.6], [30.4, -116.0], [29.2, -114.9], [28.0, -114.1],
  [27.0, -114.2], [26.2, -113.4], [26, -130], [46.6, -130],
];
const GULF_CALIFORNIA = [
  [31.8, -114.8], [31.3, -113.6], [30.2, -112.8], [29, -112.2], [27.9, -111.0], [27.0, -110.4], [26.0, -109.4], [26.0, -111.6],
  [27.2, -112.3], [28.5, -113.2], [29.9, -114.4], [31.0, -114.7],
];
const GULF_MEXICO = [
  [26.0, -97.2], [27.8, -97.4], [28.9, -95.3], [29.7, -94.0], [29.6, -92.2], [29.2, -90.5], [29.9, -89.4], [30.3, -88.5],
  [30.4, -87.0], [30.1, -85.5], [29.7, -84.9], [25, -84.9], [25, -97.2],
];
const LAKE_MICHIGAN = [
  [41.62, -87.5], [41.9, -87.62], [42.5, -87.8], [43.2, -87.9], [44.0, -87.6], [44.5, -87.5], [45.2, -87.0], [45.8, -86.0],
  [45.9, -84.9], [44.8, -85.6], [44.0, -86.4], [43.2, -86.3], [42.3, -86.3], [41.8, -86.8], [41.62, -87.3],
];
const RIVERS = [
  // Mississippi
  [[46.5, -93.5], [45.0, -93.2], [44.0, -91.6], [43.0, -91.1], [42.0, -90.2], [41.4, -91.0], [40.4, -91.4], [39.4, -90.9], [38.8, -90.1], [38.6, -90.2], [37.3, -89.5], [36.6, -89.5], [35.1, -90.1], [34.0, -90.9], [33.0, -91.1], [31.5, -91.5], [30.5, -91.2], [29.9, -90.1]],
  // Missouri
  [[38.8, -90.1], [38.7, -91.4], [39.1, -94.6], [40.0, -95.3], [41.3, -95.9], [42.5, -96.4], [43.0, -98.0], [44.4, -100.4], [46.5, -100.6]],
  // Colorado
  [[40.1, -105.9], [39.5, -107.3], [39.1, -108.6], [38.6, -109.6], [37.3, -110.9], [36.9, -111.6], [36.1, -112.1], [36.2, -113.3], [36.0, -114.1], [36.1, -114.7], [35.2, -114.6], [34.3, -114.2], [33.6, -114.5], [32.7, -114.7], [31.8, -114.8]],
  // Rio Grande
  [[37.8, -107.5], [37.5, -106.3], [36.5, -105.9], [35.6, -106.1], [35.1, -106.7], [34.0, -106.9], [33.0, -107.2], [32.3, -106.8], [31.8, -106.5], [31.0, -105.5], [29.8, -104.4], [29.5, -102.8], [29.8, -101.4], [28.7, -100.5], [27.5, -99.5], [26.4, -99.0], [26.0, -97.4]],
  // Arkansas
  [[38.3, -105.2], [38.1, -103.5], [37.9, -100.9], [37.7, -98.6], [37.0, -97.0], [36.1, -95.9], [35.4, -94.4], [34.6, -92.3], [33.8, -91.1]],
];
const MOUNTAINS = [
  [39.5, -120.4], [38.5, -119.9], [37.6, -119.2], [36.6, -118.6], [35.7, -118.3], [41.2, -122.2], [40.3, -121.5],
  [39.6, -116.2], [40.6, -115.4], [38.6, -117.1], [41.6, -117.0], [37.6, -115.2],
  [40.4, -111.6], [41.5, -110.8], [43.0, -110.2], [44.4, -110.6], [45.6, -111.3], [44.2, -107.3],
  [40.6, -105.8], [39.5, -106.2], [38.5, -106.4], [37.6, -105.6], [36.5, -105.4], [37.9, -107.7], [39.2, -107.4],
  [35.35, -111.7], [34.3, -111.3], [33.5, -109.6], [32.6, -108.4], [30.0, -108.3], [28.6, -107.4], [27.3, -106.8],
  [36.8, -93.0], [36.4, -94.3], [43.8, -103.6],
];
// Route 66, Chicago to Santa Monica, with the pre-1937 Santa Fe loop.
const ROUTE_66 = [
  [41.88, -87.63], [41.53, -88.08], [41.31, -88.15], [41.0, -88.52], [40.88, -88.63], [40.48, -88.99], [40.26, -89.23],
  [39.8, -89.64], [39.18, -89.65], [38.63, -90.2], [37.95, -91.77], [37.21, -93.29], [37.08, -94.51], [36.15, -95.99],
  [35.47, -97.52], [35.41, -99.4], [35.22, -101.83], [35.17, -103.72], [34.94, -104.68], [35.52, -105.2], [35.69, -105.94],
  [35.08, -106.65], [35.15, -107.85], [35.53, -108.74], [34.9, -110.16], [35.02, -110.7], [35.2, -111.65], [35.25, -112.19],
  [35.33, -112.88], [35.38, -113.66], [35.37, -113.73], [35.19, -114.05], [35.03, -114.38], [34.85, -114.61],
  [34.56, -115.74], [34.83, -116.69], [34.9, -117.02], [34.6, -117.33], [34.54, -117.29], [34.11, -117.29],
  [34.15, -118.14], [34.01, -118.5],
];
const PART1_ROUTE = [
  [34.01, -118.5], [34.15, -118.14], [34.11, -117.29], [34.54, -117.29], [34.6, -117.33], [34.9, -117.02], [34.83, -116.69],
  [34.56, -115.74], [34.85, -114.61], [35.03, -114.38], [35.19, -114.05], [35.37, -113.73], [35.38, -113.66], [35.33, -112.88],
  [35.25, -112.19], [35.2, -111.65], [35.02, -110.7], [34.9, -110.16], [35.53, -108.74], [35.15, -107.85], [35.04, -107.47],
  [35.08, -106.65], [35.69, -105.94],
];
const PART2_ROUTE = [
  [41.88, -87.63], [41.53, -88.08], [41.31, -88.15], [41.0, -88.52], [40.88, -88.63], [40.26, -89.23], [39.8, -89.64], [38.63, -90.2],
  [38.06, -91.4], [37.68, -92.66], [37.21, -93.29], [37.18, -94.31], [37.08, -94.51], [36.4, -95.44], [36.19, -95.75], [36.15, -95.99],
  [35.66, -97.33], [35.47, -97.52], [35.52, -98.97], [35.23, -100.6], [35.22, -101.83], [35.27, -102.67], [35.17, -103.72],
  [34.94, -104.68], [35.01, -105.67], [35.08, -106.65],
];

// Where each day ended.
export const OVERNIGHT = {
  "tsa-glamour-airport-limbo-mcnuggets": [33.98, -118.45],
  "pier-selfies-end-of-trail-barstow": [34.9, -117.02],
  "bottle-trees-ghost-towns-neon-needles": [34.85, -114.61],
  "oatman-donkey-parade-road-to-kingman": [35.19, -114.05],
  "side-quests-seligman-kitsch-williams-deep-freeze": [35.25, -112.19],
  "snowy-white-knuckle-driving-frozen-flagstaff-wander": [35.2, -111.65],
  "standing-around-winslow": [35.02, -110.7],
  "winslow-to-santa-fe-wigwam-throwback-maverik-save": [35.69, -105.94],
  "downtown-santa-fe-miracle-staircase-happy-hour-timing": [35.69, -105.94],
  "folk-art-fancy-coffee-bye-new-mexico": [35.04, -106.61],
  "red-eye-to-route-66": [41.98, -87.9],
  "lou-mitchells-joliet-gemini-giant": [40.88, -88.63],
  "pontiac-murals-lincolns-springfield": [39.8, -89.64],
  "lincoln-miles-of-memories-cozy-dog-st-louis": [38.63, -90.2],
  "arch-trams-bridge-bends-frozen-custard": [38.63, -90.2],
  "cuba-murals-rocker-beaver-nuggets": [37.21, -93.29],
  "chubby-angels-red-oak-beige-dinner": [37.08, -94.51],
  "totems-whales-round-barns-bank-vaults": [35.47, -97.52],
  "museum-mclean-big-texan": [35.22, -101.83],
  "pie-painted-lines-neon-camels": [35.17, -103.72],
  "spaceships-neon-old-town": [35.08, -106.65],
};

function inPolygon(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function fillWater(fb, poly) {
  const pts = poly.map(([lat, lon]) => project(lat, lon));
  for (let y = view.top; y <= bottom(); y++) {
    for (let x = 0; x < 280; x++) if (inPolygon(x + 0.5, y + 0.5, pts)) fb.paint(x, y, "blue");
  }
}

function line(points, plot) {
  for (let i = 1; i < points.length; i++) {
    let [x0, y0] = project(...points[i - 1]);
    const [x1, y1] = project(...points[i]);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      plot(x0, y0);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }
}

// A blue hairline on white: switch off one odd dot and the monitor fills it blue.
function river(fb, points) {
  line(points, (x, y) => {
    if (y < view.top || y > bottom()) return;
    const odd = x | 1;
    fb.set(odd, y, 0);
    fb.setHi(odd, y, 1);
  });
}

function blackLine(fb, points, dotted = false) {
  let n = 0;
  line(points, (x, y) => {
    n++;
    if (y < view.top || y > bottom()) return;
    if (dotted && n % 6 > 2) return;
    const even = x & ~1;
    fb.set(even, y, 0);
    fb.set(even + 1, y, 0);
  });
}

const MOUNTAIN = ["....##....", "...####...", "..##..##..", ".##....##.", "##......##"];

function mountain(fb, x, y) {
  MOUNTAIN.forEach((row, r) => {
    if (y + r < view.top || y + r > bottom()) return;
    for (let c = 0; c < row.length; c++) if (row[c] === "#") fb.set(x + c, y + r, 0);
  });
}

function blackBox(fb, x, y, w, h) {
  fb.fill(x, y, w, h, "white");
  fb.fill(x, y, w, 1, "black");
  fb.fill(x, y + h - 1, w, 1, "black");
  fb.fill(x, y, 2, h, "black");
  fb.fill(x + w - 2, y, 2, h, "black");
}

function label(fb, text, x, y) {
  const w = measure(text) + 8;
  blackBox(fb, x, y, w, LINE + 3);
  drawText(fb, x + 4, y + 2, text, { invert: true });
  return { x, y, w, h: LINE + 3 };
}

// Overnight stops are hollow squares, like the forts on the game's map.
function marker(fb, x, y, big) {
  const s = big ? 8 : 6;
  const x0 = (x - s / 2) & ~1;
  const y0 = y - s / 2;
  fb.fill(x0, y0, s, s, "black");
  fb.fill(x0 + 2, y0 + 2, s - 4, s - 4, "white");
}

// Land, water, rivers, mountains and routes never change, so each view's base layer
// is drawn once and copied in on every frame.
const baseCache = new Map();

function baseLayer(v, extra) {
  const key = JSON.stringify(v) + (extra?.key || "");
  if (!baseCache.has(key)) {
    const fb = new HiRes(v.top + v.height);
    const previous = view;
    view = v;
    fb.fill(0, v.top, 280, v.height, "white");
    fillWater(fb, PACIFIC);
    fillWater(fb, GULF_CALIFORNIA);
    fillWater(fb, GULF_MEXICO);
    fillWater(fb, LAKE_MICHIGAN);
    RIVERS.forEach((r) => river(fb, r));
    for (const [lat, lon] of MOUNTAINS) {
      const [x, y] = project(lat, lon);
      if (extra?.skipMountain?.(x, y)) continue;
      mountain(fb, x - 5, y - 2);
    }
    blackLine(fb, ROUTE_66, true);
    blackLine(fb, PART1_ROUTE);
    blackLine(fb, PART2_ROUTE);
    extra?.draw?.(fb);
    view = previous;
    baseCache.set(key, fb);
  }
  return baseCache.get(key);
}

export function drawMap(fb, { entries, highlight, blinkOn = true, hover = -1 }) {
  const base = baseLayer(FULL_VIEW, {
    key: "full",
    skipMountain: (x, y) => x < 132 && y < 26, // keep the title clear
    draw: (layer) => {
      drawCentered(layer, 4, "Map of the", { invert: true, x0: 8, x1: 128 });
      drawCentered(layer, 13, "Route 66 Trail", { invert: true, x0: 8, x1: 128 });
      label(layer, "CHICAGO", 196, 12);
      label(layer, "SANTA MONICA", 2, 110);
      label(layer, "ALBUQUERQUE", 104, 101);
      legend(layer);
    },
  });
  fb.copyFrom(base, 0, 0, 280, FULL_VIEW.height, 0, 0);
  view = FULL_VIEW;
  const hotspots = [];
  entries.forEach((entry, index) => {
    const at = OVERNIGHT[entry.slug];
    if (!at) return;
    const [x, y] = project(...at);
    const isHighlight = highlight === entry.slug;
    if (isHighlight && !blinkOn) return;
    marker(fb, x, y, isHighlight || hover === index);
    hotspots.push({ x: x - 5, y: y - 5, w: 10, h: 10, option: index });
  });
  return hotspots;
}

function legend(fb) {
  const lx = 4;
  const ly = 126;
  const rows = [
    ["box", "Overnight stops"],
    ["line", "Your route"],
    ["dots", "Route 66"],
    ["river", "Rivers"],
    ["mtn", "Mountains"],
  ];
  blackBox(fb, lx, ly, Math.max(...rows.map(([, text]) => measure(text))) + 30, 54);
  rows.forEach(([kind, text], i) => {
    const y = ly + 4 + i * LINE;
    const x = lx + 6;
    if (kind === "box") marker(fb, x + 5, y + 3, false);
    if (kind === "line") fb.fill(x, y + 3, 10, 1, "black");
    if (kind === "dots") [0, 6].forEach((d) => fb.fill(x + d, y + 3, 4, 1, "black"));
    if (kind === "river") {
      // a short wavy blue hairline, drawn the same way as the rivers
      [0, 0, 1, 1, 0, 0, -1, -1, 0, 0, 1, 1].forEach((dy, k) => {
        const px = (x + k) | 1;
        fb.set(px, y + 3 + dy, 0);
        fb.setHi(px, y + 3 + dy, 1);
      });
    }
    if (kind === "mtn") mountain(fb, x, y);
    drawText(fb, x + 16, y, text, { invert: true });
  });
}

// A close-up strip of one day's route: where it started, where it ended (blinking),
// and a dashed line for flights.
export function drawRouteStrip(fb, { from, to, fromName, toName, flight = false, blinkOn = true, top = 0, height = 112 }) {
  const midLat = (from[0] + to[0]) / 2;
  const midLon = (from[1] + to[1]) / 2;
  const spanLon = Math.abs(from[1] - to[1]);
  const spanLat = Math.abs(from[0] - to[0]) * 1.25;
  const degPerPx = Math.max((spanLon * 1.9) / 280, (spanLat * 2.2) / height, 3.2 / 280);
  const px = 1 / degPerPx;
  const v = {
    lon0: +(midLon - 140 * degPerPx).toFixed(4),
    lat0: +(midLat + height / 2 / (px * 1.25)).toFixed(4),
    px: +px.toFixed(4),
    top,
    height,
  };
  const labels = (layer) => {
    const a = project(...from);
    const b = project(...to);
    if (flight) {
      let n = 0;
      line([from, to], (x, y) => {
        if (n++ % 6 >= 3 || y < top || y > top + height - 1) return;
        layer.set(x & ~1, y, 0);
        layer.set((x & ~1) + 1, y, 0);
      });
    }
    const place = (name, [x, y], other) => {
      const w = measure(name) + 8;
      const lx = Math.min(274 - w, Math.max(2, x < other[0] ? x - w - 6 : x + 6));
      const ly = Math.min(top + height - LINE - 5, Math.max(top + 2, y - 6));
      label(layer, name, lx, ly);
    };
    if (fromName && (a[0] !== b[0] || a[1] !== b[1])) place(fromName, a, b);
    if (toName) place(toName, b, a);
    marker(layer, a[0], a[1], false);
  };
  const base = baseLayer(v, { key: `${fromName}>${toName}${flight ? "*" : ""}`, draw: labels });
  fb.copyFrom(base, 0, top, 280, height, 0, top);
  view = v;
  const [x, y] = project(...to);
  if (blinkOn) marker(fb, x, y, true);
  else marker(fb, x, y, false);
  view = FULL_VIEW;
}
