#!/usr/bin/env node
/**
 * evidence-sync.mjs — derive `data/evidence.json` from the approved public
 * snapshot (`public-snapshot/snapshot.json`).
 *
 * Usage: npm run evidence:sync
 *
 * The snapshot is the content source; this script only reshapes it. Mapping
 * (inspect-first and deliberately conservative):
 *   - source: `snapshot.evidence[]`, the snapshot's own evidence list.
 *   - label:  `title`. A missing/blank title is skipped, never invented.
 *   - url:    `url`, canonicalised so a legacy GitHub owner
 *             (`github.com/HunterProX/`, `github.com/tuuser/`) becomes the
 *             canonical owner (`github.com/cristian-cardona-dev/`).
 *   - status: `verification_status` mapped onto the claim-status vocabulary
 *             the site already uses for `EvidenceBadge`:
 *               verified_self_reported   -> demonstrated
 *               unverified_self_reported -> developing
 *             An unknown verification_status is skipped rather than guessed.
 *   - `public: false` entries are skipped: they are not public evidence.
 *
 * The output is deterministic and idempotent: `generatedAt` mirrors the source
 * snapshot's `generated_at` (never `Date.now()`), items keep the snapshot's
 * order, and duplicate canonical URLs collapse to their first occurrence — so
 * running the script twice produces byte-identical output.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_FILE = join(ROOT, 'public-snapshot', 'snapshot.json');
const OUTPUT_FILE = join(ROOT, 'data', 'evidence.json');

const CANONICAL_OWNER = 'cristian-cardona-dev';
const LEGACY_OWNERS = ['hunterprox', 'tuuser'];

/** Snapshot `verification_status` -> site claim status (see copy.ts). */
const STATUS_BY_VERIFICATION = {
  verified_self_reported: 'demonstrated',
  unverified_self_reported: 'developing',
};

const NOTE =
  'Derived from public-snapshot/snapshot.json by scripts/evidence-sync.mjs; validate with scripts/data-validate.mjs.';

function fail(message) {
  console.error(`evidence:sync FAILED — ${message}`);
  process.exit(1);
}

/**
 * Canonicalise a public URL. Returns `null` for anything that is not a usable
 * https URL, so a malformed entry is skipped instead of written out.
 */
function canonicalizeUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  if (url.hostname.toLowerCase() === 'github.com') {
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments.length > 0 && LEGACY_OWNERS.includes(segments[0].toLowerCase())) {
      segments[0] = CANONICAL_OWNER;
      url.pathname = `/${segments.join('/')}`;
    }
  }
  return url.toString();
}

function readSnapshot() {
  if (!existsSync(SNAPSHOT_FILE)) {
    fail('snapshot not found at public-snapshot/snapshot.json');
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(SNAPSHOT_FILE, 'utf8'));
  } catch (error) {
    fail(`snapshot is invalid JSON — ${error.message}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    fail('snapshot must be a JSON object');
  }
  return parsed;
}

function extractItems(snapshot) {
  const source = Array.isArray(snapshot.evidence) ? snapshot.evidence : [];
  const items = [];
  const seen = new Set();

  for (const entry of source) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    if (entry.public === false) continue;

    const label = typeof entry.title === 'string' ? entry.title.trim() : '';
    const status = STATUS_BY_VERIFICATION[entry.verification_status];
    // Ambiguous or unlabelled evidence is skipped, never guessed.
    if (label === '' || status === undefined) continue;

    const url = typeof entry.url === 'string' ? canonicalizeUrl(entry.url) : null;
    if (url === null) continue;
    if (seen.has(url)) continue;

    seen.add(url);
    items.push({ label, url, status });
  }

  return items;
}

function main() {
  const snapshot = readSnapshot();
  const items = extractItems(snapshot);

  // The canonicalisation must be complete: no legacy owner may survive.
  const leaked = items.filter((item) =>
    LEGACY_OWNERS.some((owner) => item.url.toLowerCase().includes(owner)),
  );
  if (leaked.length > 0) {
    fail(`canonicalisation incomplete: ${leaked.map((item) => item.url).join(', ')}`);
  }

  const output = {
    note: NOTE,
    generatedAt: typeof snapshot.generated_at === 'string' ? snapshot.generated_at : null,
    items,
  };

  writeFileSync(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`);
  console.log(
    `evidence:sync — items ${items.length}, generatedAt ${output.generatedAt} (mirrors snapshot)`,
  );
}

main();
