# Route 66 Diary (Astro + Cloudflare)

Mobile-first retro blog inspired by early-2000s Microsoft Road Trip software.

This site tracks David's Route 66 diary from Santa Monica to Albuquerque.
The first stop is already logged with coordinates:

- **33.982459, -118.457771** (near Santa Monica)

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
latitude: 0.000000
longitude: 0.000000
tags:
  - route-66
---

Trip notes here.
```
