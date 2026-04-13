#!/usr/bin/env node
/**
 * Download photos for the static /photos/ gallery.
 *
 * Option A — Facebook Graph API (recommended for page owners):
 *   Create a Meta app → get a Page access token with permissions to read the page’s photos
 *   (e.g. pages_read_engagement; see current Meta docs for “Page photos”).
 *   Then:
 *     export FACEBOOK_PAGE_ACCESS_TOKEN="..."
 *     node scripts/sync-facebook-gallery.mjs --graph
 *
 * Option B — Manual image URLs (one per line in a text file):
 *   Right-click an image in the browser → “Copy image address” (direct CDN URLs work best).
 *     node scripts/sync-facebook-gallery.mjs --urls photo-urls.txt
 *
 * Optional: FACEBOOK_PAGE_ID=harrybradroccophotography (default)
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const GALLERY_DIR = path.join(ROOT, "images", "gallery");
const GRAPH_VERSION = "v21.0";
const DEFAULT_PAGE_ID = "harrybradroccophotography";

function extFromContentType(ct) {
  if (!ct) return null;
  const m = ct.match(/image\/(jpeg|jpg|png|gif|webp)/i);
  if (!m) return null;
  const t = m[1].toLowerCase();
  if (t === "jpeg" || t === "jpg") return ".jpg";
  return `.${t}`;
}

function extFromUrl(url) {
  try {
    const u = new URL(url);
    const e = path.extname(u.pathname).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(e)) {
      return e === ".jpeg" ? ".jpg" : e;
    }
  } catch {
    /* ignore */
  }
  return ".jpg";
}

async function downloadImage(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; lithiumwow-gallery-sync/1.0; +https://lithiumwow.github.io/photos/)",
    },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`GET ${url} → ${res.status} ${res.statusText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const ext =
    extFromContentType(res.headers.get("content-type")) || extFromUrl(url);
  return { buf, ext };
}

function parseUrlsFile(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const parts = t.split(",").map((p) => p.trim());
    const url = parts[0];
    if (!/^https?:\/\//i.test(url)) continue;
    out.push({
      source: url,
      caption: parts[1] || "",
      id: `url-${out.length + 1}`,
    });
  }
  return out;
}

async function loadUrlsFromFile(filePath) {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);
  const text = await fs.readFile(abs, "utf8");
  return parseUrlsFile(text);
}

async function fetchGraphPagePhotos(accessToken, pageId, max) {
  const items = [];
  let next = `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(
    pageId,
  )}/photos?type=uploaded&fields=id,images,name&limit=50&access_token=${encodeURIComponent(
    accessToken,
  )}`;

  while (next && items.length < max) {
    const res = await fetch(next);
    const data = await res.json();
    if (data.error) {
      throw new Error(
        data.error.message || `Graph API error: ${JSON.stringify(data.error)}`,
      );
    }
    for (const p of data.data || []) {
      if (items.length >= max) break;
      const imgs = p.images || [];
      if (!imgs.length) continue;
      const best = imgs.reduce((a, b) => (b.width > a.width ? b : a));
      items.push({
        id: p.id,
        source: best.source,
        caption: (p.name || "").trim(),
      });
    }
    next =
      items.length >= max
        ? null
        : data.paging?.next
          ? data.paging.next
          : null;
  }
  return items;
}

function printHelp() {
  console.log(`Usage:
  node scripts/sync-facebook-gallery.mjs --graph [--max N]
  node scripts/sync-facebook-gallery.mjs --urls <file.txt> [--max N]
  node scripts/sync-facebook-gallery.mjs --dry-run ...   (no writes)

Environment:
  FACEBOOK_PAGE_ACCESS_TOKEN   Required for --graph
  FACEBOOK_PAGE_ID             Optional, default ${DEFAULT_PAGE_ID}

URL file: one image URL per line. Optional caption after comma:
  https://example.com/a.jpg, Sunset
`);
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  const dryRun = argv.includes("--dry-run");
  const maxArg = argv.indexOf("--max");
  const max =
    maxArg >= 0 && argv[maxArg + 1]
      ? Math.max(1, parseInt(argv[maxArg + 1], 10) || 30)
      : 30;

  const hasGraph = argv.includes("--graph");
  const urlsIdx = argv.indexOf("--urls");
  const hasUrls = urlsIdx >= 0;

  if (hasGraph && hasUrls) {
    console.error("Use either --graph or --urls, not both.");
    process.exit(1);
  }
  if (!hasGraph && !hasUrls) {
    printHelp();
    process.exit(1);
  }

  const mode = hasGraph ? "graph" : "urls";
  let urlsPath = null;
  if (mode === "urls") {
    urlsPath = argv[urlsIdx + 1];
    if (!urlsPath) {
      console.error("Missing path after --urls");
      process.exit(1);
    }
  }

  let items = [];
  if (mode === "urls") {
    items = await loadUrlsFromFile(urlsPath);
    items = items.slice(0, max);
    if (!items.length) {
      console.error("No valid URLs in file.");
      process.exit(1);
    }
  } else {
    const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    if (!token) {
      console.error(
        "Set FACEBOOK_PAGE_ACCESS_TOKEN for --graph (see script header comments).",
      );
      process.exit(1);
    }
    const pageId = process.env.FACEBOOK_PAGE_ID || DEFAULT_PAGE_ID;
    items = await fetchGraphPagePhotos(token, pageId, max);
    if (!items.length) {
      console.error(
        "Graph API returned no photos. Check token permissions and page ID.",
      );
      process.exit(1);
    }
  }

  console.log(`Preparing ${items.length} photo(s) (dry-run=${dryRun})`);

  await fs.mkdir(GALLERY_DIR, { recursive: true });

  for (let i = 0; i < items.length; i++) {
    const p = items[i];
    const seq = String(i + 1).padStart(3, "0");
    if (!dryRun) {
      const { buf, ext: e } = await downloadImage(p.source);
      const filename =
        mode === "graph" ? `fb-${p.id}${e}` : `import-${seq}${e}`;
      const destAbs = path.join(GALLERY_DIR, filename);
      await fs.writeFile(destAbs, buf);
      console.log(`  saved /images/gallery/${filename}`);
    } else {
      const ext = extFromUrl(p.source);
      const filename =
        mode === "graph" ? `fb-${p.id}${ext}` : `import-${seq}${ext}`;
      console.log(
        `  would save /images/gallery/${filename} ← ${p.source.slice(0, 72)}…`,
      );
    }
  }

  if (!dryRun) {
    const { generateGalleryManifest } = await import(
      "./generate-gallery-manifest.mjs"
    );
    await generateGalleryManifest();
    console.log(`Updated ${path.relative(ROOT, "photos/gallery-manifest.json")}`);
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
