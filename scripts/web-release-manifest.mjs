import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// Emits release-manifest.json into web/dist for GitHub Pages / Cloudflare
// Worker parity checks. Same shape as site/release-build.mjs
// (docs/dual-deployment.md contract): per-target deployment_id / site_origin /
// base_path, but the SAME source_commit + snapshot_id across both hosts.
//
// RELEASE_TARGET selects the destination host (default: github-pages). The
// Cloudflare Worker origin mirrors the `cloudflare-worker` entry in
// site/site-config.json (the registry read by site/release-build.mjs); it can
// be overridden with CF_ORIGIN.
const TARGETS = {
  "github-pages": {
    deployment_id: "github-pages",
    site_origin: "https://cristian-cardona-dev.github.io",
    base_path: "/professional-evolution-portfolio/",
  },
  "cloudflare-worker": {
    deployment_id: "cloudflare-worker",
    site_origin: process.env.CF_ORIGIN || "https://professional-evolution-portfolio.crisss198.workers.dev",
    base_path: "/",
  },
};
const targetId = process.env.RELEASE_TARGET || "github-pages";
const target = TARGETS[targetId];
if (!target) throw new Error(`Unknown web release target: ${targetId}`);
const root = process.cwd();
const out = resolve(root, "web/dist/release-manifest.json");
let sourceCommit = "unknown";
try { sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(); } catch {}
const snapshot = JSON.parse(await readFile(resolve(root, "public-snapshot/snapshot.json"), "utf8"));
const manifest = {
  source_commit: sourceCommit,
  snapshot_id: snapshot.snapshot_id,
  deployment_id: target.deployment_id,
  site_origin: target.site_origin,
  base_path: target.base_path,
  generated_at: new Date().toISOString(),
};
await writeFile(out, JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log(`web release manifest ready: ${out} (${target.deployment_id})`);
