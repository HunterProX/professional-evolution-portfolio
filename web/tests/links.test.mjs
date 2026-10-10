/**
 * Broken link checker — validates all internal links and anchors in built HTML.
 *
 * Scans `web/dist/` for HTML files, extracts `href` and `src` attributes,
 * verifies internal links resolve to files in the build output, and checks
 * anchor links point to existing IDs. External URLs are validated for format
 * only (no network calls).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';

const DIST = resolve(import.meta.dirname, '..', 'dist');
const BASE_PATH = '/professional-evolution-portfolio';

/** Strip the GitHub Pages base path prefix from internal links. */
function stripBasePath(link) {
  if (link.startsWith(`${BASE_PATH}/`)) return link.slice(BASE_PATH.length);
  if (link === BASE_PATH) return '/';
  return link;
}

function listHtmlFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...listHtmlFiles(full));
    } else if (entry.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

function extractLinks(html) {
  const hrefs = [...html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
  const srcs = [...html.matchAll(/src\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
  return [...hrefs, ...srcs];
}

function extractIds(html) {
  return new Set([...html.matchAll(/id\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]));
}

function isExternal(url) {
  return /^https?:\/\//i.test(url) || /^mailto:/i.test(url) || /^tel:/i.test(url);
}

test('built HTML contains no broken internal links or anchors', () => {
  assert.ok(existsSync(DIST), `dist directory must exist at ${DIST}`);
  const htmlFiles = listHtmlFiles(DIST);
  assert.ok(htmlFiles.length > 0, 'dist must contain at least one HTML file');

  const errors = [];

  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    const ids = extractIds(html);
    const links = extractLinks(html);
    const fileRel = relative(DIST, file).replace(/\\/g, '/');

    for (const rawLink of links) {
      const link = stripBasePath(rawLink);
      if (isExternal(link) || link.startsWith('data:') || link.startsWith('javascript:')) continue;
      if (link === '' || link === '#') continue;

      const [pathPart, fragment] = link.split('#');

      if (pathPart) {
        const resolved = pathPart.startsWith('/')
          ? join(DIST, pathPart.slice(1))
          : resolve(dirname(file), pathPart);

        if (!existsSync(resolved)) {
          const dirIndex = join(resolved, 'index.html');
          if (!existsSync(dirIndex)) {
            errors.push(`${fileRel}: broken internal link "${link}"`);
          }
        }
      }

      if (fragment && pathPart) {
        const targetFile = pathPart.startsWith('/')
          ? join(DIST, pathPart.slice(1))
          : resolve(dirname(file), pathPart);
        let targetHtml = targetFile;
        if (existsSync(targetFile) && statSync(targetFile).isDirectory()) {
          targetHtml = join(targetFile, 'index.html');
        } else if (!existsSync(targetFile)) {
          targetHtml = join(targetFile, 'index.html');
        }
        if (existsSync(targetHtml) && statSync(targetHtml).isFile()) {
          const targetIds = extractIds(readFileSync(targetHtml, 'utf8'));
          if (!targetIds.has(fragment)) {
            errors.push(`${fileRel}: broken anchor "#${fragment}" in "${link}"`);
          }
        }
      } else if (fragment && !pathPart) {
        if (!ids.has(fragment)) {
          errors.push(`${fileRel}: broken same-page anchor "#${fragment}"`);
        }
      }
    }
  }

  assert.deepEqual(errors, [], `Found ${errors.length} broken links:\n${errors.join('\n')}`);
});

test('all external URLs have valid format', () => {
  const htmlFiles = listHtmlFiles(DIST);
  const errors = [];

  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    const links = extractLinks(html);
    const fileRel = relative(DIST, file).replace(/\\/g, '/');

    for (const rawLink of links) {
      const link = stripBasePath(rawLink);
      if (!isExternal(link)) continue;
      if (link.startsWith('mailto:')) {
        if (!/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/.test(link)) {
          errors.push(`${fileRel}: invalid mailto "${link}"`);
        }
        continue;
      }
      if (link.startsWith('tel:')) continue;
      try {
        new URL(link);
      } catch {
        errors.push(`${fileRel}: invalid URL "${link}"`);
      }
    }
  }

  assert.deepEqual(errors, [], `Found ${errors.length} invalid external URLs:\n${errors.join('\n')}`);
});
