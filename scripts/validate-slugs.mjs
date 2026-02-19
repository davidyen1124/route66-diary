#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import YAML from "yaml";

const BLOG_DIR = path.resolve("src/content/blog");
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function splitFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return null;
  return { frontmatter: match[1] };
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

async function main() {
  const files = (await fs.readdir(BLOG_DIR))
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .sort();

  const missing = [];
  const invalid = [];
  const duplicates = new Map(); // slug/alias -> [files]

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
    if (!slug) {
      missing.push({ file: name, reason: "frontmatter slug missing/blank" });
      continue;
    }
    if (!SLUG_RE.test(slug)) {
      invalid.push({ file: name, slug, reason: "must be URL-safe kebab-case" });
      continue;
    }

    const aliasesRaw = fm.slugAliases;
    const aliases = Array.isArray(aliasesRaw)
      ? aliasesRaw.map((x) => String(x ?? "").trim()).filter(Boolean)
      : [];

    for (const a of aliases) {
      if (!SLUG_RE.test(a)) {
        invalid.push({ file: name, slug: a, reason: "slugAliases must be URL-safe kebab-case" });
      }
    }

    const register = (value) => {
      const v = String(value ?? "").trim();
      if (!v) return;
      const list = duplicates.get(v) ?? [];
      list.push(name);
      duplicates.set(v, list);
    };

    register(slug);
    for (const a of aliases) register(a);
  }

  const dupLines = [...duplicates.entries()]
    .filter(([, names]) => names.length > 1)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([slug, names]) => `- ${slug}: ${names.join(", ")}`);

  const problems = [];
  if (missing.length) {
    problems.push(
      `Missing required frontmatter slug:\n${missing
        .map((x) => `- ${x.file} (${x.reason})`)
        .join("\n")}`,
    );
  }
  if (invalid.length) {
    problems.push(
      `Invalid frontmatter slug:\n${invalid
        .map((x) => `- ${x.file}: "${x.slug}" (${x.reason})`)
        .join("\n")}`,
    );
  }
  if (dupLines.length) {
    problems.push(`Duplicate slugs are not allowed:\n${dupLines.join("\n")}`);
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

