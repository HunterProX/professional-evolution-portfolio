import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// Emits release-manifest.json into web/dist for GitHub Pages parity checks.
// Same shape as site/release-build.mjs (docs/dual-deployment.md contract).
const root = process.cwd();
const out = resolve(root, "web/dist/release-manifest.json");
let sourceCommit = "unknown";
try { sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(); } catch {}
const snapshot = JSON.parse(await readFile(resolve(root, "public-snapshot/snapshot.json"), "utf8"));
const manifest = {
  source_commit: sourceCommit,
  snapshot_id: snapshot.snapshot_id,
  deployment_id: "github-pages-web",
  site_origin: "https://cristian-cardona-dev.github.io",
  base_path: "/professional-evolution-portfolio/",
  generated_at: new Date().toISOString(),
};
await writeFile(out, JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log(`web release manifest ready: ${out}`);
