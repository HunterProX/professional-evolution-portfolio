import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);
const root = resolve(import.meta.dirname, "..");
const activity = JSON.parse(await readFile(resolve(root, "github-activity/snapshot.json"), "utf8"));
const activitySchema = JSON.parse(await readFile(resolve(root, "github-activity/schema.json"), "utf8"));
const snapshot = JSON.parse(await readFile(resolve(root, "public-snapshot/snapshot.json"), "utf8"));
const html = await readFile(resolve(root, "index.html"), "utf8");
const css = await readFile(resolve(root, "site/styles.css"), "utf8");
const app = await readFile(resolve(root, "site/app.js"), "utf8");
const registry = JSON.parse(await readFile(resolve(root, "site/site-config.json"), "utf8"));
const enPage = await readFile(resolve(root, "en/index.html"), "utf8").catch(() => "");
const esPage = await readFile(resolve(root, "es/index.html"), "utf8").catch(() => "");
test("portfolio UI uses the approved snapshot as its only data source", () => { assert.match(app, /public-snapshot\/snapshot\.json/); assert.doesNotMatch(app, /personal-wt|portfolio-work|Desktop|Users[\\/]/i); assert.doesNotMatch(html, /portfolio-work|Desktop|Users[\\/]/i); });
test("portfolio includes required evidence-first sections", () => { for (const section of ["evidence", "projects", "trajectory", "goals", "boundaries"]) assert.match(html, new RegExp(`id="${section}"`)); assert.match(css, /prefers-reduced-motion/); assert.match(css, /:focus-visible/); });
test("rendered data remains bounded to snapshot records", () => { assert.equal(snapshot.claims.length, 12); assert.equal(snapshot.projects.length, 4); assert.equal(Object.keys(snapshot.goals).length, 3); assert.equal(snapshot.requires_human_review, true); });
test("site does not contain unsupported marketing claims", () => { assert.doesNotMatch(`${app}\n${css}`, /10\+|years of experience|cost reduction|AWS|GCP|Kubernetes|Terraform/i); });
test("localized pages are generated with correct language routes", () => { assert.match(enPage, /<html lang="en">/); assert.match(esPage, /<html lang="es">/); assert.match(enPage, /src="\.\.\/site\/app\.js"/); assert.match(esPage, /src="\.\.\/site\/app\.js"/); assert.match(html, /href="en\/"/); assert.match(html, /href="es\/"/); assert.match(html, /language-switcher/); });
test("locale catalogs have complete claim parity", async () => { const en = JSON.parse(await readFile(resolve(root, "site/i18n/en.json"), "utf8")); const es = JSON.parse(await readFile(resolve(root, "site/i18n/es.json"), "utf8")); assert.deepEqual(Object.keys(en.claims).sort(), Object.keys(es.claims).sort()); assert.deepEqual(Object.keys(en.projects).sort(), Object.keys(es.projects).sort()); assert.deepEqual(Object.keys(en.goals).sort(), Object.keys(es.goals).sort()); });
test("URL registry has one canonical and a distinct mirror", () => { assert.equal(registry.deployments.filter((item) => item.role === "canonical" && item.enabled).length, 1); assert.ok(registry.deployments.some((item) => item.role === "mirror")); assert.match(registry.canonical_deployment_id, /^[a-z0-9-]+$/); });
test("release build script exists and emits a manifest contract", async () => { const build = await readFile(resolve(root, "site/release-build.mjs"), "utf8"); assert.match(build, /release-manifest\.json/); assert.match(build, /SITE_ORIGIN/); assert.match(build, /SITE_BASE_PATH/); });

test("GitHub activity contract is public, allowlisted, and empty without inventing activity", () => { assert.equal(activitySchema.properties.schema_version.const, "1.0.0"); assert.equal(activity.source.mode, "checked_in_fixture"); assert.equal(activity.status.availability, "empty"); assert.equal(activity.repositories.length, 0); assert.ok(activity.allowed_repositories.every((url) => /^https:\/\/github\.com\/[^/]+\/[^/]+$/.test(url))); assert.match(app, /github-activity\/snapshot\.json/); assert.doesNotMatch(JSON.stringify(activity), /private|token|localhost|Users[\\/]/i); });
test("GitHub activity rendering is offline and bilingual", () => { assert.match(app, /renderGithubActivity/); assert.match(app, /github_activity_empty/); assert.match(enPage, /github-activity/); assert.match(esPage, /github-activity/); });
test("rendered navigation uses stable keys and complete English/Spanish labels", async () => {
  for (const page of [html, enPage, esPage]) for (const key of ["evidence", "projects", "github_activity_label", "trajectory", "goals"]) assert.match(page, new RegExp(`data-nav-key="${key}"`));
  const en = JSON.parse(await readFile(resolve(root, "site/i18n/en.json"), "utf8")); const es = JSON.parse(await readFile(resolve(root, "site/i18n/es.json"), "utf8"));
  assert.deepEqual([en.ui.evidence, en.ui.projects, en.ui.github_activity_label, en.ui.trajectory, en.ui.goals], ["Evidence", "Projects", "GitHub", "Trajectory", "Goals"]);
  assert.deepEqual([es.ui.evidence, es.ui.projects, es.ui.github_activity_label, es.ui.trajectory, es.ui.goals], ["Evidencia", "Proyectos", "GitHub", "Trayectoria", "Objetivos"]);
  assert.match(app, /data-nav-key=\\"github_activity_label\\"/); assert.doesNotMatch(app, /primary-nav a:nth-child/);
});
test("activity validator enforces malformed records, ownership, and stale policy", async () => {
  const validator = resolve(root, "github-activity/validate.mjs"); const fixtures = resolve(root, "github-activity/fixtures");
  await assert.rejects(run(process.execPath, [validator, resolve(fixtures, "malformed.json")]));
  for (const name of ["non-empty.json", "stale.json", "unavailable.json"]) await run(process.execPath, [validator, resolve(fixtures, name)]);
  assert.match(await readFile(resolve(fixtures, "non-empty.json"), "utf8"), /pull\/1/); assert.match(await readFile(resolve(fixtures, "stale.json"), "utf8"), /stale_reason/);
});
test("activity rendering contract exposes inspectability and generated base paths", () => {
  assert.match(app, /github_activity_captured/); assert.match(app, /github_activity_message/); assert.match(app, /github_activity_source/); assert.match(app, /state\.activity = null/);
  assert.match(app, /github-activity\/snapshot\.json/); assert.match(enPage, /\.\.\/site\/app\.js/); assert.match(esPage, /\.\.\/site\/app\.js/);
});
