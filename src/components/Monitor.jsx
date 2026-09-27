import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AppleScreen } from "./AppleScreen.jsx";
import { loadPicture } from "../apple2/picture.js";
import { sfx } from "../apple2/sound.js";

const W = 280;
const H = 192;

// Fit one 280x192 screen inside the window. Whole device pixels keep every Apple II
// dot identical; if that would waste much space (small 2x phones) the screen fills
// the space instead.
function usePixelScale() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const update = () => {
      const dpr = window.devicePixelRatio || 1;
      const fit = Math.min((root.clientWidth - 8) / W, (window.innerHeight - 16) / H, 5);
      const snapped = Math.max(1, Math.floor(fit * dpr)) / dpr;
      root.style.setProperty("--px", String(snapped >= fit * 0.9 ? snapped : Math.max(1, fit)));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
}

// One screen at a time, like the game. Click or tap a choice to pick it; click or tap
// anywhere on a screen without choices to continue. Scrolling and swiping do nothing.
// Every screen change is a browser-history step, so Back returns to the previous screen.
// The keyboard works too: SPACE/RETURN/right arrow continue, left arrow goes back,
// number keys choose, ESC or B returns to the menu.
export function Monitor({ scenes, routeKey, focus, onBack }) {
  usePixelScale();

  const find = (id) => {
    const i = id ? scenes.findIndex((s) => s.id === id) : -1;
    return i >= 0 ? i : 0;
  };
  // A new page, a Back step, or a jump such as "Travel Part II" picks the screen; this
  // is settled during render so the previous position never flashes.
  const [nav, setNav] = useState(() => ({ routeKey, focus, index: find(focus?.id) }));
  if (nav.routeKey !== routeKey || nav.focus !== focus) setNav({ routeKey, focus, index: find(focus?.id) });
  const index = nav.routeKey === routeKey && nav.focus === focus ? nav.index : find(focus?.id);

  const current = Math.min(index, scenes.length - 1);
  const scene = scenes[current];
  const state = useRef({});
  state.current = { scenes, index: current };

  // Keep the screen in the URL: moving forward or back adds a history step; landing on
  // a page just records where it is.
  const pushNext = useRef(false);
  useEffect(() => {
    const url = new URL(window.location.href);
    url.hash = current === 0 ? "" : scene.id;
    const push = pushNext.current;
    pushNext.current = false;
    if (url.href === window.location.href) return;
    if (push) window.history.pushState({ inApp: true }, "", url);
    else window.history.replaceState(window.history.state, "", url);
  }, [current, scene.id]);

  // Warm up the next pictures so they are ready when the screen changes.
  useEffect(() => {
    for (const s of scenes.slice(current + 1, current + 3)) if (s.picture) loadPicture(s.picture).catch(() => {});
  }, [scenes, current]);

  const goTo = useCallback((i) => {
    if (i < 0 || i >= state.current.scenes.length) return false;
    pushNext.current = true;
    setNav((n) => ({ ...n, index: i }));
    return true;
  }, []);

  const next = useCallback(() => {
    const { scenes: list, index: i } = state.current;
    sfx.next();
    if (list[i].onNext) list[i].onNext();
    else if (!goTo(i + 1)) sfx.error();
  }, [goTo]);

  const prev = useCallback(() => {
    sfx.next();
    if (!goTo(state.current.index - 1)) sfx.error();
  }, [goTo]);

  const select = useCallback(
    (target, option) => {
      if (option === "next") return next();
      if (option === "enter") {
        sfx.select();
        target.onEnter?.();
        return undefined;
      }
      const choice = target.options?.[option];
      if (!choice) return undefined;
      sfx.select();
      choice.run?.();
      return undefined;
    },
    [next],
  );

  useEffect(() => {
    const onKey = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const { scenes: list, index: i } = state.current;
      const here = list[i];
      const key = event.key;
      if (key === " " || key === "ArrowRight") {
        event.preventDefault();
        next();
        return;
      }
      if (key === "ArrowLeft") {
        event.preventDefault();
        prev();
        return;
      }
      if (key === "Enter") {
        if (event.target?.classList?.contains("hotspot")) return;
        event.preventDefault();
        if (here.onEnter) select(here, "enter");
        else next();
        return;
      }
      if (/^[0-9]$/.test(key)) {
        // this screen's choice first, then the nearest screen that offers it
        const order = list.map((_, n) => n).sort((a, b) => Math.abs(a - i) - Math.abs(b - i));
        for (const n of order) {
          const option = list[n].options?.findIndex((o) => o.key === key) ?? -1;
          if (option >= 0) {
            event.preventDefault();
            if (n !== i) goTo(n);
            select(list[n], option);
            return;
          }
        }
        sfx.error();
        return;
      }
      if ((key === "b" || key === "B" || key === "Escape") && onBack) {
        event.preventDefault();
        sfx.select();
        onBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, next, prev, select, onBack]);

  // Screens with choices wait for a choice; every other screen continues on a click.
  const tapContinues = !scene.options?.length || scene.tapToContinue;
  const onScreenClick = (event) => {
    if (event.target.closest(".hotspot") || !tapContinues) return;
    next();
  };

  return (
    <>
      <div className="monitor-stage">
        <div className={`monitor-screen${tapContinues ? " is-tappable" : ""}`} onClick={onScreenClick}>
          <AppleScreen key={`${routeKey}:${scene.id}`} scene={scene} onSelect={select} />
        </div>
      </div>
      {/* The whole page's text and links, in reading order, for screen readers. */}
      <div className="sr-only">
        {scenes.map((s) => (
          <section key={s.id} aria-label={s.label}>
            {s.a11y}
            {s.options?.some((o) => o.href) ? (
              <ul>
                {s.options.filter((o) => o.href).map((o) => (
                  <li key={o.href}>
                    <a href={o.href}>{o.label}</a>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </>
  );
}
