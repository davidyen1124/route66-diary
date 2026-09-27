import { HiRes } from "./hires.js";
import { ditherInto, prepare } from "./dither.js";

const cache = new Map();

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

// Fetch a picture and convert it to a 280-wide hi-res image of the given height.
// crop is a fractional source rectangle { x, y, w, h }; the result covers the frame.
export function loadPicture({ src, height, crop, tone, diffusion = 0.62 }) {
  const key = JSON.stringify([src, height, crop, tone, diffusion]);
  if (!cache.has(key)) {
    const job = loadImage(src).then((img) => {
      const W = 280;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      let sx = (crop?.x ?? 0) * iw;
      let sy = (crop?.y ?? 0) * ih;
      let sw = (crop?.w ?? 1) * iw;
      let sh = (crop?.h ?? 1) * ih;
      const want = W / height;
      if (sw / sh > want) {
        const nw = sh * want;
        sx += (sw - nw) / 2;
        sw = nw;
      } else {
        const nh = sw / want;
        sy += (sh - nh) / 2;
        sh = nh;
      }
      // two-step downscale keeps fine pixel-art detail from aliasing
      const mid = document.createElement("canvas");
      mid.width = W * 2;
      mid.height = height * 2;
      const mctx = mid.getContext("2d");
      mctx.imageSmoothingQuality = "high";
      mctx.drawImage(img, sx, sy, sw, sh, 0, 0, mid.width, mid.height);
      const small = document.createElement("canvas");
      small.width = W;
      small.height = height;
      const sctx = small.getContext("2d", { willReadFrequently: true });
      sctx.imageSmoothingQuality = "high";
      sctx.drawImage(mid, 0, 0, W, height);
      const data = sctx.getImageData(0, 0, W, height);
      const fb = new HiRes(height);
      ditherInto(fb, prepare(data, tone), W, height, 0, 0, { diffusion });
      return fb;
    });
    job.catch(() => cache.delete(key));
    cache.set(key, job);
  }
  return cache.get(key);
}
