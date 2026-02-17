# Route 66 Diary (Astro + Cloudflare)

Mobile-first retro blog inspired by early-2000s Microsoft Road Trip software.

This site tracks David's Route 66 diary from Santa Monica to Albuquerque using pre-geocoded `mapPoints` in each entry.

## Stack

- Astro 5
- Astro Content Collections
- `@astrojs/cloudflare` adapter
- Wrangler for Cloudflare deployment

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy to Cloudflare (Wrangler)

You said Wrangler auth is already done, so deploy is:

```bash
npx wrangler deploy
```

Or use the convenience script:

```bash
npm run deploy
```

## Project layout

- `src/pages/index.astro` — dashboard / route status
- `src/pages/blog/index.astro` — stop log list
- `src/content/blog/day-*.md` — diary entries
- `src/layouts/BlogPost.astro` — stop entry template
- `astro.config.mjs` + `wrangler.toml` — Cloudflare deployment config

## Add a new stop

Create a new Markdown file in `src/content/blog/` named like `day-02-*.md`:

```md
---
title: "Day 2: ..."
description: "..."
pubDate: 2026-02-14
city: "..."
state: "..."
locationSource: "explicit"
mapPoints:
  - label: "Exact stop name"
    latitude: 0
    longitude: 0
tags:
  - route-66
---

Trip notes here.
```

## Coordinate enrichment script

If you only have place names, add a `mapPointHints` array in post frontmatter and run:

```bash
GEOAPIFY_API_KEY=your_key_here npm run enrich:map-points
```

The script geocodes with Geoapify autocomplete (`limit=5`, `lang=en`, `filter=countrycode:us`) and picks a deterministic best match, then updates each `src/content/blog/*.md` file with de-duplicated `mapPoints` at content-prep time, so no geocoding happens during page render.

For backward compatibility, `GEOCODE_MAPS_API_KEY` is still accepted if `GEOAPIFY_API_KEY` is not set.
