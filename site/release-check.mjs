import { readFile } from "node:fs/promises";

const origin = process.env.SITE_ORIGIN;
const failures = [];
if (!origin) failures.push("SITE_ORIGIN is required for canonical, hreflang, sitemap, and deployment metadata.");
else if (!/^https:\/\/[^\s/]+(?:\/[^\s]*)?$/.test(origin)) failures.push("SITE_ORIGIN must be an absolute HTTPS origin.");
const snapshot = JSON.parse(await readFile("public-snapshot/snapshot.json", "utf8"));
if (snapshot.snapshot_status !== "draft") failures.push("Snapshot must remain draft until human content approval.");
if (snapshot.requires_human_review !== true) failures.push("Snapshot requires_human_review must remain true.");
if (!snapshot.evidence.every((entry) => entry.public === true && entry.url.startsWith("https://"))) failures.push("All evidence must be public HTTPS URLs.");
if (failures.length) { console.error(["RELEASE BLOCKED", ...failures.map((failure) => `- ${failure}`)].join("\n")); process.exit(2); }
console.log(`RELEASE CHECK PASS: origin=${origin}; ${snapshot.evidence.length} public evidence records; human review remains required.`);
