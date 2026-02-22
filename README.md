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
- Optional Cloudflare Web Analytics:
  - In Cloudflare dashboard, open your site and go to `Analytics & Logs` -> `Web Analytics` and copy the beacon token.
  - Set `PUBLIC_CF_BEACON_TOKEN` in your build/deploy environment (for example as a CI/CD env var) so Astro can inject the beacon script site-wide.

`wrangler.toml` contains the Cloudflare Worker config (`name`, `main`, compatibility date/flags, assets binding, and KV namespace bindings).

## Content model

Blog entries live in `src/content/blog/*.md` and are loaded by the `blog` collection.

Supported frontmatter fields (most important):

- `title` (required)
- `description` (required)
- `pubDate` (required; date)
- `city`, `state` (optional)
- `weather` (optional)
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
mapPoints:
  - label: "Stop name, state"
    latitude: 35.0
    longitude: -115.0
```

Map points are expected to include coordinates in frontmatter (this project doesn’t ship a geocode/enrichment step in the build).

## Note on map rendering

`src/layouts/BlogPost.astro` renders a Leaflet map when coordinates are available from `mapPoints`. If no points are available it shows a compact fallback message.
