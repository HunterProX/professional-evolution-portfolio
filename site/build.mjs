import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const basePath = process.env.SITE_BASE_PATH || "";
const outputRoot = process.env.OUTPUT_DIR ? resolve(root, process.env.OUTPUT_DIR) : root;
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
    .replace('src="site/theme.js"', 'src="../site/theme.js"')
    .replace('href="site/styles.css"', 'href="../site/styles.css"')
    .replace('href="site/i18n.css"', 'href="../site/i18n.css"')
    .replace('href="site/theme.css"', 'href="../site/theme.css"')
    .replace('src="site/app.js"', 'src="../site/app.js"')
    .replace('href="en/"', 'href="../en/"')
    .replace('href="es/"', 'href="../es/"')
    .replace('<script type="module" src="../site/app.js"></script>', '<script type="module" src="../site/app.js"></script>');
  const localizedOutput = locale === "es"
    ? output.replace('aria-label="Dark theme active. Switch to light theme" aria-pressed="false">Dark theme</button>', 'aria-label="Tema oscuro activo. Cambiar a tema claro" aria-pressed="false">Tema oscuro</button>')
    : output;
  const target = resolve(outputRoot, locale, "index.html");
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, localizedOutput, "utf8");
}
const rootPage = source.replace(/<html lang="en">/, '<html lang="en">');
await mkdir(outputRoot, { recursive: true });
await writeFile(resolve(outputRoot, "index.html"), rootPage, "utf8");
for (const locale of locales) {
  const target = resolve(outputRoot, locale, "index.html");
  const page = await readFile(target, "utf8");
  await writeFile(target, page.replace('public-snapshot/snapshot.json', '../public-snapshot/snapshot.json').replace('github-activity/snapshot.json', '../github-activity/snapshot.json'), "utf8");
}
console.log(`Built locales: ${locales.join(", ")}`);
console.log(`Target base path: ${basePath || "/"}`);
