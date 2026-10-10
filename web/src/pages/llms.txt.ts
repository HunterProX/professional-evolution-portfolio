/**
 * llms.txt — `web/dist/llms.txt`, a machine-readable map of the site for
 * language models, per the llms.txt specification (llmstxt.org).
 *
 * Design:
 *   - The prose summary is the only hand-written text; every list entry is
 *     derived from the canonical data layer (`data/profile.json`,
 *     `data/projects.json`) so the file cannot advertise a page or project the
 *     site does not publish.
 *   - All URLs are absolute and built from `PUBLIC_CANONICAL_BASE` — the same
 *     canonical source BaseLayout uses — so the Worker mirror does not list its
 *     own origin. `rss.xml` and the suggestion-issue form come from their
 *     single existing definitions.
 *
 * Astro renders a static endpoint from `GET`; no runtime is involved.
 */
import type { APIRoute } from 'astro';
import { profile, projects } from '../lib/data';
import { SUGGESTION_ISSUE_URL } from '../lib/urls';

/** Canonical Pages base, used only if the build did not inject one. */
const FALLBACK_CANONICAL_BASE =
  'https://cristian-cardona-dev.github.io/professional-evolution-portfolio/';

/** The site's own project entry carries the public repository URL. */
const SITE_PROJECT_SLUG = 'professional-evolution-portfolio';

export const GET: APIRoute = ({ site }) => {
  const canonicalBase = (
    import.meta.env.PUBLIC_CANONICAL_BASE ||
    (site ? new URL(import.meta.env.BASE_URL, site).href : FALLBACK_CANONICAL_BASE)
  ).replace(/\/?$/, '/');

  /** Absolute canonical URL for a locale-relative path (e.g. `work/`). */
  const abs = (path = '') => new URL(path, canonicalBase).href;

  const repo =
    projects.find((project) => project.slug === SITE_PROJECT_SLUG)?.repo ??
    profile.socials.github;

  const lines = [
    `# ${profile.name} — Professional Evolution Portfolio`,
    '',
    `> ${profile.name}'s evidence-backed, bilingual (EN/ES) professional portfolio.`,
    '> Every capability claim carries an explicit status — Demonstrated, In development,',
    '> Aspirational or Insufficient evidence. Projects link to public repositories under',
    `> github.com/${profile.reposOwner}, the timeline separates shipped work from direction`,
    '> ahead, and contact is by email or public GitHub issues.',
    '',
    'Prefer /work/ for case studies, /evolution/ for milestones and /evidence/ for proof',
    'links. All content is generated from a reviewed data layer; only public,',
    'human-declared career facts are published; no client names, compensation or',
    'private operational data is published, and planned work is explicitly labelled.',
    '',
    '## Pages',
    `- [Home](${abs()}): the portfolio overview.`,
    `- [Work](${abs('work/')}): the project case studies.`,
    `- [Evolution](${abs('evolution/')}): the professional timeline and roadmap.`,
    `- [Evidence](${abs('evidence/')}): the proof links behind the claims.`,
    `- [Contact](${abs('#contact')}): how to get in touch.`,
    `- [How this site is built](${abs('build/')}): the stack, deployment and boundaries behind this site.`,
    `- [RSS feed](${abs('rss.xml')}): evolution milestones as a feed.`,
    '',
    '## Career',
    `- [Career](${abs('career/')}): the employer history and skills trajectory.`,
    '',
    '## Case studies',
    ...projects.map((project) => `- [${project.name}](${abs(`work/${project.slug}/`)}): ${project.summary}`),
    '',
    '## Source',
    `- [GitHub repository](${repo}): public source for this site and its data layer.`,
    `- [Suggest an improvement](${SUGGESTION_ISSUE_URL}): open a public issue.`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
