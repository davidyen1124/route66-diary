import { useCallback, useEffect, useMemo, useState } from "react";
import { getEntryBySlug } from "./data.js";
import { Monitor } from "./components/Monitor.jsx";
import { setSound, soundOn, subscribeSound } from "./apple2/sound.js";
import { aboutScenes, articleScenes, homeScenes, listHref, mapScenes, notFoundScenes } from "./journey.jsx";

function readRoute() {
  // Old /blog/... links keep working: drop the prefix and carry on.
  if (/^\/blog(\/|$)/.test(window.location.pathname)) {
    const url = new URL(window.location.href);
    url.pathname = url.pathname.replace(/^\/blog/, "") || "/";
    window.history.replaceState(window.history.state, "", url);
  }
  const { pathname, search, hash } = window.location;
  const params = new URLSearchParams(search);
  const focus = hash ? { id: decodeURIComponent(hash.slice(1)) } : null;
  if (pathname === "/" || pathname === "") return { view: "home", part: params.get("part") === "1" ? 1 : 2, focus };
  const match = pathname.match(/^\/([^/]+)\/?$/);
  if (!match) return { view: "entry", slug: null, focus };
  if (match[1] === "map") return { view: "map", day: params.get("day"), focus };
  if (match[1] === "about") return { view: "about", focus };
  return { view: "entry", slug: match[1], focus };
}

function navigate(path) {
  window.history.pushState({ inApp: true }, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function App() {
  const [route, setRoute] = useState(readRoute);
  const [focus, setFocus] = useState(() => readRoute().focus);
  const [sound, setSoundState] = useState(soundOn);

  useEffect(() => {
    const update = () => {
      const next = readRoute();
      setRoute(next);
      setFocus(next.focus);
    };
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);

  useEffect(() => subscribeSound(setSoundState), []);

  const go = useCallback((path) => navigate(path), []);
  const toggleSound = useCallback(() => setSound(!soundOn()), []);
  // Jump the monitor to a screen on the current page (a history step, so Back returns).
  const scrollTo = useCallback((id) => {
    const url = new URL(window.location.href);
    url.hash = id;
    window.history.pushState({ inApp: true }, "", url);
    setFocus({ id, nonce: Date.now() });
  }, []);

  const choosePart = useCallback((part) => {
    const url = new URL(window.location.href);
    if (part === 1) url.searchParams.set("part", "1");
    else url.searchParams.delete("part");
    url.hash = `chapter-${part}`;
    window.history.pushState({ inApp: true }, "", url);
    setRoute((r) => ({ ...r, part }));
    setFocus({ id: `chapter-${part}`, nonce: Date.now() });
  }, []);

  const back = useCallback(() => {
    if (window.history.state?.inApp) window.history.back();
    else navigate("/");
  }, []);

  const entry = route.view === "entry" && route.slug ? getEntryBySlug(route.slug) : null;
  const routeKey = route.view === "entry" ? `entry:${route.slug}` : route.view === "home" ? `home:${route.part}` : route.view;

  const { scenes, title, onBack } = useMemo(() => {
    switch (route.view) {
      case "home":
        return {
          scenes: homeScenes({ part: route.part, sound, choosePart, toggleSound, go }),
          title: route.part === 2 ? "Route 66 Part II | Trail Journal" : "Route 66 Part I | Trail Journal",
          onBack: () => scrollTo("main-menu"),
        };
      case "map":
        return { scenes: mapScenes({ highlight: route.day, back, go }), title: "Map of the Trail | Route 66 Trail Journal", onBack: back };
      case "about":
        return { scenes: aboutScenes({ go }), title: "Learn About the Trail | Route 66 Trail Journal", onBack: () => go("/#main-menu") };
      default:
        if (!entry) return { scenes: notFoundScenes({ go }), title: "Trail Not Found | Route 66", onBack: () => go("/") };
        return {
          scenes: articleScenes(entry, { sound, toggleSound, go, scrollTo }),
          title: `Day ${entry.day}: ${entry.title}`,
          onBack: () => go(listHref(entry.part)),
        };
    }
  }, [route, entry, sound, choosePart, toggleSound, go, scrollTo, back]);

  useEffect(() => {
    document.title = title;
  }, [title]);

  // Move screen-reader focus to the new page's heading after navigation.
  useEffect(() => {
    if (!window.history.state?.inApp) return;
    const heading = document.querySelector("[data-route-heading]");
    heading?.focus({ preventScroll: true });
  }, [routeKey]);

  return (
    <main className="monitor">
      {route.view === "home" ? <h1 className="sr-only">Route 66 Trail Journal</h1> : null}
      <Monitor scenes={scenes} onBack={onBack} focus={focus} routeKey={routeKey} />
    </main>
  );
}
