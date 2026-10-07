import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
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
test("employment and exploratory systems-review paths stay separate and evidence-bounded", async () => {
  for (const page of [html, enPage, esPage]) {
    assert.match(page, /data-nav-key="professional_opportunities"[^>]+href="#professional-opportunities"/);
    assert.match(page, /data-nav-key="services_review"[^>]+href="#systems-review"/);
    assert.match(page, /id="professional-opportunities"[\s\S]*?href="https:\/\/www\.linkedin\.com\/in\/cristian-cardona-dev\/"/);
    assert.match(page, /id="systems-review"[\s\S]*?href="#evidence-index"/);
    assert.match(page, /not a validated or packaged service/i);
    assert.doesNotMatch(page, /<form\b|mailto:/i);
  }
  const en = JSON.parse(await readFile(resolve(root, "site/i18n/en.json"), "utf8")); const es = JSON.parse(await readFile(resolve(root, "site/i18n/es.json"), "utf8"));
  for (const key of ["professional_opportunities", "services_review", "paths_heading", "paths_intro", "professional_path_label", "professional_path_text", "professional_path_cta", "systems_path_label", "systems_path_text", "systems_path_cta"]) { assert.ok(en.ui[key]); assert.ok(es.ui[key]); }
  assert.match(en.ui.systems_path_text, /exploratory|not a validated/i); assert.match(es.ui.systems_path_text, /exploratoria|No es un servicio validado/i);
  assert.match(app, /renderCommercialText\(\)/);
});
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
test("activity validator reports null repositories and records without uncaught TypeError", async () => {
  const validator = resolve(root, "github-activity/validate.mjs"); const fixtures = resolve(root, "github-activity/fixtures"); const directory = await mkdtemp(resolve(tmpdir(), "github-activity-test-"));
  try {
    const cases = [{ name: "null-repository", source: "non-empty.json", mutate: (doc) => { doc.repositories = [null]; } }, { name: "null-repository-url-with-valid-activity", source: "non-empty.json", mutate: (doc) => { doc.repositories[0].url = null; } }, { name: "non-string-repository-url-with-valid-activity", source: "non-empty.json", mutate: (doc) => { doc.repositories[0].url = 42; } }, { name: "null-activity", source: "non-empty.json", mutate: (doc) => { doc.repositories[0].pull_requests = [null]; } }];
    for (const item of cases) {
      const doc = JSON.parse(await readFile(resolve(fixtures, item.source), "utf8")); item.mutate(doc); const file = resolve(directory, `${item.name}.json`); await writeFile(file, `${JSON.stringify(doc, null, 2)}\n`);
      await assert.rejects(run(process.execPath, [validator, file]), (error) => { assert.doesNotMatch(error.stderr, /TypeError|Cannot read properties/); assert.match(error.stderr, /repository|object|invalid/i); return true; });
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});
test("activity source has no visible replacement characters", () => { assert.doesNotMatch(app, /\uFFFD/); });

class TestNode {
  constructor(tag = "div", text = "") { this.tagName = tag; this.children = []; this._text = text; this.className = ""; this.attributes = {}; }
  set textContent(value) { this.children = []; this._text = String(value); }
  get textContent() { return this._text + this.children.map((child) => child.textContent).join(""); }
  append(...nodes) { this._text = ""; this.children.push(...nodes); }
  replaceChildren(...nodes) { this._text = ""; this.children = [...nodes]; }
  setAttribute(name, value) { this.attributes[name] = value; }
  getAttribute(name) { return this.attributes[name]; }
  addEventListener() {}
  toggleAttribute() {}
}
function makeTestDocument() {
  const ids = Object.fromEntries(["claims-grid", "projects-grid", "evidence-grid", "goals-grid", "github-activity-grid", "snapshot-version", "footer-snapshot-id"].map((id) => [id, new TestNode("div")]));
  const description = new TestNode("meta");
  const nodes = { ".language-switcher a": [], "[data-filter]": [], 'meta[name="description"]': description };
  return { documentElement: { lang: "en" }, title: "", createElement: (tag) => new TestNode(tag), getElementById: (id) => ids[id], querySelector: (selector) => selector.startsWith("#") ? ids[selector.slice(1)] : nodes[selector] || null, querySelectorAll: (selector) => nodes[selector] || [], ids };
}
test("activity fixtures render cards, stale/empty/unavailable states, and preserve snapshot content", async () => {
  globalThis.__PORTFOLIO_TEST__ = true; globalThis.document = makeTestDocument(); globalThis.window = { location: { pathname: "/" } };
  const appModule = await import(`${pathToFileURL(resolve(root, "site/app.js"))}?render-tests`); const catalog = JSON.parse(await readFile(resolve(root, "site/i18n/en.json"), "utf8")); const fixtures = resolve(root, "github-activity/fixtures"); const snapshot = JSON.parse(await readFile(resolve(root, "public-snapshot/snapshot.json"), "utf8"));
  const fixture = async (name) => JSON.parse(await readFile(resolve(fixtures, name), "utf8")); const render = async (activityLoader) => { await appModule.boot({ snapshot, catalog, loadActivity: activityLoader }); assert.match(document.ids["claims-grid"].textContent, /evidence/i); return document.ids["github-activity-grid"].textContent; };
  assert.match(await render(() => fixture("non-empty.json")), /Add public activity snapshot/); const staleText = await render(() => fixture("stale.json")); assert.match(staleText, /Reviewed fixture retained/); assert.match(staleText, /No selected public pull requests/); assert.match(await render(() => fixture("unavailable.json")), /unavailable/i); assert.match(await render(() => Promise.reject(new Error("isolated activity failure"))), /unavailable/i); assert.match(document.ids["projects-grid"].textContent, /Cloud|AI|project/i);
});
test("activity rendering contract exposes inspectability and generated base paths", () => {
  assert.match(app, /github_activity_captured/); assert.match(app, /github_activity_message/); assert.match(app, /github_activity_source/); assert.match(app, /state\.activity = null/);
  assert.match(app, /github-activity\/snapshot\.json/); assert.match(enPage, /\.\.\/site\/app\.js/); assert.match(esPage, /\.\.\/site\/app\.js/);
});
