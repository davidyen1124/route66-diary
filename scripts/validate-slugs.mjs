#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { resolveMapPointLabel } from "../src/lib/mapPointMatcher.js";

const BLOG_DIR = path.resolve("src/content/blog");
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function splitFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return null;
  return { frontmatter: match[1], body: markdown.slice(match[0].length) };
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

function extractBoldSegments(markdownBody) {
  if (typeof markdownBody !== "string" || markdownBody.length === 0) return [];

  let body = markdownBody;
  body = body.replace(/```[\s\S]*?```/g, " ");
  body = body.replace(/`[^`]*`/g, " ");

  const segments = [];
  const pattern = /(\*\*|__)(?=\S)([\s\S]*?\S)\1/g;
  let match;
  while ((match = pattern.exec(body)) !== null) {
    const text = match[2].replace(/\s+/g, " ").trim();
    if (text) segments.push(text);
  }
  return segments;
}

function getMapPointLabels(frontmatter) {
  if (!frontmatter || typeof frontmatter !== "object") return [];
  if (!Array.isArray(frontmatter.mapPoints)) return [];
  return frontmatter.mapPoints
    .map((point) => (point && typeof point.label === "string" ? point.label.trim() : ""))
    .filter(Boolean);
}

async function main() {
  const files = (await fs.readdir(BLOG_DIR))
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .sort();

  const missing = [];
  const invalid = [];
  const duplicates = new Map(); // slug -> [files]
  const unmatchedBold = [];

  for (const name of files) {
    const filePath = path.join(BLOG_DIR, name);
    const markdown = await fs.readFile(filePath, "utf8");
    const parts = splitFrontmatter(markdown);
    if (!parts) {
      missing.push({ file: name, reason: "no frontmatter block found" });
      continue;
    }

    const fm = parseYamlFrontmatter(parts.frontmatter, filePath);
    const slug = typeof fm.slug === "string" ? fm.slug.trim() : "";
    const mapLabels = getMapPointLabels(fm);
    const boldSegments = extractBoldSegments(parts.body);

    for (const segment of boldSegments) {
      const match = resolveMapPointLabel(segment, mapLabels);
      if (!match) unmatchedBold.push({ file: name, bold: segment, labels: mapLabels });
    }

    if (!slug) {
      missing.push({ file: name, reason: "frontmatter slug missing/blank" });
      continue;
    }

    if (!SLUG_RE.test(slug)) {
      invalid.push({ file: name, slug, reason: "must be URL-safe kebab-case" });
      continue;
    }

    const list = duplicates.get(slug) ?? [];
    list.push(name);
    duplicates.set(slug, list);
  }

  const dupLines = [...duplicates.entries()]
    .filter(([, names]) => names.length > 1)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([slug, names]) => `- ${slug}: ${names.join(", ")}`);

  const problems = [];
  if (missing.length) {
    problems.push(
      `Missing required frontmatter slug:\n${missing.map((x) => `- ${x.file} (${x.reason})`).join("\n")}`,
    );
  }
  if (invalid.length) {
    problems.push(
      `Invalid frontmatter slug:\n${invalid.map((x) => `- ${x.file}: \"${x.slug}\" (${x.reason})`).join("\n")}`,
    );
  }
  if (dupLines.length) {
    problems.push(`Duplicate slugs are not allowed:\n${dupLines.join("\n")}`);
  }
  if (unmatchedBold.length) {
    problems.push(
      `Bold text must resolve to a map marker label:\n${unmatchedBold
        .map((item) => `- ${item.file}: "${item.bold}"\n  mapPoints: ${item.labels.length ? item.labels.join(" | ") : "(none)"}`)
        .join("\n")}`,
    );
  }

  if (problems.length) {
    console.error(`[validate-slugs] Blog slug validation failed:\n\n${problems.join("\n\n")}\n`);
    process.exit(1);
  }

  console.log(`[validate-slugs] OK (${files.length} entries).`);
}

main().catch((error) => {
  console.error(`[validate-slugs] Failed:`, error);
  process.exit(1);
});
