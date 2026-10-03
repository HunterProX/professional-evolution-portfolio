import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = await readFile(resolve(root, "index.html"), "utf8");
const locales = ["en", "es"];
const catalogs = Object.fromEntries(await Promise.all(locales.map(async (locale) => [locale, JSON.parse(await readFile(resolve(root, `site/i18n/${locale}.json`), "utf8"))])));
const requiredClaimIds = JSON.parse(await readFile(resolve(root, "public-snapshot/snapshot.json"), "utf8")).claims.map((claim) => claim.id);
for (const locale of locales) {
  const catalog = catalogs[locale];
  const missing = requiredClaimIds.filter((id) => !catalog.claims[id]?.text || !catalog.claims[id]?.notes);
  if (missing.length) throw new Error(`${locale}: missing reviewed translations for ${missing.join(", ")}`);
  const output = source
    .replace('<html lang="en">', `<html lang="${locale}">`)
    .replace(/<title>[^<]+<\/title>/, `<title>${catalog.meta.title}</title>`)
    .replace(/(<meta name="description" content=")[^"]+(">)/, `$1${catalog.meta.description}$2`)
    .replace('href="site/styles.css"', 'href="../site/styles.css"')
    .replace('href="site/i18n.css"', 'href="../site/i18n.css"')
    .replace('src="site/app.js"', 'src="../site/app.js"')
    .replace('href="/en/"', 'href="../en/"')
    .replace('href="/es/"', 'href="../es/"')
    .replace('<script type="module" src="../site/app.js"></script>', '<script type="module" src="../site/app.js"></script>');
  const target = resolve(root, locale, "index.html");
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, output, "utf8");
}
await writeFile(resolve(root, "en", "index.html"), (await readFile(resolve(root, "en", "index.html"), "utf8")).replace('public-snapshot/snapshot.json', '../public-snapshot/snapshot.json'), "utf8");
await writeFile(resolve(root, "es", "index.html"), (await readFile(resolve(root, "es", "index.html"), "utf8")).replace('public-snapshot/snapshot.json', '../public-snapshot/snapshot.json'), "utf8");
console.log(`Built locales: ${locales.join(", ")}`);
