#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const file = process.argv[2] ? resolve(process.argv[2]) : resolve(root, "github-activity/snapshot.json");
const raw = readFileSync(file, "utf8");
const doc = JSON.parse(raw); const errors = [];
if (raw !== JSON.stringify(doc, null, 2) + "\n") errors.push("snapshot must use deterministic two-space JSON formatting"); const fail = (message) => errors.push(message);
const iso = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(v);
const repoUrl = (v) => typeof v === "string" && /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(v);
const objectUrl = (v) => typeof v === "string" && /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/(pull|commit|releases\/tag|deployments)\/[^\s]+$/.test(v);
if (doc.schema_version !== "1.0.0") fail("unsupported schema_version");
if (!iso(doc.captured_at)) fail("captured_at must be a UTC ISO timestamp");
if (!doc.status || !["available", "empty", "unavailable"].includes(doc.status.availability) || typeof doc.status.stale !== "boolean" || typeof doc.status.message !== "string") fail("invalid status contract");
if (!doc.source || doc.source.provider !== "github" || !["checked_in_fixture", "build_snapshot"].includes(doc.source.mode) || doc.source.url !== "https://github.com/") fail("invalid source contract");
if (!Array.isArray(doc.allowed_repositories) || !doc.allowed_repositories.length || new Set(doc.allowed_repositories).size !== doc.allowed_repositories.length) fail("allowlist must contain unique repositories");
for (const url of doc.allowed_repositories || []) if (!repoUrl(url)) fail(`non-public repository in allowlist: ${url}`);
if (!Array.isArray(doc.repositories)) fail("repositories must be an array");
const allowed = new Set(doc.allowed_repositories || []);
for (const repository of doc.repositories || []) {
  if (!repository || repository.visibility !== "public" || !repoUrl(repository.url) || !allowed.has(repository.url)) fail("repository is not public and allowlisted");
  for (const kind of ["pull_requests", "commits", "releases", "deployments"]) { if (!Array.isArray(repository[kind])) fail(`${kind} must be an array`); for (const item of repository[kind] || []) if (!item || !objectUrl(item.url) || !iso(item.captured_at) || typeof item.title !== "string") fail(`invalid ${kind} object`); }
}
if (/(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}|-----BEGIN .*PRIVATE KEY-----|(?:personal|private)\s+repository/i.test(raw)) fail("snapshot contains credential or private-data marker");
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`GitHub activity snapshot valid: ${file}`);
