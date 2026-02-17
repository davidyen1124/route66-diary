# Route 66 Diary

Astro site that tracks a Route 66 trip as dated stop entries, with a dashboard view, per-entry map rendering, and Cloudflare deployment support.

## Stack

- Astro 5
- Astro Content Collections (`src/content.config.ts`)
- `@astrojs/cloudflare` adapter
- Wrangler (Cloudflare)
- Leaflet via CDN for map rendering in entry pages

## Run locally

```bash
npm install
npm run dev
```

`npm run dev` also clears `.astro` output first.

## Build

```bash
npm run build
```

`npm run clean:astro` can be run separately if you need a manual cache reset.

## Cloudflare deployment

- `npm run build` generates the SSR worker output.
- `npm run deploy` runs build + writes `dist/.assetsignore` + `npx wrangler deploy`.

`wrangler.toml` contains the Cloudflare Worker config (`name`, `main`, compatibility date/flags, assets binding, and KV namespace bindings).

## Content model

Blog entries live in `src/content/blog/*.md` and are loaded by the `blog` collection.

Supported frontmatter fields (most important):

- `title` (required)
- `description` (required)
- `pubDate` (required; date)
- `city`, `state` (optional)
- `weather` (optional)
- `mapPointHints` (optional hints used for geocoding)
- `mapPoints` (optional array of `{ label, latitude, longitude }`)

## Routes

- `/` (in `src/pages/index.astro`) redirects to `/blog`
- `/blog` lists entries and dashboard progress
- `/blog/[slug]` renders an entry
- `/rss.xml` is generated from the `blog` collection

## Add or edit a stop

Create or update a markdown entry in `src/content/blog/`:

```md
---
title: "Day 5: ..."
description: "..."
pubDate: 2026-02-17
city: "..."
state: "..."
---

Trip notes...
```

Optional map/weather fields:

```md
weather: "Mostly clear"
mapPointHints:

- "Stop name, state"
  mapPoints:
- label: "Stop name, state"
  latitude: 35.0
  longitude: -115.0
```

If only `mapPointHints` are present, run the enrichment script below to generate `mapPoints`.

## Geocode enrichment helper

```bash
GEOAPIFY_API_KEY=your_key npm run enrich:map-points
```

The script:

- reads every `src/content/blog/*.md`
- uses each entry’s `mapPointHints` (or bold phrases in markdown body as fallback) to query Geoapify autocomplete (`filter=countrycode:us`, `limit=5`, `lang=en`)
- caches geocode lookups at `scripts/.geocode-cache.json`
- updates frontmatter `mapPoints` with de-duplicated coordinates
- leaves existing valid coordinates intact

For backward compatibility, `GEOCODE_MAPS_API_KEY` is also accepted.

## Note on map rendering

`src/layouts/BlogPost.astro` renders a Leaflet map when coordinates are available from `mapPoints`. If no points are available it shows a compact fallback message.
