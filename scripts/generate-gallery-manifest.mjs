#!/usr/bin/env node
/**
 * Scans images/gallery/ and writes photos/gallery-manifest.json for /photos/.
 * Optional captions: edit photos/gallery-captions.json as { "filename.jpg": "Caption" }.
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const GALLERY_DIR = path.join(ROOT, "images", "gallery");
const OUT = path.join(ROOT, "photos", "gallery-manifest.json");
const CAPTIONS = path.join(ROOT, "photos", "gallery-captions.json");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);

export async function generateGalleryManifest() {
  await fs.mkdir(GALLERY_DIR, { recursive: true });
  let entries = [];
  try {
    const names = await fs.readdir(GALLERY_DIR);
    for (const name of names) {
      const ext = path.extname(name).toLowerCase();
      if (!IMAGE_EXT.has(ext)) continue;
      if (name.startsWith(".")) continue;
      entries.push(name);
    }
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  entries.sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
  );

  let captions = {};
  try {
    const raw = await fs.readFile(CAPTIONS, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      captions = parsed;
    }
  } catch {
    /* optional file */
  }

  const manifest = entries.map((file) => ({
    file,
    caption:
      typeof captions[file] === "string" ? captions[file] : "",
  }));

  await fs.writeFile(OUT, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifest;
}

async function main() {
  const m = await generateGalleryManifest();
  console.log(`Wrote ${path.relative(ROOT, OUT)} (${m.length} image(s))`);
}

const entryFile = fileURLToPath(import.meta.url);
const runAsMain =
  Boolean(process.argv[1]) &&
  path.resolve(process.argv[1]) === path.resolve(entryFile);

if (runAsMain) {
  main().catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  });
}
