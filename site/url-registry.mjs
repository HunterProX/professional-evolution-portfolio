import { readFile } from "node:fs/promises";

export async function loadRegistry() {
  return JSON.parse(await readFile(new URL("./site-config.json", import.meta.url), "utf8"));
}

export function deploymentUrl(deployment) {
  const base = deployment.base_path === "/" ? "" : `/${deployment.base_path.replace(/^\/+|\/+$/g, "")}`;
  return `${deployment.origin.replace(/\/$/, "")}${base}/`;
}

export function validateRegistry(registry) {
  const failures = [];
  if (!registry?.schema_version || !registry?.canonical_deployment_id) failures.push("schema_version and canonical_deployment_id are required");
  if (!Array.isArray(registry?.deployments) || registry.deployments.length === 0) failures.push("at least one deployment is required");
  const ids = new Set();
  for (const deployment of registry.deployments || []) {
    if (ids.has(deployment.id)) failures.push(`duplicate deployment id: ${deployment.id}`);
    ids.add(deployment.id);
    if (!/^https:\/\/[^\s/]+$/.test(deployment.origin)) failures.push(`invalid HTTPS origin: ${deployment.id}`);
    if (!deployment.base_path.startsWith("/")) failures.push(`base_path must start with /: ${deployment.id}`);
    if (deployment.enabled && !["canonical", "mirror"].includes(deployment.role)) failures.push(`invalid role: ${deployment.id}`);
  }
  const canonical = registry.deployments?.filter((item) => item.role === "canonical" && item.enabled) || [];
  if (canonical.length !== 1) failures.push("exactly one enabled canonical deployment is required");
  if (!ids.has(registry.canonical_deployment_id)) failures.push("canonical_deployment_id does not resolve");
  return failures;
}

if (process.argv[1]?.endsWith("url-registry.mjs")) {
  const failures = validateRegistry(await loadRegistry());
  if (failures.length) { console.error(failures.map((failure) => `URL REGISTRY FAIL: ${failure}`).join("\n")); process.exit(1); }
  console.log("URL REGISTRY PASS");
}
