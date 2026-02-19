#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import YAML from "yaml";

const BLOG_DIR = path.resolve("src/content/blog");
const CACHE_PATH = path.resolve("scripts/.geocode-cache.json");
const GEOCODE_API_KEY =
  process.env.GEOAPIFY_API_KEY || process.env.GEOCODE_MAPS_API_KEY;
const COORDINATE_OVERRIDES = {
  "san jose international airport": {
    latitude: 37.36333,
    longitude: -121.929337,
  },
  "los angeles international airport": {
    latitude: 33.942167,
    longitude: -118.421359,
  },
  "jamaica bay inn, marina del rey, california": {
    latitude: 33.982464,
    longitude: -118.457562,
  },
  "los angeles, california": { latitude: 34.053691, longitude: -118.242766 },
  "santa monica pier, california": {
    latitude: 34.008896,
    longitude: -118.4974,
  },
  "route 66 end of the trail sign, santa monica, california": {
    latitude: 34.00943,
    longitude: -118.49723,
  },
  "pasadena, california": { latitude: 34.147651, longitude: -118.144155 },
  "original mcdonald's site and museum, san bernardino, california": {
    latitude: 34.12164,
    longitude: -117.32266,
  },
  "california route 66 museum, victorville, california": {
    latitude: 34.537132,
    longitude: -117.294398,
  },
  "barstow, california": { latitude: 34.898622, longitude: -117.024431 },
  "route 66 mother road museum, barstow, california": {
    latitude: 34.905019,
    longitude: -117.025091,
  },
  "harvey house, barstow, california": {
    latitude: 34.904817,
    longitude: -117.025638,
  },
  "elmer's bottle tree ranch, oro grande, california": {
    latitude: 34.690342,
    longitude: -117.339629,
  },
  "calico ghost town, yermo, california": {
    latitude: 34.948447,
    longitude: -116.863619,
  },
  "bagdad cafe, newberry springs, california": {
    latitude: 34.819663,
    longitude: -116.643297,
  },
  "roy's motel and cafe, amboy, california": {
    latitude: 34.558812,
    longitude: -115.743576,
  },
  "needles, california": { latitude: 34.838324, longitude: -114.603872 },
  "river city pizza co, needles, california": {
    latitude: 34.848308,
    longitude: -114.616686,
  },
  "welcome to california sign, needles, california": {
    latitude: 34.84906,
    longitude: -114.61495,
  },
  "oatman, arizona": { latitude: 35.026391, longitude: -114.383569 },
  "kingman, arizona": { latitude: 35.189592, longitude: -114.0533 },
  "mr d'z route 66 diner, kingman, arizona": {
    latitude: 35.189199,
    longitude: -114.057401,
  },
};

const log = (...args) => console.log("[enrich-map-points]", ...args);

function splitFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;
  return { frontmatter: match[1], body: match[2] };
}

function parseYamlFrontmatter(frontmatter, filePath) {
  try {
    const parsed = YAML.parse(frontmatter);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    throw new Error(
      `Failed parsing frontmatter in ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}

function formatNumber(value) {
  return Number(value.toFixed(6)).toString();
}

function yamlString(value) {
  return JSON.stringify(value);
}

function mapPointBlock(points) {
  const lines = ["mapPoints:"];
  for (const point of points) {
    lines.push(`  - label: ${yamlString(point.label)}`);
    lines.push(`    latitude: ${formatNumber(point.latitude)}`);
    lines.push(`    longitude: ${formatNumber(point.longitude)}`);
  }
  return lines;
}

function replaceTopLevelBlock(frontmatter, key, replacementLines) {
  const lines = frontmatter.split("\n");
  const keyRe = new RegExp(`^${key}\\s*:`);
  const topLevelKeyRe = /^[A-Za-z0-9_-]+\s*:/;

  const output = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (keyRe.test(line)) {
      i += 1;
      while (i < lines.length && !topLevelKeyRe.test(lines[i])) i += 1;
      i -= 1;
      continue;
    }
    output.push(line);
  }

  const insertBefore = output.findIndex((line) => /^tags\s*:/.test(line));
  if (insertBefore >= 0) {
    output.splice(insertBefore, 0, ...replacementLines);
  } else {
    if (output.length > 0 && output[output.length - 1].trim() !== "")
      output.push("");
    output.push(...replacementLines);
  }

  return output
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

async function readCache() {
  try {
    const raw = await fs.readFile(CACHE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeCache(cache) {
  const json = `${JSON.stringify(cache, null, 2)}\n`;
  await fs.writeFile(CACHE_PATH, json, "utf8");
}

function normalizeForMatch(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toMapPointInput(value) {
  if (typeof value === "string") {
    const label = value.trim();
    if (!label) return null;
    return { label, latitude: null, longitude: null };
  }

  if (!value || typeof value !== "object") return null;
  if (typeof value.label !== "string") return null;
  const label = value.label.trim();
  if (!label) return null;

  const latitude = toFiniteNumber(value.latitude);
  const longitude = toFiniteNumber(value.longitude);
  return { label, latitude, longitude };
}

function collectMapPointInputs(rawMapPoints) {
  const byLabel = new Map();
  for (const value of rawMapPoints) {
    const point = toMapPointInput(value);
    if (!point) continue;

    const key = point.label.toLowerCase();
    const existing = byLabel.get(key);
    if (!existing) {
      byLabel.set(key, point);
      continue;
    }

    const existingHasCoords =
      Number.isFinite(existing.latitude) && Number.isFinite(existing.longitude);
    const pointHasCoords =
      Number.isFinite(point.latitude) && Number.isFinite(point.longitude);

    if (!existingHasCoords && pointHasCoords) {
      byLabel.set(key, point);
    }
  }
  return Array.from(byLabel.values());
}

function extractGeoapifyCandidates(payload) {
  if (!payload || typeof payload !== "object") return [];

  if (Array.isArray(payload.results)) {
    return payload.results;
  }

  if (Array.isArray(payload.features)) {
    return payload.features.map((feature) => {
      const properties =
        feature &&
        typeof feature === "object" &&
        feature.properties &&
        typeof feature.properties === "object"
          ? feature.properties
          : {};
      const coordinates = Array.isArray(feature?.geometry?.coordinates)
        ? feature.geometry.coordinates
        : [];
      return {
        ...properties,
        lon: properties.lon ?? coordinates[0],
        lat: properties.lat ?? coordinates[1],
      };
    });
  }

  return [];
}

function pickBestGeoapifyCandidate(label, candidates) {
  const normalizedLabel = normalizeForMatch(label);

  const scored = candidates
    .map((candidate) => {
      const lat = toFiniteNumber(candidate?.lat);
      const lon = toFiniteNumber(candidate?.lon);
      if (lat === null || lon === null) return null;

      const name = String(candidate?.name ?? "");
      const formatted = String(candidate?.formatted ?? "");
      const scoreText = `${name} ${formatted}`.trim();
      const normalizedText = normalizeForMatch(scoreText);
      const confidence =
        toFiniteNumber(candidate?.rank?.confidence ?? candidate?.confidence) ??
        0;

      let matchScore = 0;
      if (normalizedText === normalizedLabel) {
        matchScore = 3;
      } else if (normalizedText.startsWith(normalizedLabel)) {
        matchScore = 2;
      } else if (normalizedText.includes(normalizedLabel)) {
        matchScore = 1;
      }

      return {
        candidate,
        lat,
        lon,
        confidence,
        matchScore,
        sortText: `${formatted}|${name}`.toLowerCase(),
      };
    })
    .filter(Boolean);

  if (scored.length === 0) return null;

  scored.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    if (a.sortText !== b.sortText) return a.sortText.localeCompare(b.sortText);
    if (a.lat !== b.lat) return a.lat - b.lat;
    return a.lon - b.lon;
  });

  return scored[0];
}

async function geocodeLabel(label, cache) {
  const cacheKey = label.trim().toLowerCase();
  if (COORDINATE_OVERRIDES[cacheKey]) return COORDINATE_OVERRIDES[cacheKey];
  if (cache[cacheKey]) return cache[cacheKey];

  if (!GEOCODE_API_KEY) {
    throw new Error(
      "GEOAPIFY_API_KEY (or GEOCODE_MAPS_API_KEY) is required to geocode missing map points.",
    );
  }

  const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
  url.searchParams.set("text", label);
  url.searchParams.set("apiKey", GEOCODE_API_KEY);
  url.searchParams.set("limit", "5");
  url.searchParams.set("lang", "en");
  url.searchParams.set("filter", "countrycode:us");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Geoapify request failed (${response.status}) for "${label}"`,
    );
  }

  const payload = await response.json();
  const candidates = extractGeoapifyCandidates(payload);
  const best = pickBestGeoapifyCandidate(label, candidates);
  if (!best) {
    throw new Error(`No geocode result for "${label}"`);
  }

  const resolved = {
    latitude: best.lat,
    longitude: best.lon,
  };

  if (
    !Number.isFinite(resolved.latitude) ||
    !Number.isFinite(resolved.longitude)
  ) {
    throw new Error(`Invalid coordinates returned for "${label}"`);
  }

  cache[cacheKey] = resolved;
  return resolved;
}

function dedupeResolvedPoints(points) {
  const seen = new Set();
  const out = [];
  for (const point of points) {
    const key = `${point.label.toLowerCase()}|${point.latitude.toFixed(6)}|${point.longitude.toFixed(6)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(point);
  }
  return out;
}

async function processFile(filePath, cache) {
  const raw = await fs.readFile(filePath, "utf8");
  const split = splitFrontmatter(raw);
  if (!split) {
    log(`skip ${path.basename(filePath)}: missing frontmatter`);
    return false;
  }

  const data = parseYamlFrontmatter(split.frontmatter, filePath);
  const rawMapPoints = Array.isArray(data.mapPoints) ? data.mapPoints : [];
  const pointInputs = collectMapPointInputs(rawMapPoints);

  if (pointInputs.length === 0) {
    log(`skip ${path.basename(filePath)}: no mapPoints labels`);
    return false;
  }

  const resolvedPoints = [];
  for (const point of pointInputs) {
    if (
      Number.isFinite(point.latitude) &&
      Number.isFinite(point.longitude)
    ) {
      resolvedPoints.push({
        label: point.label,
        latitude: point.latitude,
        longitude: point.longitude,
      });
      continue;
    }

    const coords = await geocodeLabel(point.label, cache);
    resolvedPoints.push({
      label: point.label,
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
  }

  const dedupedPoints = dedupeResolvedPoints(resolvedPoints);
  const newMapPointsBlock = mapPointBlock(dedupedPoints);
  const updatedFrontmatter = replaceTopLevelBlock(
    split.frontmatter,
    "mapPoints",
    newMapPointsBlock,
  );
  const next = `---\n${updatedFrontmatter}\n---\n${split.body}`;

  if (next === raw) {
    log(`unchanged ${path.basename(filePath)}`);
    return false;
  }

  await fs.writeFile(filePath, next, "utf8");
  log(`updated ${path.basename(filePath)} (${dedupedPoints.length} points)`);
  return true;
}

async function main() {
  const entries = await fs.readdir(BLOG_DIR);
  const files = entries
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => path.join(BLOG_DIR, name));

  const cache = await readCache();
  let changedCount = 0;

  for (const filePath of files) {
    const changed = await processFile(filePath, cache);
    if (changed) changedCount += 1;
  }

  await writeCache(cache);
  log(`done. files changed: ${changedCount}`);
}

main().catch((error) => {
  console.error(
    "[enrich-map-points]",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
