# Apple II Oregon Trail design QA

## Reference captures

- Wikimedia Commons, [Screenshots of The Oregon Trail (1985)](https://commons.wikimedia.org/wiki/Category:Screenshots_of_The_Oregon_Trail_(1985)): 11 native 280x192 captures. These cover the MECC splash, main menu, trail guide text, the choice of occupation and departure month, size-up menu, talk-to-people, river crossing, fort store, and the Top Ten.
- R. Philip Bouchard (the game's designer), [The Oregon Trail](https://www.philipbouchard.com/oregon-trail.html): about 50 more 2x captures. These cover the travel screen, approaching and arriving at landmarks, event message boxes, supplies, the map, arrival in Oregon, points and rating, rivers, hunting, rafting, and the store.

## Measurements taken from the captures

- **Font:** proportional; 7 rows plus 1 descender row; strokes 2 pixels wide; 2 blank columns between glyphs (1 for the condensed RETURN prompt); space is 8 pixels; digits sit in 6-pixel cells.
- **Big title face:** 20 rows tall plus a 4-row descender, with 3-pixel glyph gaps.
- **Text layout:** line pitch 9; body text x=20 and about 240 pixels wide; "Press SPACE BAR to continue" centered at y=184.
- **Dividers:** 14 rows tall, blue.
- **Travel screen:**
  - Scenery band: rows 13–29.
  - Ground block: from row 60.
  - RETURN prompt: y=112.
  - White status box: rows 121–177, with labels right-aligned on the colon.
- **Landmark screen:** picture on rows 0–159, white caption bar on rows 160–179, prompt at y=182.
- **Message box:** 1-pixel black margin, 3-pixel white border with 2-step rounded corners, and text inset 8 by 6.

## Verification

- **Engine fidelity:** re-rendering the main-menu text and title with the engine and diffing against the native capture gave 0 differing pixels out of 45,920 compared. The ornament rows were excluded because the divider is an original design in the same style.
- **Content:** a script rebuilds every article's on-screen text and compares it to `src/data.js`. All paragraphs, summaries, and trail stops are present for all 14 days.
- **Viewports:** checked in the browser at 1440x900@2x (monitor mode, scale 4.5), 390x844@3x, and 375x812@2x (strip mode). No horizontal overflow at any of them.
- **Flows:** splash to main menu to part to day list to article, using SPACE, RETURN, number keys, B, clicks, and taps. Also the map deep link with a blinking stop, the About pages, and the tombstone 404.
- **Build:** `npm run build` and `npm run test:sites` pass.

## Revision: picture screens and generated art

- **Artwork:** 76 pictures generated with the Codex `imagegen` skill (built-in `image_gen`, six parallel `codex exec` sessions): 16 landmark and chapter pictures restyled from the originals, and 60 story pictures. They were reviewed on contact sheets. One landmark was regenerated after the model added a dinosaur skeleton.
- **Conversion:** palette-native art converts to hi-res with no tone lift (diffusion 0.45). Compared with converting the original full-color illustrations, the silhouettes stay clean and the dither noise disappears.
- **Content:** `chunkText` output was checked for every paragraph at 5 and 6 lines. There are no lost words, no overflow, and no single-line screens. The article checker confirms every paragraph, summary, and trail stop appears on screen for all 14 days (112 story screens).
- **Cars:** Part I days show the Kia Sportage (SUV sprite and art); Part II days show the Elantra (sedan sprite and art).

## Revision: one screen at a time

- **Behavior:** pages no longer scroll. Only the current screen is mounted, and the document height equals the viewport on desktop (1440x900) and phones (390x844 with touch).
- **Tested flows:**
  - SPACE, arrows, RETURN to size up, number choices, and B/Esc.
  - Clicking or tapping a screen continues; choices are picked directly; menus ignore taps outside their choices.
  - The mouse wheel and swipes in every direction leave the screen unchanged, and the page never scrolls.
  - The browser Back button returns to the previous screen.
  - The URL hash follows the screen, so `#saved` and `#size-up` deep links land correctly.
