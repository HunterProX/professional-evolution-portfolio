import { readFile } from "node:fs/promises";

const snapshot = JSON.parse(await readFile("public-snapshot/snapshot.json", "utf8"));
const en = JSON.parse(await readFile("site/i18n/en.json", "utf8"));
const es = JSON.parse(await readFile("site/i18n/es.json", "utf8"));
const failures = [];
for (const id of snapshot.claims.map((claim) => claim.id)) {
  if (!en.claims[id]?.text || !es.claims[id]?.text) failures.push(`Missing claim translation: ${id}`);
}
if (snapshot.requires_human_review !== true) failures.push("Snapshot must remain marked for human review.");
if (!snapshot.evidence.every((entry) => entry.public === true && entry.url.startsWith("https://"))) failures.push("Every evidence record must be a public HTTPS URL.");
if (failures.length) { console.error(failures.map((failure) => `DOCTOR FAIL: ${failure}`).join("\n")); process.exit(1); }
console.log("DOCTOR PASS: snapshot, public evidence, and locale catalogs are aligned.");
