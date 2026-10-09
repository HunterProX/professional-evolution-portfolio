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
 * deployment (site + base path) — the entity the rest of the site is about.
 */
export function personJsonLd(site: URL | undefined): Record<string, unknown> | null {
  if (!site) return null;
  const url = new URL(import.meta.env.BASE_URL, site);
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    url: url.href,
    sameAs: [profile.socials.github, profile.socials.linkedin],
  };
}
