const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "at",
  "for",
  "in",
  "of",
  "on",
  "the",
  "to",
]);

const TOKEN_ALIASES = new Map([
  ["az", "arizona"],
  ["ca", "california"],
  ["st", "saint"],
  ["ft", "fort"],
  ["mt", "mount"],
]);

function normalizeRaw(text) {
  if (typeof text !== "string") return "";
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizePlaceText(text) {
  return normalizeRaw(text);
}

export function tokenizePlaceText(text) {
  const normalized = normalizeRaw(text);
  if (!normalized) return [];
  const rawTokens = normalized.split(" ").filter(Boolean);
  const expanded = [];
  for (const token of rawTokens) {
    expanded.push(token);
    const alias = TOKEN_ALIASES.get(token);
    if (alias) expanded.push(alias);
  }
  return expanded;
}

function buildTokenSet(tokens) {
  const set = new Set();
  for (const token of tokens) {
    if (!STOPWORDS.has(token)) set.add(token);
  }
  if (set.size === 0) {
    for (const token of tokens) set.add(token);
  }
  return set;
}

function matchScore(query, label) {
  const queryNorm = normalizeRaw(query);
  const labelNorm = normalizeRaw(label);
  if (!queryNorm || !labelNorm) return 0;
  if (queryNorm === labelNorm) return 100;
  if (labelNorm.includes(queryNorm) || queryNorm.includes(labelNorm)) return 90;

  const queryTokens = tokenizePlaceText(query);
  const labelTokens = tokenizePlaceText(label);
  if (queryTokens.length === 0 || labelTokens.length === 0) return 0;

  const querySet = buildTokenSet(queryTokens);
  const labelSet = buildTokenSet(labelTokens);

  let overlap = 0;
  for (const token of querySet) {
    if (labelSet.has(token)) overlap += 1;
  }

  if (overlap === 0) return 0;

  const queryCoverage = overlap / querySet.size;
  const labelCoverage = overlap / labelSet.size;

  if (queryCoverage === 1) {
    return 80 + Math.min(9, labelCoverage * 9);
  }

  if (queryCoverage >= 0.66 && overlap >= 2) {
    return 60 + Math.min(15, queryCoverage * 20 + labelCoverage * 5);
  }

  return 0;
}

export function resolveMapPointLabel(input, labels) {
  if (!Array.isArray(labels) || labels.length === 0) return null;

  let bestLabel = null;
  let bestScore = 0;

  for (const label of labels) {
    if (typeof label !== "string" || !label.trim()) continue;
    const score = matchScore(input, label);
    if (score > bestScore) {
      bestScore = score;
      bestLabel = label;
      continue;
    }

    if (score === bestScore && bestLabel) {
      const currentLen = normalizeRaw(bestLabel).length;
      const nextLen = normalizeRaw(label).length;
      if (nextLen < currentLen) bestLabel = label;
    }
  }

  return bestScore >= 60 ? bestLabel : null;
}
