import { BIG, SMALL } from "./fontData.js";

export const LINE = 9; // the game's text line pitch
const GAP = 2; // blank columns after every small glyph
const SPACE = 8;
const BIG_GAP = 3;
const BIG_SPACE = 8;

// Map typographic characters in the diary onto the game's character set.
const REPLACE = [
  [/[‘’ʼ]/g, "'"],
  [/[“”]/g, '"'],
  [/—/g, "--"],
  [/[–‑‐]/g, "-"],
  [/…/g, "..."],
  [/金龍/g, "Jin Long"],
  [/ /g, " "],
];

export function normalize(text) {
  // accented letters lose their accents (façade, giclée, décor)
  let out = String(text).normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const [re, to] of REPLACE) out = out.replace(re, to);
  return out;
}

function glyph(ch) {
  return SMALL[ch] || SMALL["?"];
}

// `tight` is the condensed setting the game uses for its longest prompt line
// ("Press RETURN to size up the situation"): one blank column between glyphs.
export function measure(text, { tight = false } = {}) {
  const s = normalize(text);
  const gap = tight ? GAP - 1 : GAP;
  let w = 0;
  for (const ch of s) w += ch === " " ? SPACE - (tight ? 1 : 0) : glyph(ch)[0] + gap;
  return Math.max(0, w - (s.length && s[s.length - 1] !== " " ? gap : 0));
}

// Draw small text; returns the pen position after the last glyph.
export function drawText(fb, x, y, text, { invert = false, tight = false } = {}) {
  const gap = tight ? GAP - 1 : GAP;
  let pen = Math.round(x);
  for (const ch of normalize(text)) {
    if (ch === " ") {
      pen += SPACE - (tight ? 1 : 0);
      continue;
    }
    const g = glyph(ch);
    fb.blitBits(g.slice(1), g[0], pen, y, { invert });
    pen += g[0] + gap;
  }
  return pen;
}

export function drawCentered(fb, y, text, opts = {}) {
  const { x0 = 0, x1 = fb.w } = opts;
  const w = measure(text);
  const x = Math.round(x0 + (x1 - x0 - w) / 2);
  drawText(fb, x, y, text, opts);
  return { x, w };
}

// Greedy word wrap in pixels. Long words are split so nothing overflows.
export function wrap(text, maxWidth) {
  const words = normalize(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (let word of words) {
    while (measure(word) > maxWidth) {
      let cut = word.length - 1;
      while (cut > 1 && measure(word.slice(0, cut)) > maxWidth) cut--;
      if (line) {
        lines.push(line);
        line = "";
      }
      lines.push(word.slice(0, cut));
      word = word.slice(cut);
    }
    const candidate = line ? `${line} ${word}` : word;
    if (measure(candidate) <= maxWidth) line = candidate;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function measureBig(text) {
  let w = 0;
  for (const ch of text) w += (ch === " " ? BIG_SPACE : (BIG[ch] || BIG.o)[0]) + BIG_GAP;
  return Math.max(0, w - BIG_GAP);
}

export function drawBig(fb, x, y, text, { invert = false } = {}) {
  let pen = Math.round(x);
  for (const ch of text) {
    if (ch === " ") {
      pen += BIG_SPACE + BIG_GAP;
      continue;
    }
    const g = BIG[ch] || BIG.o;
    fb.blitBits(g.slice(1), g[0], pen, y, { invert });
    pen += g[0] + BIG_GAP;
  }
  return pen;
}

export function drawBigCentered(fb, y, text, opts) {
  const w = measureBig(text);
  const x = Math.round((fb.w - w) / 2);
  drawBig(fb, x, y, text, opts);
  return { x, w };
}

export const CURSOR = "▒";

// Wrap into the same number of lines as a greedy wrap, but as evenly as possible,
// so centered headings never end on a lonely word.
export function wrapBalanced(text, maxWidth) {
  const lines = wrap(text, maxWidth);
  if (lines.length < 2) return lines;
  let lo = 24;
  let hi = maxWidth;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (wrap(text, mid).length <= lines.length) hi = mid;
    else lo = mid + 1;
  }
  return wrap(text, lo);
}

// Break a caption at its " · " separators first, then inside segments if needed.
export function wrapSegments(text, maxWidth, sep = " · ") {
  if (measure(text) <= maxWidth) return [normalize(text)];
  const lines = [];
  for (const segment of normalize(text).split(sep)) {
    const last = lines[lines.length - 1];
    if (last !== undefined && measure(`${last}${sep}${segment}`) <= maxWidth) lines[lines.length - 1] = `${last}${sep}${segment}`;
    else lines.push(...wrapBalanced(segment, maxWidth));
  }
  return lines;
}

// Split a paragraph into screen-sized pieces of at most maxLines wrapped lines, using
// the fewest screens and keeping them evenly filled. Breaks fall between sentences when
// possible; a sentence too long for one screen is cut at a word, preferring a comma,
// dash, colon or semicolon. Every word appears exactly once and in order.
export function chunkText(text, width, maxLines) {
  const lines = (s) => wrap(s, width).length;
  const sentences = [];
  for (const part of normalize(text).trim().split(/(?<=[.!?]["')]*)\s+(?=["'(A-Z0-9])/)) {
    const last = sentences[sentences.length - 1];
    if (last !== undefined && /\b(St|Mr|Mrs|Dr|Mt)\.$/.test(last)) sentences[sentences.length - 1] = `${last} ${part}`;
    else sentences.push(part);
  }
  // Units are whole sentences, or balanced pieces of sentences that cannot fit.
  const units = [];
  for (const sentence of sentences) {
    if (lines(sentence) <= maxLines) {
      units.push(sentence);
      continue;
    }
    units.push(...balance(sentence.split(" "), (words) => lines(words.join(" ")), maxLines, (w) => /[,;:]$|--$/.test(w)).map((w) => w.join(" ")));
  }
  return balance(units, (group) => lines(group.join(" ")), maxLines).map((group) => group.join(" "));
}

// Partition items into the fewest consecutive groups whose size(group) <= max, then
// prefer evenly filled groups (and, optionally, groups that end at a preferred item).
function balance(items, size, max, preferredEnd) {
  const n = items.length;
  const best = new Array(n + 1).fill(null);
  best[0] = { groups: 0, cost: 0, from: -1 };
  for (let end = 1; end <= n; end++) {
    for (let start = end - 1; start >= 0; start--) {
      if (!best[start]) continue;
      const s = size(items.slice(start, end));
      if (s > max) {
        if (end - start > 1) break;
      }
      const slack = max - Math.min(s, max);
      const bonus = preferredEnd && end < n && s >= 2 && preferredEnd(items[end - 1]) ? -12 : 0;
      const lonely = s < 2 && n > 1 ? 40 : 0; // a single line alone on a screen reads like a stray
      const candidate = { groups: best[start].groups + 1, cost: best[start].cost + slack * slack + bonus + lonely, from: start };
      const current = best[end];
      if (!current || candidate.groups < current.groups || (candidate.groups === current.groups && candidate.cost < current.cost)) best[end] = candidate;
    }
  }
  const groups = [];
  for (let end = n; end > 0; end = best[end].from) groups.unshift(items.slice(best[end].from, end));
  return groups;
}
