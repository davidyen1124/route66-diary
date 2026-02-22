#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import YAML from "yaml";

const BLOG_DIR = path.resolve("src/content/blog");
const OUTPUT_DIR = path.resolve("public/audio/blog");

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
const ELEVENLABS_MODEL_ID = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";

const MAX_CHARS_PER_CHUNK = 2400;

if (!ELEVENLABS_API_KEY) {
  console.error("Missing ELEVENLABS_API_KEY in environment.");
  process.exit(1);
}

function splitFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return null;
  return { frontmatter: match[1], body: markdown.slice(match[0].length) };
}

function toPlainText(markdown) {
  let text = markdown;
  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/`[^`]*`/g, " ");
  text = text.replace(/!\[[^\]]*]\([^)]*\)/g, " ");
  text = text.replace(/\[([^\]]+)]\(([^)]+)\)/g, "$1");
  text = text.replace(/^>\s?/gm, "");
  text = text.replace(/^#{1,6}\s+/gm, "");
  text = text.replace(/^[-*+]\s+/gm, "");
  text = text.replace(/^\d+\.\s+/gm, "");
  text = text.replace(/(\*\*|__)(.*?)\1/g, "$2");
  text = text.replace(/(\*|_)(.*?)\1/g, "$2");
  text = text.replace(/~~(.*?)~~/g, "$1");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n{2,}/g, "\n");
  return text.trim();
}

function splitIntoChunks(text, maxChars = MAX_CHARS_PER_CHUNK) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks = [];
  let current = "";

  const pushCurrent = () => {
    const trimmed = current.trim();
    if (trimmed) chunks.push(trimmed);
    current = "";
  };

  for (const sentence of sentences) {
    if (sentence.length > maxChars) {
      if (current) pushCurrent();
      for (let i = 0; i < sentence.length; i += maxChars) {
        chunks.push(sentence.slice(i, i + maxChars).trim());
      }
      continue;
    }

    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length > maxChars) pushCurrent();
    current = current ? `${current} ${sentence}` : sentence;
  }

  if (current) pushCurrent();
  return chunks;
}

async function synthesizeChunk(text) {
  const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(ELEVENLABS_VOICE_ID)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: ELEVENLABS_MODEL_ID,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`ElevenLabs request failed (${response.status}): ${errorBody || response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const files = (await fs.readdir(BLOG_DIR)).filter((name) => name.endsWith(".md")).sort();

  const generated = [];

  for (const name of files) {
    const sourcePath = path.join(BLOG_DIR, name);
    const raw = await fs.readFile(sourcePath, "utf8");
    const parts = splitFrontmatter(raw);
    if (!parts) {
      throw new Error(`Missing frontmatter in ${sourcePath}`);
    }

    const data = YAML.parse(parts.frontmatter) || {};
    const slug = typeof data.slug === "string" ? data.slug.trim() : "";
    const title = typeof data.title === "string" ? data.title.trim() : "";

    if (!slug) throw new Error(`Missing frontmatter slug in ${sourcePath}`);
    if (!title) throw new Error(`Missing frontmatter title in ${sourcePath}`);

    const bodyText = toPlainText(parts.body);
    const narration = bodyText.trim();
    const chunks = splitIntoChunks(narration);

    if (chunks.length === 0) {
      console.warn(`Skipping ${sourcePath}: no narration text.`);
      continue;
    }

    const audioParts = [];
    for (const chunk of chunks) {
      const audio = await synthesizeChunk(chunk);
      audioParts.push(audio);
    }

    const outputPath = path.join(OUTPUT_DIR, `${slug}.mp3`);
    await fs.writeFile(outputPath, Buffer.concat(audioParts));
    generated.push(outputPath);
    console.log(outputPath);
  }

  console.log(`Generated ${generated.length} MP3 file(s).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
