import type { CollectionEntry } from "astro:content";
import { slugify } from "./slug";

type BlogEntry = CollectionEntry<"blog">;

type SlugPayload = { canonical: string; entry: BlogEntry };

export class BlogSlugError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlogSlugError";
  }
}

function isExplicitFrontmatterSlug(entry: BlogEntry): boolean {
  // Astro uses frontmatter `slug` to override entry.slug.
  // When not set, entry.slug defaults to entry.id (derived from filename).
  return entry.slug !== entry.id;
}

/**
 * Build a deterministic index of blog entries keyed by canonical slug.
 *
 * We intentionally do NOT keep legacy slug/id aliases. If a slug changes,
 * old links should 404 (per user preference).
 */
export function buildBlogSlugIndex(entries: BlogEntry[]): {
  byId: Map<string, SlugPayload>;
  bySlug: Map<string, SlugPayload>;
} {
  const ordered = [...entries].sort((a, b) => a.id.localeCompare(b.id));

  const missing: string[] = [];
  const invalid: Array<{ id: string; provided: string; normalized: string; reason: string }> = [];
  const duplicates = new Map<string, string[]>(); // canonical -> [ids]

  const byId = new Map<string, SlugPayload>();
  const bySlug = new Map<string, SlugPayload>();
  const seen = new Map<string, string>(); // canonical -> id

  for (const entry of ordered) {
    const provided = String(entry.slug ?? "").trim();
    if (!provided || !isExplicitFrontmatterSlug(entry)) {
      missing.push(entry.id);
      continue;
    }

    const normalized = slugify(provided);
    if (!normalized || normalized !== provided) {
      invalid.push({
        id: entry.id,
        provided,
        normalized,
        reason: "slug must already be URL-safe kebab-case",
      });
      continue;
    }

    const prior = seen.get(provided);
    if (prior) {
      const ids = duplicates.get(provided) ?? [prior];
      ids.push(entry.id);
      duplicates.set(provided, ids);
      continue;
    }

    seen.set(provided, entry.id);

    const payload: SlugPayload = { canonical: provided, entry };
    byId.set(entry.id, payload);
    bySlug.set(provided, payload);
  }

  const problems: string[] = [];
  if (missing.length) {
    problems.push(
      `Missing required frontmatter slug (must be explicitly set, not derived from filename):\n- ${missing
        .sort()
        .join("\n- ")}`,
    );
  }
  if (invalid.length) {
    problems.push(
      `Invalid frontmatter slug (must already be URL-safe kebab-case; suggested shown):\n` +
        invalid
          .sort((a, b) => a.id.localeCompare(b.id))
          .map((x) => `- ${x.id}: "${x.provided}" (${x.reason}; suggest "${x.normalized}")`)
          .join("\n"),
    );
  }
  if (duplicates.size) {
    const lines = [...duplicates.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([slug, ids]) => `- "${slug}": ${ids.sort().join(", ")}`)
      .join("\n");
    problems.push(`Duplicate slugs are not allowed:\n${lines}`);
  }

  if (problems.length) {
    throw new BlogSlugError(`Blog slug validation failed:\n\n${problems.join("\n\n")}\n`);
  }

  return { byId, bySlug };
}

export function blogEntryUrl(entry: BlogEntry, index: ReturnType<typeof buildBlogSlugIndex>): string {
  const resolved = index.byId.get(entry.id);
  if (!resolved) throw new BlogSlugError(`No slug index entry found for blog id "${entry.id}".`);
  return `/blog/${resolved.canonical}/`;
}
