#!/usr/bin/env node
/**
 * sitemap-generate.mjs — emit `web/dist/sitemap.xml` from the built HTML files.
 *
 * Usage: runs as the `postbuild` step of `npm --prefix web run build`.
 *
 * Design:
 *   - The source of truth is the build output itself: every `index.html` under
 *     `web/dist` is a real route that Astro rendered, so the sitemap cannot
 *     list a page that does not exist, nor miss one that does.
 *   - URLs are `site + base + route`, matching the canonical URLs BaseLayout
 *     emits. `SITE` and `BASE` below must stay in sync with
 *     `web/astro.config.mjs` (they are duplicated because a build script runs
 *     before any page and importing the Astro config would drag in the whole
 *     toolchain for two strings).
 *   - Output is deterministic: routes are sorted lexicographically, and the
 *     file always ends with a newline.
 *
 * No dependencies. Exits non-zero if `web/dist` is missing (i.e. the build
 * did not run), so a broken wiring fails the build instead of silently
 * publishing no sitemap.
 */
import { readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'web', 'dist');

// Keep in sync with web/astro.config.mjs.
const SITE = 'https://cristian-cardona-dev.github.io';
const BASE = '/professional-evolution-portfolio/';

/** Recursively collect every `index.html` under `dir` (a routed page). */
function collectPages(dir) {
  const pages = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      // `_astro` holds hashed assets, not pages.
      if (entry.name.startsWith('_')) continue;
      pages.push(...collectPages(full));
    } else if (entry.name === 'index.html') {
      pages.push(full);
    }
  }
  return pages;
}

/** `dist/work/index.html` → `/professional-evolution-portfolio/work/`. */
function toRoute(file) {
  const dir = relative(DIST, dirname(file));
  const segments = dir === '' ? [] : dir.split(sep);
  return `${BASE}${segments.map(encodeURIComponent).join('/')}${segments.length > 0 ? '/' : ''}`;
}

const pages = collectPages(DIST);
if (pages.length === 0) {
  console.error(
    'sitemap:generate FAILED — no pages found in web/dist; run `astro build` first.',
  );
  process.exit(1);
}

const routes = [...new Set(pages.map(toRoute))].sort();
const lines = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...routes.map((route) => `  <url><loc>${SITE}${route}</loc></url>`),
  '</urlset>',
];

writeFileSync(join(DIST, 'sitemap.xml'), `${lines.join('\n')}\n`);
console.log(`sitemap:generate OK — ${routes.length} URLs written to web/dist/sitemap.xml`);
