// Screen builders. Each scene describes one 280x192 Apple II screen:
//   draw(fb, state) paints it and returns the clickable regions it laid out;
//   options[] are the numbered choices (or links) those regions trigger.
// Layout numbers follow measurements taken from native captures of the 1985 game.
import { LINE, drawBig, drawBigCentered, drawCentered, drawText, measure, measureBig, normalize, wrap } from "./text.js";
import { inverseHeader, menu, messageBox, ornament, prompt, whiteBand } from "./draw.js";
import { CLOUD, drawCar, drawSprite, spriteSize } from "./sprites.js";
import { drawMap, drawRouteStrip } from "./map.js";

export const PRESS_SPACE = "Press SPACE BAR to continue";
const TEXT_X = 20;
const TEXT_W = 240;

// ---------------------------------------------------------------- helpers

// On touch screens the prompts ask for a tap instead of a key.
const TOUCH = typeof window !== "undefined" && Boolean(window.matchMedia?.("(pointer: coarse)").matches);
export function promptText(text) {
  if (!TOUCH) return text;
  return text.replace(/^Press SPACE BAR/, "Tap the screen").replace(/^Press RETURN/, "Tap here");
}

function lineSpot(x, y, w) {
  return { x: x - 3, y: y - 2, w: w + 6, h: LINE + 2 };
}

function continueLine(fb, state, y = 184, label = PRESS_SPACE) {
  const text = promptText(label);
  const w = measure(text);
  const x = Math.round((fb.w - w) / 2);
  const hover = state.hover === "next";
  if (hover) fb.fill(x - 3, y - 1, w + 6, LINE, "white");
  drawText(fb, x, y, text, { invert: hover });
  return { ...lineSpot(x, y, w), option: "next" };
}

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text) {
  let h = 2166136261;
  for (const ch of String(text)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}


// ---------------------------------------------------------------- splash

export function splashScene({ title = "Route 66", subtitle = "Trail Journal", tagline = "two journeys on the mother road", year = 2026 } = {}) {
  return {
    id: "splash",
    label: `${title} ${subtitle}`,
    draw(fb, state) {
      fb.clear("white");
      // blue frame
      fb.fill(29, 15, 223, 8, "blue");
      fb.fill(29, 99, 223, 8, "blue");
      fb.fill(29, 23, 7, 76, "blue");
      fb.fill(245, 23, 7, 76, "blue");
      drawBigCentered(fb, 36, title, { invert: true });
      drawCentered(fb, 68, subtitle, { invert: true });
      // speed stripes running into a black Route 66 shield
      const sx = 104;
      const sy = 114;
      [[118, 44], [122, 36], [126, 30], [130, 28], [134, 30], [138, 34], [142, 40], [146, 48], [150, 58]].forEach(([y, x0]) => fb.fill(x0, y, sx - 4 - x0, 2, "green"));
      for (let r = 0; r < 44; r++) {
        const inset = r === 0 ? 2 : r > 27 ? Math.round((r - 27) * 2.1) : 0;
        const w = 72 - inset * 2;
        if (w > 0) fb.fill(sx + inset, sy + r, w, 1, "black");
      }
      fb.fill(sx + 32, sy, 8, 3, "white");
      drawCentered(fb, sy + 6, "ROUTE", { x0: sx, x1: sx + 72 });
      drawBig(fb, sx + Math.round((72 - measureBig("66")) / 2), sy + 16, "66");
      // name bar, blue rule, copyright, green floor
      fb.fill(0, 159, 280, 10, "black");
      drawCentered(fb, 160, tagline);
      fb.fill(0, 169, 280, 1, "black");
      fb.fill(0, 170, 280, 4, "blue");
      const copy = `COPYRIGHT ${year}`;
      drawText(fb, 270 - measure(copy), 174, copy, { invert: true });
      fb.fill(0, 181, 280, 11, "green");
      return { hotspots: [{ x: 0, y: 0, w: 280, h: 192, option: "next" }] };
    },
  };
}

// ---------------------------------------------------------------- main menu

export function mainMenuScene({ options }) {
  return {
    id: "main-menu",
    label: "Main menu",
    cursor: true,
    options,
    draw(fb, state) {
      fb.clear();
      drawBigCentered(fb, 6, "Route 66");
      drawCentered(fb, 30, "Trail Journal");
      ornament(fb, 42);
      drawText(fb, 32, 63, "You may:");
      const { hotspots } = menu(fb, 48, 83, options, { pitch: 11, hover: typeof state.hover === "number" ? state.hover : -1 });
      prompt(fb, 32, 146, "What is your choice?", state.cursorOn);
      ornament(fb, 166);
      return { hotspots: hotspots.map((h) => ({ ...h, option: h.index })) };
    },
  };
}

// ---------------------------------------------------------------- landmark picture

export function captionCase(text) {
  const keep = new Set(["PM", "AM", "SFO", "LAX", "ABQ", "SJC", "ORD"]);
  const small = new Set(["a", "an", "the", "of", "on", "to", "in", "and", "at", "for"]);
  let startOfPhrase = true;
  return normalize(text)
    .split(" ")
    .map((word) => {
      if (word === "→" || word === "·" || word === "&" || word === "-") {
        startOfPhrase = true;
        return word;
      }
      if (keep.has(word) || /^\d/.test(word)) {
        startOfPhrase = false;
        return word;
      }
      const lower = word.toLowerCase();
      const out = !startOfPhrase && small.has(lower) ? lower : lower.replace(/(^|-)([a-z])/g, (m, p, c) => p + c.toUpperCase());
      startOfPhrase = false;
      return out;
    })
    .join(" ");
}

export function landmarkScene({ id, label, captionLines, picture, pressText = PRESS_SPACE, overlay }) {
  const barLines = captionLines.length;
  const barH = barLines * LINE + 2;
  const barTop = 180 - barH;
  return {
    id,
    label,
    picture: { ...picture, height: barTop },
    loadEffect: true,
    draw(fb, state) {
      fb.clear();
      if (state.picture) {
        const reveal = state.reveal;
        for (let y = 0; y < barTop; y++) {
          if (reveal && !reveal(y)) continue;
          fb.copyFrom(state.picture, 0, y, 280, 1, 0, y);
        }
      }
      whiteBand(fb, barTop, barH);
      captionLines.forEach((line, i) => drawCentered(fb, barTop + 2 + i * LINE, line, { invert: true }));
      const spots = [];
      if (overlay) spots.push(...(overlay(fb, state) || []));
      spots.push(continueLine(fb, state, 182, pressText));
      return { hotspots: spots };
    },
  };
}

// ---------------------------------------------------------------- text screens

// Header lines centered at the top, blue dividers, wrapped paragraphs. Returns one or
// more scenes; long text continues on the next screen like the game's trail guide.
// Paragraphs stay whole on a screen whenever they can; only a paragraph too long for
// any screen is split, and never so a lone line is left behind.
export function paginateParagraphs(paragraphs, firstCapacity, restCapacity) {
  const pages = [];
  let page = [];
  let cap = firstCapacity;
  const flush = () => {
    pages.push(page);
    page = [];
    cap = restCapacity;
  };
  for (const lines of paragraphs) {
    const gap = page.length ? 1 : 0;
    if (page.length + gap + lines.length <= cap) {
      if (gap) page.push("");
      page.push(...lines);
      continue;
    }
    if (page.length && lines.length <= restCapacity) {
      flush();
      page.push(...lines);
      continue;
    }
    let rest = lines.slice();
    if (page.length && cap - page.length - 1 >= 3) page.push("");
    else if (page.length) flush();
    while (rest.length) {
      let room = cap - page.length;
      if (rest.length > room && rest.length - room < 2) room -= 2 - (rest.length - room);
      page.push(...rest.splice(0, Math.max(1, room)));
      if (rest.length) flush();
    }
  }
  if (page.length) pages.push(page);
  return pages.length ? pages : [[]];
}

// Header lines centered at the top, blue dividers, wrapped paragraphs. Returns one or
// more scenes; long text continues on the next screen like the game's trail guide.
export function textScenes({ id, label, header = [], paragraphs, big, lastPress = PRESS_SPACE }) {
  const blocks = paragraphs.map((p) => wrap(p, TEXT_W));
  const firstStart = big ? 62 : header.length ? 4 + header.length * LINE + 6 + 14 + 10 : 29;
  const capacity = (start) => Math.floor((158 - start) / LINE) + 1;
  const pages = paginateParagraphs(blocks, capacity(firstStart), capacity(29));
  return pages.map((page, index) => ({
    id: `${id}-${index + 1}`,
    label: index === 0 ? label : `${label} (continued)`,
    textLines: page,
    draw(fb, state) {
      fb.clear();
      let start = 29;
      if (index === 0 && big) {
        drawBigCentered(fb, 10, big);
        ornament(fb, 40);
        start = firstStart;
      } else if (index === 0 && header.length) {
        header.forEach((line, i) => drawCentered(fb, 4 + i * LINE, line));
        const oy = 4 + header.length * LINE + 6;
        ornament(fb, oy);
        start = oy + 14 + 10;
      } else {
        ornament(fb, 5);
      }
      page.forEach((line, i) => drawText(fb, TEXT_X, start + i * LINE, line));
      const lastLine = start + (page.length - 1) * LINE;
      ornament(fb, Math.max(162, lastLine + LINE));
      const last = index === pages.length - 1;
      return { hotspots: [continueLine(fb, state, 184, last ? lastPress : PRESS_SPACE)] };
    },
  }));
}

// ---------------------------------------------------------------- day list

export function dayListScenes({ heading, intro, header, entries }) {
  const X = 8;
  const items = entries.map((entry) => ({
    key: entry.day === 10 ? "0" : String(entry.day),
    number: String(entry.day),
    label: entry.title,
    sub: `${entry.dateDisplay.replace(/,\s*\d{4}$/, "")} · ${entry.location}`,
    href: entry.href,
    entry,
  }));
  const labelX = X + measure("10.") + 9;
  const width = 272 - labelX;
  const heights = items.map((item) => (wrap(item.label, width).length + wrap(item.sub, width).length) * LINE + 5);
  const introLines = wrap(intro, 250);
  const headingY = 28 + introLines.length * LINE + 6;
  const firstTop = headingY + LINE + 8;
  // Fewest screens that hold every day, then spread the days evenly across them.
  const fits = (sizes) => {
    let i = 0;
    return sizes.every((count, p) => {
      let y = p === 0 ? firstTop : 25;
      for (let k = 0; k < count; k++) y += heights[i++];
      return y <= (p === sizes.length - 1 ? 156 : 174);
    });
  };
  // Try every way to split the days over the fewest screens; keep the most even split.
  const compositions = (n, k) => {
    if (k === 1) return [[n]];
    const out = [];
    for (let first = 1; first <= n - k + 1; first++) for (const rest of compositions(n - first, k - 1)) out.push([first, ...rest]);
    return out;
  };
  let pages = null;
  for (let count = 1; count <= items.length && !pages; count++) {
    const best = compositions(items.length, count)
      .filter(fits)
      .sort((a, b) => Math.max(...a) - Math.min(...a) - (Math.max(...b) - Math.min(...b)))[0];
    if (best) {
      let i = 0;
      pages = best.map((n) => Array.from({ length: n }, () => i++));
    }
  }
  pages ||= items.map((_, i) => [i]);

  return pages.map((indices, pageIndex) => {
    const options = indices.map((i) => items[i]);
    const last = pageIndex === pages.length - 1;
    return {
      id: pageIndex === 0 ? "saved" : `saved-${pageIndex + 1}`,
      label: pageIndex === 0 ? heading : `${heading} (continued)`,
      cursor: last,
      options,
      draw(fb, state) {
        fb.clear();
        let cy;
        if (pageIndex === 0) {
          inverseHeader(fb, header, 1);
          introLines.forEach((line, i) => drawText(fb, X, 28 + i * LINE, line));
          drawText(fb, X, headingY, heading);
          cy = firstTop;
        } else {
          ornament(fb, 0);
          cy = 25;
        }
        const hotspots = [];
        options.forEach((item, idx) => {
          const hover = state.hover === idx;
          const labelLines = wrap(item.label, width);
          const subLines = wrap(item.sub, width);
          const h = (labelLines.length + subLines.length) * LINE;
          if (hover) fb.fill(X - 3, cy - 2, 272 - X + 6, h + 2, "white");
          const num = `${item.number}.`;
          drawText(fb, labelX - 9 - measure(num), cy, num, { invert: hover });
          labelLines.forEach((line, k) => drawText(fb, labelX, cy + k * LINE, line, { invert: hover }));
          subLines.forEach((line, k) => drawText(fb, labelX, cy + (labelLines.length + k) * LINE, line, { invert: hover }));
          hotspots.push({ x: X - 3, y: cy - 2, w: 272 - X + 6, h: h + 2, option: idx });
          cy += h + 5;
        });
        if (last) {
          prompt(fb, X, 162, "Which day will you relive?", state.cursorOn);
          ornament(fb, 177);
        } else {
          hotspots.push(continueLine(fb, state, 180, "Press SPACE BAR for more days"));
        }
        return { hotspots };
      },
    };
  });
}

// ---------------------------------------------------------------- travel screen

const WEST_BAND = { mountains: "violet", grass: "green", snow: "white", city: "blue" };

function drawBand(fb, kind, seed, lift = 0) {
  const rnd = mulberry(seed);
  const base = 29 - lift;
  const heights = [];
  let h = 6 + rnd() * 6;
  let v = 0;
  for (let x = 0; x < 280; x++) {
    v += (rnd() - 0.5) * (kind === "grass" ? 0.9 : 1.5);
    v *= 0.92;
    h += v;
    const max = kind === "grass" ? 7 : 16;
    const min = kind === "grass" ? 2 : 3;
    if (h > max) { h = max; v = -Math.abs(v); }
    if (h < min) { h = min; v = Math.abs(v); }
    heights.push(Math.round(h));
  }
  if (kind === "city") {
    let x = 0;
    while (x < 280) {
      const w = 8 + Math.floor(rnd() * 14);
      const bh = 4 + Math.floor(rnd() * 14);
      fb.fill(x, base + 1 - bh, w - 2, bh, "blue");
      for (let wy = base + 3 - bh; wy < base - 1; wy += 3) {
        for (let wx = x + 2; wx < x + w - 4; wx += 4) if (rnd() < 0.45) fb.fill(wx, wy, 2, 1, "white");
      }
      x += w;
    }
    return;
  }
  const color = WEST_BAND[kind] || "violet";
  for (let x = 0; x < 280; x++) {
    const top = base - heights[x];
    fb.fill(x, top, 1, base + 1 - top, color);
  }
  // white highlights on ridge tops (snowcaps / sunlit grass)
  for (let x = 2; x < 278; x += 2) {
    const peak = heights[x] >= heights[x - 2] && heights[x] >= heights[x + 2];
    const tall = kind === "grass" ? heights[x] >= 5 : heights[x] >= 10;
    if ((peak && tall) || rnd() < (kind === "grass" ? 0.04 : 0.02)) {
      const depth = kind === "snow" ? 4 : kind === "grass" ? 1 : 2;
      fb.fill(x - 1, base - heights[x], 3, depth, "white");
    }
  }
  if (kind === "snow") {
    for (let x = 0; x < 280; x++) fb.fill(x, base - 3, 1, 4, "blue");
  }
}

function drawGround(fb, color, top, bottom) {
  if (color === "gray") {
    for (let y = top; y <= bottom; y++) {
      for (let x = 1; x < 278; x++) fb.set(x, y, ((x + (y % 2) * 2) & 3) < 2 ? 1 : 0);
    }
    return;
  }
  fb.fill(1, top, 277, bottom - top + 1, color);
}

function drawWeather(fb, weather, t, seed, lift = 0) {
  const rnd = mulberry(seed ^ 0x9e3779b9);
  const sky = 30 - lift;
  if (weather === "night") {
    for (let i = 0; i < 46; i++) {
      const x = Math.floor(rnd() * 278);
      const y = rnd() < 0.5 ? Math.floor(rnd() * (12 - lift)) : sky + 1 + Math.floor(rnd() * 14);
      const twinkle = Math.floor(t * 2 + i) % 7 !== 0;
      if (twinkle) fb.set(x, y, 1);
    }
    return;
  }
  if (weather === "clouds" || weather === "rain" || weather === "snow") {
    const clouds = weather === "clouds" ? 3 : 4;
    for (let i = 0; i < clouds; i++) {
      const base = rnd() * 300;
      const speed = 2 + rnd() * 2;
      const x = Math.round(((base + t * speed) % 320) - 30);
      const y = i % 2 || lift > 6 ? Math.max(0, 1 - lift) : sky + 2 + Math.floor(rnd() * 4);
      fb.sprite(CLOUD, x, y);
    }
  }
  if (weather === "rain") {
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(rnd() * 140) * 2;
      const phase = rnd() * 30;
      const y = sky + 6 + Math.floor((phase + t * 40) % 22);
      fb.fill(x, y, 2, 3, "blue");
    }
  }
  if (weather === "snow") {
    for (let i = 0; i < 55; i++) {
      const x0 = rnd() * 280;
      const phase = rnd() * 60;
      const y = Math.floor((phase + t * 9) % (60 - lift));
      const x = Math.floor(x0 + Math.sin(t * 1.5 + i) * 3);
      if (y < 12 - lift || y > sky) fb.fill(x, y, 2, 1, "white");
    }
  }
}

export function sceneryFor(entry) {
  const w = entry.weather.toLowerCase();
  const airport = entry.stops.some((s) => /airport|airlines/i.test(s)) && entry.day <= 1;
  const weather = /night/.test(w) ? "night" : /snow/.test(w) ? "snow" : /rain/.test(w) ? "rain" : /overcast|cloud/.test(w) ? "clouds" : "clear";
  const heavySnow = /heavy snow/.test(w);
  let band = entry.part === 2 ? "grass" : "mountains";
  let ground = entry.part === 2 ? "green" : "orange";
  let props = entry.part === 2 ? ["tree", "shield", "motel"] : ["cactus", "shield", "motel"];
  if (airport) {
    band = "city";
    ground = "gray";
    props = ["plane", "shield"];
  }
  if (heavySnow) {
    band = "snow";
    ground = "white";
    props = ["pine", "shield", "pine"];
  }
  // Part II reaches the New Mexico desert on its last two days.
  if (entry.part === 2 && entry.day >= 10) {
    band = "mountains";
    ground = "orange";
    props = ["cactus", "shield", "motel"];
  }
  if (entry.part === 1 && entry.day === 10) props = ["cactus", "plane", "shield"];
  return { band, ground, weather, props };
}

// The moving roadside: scenery band, weather, props drifting east as the car heads
// west. `lift` raises the scenery (0 is the game's own layout).
function drawRoad(fb, entry, t, { lift, groundTop, groundBottom }) {
  const scenery = sceneryFor(entry);
  const seed = hash(entry.slug);
  drawBand(fb, scenery.band, seed, lift);
  drawWeather(fb, scenery.weather, t, seed, lift);
  scenery.props.forEach((name, i) => {
    const size = spriteSize(name);
    const offset = (i * 131 + (seed % 97)) % 300;
    const span = 280 + size.w + 60;
    const x = Math.round(((offset + t * 14) % span) - size.w - 30);
    if (name === "plane") drawSprite(fb, name, x, 34 - lift + (i % 2) * 4);
    else drawSprite(fb, name, x, groundTop - size.h);
  });
  drawCar(fb, 200, groundTop, Math.floor(t * 6), entry.part === 1 ? "suv" : "sedan");
  drawGround(fb, scenery.ground, groundTop, groundBottom);
}

export function travelScene({ entry, statusLines, popupLines, onEnterLabel = "Press RETURN to size up the situation" }) {
  const colonX = 4 + measure("Next landmark:");
  const valueX = colonX + 6;
  const valueW = 274 - valueX;
  const rows = [];
  statusLines.forEach(([label, value]) => {
    wrap(value, valueW).forEach((line, i) => rows.push([i ? "" : `${label}:`, line]));
  });
  const boxH = rows.length * LINE + 5;
  const boxTop = 178 - boxH;
  const returnY = boxTop - 9;
  const groundBottom = returnY - 3;
  const popup = popupLines.flatMap((line) => wrap(line, 200));
  const popupH = popup.length * LINE + 12;
  // Lift the scenery when the message and status need more room than the game's layout.
  const lift = Math.max(0, Math.min(14, popupH + 8 - (groundBottom - 60)));
  const groundTop = 60 - lift;
  const popupY = groundTop + Math.max(3, Math.round((groundBottom - groundTop - popupH) / 2));

  return {
    id: "travel",
    label: popupLines.join(": "),
    animated: true,
    options: [],
    draw(fb, state) {
      fb.clear();
      drawRoad(fb, entry, state.t || 0, { lift, groundTop, groundBottom });
      messageBox(fb, 28, popupY, 217, popupH);
      popup.forEach((line, i) => drawText(fb, 36, popupY + 6 + i * LINE, line));
      const hoverEnter = state.hover === "enter";
      const enterText = promptText(onEnterLabel);
      const rw = measure(enterText, { tight: true });
      const rx = Math.round((280 - rw) / 2);
      if (hoverEnter) fb.fill(rx - 3, returnY - 1, rw + 6, LINE, "white");
      drawText(fb, rx, returnY, enterText, { invert: hoverEnter, tight: true });
      whiteBand(fb, boxTop, boxH, 0, 279);
      rows.forEach(([label, value], i) => {
        const y = boxTop + 3 + i * LINE;
        if (label) drawText(fb, colonX - measure(label), y, label, { invert: true });
        drawText(fb, valueX, y, value, { invert: true });
      });
      return {
        hotspots: [
          { ...lineSpot(rx, returnY, rw), option: "enter" },
          continueLine(fb, state, 184),
        ],
      };
    },
  };
}

// ---------------------------------------------------------------- story screens

export const STORY_PICTURE_H = 112;
export const STORY_TEXT_W = 260;

// A picture, the moving road, or a route map on top; the place names in a white
// caption bar; a few lines of the diary underneath.
export function storyScene({ id, label, entry, visual, captionLines, text }) {
  const barH = captionLines.length * LINE + 1;
  const textTop = STORY_PICTURE_H + barH + 4;
  const lines = wrap(text, STORY_TEXT_W);
  return {
    id,
    label,
    textChunk: text,
    captionLines,
    animated: visual.type === "event",
    cursor: visual.type === "map",
    picture: visual.type === "picture" ? { ...visual.picture, height: STORY_PICTURE_H } : undefined,
    loadEffect: visual.type === "picture",
    draw(fb, state) {
      fb.clear();
      if (visual.type === "picture" && state.picture) {
        for (let y = 0; y < STORY_PICTURE_H; y++) {
          if (state.reveal && !state.reveal(y)) continue;
          fb.copyFrom(state.picture, 0, y, 280, 1, 0, y);
        }
      } else if (visual.type === "event") {
        drawRoad(fb, entry, state.t || 0, { lift: 9, groundTop: 51, groundBottom: STORY_PICTURE_H - 1 });
      } else if (visual.type === "map") {
        drawRouteStrip(fb, { ...visual.route, blinkOn: state.cursorOn !== false, top: 0, height: STORY_PICTURE_H });
      }
      whiteBand(fb, STORY_PICTURE_H, barH);
      captionLines.forEach((line, i) => drawCentered(fb, STORY_PICTURE_H + 1 + i * LINE, line, { invert: true }));
      lines.forEach((line, i) => drawText(fb, 10, textTop + i * LINE, line));
      return { hotspots: [continueLine(fb, state, 184)] };
    },
  };
}

// ---------------------------------------------------------------- size up the situation

export function sizeUpScene({ place, date, facts, options }) {
  const factRows = facts.flatMap(([label, value]) => wrap(`${label}: ${value}`, 258));
  const boxH = factRows.length * LINE + 9;
  return {
    id: "size-up",
    label: `${place}, ${date}`,
    cursor: true,
    options,
    draw(fb, state) {
      fb.clear();
      drawCentered(fb, 0, place);
      drawCentered(fb, 9, date);
      whiteBand(fb, 21, boxH, 0, 279);
      factRows.forEach((row, i) => drawText(fb, 10, 26 + i * LINE, row, { invert: true }));
      const top = 21 + boxH + 4;
      drawText(fb, 0, top, "You may:");
      const pitch = options.length > 5 ? LINE : 11;
      const { hotspots } = menu(fb, 30, top + 17, options, { pitch, hover: typeof state.hover === "number" ? state.hover : -1 });
      prompt(fb, 0, 183, "What is your choice?", state.cursorOn);
      return { hotspots: hotspots.map((h) => ({ ...h, option: h.index })) };
    },
  };
}

// ---------------------------------------------------------------- map

export function mapScene({ entries, highlight, pressText = PRESS_SPACE }) {
  return {
    id: "map",
    label: "Map of the Route 66 Trail",
    cursor: Boolean(highlight),
    options: entries.map((entry) => ({ label: `Part ${entry.part === 1 ? "I" : "II"}, Day ${entry.day}: ${entry.title}`, href: entry.href })),
    draw(fb, state) {
      fb.clear();
      const spots = drawMap(fb, { entries, highlight, blinkOn: state.cursorOn !== false, hover: typeof state.hover === "number" ? state.hover : -1 });
      return { hotspots: [...spots, continueLine(fb, state, 183, pressText)] };
    },
  };
}

// ---------------------------------------------------------------- tombstone

export function tombstoneScene({ title, lines, epitaph }) {
  return {
    id: "tombstone",
    label: title,
    draw(fb, state) {
      fb.clear();
      drawCentered(fb, 6, title);
      // rolling green hill
      for (let x = 0; x < 280; x++) {
        const top = 150 - Math.round(10 * Math.sin((x / 280) * Math.PI));
        fb.fill(x, top, 1, 178 - top, "green");
      }
      // headstone with a rounded top
      const cx = 140;
      const w = 118;
      const top = 24;
      for (let y = top; y < 152; y++) {
        const dy = y - (top + w / 2);
        const half = y < top + w / 2 ? Math.round(Math.sqrt(Math.max(0, (w / 2) ** 2 - dy * dy))) : w / 2;
        if (half <= 0) continue;
        fb.fill(cx - half, y, half * 2, 1, "white");
      }
      // weathered shading down the right side of the stone
      for (let y = top + 30; y < 146; y++) for (let x = cx + w / 2 - 6; x < cx + w / 2; x++) if ((x + 2 * y) % 4 < 2) fb.set(x, y, 0);
      // base slab
      fb.fill(cx - w / 2 - 8, 146, w + 16, 8, "white");
      for (let x = cx - w / 2 - 8; x < cx + w / 2 + 8; x += 2) fb.set(x, 153, 0);
      lines.forEach((line, i) => drawCentered(fb, 66 + i * LINE, line, { invert: true, x0: cx - w / 2, x1: cx + w / 2 }));
      epitaph.forEach((line, i) => drawCentered(fb, 66 + (lines.length + 1) * LINE + i * LINE, line, { invert: true, x0: cx - w / 2, x1: cx + w / 2 }));
      return { hotspots: [continueLine(fb, state, 182, "Press SPACE BAR to return")] };
    },
  };
}

