// Writes Codex batch files for the Apple II artwork and prints the run command.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { LANDMARKS, SCENES, landmarkPrompt, scenePrompt } from "./prompts.mjs";

const batches = Number(process.argv[2] || 6);
const prefix = process.argv[3] || "batch";
// The image tool needs absolute reference paths. The Pontiac original is truncated,
// so its complete upper part (art-src/refs/day3-pontiac-top.png, cut with sips) is used.
const REF_OVERRIDES = { "public/assets/part2/day3-pontiac-springfield.png": "art-src/refs/day3-pontiac-top.png" };
const jobs = [
  ...LANDMARKS.map((job) => ({ id: job.id, ref: path.resolve(REF_OVERRIDES[job.ref] || job.ref), prompt: landmarkPrompt(job) })),
  ...Object.keys(SCENES).map((id) => ({ id, prompt: scenePrompt(id) })),
]
  .map((job) => ({ ...job, out: `art-src/raw/${job.id}.png` }))
  .filter((job) => !existsSync(job.out));

mkdirSync("art-src/jobs", { recursive: true });
mkdirSync("art-src/raw", { recursive: true });
const groups = Array.from({ length: batches }, () => []);
jobs.forEach((job, i) => groups[i % batches].push(job));
groups.forEach((group, i) => group.length && writeFileSync(`art-src/jobs/${prefix}-${i + 1}.json`, JSON.stringify(group, null, 2)));
console.log(`${jobs.length} jobs in ${batches} batches`);
