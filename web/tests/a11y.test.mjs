/**
 * Accessibility testing — axe-core WCAG 2.2 AA compliance on built HTML.
 *
 * Parses built HTML from `web/dist/` with jsdom, runs axe-core against each
 * page (EN and ES), and asserts 0 WCAG AA violations.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { JSDOM } from 'jsdom';
import axe from 'axe-core';

const DIST = resolve(import.meta.dirname, '..', 'dist');

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

/**
 * Run axe-core against a JSDOM window.
 * Returns array of violations.
 */
function runAxe(dom) {
  return new Promise((resolvePromise, rejectPromise) => {
    const { window } = dom;
    // Execute axe-core source in the window context
    try {
      window.eval(axe.source);
    } catch (err) {
      rejectPromise(new Error(`axe-core eval failed: ${err.message}`));
      return;
    }

    const axeLib = window.axe;
    if (!axeLib) {
      rejectPromise(new Error('axe-core failed to inject'));
      return;
    }

    axeLib.run(window.document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      },
      resultTypes: ['violations'],
    })
      .then((results) => resolvePromise(results.violations))
      .catch(rejectPromise);
  });
}

test('all built pages pass WCAG 2.2 AA accessibility checks', async () => {
  assert.ok(existsSync(DIST), `dist directory must exist at ${DIST}`);
  const htmlFiles = listHtmlFiles(DIST);
  assert.ok(htmlFiles.length > 0, 'dist must contain at least one HTML file');

  const failures = [];

  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    const fileRel = relative(DIST, file).replace(/\\/g, '/');

    try {
      const dom = new JSDOM(html, {
        url: `https://example.com/${fileRel}`,
        runScripts: 'outside-only',
        pretendToBeVisual: true,
      });

      const violations = await runAxe(dom);

      if (violations.length > 0) {
        for (const v of violations) {
          for (const node of v.nodes) {
            const target = node.target?.join(' ') || 'unknown';
            const snippet = (node.html || '').substring(0, 200);
            failures.push(
              `${fileRel}: [${v.impact}] ${v.id} — target: ${target} — snippet: ${snippet}`
            );
          }
        }
      }

      dom.window.close();
    } catch (err) {
      failures.push(`${fileRel}: axe failed — ${err.message}`);
    }
  }

  assert.deepEqual(
    failures,
    [],
    `Found ${failures.length} accessibility violations:\n${failures.join('\n')}`
  );
});
