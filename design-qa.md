# Route 66 article-screen design QA

## Comparison target

- Source visual truth: `/workspace/scratch/cab2bd574928/generated_images/exec-a67cb2e5-da55-4059-93d6-fb6b8f87df24.png`, the third displayed article mockup selected by the user.
- Source pixels: `853 × 1844`, normalized to `390 × 844` at density `1`.
- Browser-rendered implementation: `/workspace/scratch/cab2bd574928/route66-article-mobile-current.jpg`.
- Implementation pixels and CSS viewport: `390 × 844` at device pixel ratio `1`.
- State: Part II, Day 1 article, top of page.
- Same-view composite evidence: `/workspace/scratch/cab2bd574928/route66-article-comparison.png` (`780 × 844`, source on the left and implementation on the right).

## Findings

No actionable P0, P1, or P2 differences remain.

The implementation keeps the mock's compact green journal masthead, amber two-line title, green metadata, full-width 16:9 airport art, caption rule, numbered green trail, amber event names, and light monospaced story copy. The full event names wrap more than the abbreviated labels in the mock; this is intentional because the user's goal is to make each real location or event easier to identify and read.

## Comparison history

### Pass 1 — passed

- The source and browser capture were normalized to the same `390 × 844` viewport and placed in one comparison image.
- No visual fixes were made after this comparison because no P0/P1/P2 mismatch was found.
- The implementation contains longer authentic article copy than the mock's abbreviated sample, so fewer event groups fit above the fold. This is an intentional content-preservation constraint rather than density drift.

## Required fidelity surfaces

- **Fonts and typography:** Press Start 2P carries the DOS masthead, labels, title, markers, and event headings. IBM Plex Mono keeps the preserved long-form paragraphs legible at approximately `16px` with a `1.82` line height. Wrapping is clean and no heading or metadata is clipped.
- **Spacing and layout rhythm:** the compact header, title block, 16:9 image, caption, and timeline follow the source hierarchy. The timeline uses a consistent `50px` marker column and `22px` content gap on mobile. The browser reported `clientWidth: 390` and `scrollWidth: 390`, so there is no horizontal overflow.
- **Colors and visual tokens:** the implementation reuses the approved near-black, amber, phosphor-green, cream, and muted-green tokens. There are no gradients, shadows, or rounded article cards.
- **Image quality and asset fidelity:** the original ImageGen airport artwork is used directly, with the same cinematic crop and no placeholder, SVG, CSS-art, or watermark substitute.
- **Copy and content:** all original paragraphs and every trail stop are preserved. They are distributed into consecutive event groups so no migrated writing or stop disappears. Day 2 exposes all nine stops in five readable groups, and the tested Part I Day 5 exposes all eight stops and all five original paragraphs.

## Focused comparison evidence

A separate crop was unnecessary because the normalized composite keeps the masthead, title, metadata, image, caption, first marker, event heading, and paragraph typography readable at their target CSS size. Those are the detailed fidelity surfaces for this screen.

## Interaction and responsiveness

- Tested `ALL DAYS` back navigation and the `B` keyboard shortcut.
- Tested Part I / Part II switching after returning from an article.
- Tested opening Part II Day 2 and verified five groups include every stop through Hampton Inn Pontiac.
- Tested migrated Part I Day 5 and verified all original paragraphs and stops remain present.
- Long event headings wrap without horizontal overflow at `390 × 844`.
- Browser logs contain no application errors. The only observed errors are unrelated cloud-browser extension metadata messages.

## Follow-up polish

- **P3:** the mock includes a decorative back arrow; the implementation keeps the `ALL DAYS` label text-only to respect the project's no-SVG asset direction.
- **P3:** authentic full-length paragraphs make the page longer than the abbreviated concept, which is preferable for this diary.

## Homepage spacing follow-up

- User reference: `/workspace/scratch/cab2bd574928/upload/9647A7DD-C5BE-41C6-8AC9-EFF7C1097AC5.jpeg`.
- Browser-rendered implementation: `/workspace/scratch/cab2bd574928/route66-home-gap-mobile.jpg`, captured at `390 × 844` CSS pixels and density `1`.
- Focused same-view comparison: `/workspace/scratch/cab2bd574928/route66-gap-comparison.png`, reference on the left and corrected implementation on the right.
- Fix: added an `18px` mobile margin between the chapter route title and cover image. The desktop breakpoint retains its existing `30px` gap.
- Evidence: the browser measured an exact `18px` title-to-image gap, `clientWidth: 390`, and `scrollWidth: 390`. No neighboring homepage spacing, typography, artwork, or list layout changed.
- Result: no P0/P1/P2 findings remain for the requested spacing correction.

## Article-header follow-up

- User reference: `/workspace/scratch/cab2bd574928/upload/6077216A-C9EE-45EB-B561-D3768589A5BD.jpeg`.
- Browser-rendered implementation: `/workspace/scratch/cab2bd574928/route66-day3-no-all-days.jpg`, captured at `390 × 844` CSS pixels and density `1`.
- Fix: removed the top `ALL DAYS` link so `PART II · DAY 3` follows the compact journal masthead directly. Bottom return navigation and the `B` keyboard shortcut remain available.
- Evidence: the browser-rendered header sequence is `ROUTE 66 · TRAIL JOURNAL`, then `PART II · DAY 3`, then the article title. The page reports `clientWidth: 390` and `scrollWidth: 390`.
- Result: no P0/P1/P2 findings remain for the requested header simplification.

## Final result

**final result: passed**

---

# Part I itinerary-art extension QA

## Comparison target

- Source visual truth: `/workspace/scratch/cab2bd574928/route66-diary-site/public/assets/part2/day3-pontiac-springfield.png`, an approved Part II itinerary illustration at `1672 × 941` pixels.
- New implementation asset: `/workspace/scratch/cab2bd574928/route66-diary-site/public/assets/part1/day4-oatman-kingman.webp`, generated at `1672 × 941` pixels and delivered as mobile-optimized WebP.
- Same-input full-view comparison: `/workspace/scratch/cab2bd574928/route66-part2-part1-style-comparison.jpg`, `1672 × 471` pixels, with the approved Part II image on the left and the new Part I image on the right.
- Browser-rendered implementation: `/workspace/scratch/cab2bd574928/route66-part1-day4-mobile.jpg`.
- Implementation pixels and CSS viewport: `390 × 844` at device pixel ratio `1`.
- State: Part I, Day 4 article, top of page with the new Oatman illustration and first timeline group visible.

## Findings

No actionable P0, P1, or P2 differences remain. The new Part I scene carries forward the approved dense pixel texture, cream road-trip sedan, natural cinematic perspective, dark asphalt, amber practical light, and restrained green accents. Its colder, darker balance is intentional evidence of Day 4's moderate rain rather than palette drift.

## Comparison history

### Pass 1 — passed

- All ten assets were generated as distinct `1672 × 941` ImageGen scenes, visually inspected, and checked against their day-specific route, stops, and weather.
- The approved Part II source and representative Part I implementation were normalized into a single equal-height visual comparison.
- No visual fixes were made after the comparison because no P0/P1/P2 mismatch was found.

## Required fidelity surfaces

- **Fonts and typography:** unchanged. The article continues using the approved Press Start 2P hierarchy and IBM Plex Mono story copy; the new image caption follows the same green label treatment.
- **Spacing and layout rhythm:** unchanged. The new image renders at `350 × 196.875` CSS pixels inside the `390px` mobile viewport, preserving the article's full-width 16:9 slot and vertical rhythm.
- **Colors and visual tokens:** the new artwork maintains the Part II dark navy/charcoal, amber, cream, and restrained phosphor-green world while varying light naturally by day and weather.
- **Image quality and asset fidelity:** all ten Part I days now use original ImageGen raster itinerary illustrations. Every production asset is `1672 × 941`; WebP delivery reduces the ten-image payload to approximately `2.4 MB` without visible pixel-art degradation. No SVG, CSS-art, placeholder, or remote legacy postcard remains.
- **Copy and content:** article titles, dates, weather, body paragraphs, and stops are unchanged. New alt text and captions describe each day's specific itinerary artwork.

## Focused comparison evidence

A separate crop was not needed. At equal height, the full-view image comparison keeps pixel edges, car proportions, road perspective, palette, weather treatment, and landmark density legible. The browser capture separately verifies that the article crop, caption, and first timeline group remain readable in the mobile layout.

## Interaction and responsiveness

- Flow under test: Part I Day 4 article loads → new itinerary art renders → press `B` → Part I saved-games list returns.
- Browser verified the new image loaded at natural size `1672 × 941`, rendered at `350 × 196.875`, and used the local Part I WebP source.
- Browser reported `clientWidth: 390` and `scrollWidth: 390`, with no horizontal overflow.
- The `B` shortcut returned to `/blog/?part=1`; `PART I` remained active and Day 10 was visible in the saved-games list.
- No application errors were observed. Logged extension metadata and unrelated authentication-page warnings were excluded as browser-environment noise.

## Final result

**final result: passed**
