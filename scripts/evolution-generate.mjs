#!/usr/bin/env node
/**
 * evolution-generate.mjs — derive milestone candidates from git history and
 * merge them into `data/evolution.json`.
 *
 * Usage: npm run evolution:generate   (add --dry-run to preview without writing)
 *
 * Rules:
 *   - only conventional-commit subjects (ai(...), docs(...), feat(...), ...) are used
 *   - merge commits are ignored
 *   - candidate ids are `git-<date>-<slug>`; commits sharing a subject and date
 *     collapse into one candidate whose evidence lists every matching commit
 *   - candidates whose id already exists are skipped, so curated entries always
 *     win and the script is idempotent
 *   - output is pretty-printed JSON with a trailing newline
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_FILE = join(ROOT, 'data', 'evolution.json');
const REPO_URL = 'https://github.com/cristian-cardona-dev/professional-evolution-portfolio';

const ALLOWED_TYPES = new Set([
  'ai', 'docs', 'doc', 'feat', 'fix', 'perf', 'refactor', 'release', 'ci', 'config', 'chore', 'test', 'build', 'style',
]);
const SUBJECT_PATTERN = /^([a-z]+)(?:\([^)]*\))?!?:\s*(.+)$/;
const MAX_SLUG_LENGTH = 80;

const dryRun = process.argv.includes('--dry-run');

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/, '');
}

function readGitLog() {
  let stdout;
  try {
    stdout = execFileSync(
      'git',
      ['log', '--reverse', '--date=short', '--pretty=format:%H%x09%ad%x09%s'],
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
    );
  } catch (error) {
    console.error(`evolution:generate FAILED — cannot read git log: ${error.message}`);
    process.exit(1);
  }
  return stdout
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const [hash, date, ...rest] = line.split('\t');
      return { hash: hash.trim(), date: date.trim(), subject: rest.join('\t').trim() };
    })
    .filter((entry) => entry.hash !== '' && entry.date !== '' && entry.subject !== '');
}

function toCandidate(commit) {
  const match = SUBJECT_PATTERN.exec(commit.subject);
  if (!match) return null; // not a conventional-commit subject (e.g. "Merge pull request ...")
  const [, type, description] = match;
  if (!ALLOWED_TYPES.has(type)) return null;
  const id = `git-${commit.date}-${slugify(commit.subject)}`;
  if (id === `git-${commit.date}-`) return null;
  return {
    id,
    date: commit.date,
    title: description.charAt(0).toUpperCase() + description.slice(1),
    subject: commit.subject,
    hash: commit.hash,
  };
}

function toMilestone(candidate, hashes) {
  return {
    id: candidate.id,
    date: candidate.date,
    title: candidate.title,
    narrative: `Derived from commit ${hashes[0].slice(0, 7)}: "${candidate.subject}". Candidate entry — review the narrative before promoting it to a curated milestone.`,
    evidence: hashes.map((hash) => `${REPO_URL}/commit/${hash}`),
    status: 'shipped',
    source: 'git',
  };
}

function loadData() {
  if (!existsSync(DATA_FILE)) {
    console.error('evolution:generate FAILED — data/evolution.json does not exist; create it before generating.');
    process.exit(1);
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
  } catch (error) {
    console.error(`evolution:generate FAILED — data/evolution.json is invalid JSON: ${error.message}`);
    process.exit(1);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !Array.isArray(parsed.milestones)) {
    console.error('evolution:generate FAILED — data/evolution.json must be an object with a "milestones" array.');
    process.exit(1);
  }
  return parsed;
}

function main() {
  const data = loadData();
  const knownIds = new Set(data.milestones.map((milestone) => milestone.id));
  const commits = readGitLog();

  // Commits sharing a subject and date collapse into one candidate whose
  // evidence lists every matching commit, oldest first (deterministic order).
  const candidates = new Map();
  for (const commit of commits) {
    const candidate = toCandidate(commit);
    if (!candidate) continue;
    if (knownIds.has(candidate.id)) continue; // curated or already generated — curated wins
    const existing = candidates.get(candidate.id);
    if (existing) {
      existing.hashes.push(commit.hash);
    } else {
      candidates.set(candidate.id, { ...candidate, hashes: [commit.hash] });
    }
  }

  const added = [...candidates.values()].map((candidate) => toMilestone(candidate, candidate.hashes));

  const total = data.milestones.length + added.length;
  const summary = `evolution:generate — commits ${commits.length}, existing ${data.milestones.length}, new ${added.length}, total ${total}${dryRun ? ' (dry run, nothing written)' : ''}`;

  if (dryRun) {
    console.log(summary);
    for (const milestone of added) console.log(`  + ${milestone.id}`);
    return;
  }

  writeFileSync(DATA_FILE, `${JSON.stringify({ ...data, milestones: [...data.milestones, ...added] }, null, 2)}\n`);
  console.log(summary);
}

main();
