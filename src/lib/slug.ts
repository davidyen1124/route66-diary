export function slugify(input: string): string {
  const raw = (input ?? "").trim();
  if (!raw) return "";

  // Normalize and strip diacritics for stable ASCII slugs.
  const normalized = raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  // Replace '&' with 'and', drop apostrophes, then dash-separate.
  const dashed = normalized
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return dashed;
}

