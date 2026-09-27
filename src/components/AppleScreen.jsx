import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { HEIGHT, HiRes, WIDTH, loadOrder } from "../apple2/hires.js";
import { loadPicture } from "../apple2/picture.js";

// One shared flash clock so every cursor on the page blinks together.
const blinkListeners = new Set();
let blinkOn = true;
let blinkTimer = null;
function subscribeBlink(fn) {
  blinkListeners.add(fn);
  if (!blinkTimer) {
    blinkTimer = window.setInterval(() => {
      blinkOn = !blinkOn;
      blinkListeners.forEach((f) => f(blinkOn));
    }, 530);
  }
  return () => {
    blinkListeners.delete(fn);
    if (!blinkListeners.size) {
      window.clearInterval(blinkTimer);
      blinkTimer = null;
    }
  };
}

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Pictures paint in with the load effect only the first time they are shown.
const revealedPictures = new Set();

function useVisible(ref) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) {
      setVisible(true);
      return undefined;
    }
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return visible;
}

const pct = (v, total) => `${(v / total) * 100}%`;

export function AppleScreen({ scene, onSelect }) {
  const slotRef = useRef(null);
  const canvasRef = useRef(null);
  const fbRef = useRef(null);
  const imageRef = useRef(null);
  const visible = useVisible(slotRef);
  const [hover, setHover] = useState(null);
  const [cursorOn, setCursorOn] = useState(true);
  const [t, setT] = useState(0);
  const [picture, setPicture] = useState(null);
  const [revealRows, setRevealRows] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [revealStarted, setRevealStarted] = useState(false);


  // Cursor blink (only while on screen).
  useEffect(() => {
    if (!scene.cursor || !visible || reducedMotion()) return undefined;
    return subscribeBlink(setCursorOn);
  }, [scene.cursor, visible]);

  // Travel animation, stepped at a period-correct ~8 frames per second.
  useEffect(() => {
    if (!scene.animated || !visible || reducedMotion()) return undefined;
    let raf = 0;
    let last = 0;
    const start = performance.now() - t * 1000;
    const tick = (now) => {
      if (now - last > 120) {
        last = now;
        setT((now - start) / 1000);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.animated, visible]);

  // Pictures load as soon as the screen comes near the viewport.
  useEffect(() => {
    if (!scene.picture || picture) return undefined;
    let alive = true;
    loadPicture(scene.picture)
      .then((fb) => alive && setPicture(fb))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [scene.picture, picture]);

  // The first time a picture is seen, it paints in hi-res memory order like a BLOAD.
  // The effect depends only on values that flip once, so scrolling away mid-load
  // never interrupts it.
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (visible) setSeen(true);
  }, [visible]);

  useEffect(() => {
    if (!picture || !seen) return undefined;
    setRevealStarted(true);
    const pictureKey = `${scene.picture?.src}:${picture.h}`;
    if (reducedMotion() || !scene.loadEffect || revealedPictures.has(pictureKey)) {
      setRevealRows(null);
      return undefined;
    }
    const order = loadOrder(picture.h);
    const shown = new Uint8Array(picture.h);
    const duration = 900;
    const started = performance.now();
    let raf = 0;
    const step = (now) => {
      const n = Math.min(order.length, Math.ceil(((now - started) / duration) * order.length));
      for (let i = 0; i < n; i++) shown[order[i]] = 1;
      setRevealRows(n >= order.length ? null : shown.slice());
      if (n < order.length) raf = requestAnimationFrame(step);
      else revealedPictures.add(pictureKey);
    };
    setRevealRows(shown.slice());
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      setRevealRows(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picture, seen]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    fbRef.current ||= new HiRes(HEIGHT);
    imageRef.current ||= ctx.createImageData(WIDTH, HEIGHT);
    const fb = fbRef.current;
    const pictureReady = picture && (!scene.loadEffect || revealStarted);
    const result = scene.draw(fb, {
      t,
      cursorOn,
      hover,
      picture: pictureReady ? picture : null,
      reveal: revealRows ? (y) => revealRows[y] === 1 : null,
    });
    fb.render(imageRef.current);
    ctx.putImageData(imageRef.current, 0, 0);
    const spots = result?.hotspots || [];
    setHotspots((prev) => (JSON.stringify(prev) === JSON.stringify(spots) ? prev : spots));
  }, [scene, t, cursorOn, hover, picture, revealRows, revealStarted]);

  const describe = (spot) => {
    if (spot.option === "next") return scene.nextLabel || "Continue";
    if (spot.option === "enter") return scene.enterLabel || "Size up the situation";
    const option = scene.options?.[spot.option];
    return option ? option.label : "";
  };

  return (
    <section className="screen-slot" ref={slotRef} id={`screen-${scene.id}`} aria-label={scene.label}>
      <div className="apple-screen">
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} aria-hidden="true" />
        <div className="apple-screen__hotspots">
          {hotspots.map((spot) => {
            const option = typeof spot.option === "number" ? scene.options?.[spot.option] : null;
            const style = {
              left: pct(spot.x, WIDTH),
              top: pct(spot.y, HEIGHT),
              width: pct(spot.w, WIDTH),
              height: pct(spot.h, HEIGHT),
            };
            const common = {
              className: "hotspot",
              style,
              onPointerEnter: (event) => event.pointerType === "mouse" && setHover(spot.option),
              onPointerLeave: () => setHover(null),
              onFocus: () => setHover(spot.option),
              onBlur: () => setHover(null),
              "aria-label": describe(spot),
            };
            const key = `${scene.id}-${spot.option}`;
            if (option?.href) {
              return (
                <a
                  {...common}
                  key={key}
                  href={option.href}
                  onClick={(event) => {
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) return;
                    event.preventDefault();
                    onSelect(scene, spot.option);
                  }}
                />
              );
            }
            return <button {...common} key={key} type="button" onClick={() => onSelect(scene, spot.option)} />;
          })}
        </div>
      </div>
    </section>
  );
}
