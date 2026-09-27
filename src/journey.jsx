// Turns the diary content into sequences of Apple II screens, one list per route.
import { chapters, getEntriesForPart } from "./data.js";
import {
  STORY_TEXT_W,
  captionCase,
  dayListScenes,
  landmarkScene,
  mainMenuScene,
  mapScene,
  sizeUpScene,
  splashScene,
  storyScene,
  textScenes,
  tombstoneScene,
  travelScene,
} from "./apple2/scenes.js";
import { chunkText, wrapSegments } from "./apple2/text.js";
import { OVERNIGHT } from "./apple2/map.js";
import ART from "./apple2/artManifest.json";
import { DAY_END_NAME, DAY_START, STORY_PLAN, planKey } from "./storyPlan.js";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const roman = (part) => (part === 1 ? "I" : "II");

export function longDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export const entryHref = (entry) => `/${entry.slug}/`;
export const listHref = (part) => `/${part === 1 ? "?part=1" : ""}#saved`;

export function daysOf(part) {
  return getEntriesForPart(part)
    .slice()
    .sort((a, b) => a.day - b.day)
    .map((entry) => ({ ...entry, href: entryHref(entry) }));
}

// Each paragraph with the trail stops it describes (see storyPlan.js). If a day has no
// plan, stops are dealt out evenly so every paragraph and every stop still appears once.
export function storyParagraphs(entry) {
  const plan = STORY_PLAN[planKey(entry)];
  if (plan && plan.length === entry.body.length) {
    return entry.body.map((text, i) => ({ text, stops: plan[i].stops.map((s) => entry.stops[s]), visual: plan[i].visual }));
  }
  const n = entry.body.length;
  return entry.body.map((text, i) => ({
    text,
    stops: entry.stops.slice(Math.floor((i * entry.stops.length) / n), Math.floor(((i + 1) * entry.stops.length) / n)),
    visual: "event",
  }));
}

// Pictures are converted to hi-res when they load. The generated Apple II artwork is
// already drawn in the six-color palette, so it goes through untouched; the original
// full-color illustrations get a tone lift first.
const ART_IDS = new Set(ART);
const ART_TONE = { tone: { saturation: 1, contrast: 1, brightness: 0, gamma: 1, maxGain: 1 }, diffusion: 0.45 };
const PICTURE_CROPS = {
  // this file ends early; only its upper part is complete
  "/assets/part2/day3-pontiac-springfield.png": { x: 0.3, y: 0, w: 0.66, h: 0.6 },
};

// Story pictures are cut to the middle band of the artwork; these keep a subject
// that sits near the top (the Del's cow, the catsup bottle's cap, the Tucumcari Inn sign).
const ART_CROPS = {
  "p2d5-5": { y: 0.03, h: 0.6 },
  "p2d10-9": { y: 0.02, h: 0.6 },
  "p2d10-10": { y: 0.08, h: 0.6 },
};

function artPicture(id) {
  return ART_IDS.has(id) ? { src: `/assets/apple2/${id}.webp`, ...ART_TONE, crop: ART_CROPS[id] } : null;
}

function picture(src, artId) {
  return (artId && artPicture(artId)) || { src, crop: PICTURE_CROPS[src] };
}

// ------------------------------------------------------------------ home

export function homeScenes({ part, sound, choosePart, toggleSound, go }) {
  const chapter = chapters[part];
  const days = daysOf(part);
  const route = captionCase(chapter.route);
  const heading = part === 2 ? "Continue the journey:" : "Saved games:";
  const menuOptions = [
    { key: "1", label: "Travel Part I", run: () => choosePart(1) },
    { key: "2", label: "Travel Part II", run: () => choosePart(2) },
    { key: "3", label: "Learn about the trail", href: "/about/", run: () => go("/about/") },
    { key: "4", label: "Look at the map", href: "/map/", run: () => go("/map/") },
    { key: "5", label: sound ? "Turn sound off" : "Turn sound on", run: toggleSound },
  ];

  const splash = splashScene();
  splash.a11y = (
    <>
      <p>Route 66 Trail Journal: two Route 66 journeys, from Santa Monica and Chicago to Albuquerque, saved one roadside stop at a time.</p>
    </>
  );
  splash.nextLabel = "Continue to the main menu";

  const main = mainMenuScene({ options: menuOptions });

  const cover = landmarkScene({
    id: `chapter-${part}`,
    label: `${chapter.label}: ${route}`,
    captionLines: [`Part ${roman(part)}: ${route}`, chapter.dates],
    picture: picture(chapter.hero, `landmark-part${part}-hero`),
  });
  cover.a11y = (
    <>
      <h2>
        {chapter.label}: {route}
      </h2>
      <p>{chapter.dates}</p>
      <p>{chapter.heroAlt}</p>
    </>
  );
  cover.nextLabel = "Continue to the list of days";

  const lists = dayListScenes({
    heading,
    intro: chapter.intro,
    header: [`Route 66 Disk 0${part}`, `${days.length} Day${days.length === 1 ? "" : "s"} Saved`],
    entries: days,
  });
  lists.forEach((list, i) => {
    list.options = list.options.map((item) => ({
      ...item,
      label: `Day ${item.entry.day}: ${item.entry.title}, ${item.entry.dateDisplay}, ${item.entry.location}`,
      run: () => go(item.href),
    }));
    list.nextLabel = "More days";
    if (i === 0) {
      list.a11y = (
        <>
          <h2>{heading.replace(":", "")}</h2>
          <p>{chapter.intro}</p>
          <p>
            Route 66 disk 0{part} · {days.length} days saved
          </p>
        </>
      );
    }
    list.a11y = (
      <>
        {list.a11y}
        <ul>
          {list.options.map((item) => (
            <li key={item.href}>
              Day {item.entry.day}: {item.entry.title}. {item.entry.dateDisplay} · {item.entry.location}. {item.entry.summary}
            </li>
          ))}
        </ul>
      </>
    );
  });
  return [splash, main, cover, ...lists];
}

// ------------------------------------------------------------------ article

export function articleScenes(entry, { sound, toggleSound, go, scrollTo }) {
  const days = daysOf(entry.part);
  const index = days.findIndex((d) => d.slug === entry.slug);
  const prev = days[index - 1];
  let next = days[index + 1];
  let nextLabel = "Continue on trail";
  if (!next && entry.part === 1) {
    next = daysOf(2)[0];
    nextLabel = "Continue to Part II";
  }
  const date = longDate(entry.date);
  const partName = `Part ${roman(entry.part)}`;

  const travel = travelScene({
    entry,
    statusLines: [
      ["Date", date],
      ["Weather", entry.weather],
      ["Destination", entry.location],
      ["Next landmark", entry.stops[0]],
    ],
    popupLines: [`${partName} · Day ${entry.day}`, entry.title],
  });
  travel.onEnter = () => scrollTo("size-up");
  travel.a11y = (
    <>
      <p>
        {partName} · Day {entry.day}
      </p>
      <h1 tabIndex={-1} data-route-heading>
        {entry.title}
      </h1>
      <p>
        <time dateTime={entry.date}>{entry.dateDisplay}</time> · {entry.location}
      </p>
      <p>{entry.weather}</p>
    </>
  );

  const key = planKey(entry);
  const caption = captionCase(entry.imageCaption || entry.stops[0]);
  const landmark = landmarkScene({
    id: "landmark",
    label: caption,
    captionLines: [...wrapSegments(caption, 270), date],
    picture: picture(entry.image, `landmark-${key}`),
  });
  landmark.a11y = (
    <p>
      {entry.imageAlt}. {caption}.
    </p>
  );

  // Route map for the day: from where the day started to where it ended.
  const start = DAY_START[key];
  const route = start && OVERNIGHT[entry.slug]
    ? { from: start.at, to: OVERNIGHT[entry.slug], fromName: start.name, toName: DAY_END_NAME[key], flight: start.flight }
    : null;
  const visualFor = (name) => {
    if (name === "map" && route) return { type: "map", route };
    const art = name !== "map" && name !== "event" ? artPicture(name) : null;
    if (art) return { type: "picture", picture: art };
    return { type: "event" };
  };

  const summaryChunks = chunkText(entry.summary, STORY_TEXT_W, 6);
  const summary = summaryChunks.map((text, i) =>
    storyScene({
      id: `summary-${i + 1}`,
      label: i === 0 ? `${partName}, Day ${entry.day}: route` : `${entry.title} (continued)`,
      entry,
      visual: visualFor("map"),
      captionLines: [`${partName} · Day ${entry.day} · ${date}`],
      text,
    }),
  );
  summary[0].a11y = <p>{entry.summary}</p>;

  const paragraphs = storyParagraphs(entry);
  const captions = paragraphs.map((p) => p.stops.join(" · "));
  // a paragraph without stops of its own shows where the day is at that moment
  captions.forEach((c, i) => {
    if (c) return;
    captions[i] = captions.slice(0, i).reverse().find(Boolean) || captions.slice(i + 1).find(Boolean) || `${partName} · Day ${entry.day}`;
  });
  const story = paragraphs.flatMap((paragraph, index) => {
    // Caption bars hold at most two lines, so a long list of stops is shared out
    // across the paragraph's screens (splitting the text finer if needed).
    const names = paragraph.stops.length ? paragraph.stops : [captions[index]];
    const groups = [];
    for (const name of names) {
      const last = groups[groups.length - 1];
      if (last && wrapSegments([...last, name].join(" · "), 272).length <= 2) last.push(name);
      else groups.push([name]);
    }
    let lines = 7 - Math.max(...groups.map((g) => wrapSegments(g.join(" · "), 272).length));
    let chunks = chunkText(paragraph.text, STORY_TEXT_W, lines);
    while (chunks.length < groups.length && lines > 3) chunks = chunkText(paragraph.text, STORY_TEXT_W, --lines);
    const visual = visualFor(paragraph.visual);
    const screens = chunks.map((text, i) => {
      const group = groups[Math.min(i, groups.length - 1)].join(" · ");
      const captionLines = wrapSegments(group, 272);
      return storyScene({
        id: `stop-${index + 1}-${i + 1}`,
        label: i === 0 ? captions[index] : `${captions[index]} (continued)`,
        entry,
        visual,
        captionLines,
        text,
      });
    });
    screens[0].a11y = (
      <>
        {paragraph.stops.length ? <h2>{paragraph.stops.join(" · ")}</h2> : null}
        <p>{paragraph.text}</p>
      </>
    );
    return screens;
  });

  const options = [];
  const add = (label, run, href) => options.push({ key: String(options.length + 1), label, run, href });
  if (next) add(nextLabel, () => go(entryHref(next)), entryHref(next));
  if (prev) add("Go back a day", () => go(entryHref(prev)), entryHref(prev));
  add("Look at map", () => go(`/map/?day=${entry.slug}`), `/map/?day=${entry.slug}`);
  add("Return to saved games", () => go(listHref(entry.part)), listHref(entry.part));
  add(sound ? "Turn sound off" : "Turn sound on", toggleSound);

  const sizeUp = sizeUpScene({
    place: entry.location,
    date,
    facts: [
      ["Weather", entry.weather],
      ["Trail stops", String(entry.stops.length)],
      ["Journey", `${partName}, Day ${entry.day} of ${days.length}`],
    ],
    options,
  });
  sizeUp.a11y = (
    <>
      <h2>Trail stops</h2>
      <ol>
        {entry.stops.map((stop) => (
          <li key={stop}>{stop}</li>
        ))}
      </ol>
    </>
  );
  return [travel, landmark, ...summary, ...story, sizeUp];
}

// ------------------------------------------------------------------ map

export function mapScenes({ highlight, back, go }) {
  const all = [...daysOf(1), ...daysOf(2)];
  const scene = mapScene({ entries: all, highlight });
  scene.onNext = back;
  scene.nextLabel = "Leave the map";
  scene.tapToContinue = true; // the stops are optional; a tap anywhere else leaves the map
  scene.options = scene.options.map((option) => ({ ...option, run: () => go(option.href) }));
  scene.a11y = (
    <>
      <h1 tabIndex={-1} data-route-heading>
        Map of the Route 66 Trail
      </h1>
      <p>Part I ran from Santa Monica to Albuquerque. Part II ran from Chicago to Albuquerque.</p>
    </>
  );
  return [scene];
}

// ------------------------------------------------------------------ learn about the trail

export function aboutScenes({ go }) {
  const intro = textScenes({
    id: "about",
    label: "Learn about the trail",
    big: "Route 66",
    paragraphs: [
      "Two Route 66 journeys -- from Santa Monica and Chicago to Albuquerque -- saved one roadside stop at a time.",
    ],
  });
  intro[0].a11y = (
    <>
      <h1 tabIndex={-1} data-route-heading>
        Learn about the trail
      </h1>
      <p>Two Route 66 journeys—from Santa Monica and Chicago to Albuquerque—saved one roadside stop at a time in an Oregon Trail–inspired diary.</p>
    </>
  );

  const parts = [1, 2].map((part) => {
    const c = chapters[part];
    const n = daysOf(part).length;
    return `Part ${roman(part)} ran from ${captionCase(c.route).replace("→", "to")}, ${c.dates}. ${c.intro} ${n} days saved.`;
  });
  const differences = textScenes({ id: "differences", label: "The two journeys", paragraphs: parts });
  differences[0].a11y = (
    <>
      <h2>The two journeys</h2>
      {parts.map((p) => (
        <p key={p}>{p}</p>
      ))}
    </>
  );

  const help = textScenes({
    id: "controls",
    label: "How to travel",
    paragraphs: [
      "Click or tap a choice to pick it. On any other screen, click or tap anywhere to continue. The browser's Back button returns to the previous screen.",
      "With a keyboard: SPACE BAR continues, the left arrow goes back, number keys choose (0 is Day 10), RETURN sizes up the situation, and ESC returns to the menu.",
    ],
    lastPress: "Press SPACE BAR for the main menu",
  });
  help[help.length - 1].onNext = () => go("/#main-menu");
  help[0].a11y = (
    <>
      <h2>How to travel</h2>
      <p>Click or tap a choice to pick it; on any other screen, click or tap anywhere to continue. The browser's Back button returns to the previous screen. With a keyboard, SPACE BAR continues, the left arrow goes back, number keys choose, and ESC returns to the menu.</p>
    </>
  );
  return [...intro, ...differences, ...help];
}

// ------------------------------------------------------------------ not found

export function notFoundScenes({ go }) {
  const scene = tombstoneScene({ title: "Trail error", lines: ["Here lies", "a broken link"], epitaph: ["This turn isn't", "on Route 66."] });
  scene.onNext = () => go("/#saved");
  scene.nextLabel = "Return to saved games";
  scene.a11y = (
    <>
      <p>Trail error</p>
      <h1 tabIndex={-1} data-route-heading>
        This turn isn't on Route 66.
      </h1>
    </>
  );
  return [scene];
}

