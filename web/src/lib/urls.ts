/**
 * Base- and locale-aware link helpers.
 *
 * The site deploys under a GitHub Pages project base path, so no internal
 * href may start with a bare `/`: every route is prefixed with
 * `import.meta.env.BASE_URL`. The Spanish routes live under `<base>es/`, so
 * every route also needs the root of the locale rendering the link — that is
 * what keeps the header, the cards and the timeline correct from any page in
 * either language.
 *
 * Section anchors (#projects, #contact, …) are a separate case: on the locale
 * home they stay plain relative fragments, and from any other page they point
 * at that section of the matching language's home.
 */
import type { Locale } from '../i18n/copy';

const BASE: string = import.meta.env.BASE_URL;

/** Root of a locale under the deployment base: `/base/` for `en`, `/base/es/` for `es`. */
export function localeRoot(locale: Locale): string {
  return locale === 'es' ? `${BASE}es/` : BASE;
}

/** Absolute, base-aware href for a route inside a locale, e.g. `route('es', 'work/')`. */
export function route(locale: Locale, path = ''): string {
  return `${localeRoot(locale)}${path}`;
}

/**
 * Href for a section of the locale home.
 *
 * `pathname` is `Astro.url.pathname` (which carries the base path during the
 * build): on the home page itself the plain `#section` fragment is returned so
 * the anchor stays relative, otherwise the absolute home URL with the fragment
 * so the link still works from every other page.
 */
export function sectionHref(locale: Locale, id: string, pathname: string): string {
  const root = localeRoot(locale);
  return pathname === root ? `#${id}` : `${root}#${id}`;
}
