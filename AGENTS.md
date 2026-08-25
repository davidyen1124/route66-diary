# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Route 66 diary design decisions

- This is a mobile-first responsive travel blog, not a dense dashboard.
- Preserve the playful Oregon Trail / early DOS identity with a near-black, amber, and restrained phosphor-green palette.
- Keep the masthead quiet: `ROUTE 66` on one line and the smaller `TRAIL JOURNAL` beneath it.
- Keep a visible mobile gap between the chapter route title and its cover image; the text must never sit directly against the artwork.
- Part I and Part II are separate chapters; Part II restarts at Day 1.
- Preserve all ten Part I entries verbatim and use the same entry anatomy for Part II: day/title, date, destination, weather, conversational paragraphs, and trail stops.
- All custom illustrations must be raster assets generated with Imagegen. Do not add handcrafted SVG or CSS art.
- Every Part I and Part II day article uses its own 16:9 Imagegen itinerary illustration in the same detailed early-DOS pixel-art world; vary the landmarks, weather, and light while keeping the recurring cream road-trip sedan and shared palette coherent.
- The approved visual reference is `/workspace/scratch/cab2bd574928/generated_images/exec-30bf7753-555a-4423-b379-e721284b3275.png`.
- The approved article-screen reference is `/workspace/scratch/cab2bd574928/generated_images/exec-a67cb2e5-da55-4059-93d6-fb6b8f87df24.png` (the third displayed mockup).
- Article writing is grouped into a vertical trail timeline so each location or event reads as one scannable section. Preserve every paragraph and every trail stop when grouping.
- Article headers show the compact journal masthead followed directly by `PART I/II · DAY N`; do not place an `ALL DAYS` link between them. Keep return navigation at the article bottom and through the `B` keyboard shortcut.
- Social previews use the exact title `Route 66 Trail Journal`, the two-journey description, and a dedicated ImageGen pixel-art card at `public/og.png`; keep Open Graph and X metadata aligned.
