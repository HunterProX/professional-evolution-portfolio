// @ts-check
import { defineConfig } from 'astro/config';

// Canonical deployment target (GitHub Pages project site).
// The base path must stay in sync with the hosting configuration in `.github/`.
// Per-target overrides: the Cloudflare Worker mirror builds the same app with
// `ASTRO_BASE=/` and `ASTRO_SITE=<mirror origin>`; both default to the
// canonical GitHub Pages values so a plain build is unchanged.
export default defineConfig({
  site: process.env.ASTRO_SITE || 'https://cristian-cardona-dev.github.io',
  base: process.env.ASTRO_BASE || '/professional-evolution-portfolio/',
  output: 'static',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
  },
});
