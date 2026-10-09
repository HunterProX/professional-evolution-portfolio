// @ts-check
import { defineConfig } from 'astro/config';

// Canonical deployment target (GitHub Pages project site).
// The base path must stay in sync with the hosting configuration in `.github/`.
export default defineConfig({
  site: 'https://cristian-cardona-dev.github.io',
  base: '/professional-evolution-portfolio/',
  output: 'static',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
  },
});
