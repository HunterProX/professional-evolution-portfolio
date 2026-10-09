/**
 * SEO helpers — structured data built from the canonical profile only.
 *
 * Nothing here invents a claim: the Person entity names the real person, points
 * at the deployed home URL and links the two published profiles. It is used by
 * the two home routes (`/` and `/es/`); BaseLayout injects whatever it receives.
 */
import { profile } from './data';

/**
 * schema.org Person for the home page. `url` is the canonical root of the
 * deployment — the entity the rest of the site is about.
 *
 * The URL is derived from `PUBLIC_CANONICAL_BASE`, the same source BaseLayout
 * uses for canonical/og/hreflang: it already carries the Pages base path and
 * stays fixed regardless of the host serving the build, so the Worker mirror
 * does not advertise its own origin in structured data. When the variable is
 * absent (a plain Pages build resolves it in `astro.config.mjs`) the historical
 * `site` + serving base is used as a fallback.
 */
export function personJsonLd(site?: URL): Record<string, unknown> | null {
  const canonicalBase = import.meta.env.PUBLIC_CANONICAL_BASE;
  const url = canonicalBase
    ? new URL(canonicalBase)
    : site
      ? new URL(import.meta.env.BASE_URL, site)
      : undefined;
  if (!url) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    url: url.href,
    sameAs: [profile.socials.github, profile.socials.linkedin],
  };
}
