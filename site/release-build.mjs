import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "dist");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
execFileSync(process.execPath, [resolve(root, "site/build.mjs")], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, OUTPUT_DIR: "dist" },
});
await cp(resolve(root, "public-snapshot"), resolve(output, "public-snapshot"), { recursive: true });
await mkdir(resolve(output, "site/i18n"), { recursive: true });
for (const file of ["app.js", "styles.css", "i18n.css"]) await cp(resolve(root, `site/${file}`), resolve(output, `site/${file}`));
for (const locale of ["en", "es"]) await cp(resolve(root, `site/i18n/${locale}.json`), resolve(output, `site/i18n/${locale}.json`));
let sourceCommit = "unknown";
try { sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(); } catch {}
const snapshot = JSON.parse(await readFile(resolve(root, "public-snapshot/snapshot.json"), "utf8"));
const manifest = {
  source_commit: sourceCommit,
  snapshot_id: snapshot.snapshot_id,
  site_origin: process.env.SITE_ORIGIN || null,
  base_path: process.env.SITE_BASE_PATH || "/",
  generated_at: new Date().toISOString(),
};
await writeFile(resolve(output, "release-manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log(`Release artifact ready: ${output}`);
