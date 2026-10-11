// The Apple II speaker could only click; tones were made by toggling it in a loop.
// A square wave through Web Audio gives the same flat, buzzy beep.
const KEY = "route66-sound";
let ctx = null;
let enabled = true;
const listeners = new Set();

try {
  enabled = window.localStorage.getItem(KEY) !== "off";
} catch {
  enabled = true;
}

export function soundOn() {
  return enabled;
}

export function setSound(on) {
  enabled = on;
  try {
    window.localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((fn) => fn(on));
}

export function subscribeSound(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function tone(freq, ms, when = 0, volume = 0.05) {
  if (!enabled) return;
  try {
    if (!ctx) {
      // An iPhone's silent switch mutes Web Audio unless the page asks for a playback session.
      try {
        if (navigator.audioSession) navigator.audioSession.type = "playback";
      } catch {
        /* an older Safari may refuse it */
      }
      ctx =new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.setValueAtTime(0, t + ms / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + ms / 1000 + 0.02);
  } catch {
    /* audio unavailable */
  }
}

export const sfx = {
  select: () => tone(1020, 90),
  next: () => tone(700, 22),
  error: () => tone(180, 160, 0, 0.06),
};
