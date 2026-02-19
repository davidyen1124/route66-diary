# agents.md

Agent instructions for this repository.

## Non-negotiable Content Rules

1. Every page must be very funny.
2. Every page must include a date.
3. Every page must include weather.
4. Every page must include at least one location that is geocoded.
5. Every geocoded location must be shown on the page map.

If any of these are missing, the task is incomplete.

## Required Frontmatter for Blog Entries

All `src/content/blog/*.md` entries must include:

- `title`
- `description`
- `pubDate`
- `weather`
- `mapPointHints` (or `mapPoints` with valid coordinates)

## Geocoding and Map Rules

1. If coordinates are missing, always run geocoding.
2. Use:
   - `GEOAPIFY_API_KEY=... npm run enrich:map-points` (preferred)
   - `GEOCODE_MAPS_API_KEY=... npm run enrich:map-points` (fallback)
3. Confirm `mapPoints` are present after enrichment.
4. Ensure map points render on the page map.

## Commands

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run enrich:map-points`
- `npm run deploy`

## Standard Workflow

1. Add or update blog content in `src/content/blog/*.md`.
2. Make sure writing is funny and includes date + weather.
3. Add `mapPointHints` for each location mentioned.
4. Run geocode enrichment to generate `mapPoints`.
5. Run `npm run build`.
6. Run `npm run preview` and verify map markers are visible.
7. Deploy with `npm run deploy` when ready.

## Validation Checklist

Before finalizing any content change:

- Humor requirement satisfied (page is clearly funny).
- Date present.
- Weather present.
- Location geocoded.
- Location visible on map.
- Build succeeds.
