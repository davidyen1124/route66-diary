import { useEffect, useMemo, useState } from "react";
import { chapters, getEntriesForPart, getEntryBySlug } from "./data.js";

function readRoute() {
  const match = window.location.pathname.match(/^\/blog\/([^/]+)\/?$/);
  return match ? { view: "entry", slug: match[1] } : { view: "home" };
}

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function SiteHeader({ compact = false }) {
  return (
    <header className={compact ? "site-header site-header--compact" : "site-header"}>
      <button className="brand" type="button" onClick={() => navigate("/blog/")} aria-label="Return to the Route 66 diary">
        <span className="brand__primary">ROUTE 66</span>
        <span className="brand__secondary">TRAIL JOURNAL</span>
      </button>
    </header>
  );
}

function ChapterSwitch({ activePart, onChange }) {
  return (
    <div className="chapter-switch" aria-label="Choose a Route 66 journey chapter">
      {[1, 2].map((part) => (
        <button
          className={activePart === part ? "chapter-switch__button is-active" : "chapter-switch__button"}
          type="button"
          aria-pressed={activePart === part}
          onClick={() => onChange(part)}
          key={part}
        >
          PART {part === 1 ? "I" : "II"}
        </button>
      ))}
    </div>
  );
}

function EntryRow({ entry }) {
  return (
    <article className="entry-row">
      <button className="entry-row__link" type="button" onClick={() => navigate(`/blog/${entry.slug}/`)}>
        <span className="entry-row__day">DAY {entry.day}</span>
        <span className="entry-row__title">{entry.title}</span>
        <span className="entry-row__meta">{entry.dateDisplay} · {entry.location}</span>
        <span className="entry-row__summary">{entry.summary}</span>
      </button>
    </article>
  );
}

function HomePage() {
  const searchPart = new URLSearchParams(window.location.search).get("part");
  const [activePart, setActivePart] = useState(searchPart === "1" ? 1 : 2);
  const chapter = chapters[activePart];
  const visibleEntries = useMemo(() => getEntriesForPart(activePart), [activePart]);

  useEffect(() => {
    document.title = activePart === 2 ? "Route 66 Part II | Trail Journal" : "Route 66 Part I | Trail Journal";
  }, [activePart]);

  function choosePart(part) {
    setActivePart(part);
    const url = new URL(window.location.href);
    if (part === 1) url.searchParams.set("part", "1");
    else url.searchParams.delete("part");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }

  return (
    <main className="page-shell">
      <SiteHeader />
      <ChapterSwitch activePart={activePart} onChange={choosePart} />

      <section className="chapter-hero" aria-labelledby="chapter-title">
        <div className="chapter-hero__copy">
          <p className="eyebrow">{chapter.label}</p>
          <h1 id="chapter-title">{chapter.route}</h1>
          <p className="chapter-hero__dates">{chapter.dates}</p>
          <p className="chapter-hero__intro">{chapter.intro}</p>
        </div>
        <img className="chapter-hero__image" src={chapter.hero} alt={chapter.heroAlt} />
      </section>

      <section className="journal-list" aria-labelledby="journal-heading">
        <div className="section-heading">
          <h2 id="journal-heading">{activePart === 2 ? "CONTINUE THE JOURNEY" : "SAVED GAMES"}</h2>
          <span aria-hidden="true" />
        </div>
        <div className="entry-list">
          {visibleEntries.map((entry) => <EntryRow entry={entry} key={`${entry.part}-${entry.day}`} />)}
        </div>
      </section>

      <footer className="site-footer">
        <span>ROUTE 66 DISK · {activePart === 2 ? "02" : "01"}</span>
        <span>{visibleEntries.length} DAYS SAVED</span>
      </footer>
    </main>
  );
}

function buildStorySections(entry) {
  const sectionCount = Math.max(1, Math.min(entry.body.length, entry.stops.length || entry.body.length));

  return Array.from({ length: sectionCount }, (_, index) => {
    const paragraphStart = Math.floor((index * entry.body.length) / sectionCount);
    const paragraphEnd = Math.floor(((index + 1) * entry.body.length) / sectionCount);
    const stopStart = Math.floor((index * entry.stops.length) / sectionCount);
    const stopEnd = Math.floor(((index + 1) * entry.stops.length) / sectionCount);

    return {
      id: `${entry.slug}-${index + 1}`,
      number: String(index + 1).padStart(2, "0"),
      stops: entry.stops.slice(stopStart, stopEnd),
      paragraphs: entry.body.slice(paragraphStart, paragraphEnd),
    };
  });
}

function ArticleBrand() {
  return (
    <button className="article-brand" type="button" onClick={() => navigate("/blog/")} aria-label="Return to the Route 66 diary">
      ROUTE 66 <span>· TRAIL JOURNAL</span>
    </button>
  );
}

function ArticlePage({ entry }) {
  const [imageAvailable, setImageAvailable] = useState(Boolean(entry.image));
  const storySections = useMemo(() => buildStorySections(entry), [entry]);

  useEffect(() => {
    document.title = `Day ${entry.day}: ${entry.title}`;
    window.scrollTo({ top: 0, behavior: "instant" });
    const onKeyDown = (event) => {
      if (event.key.toLowerCase() === "b" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        navigate(`/blog/${entry.part === 1 ? "?part=1" : ""}`);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [entry]);

  return (
    <main className="page-shell article-shell">
      <article className="travel-log">
        <ArticleBrand />
        <header className="article-header">
          <p className="article-header__day">PART {entry.part === 1 ? "I" : "II"} · DAY {entry.day}</p>
          <h1>{entry.title}</h1>
          <div className="article-meta">
            <p><time dateTime={entry.date}>{entry.dateDisplay}</time> · {entry.location}</p>
            <p>{entry.weather}</p>
          </div>
        </header>

        {imageAvailable ? (
          <figure className="article-figure">
            <img
              className="article-image"
              src={entry.image}
              alt={entry.imageAlt || "Route 66 diary illustration"}
              onError={() => setImageAvailable(false)}
            />
            <figcaption>{entry.imageCaption || `${entry.stops[0]} · ${entry.dateDisplay}`}</figcaption>
          </figure>
        ) : null}

        <section className="story-trail" aria-label={`Day ${entry.day} story by trail stop`}>
          {storySections.map((section) => (
            <section className="story-stop" key={section.id}>
              <span className="story-stop__marker" aria-hidden="true">{section.number}</span>
              <div className="story-stop__content">
                <h2>{section.stops.join(" · ") || `Travel log ${section.number}`}</h2>
                <div className="story-stop__copy">
                  {section.paragraphs.map((paragraph, index) => <p key={`${section.id}-${index}`}>{paragraph}</p>)}
                </div>
              </div>
            </section>
          ))}
        </section>

        <nav className="article-nav" aria-label="Journal navigation">
          <button type="button" onClick={() => navigate(`/blog/${entry.part === 1 ? "?part=1" : ""}`)}>RETURN TO ALL DAYS</button>
        </nav>
      </article>
    </main>
  );
}

function NotFound() {
  useEffect(() => { document.title = "Trail Not Found | Route 66"; }, []);
  return (
    <main className="page-shell not-found">
      <SiteHeader />
      <p className="eyebrow">TRAIL ERROR</p>
      <h1>THIS TURN ISN'T ON ROUTE 66.</h1>
      <button type="button" onClick={() => navigate("/blog/")}>RETURN TO SAVED GAMES</button>
    </main>
  );
}

export function App() {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const updateRoute = () => setRoute(readRoute());
    window.addEventListener("popstate", updateRoute);
    return () => window.removeEventListener("popstate", updateRoute);
  }, []);

  if (route.view === "home") return <HomePage />;
  const entry = getEntryBySlug(route.slug);
  return entry ? <ArticlePage entry={entry} key={`${entry.part}-${entry.slug}`} /> : <NotFound />;
}
