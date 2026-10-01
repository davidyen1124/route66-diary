// Shrinks the generated PNGs (art-src/raw) to 560px WebP in public/assets/apple2
// and records which pictures exist in src/apple2/artManifest.json.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { LANDMARKS, SCENES } from "./prompts.mjs";

const RAW = "art-src/raw";
const OUT = "public/assets/apple2";
mkdirSync(OUT, { recursive: true });
mkdirSync("art-src/tmp", { recursive: true });
// Only pictures that still have a prompt are kept; leftovers in art-src/raw are skipped.
const wanted = new Set([...LANDMARKS.map((job) => job.id), ...Object.keys(SCENES)]);
const ids = [];
for (const file of readdirSync(RAW).filter((f) => f.endsWith(".png")).sort()) {
  const id = file.replace(/\.png$/, "");
  if (!wanted.has(id)) continue;
  const src = `${RAW}/${file}`;
  const dest = `${OUT}/${id}.webp`;
  if (!existsSync(dest) || statSync(dest).mtimeMs < statSync(src).mtimeMs) {
    const small = `art-src/tmp/${id}.png`;
    execFileSync("sips", ["-Z", "560", src, "--out", small], { stdio: "ignore" });
    execFileSync("cwebp", ["-q", "88", "-m", "6", "-quiet", small, "-o", dest]);
  }
  ids.push(id);
}
writeFileSync("src/apple2/artManifest.json", `${JSON.stringify(ids, null, 2)}\n`);
console.log(`${ids.length} pictures ready`);
