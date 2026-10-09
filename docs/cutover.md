# Cutover — legacy `site/` → new `web/` app

Status: **documentation only.** No workflow, host, or data change is applied by
this document. The deploy pipeline described under "Deployment today" is the one
that is live; the dual-path workflow is a *proposal* awaiting a separate,
reviewed change (and the gated deploy, T11).

## Current state

- **Legacy pipeline green.** `.github/workflows/deploy-static.yml` runs on push
  to `main` (and `workflow_dispatch`), validates with `npm run check`, then
  publishes the legacy static output built by `site/build.mjs` /
  `site/release-build.mjs` to GitHub Pages and to the Cloudflare Worker mirror.
  `site/`, `en/`, `es/`, and the root `index.html` are untouched and pass
  `npm run check:all`.
- **Web pipeline green.** `web/` (Astro 5, static) builds independently with
  `npm --prefix web run build` → `web/dist`, emitting **18 pages** and an
  18-URL `web/dist/sitemap.xml` (`scripts/sitemap-generate.mjs`). It is not yet
  deployed by any workflow.
- **Parity matrix 13/13.** Every legacy homepage section has a `web/`
  counterpart (1 ported, 7 improved, 5 superseded). See
  [parity-matrix.md](parity-matrix.md).

Both trees coexist in one repository; neither build writes into the other's
output directory.

## Deployment today (unchanged)

`.github/workflows/deploy-static.yml` has a `validate` job and two publishing
jobs (`github-pages`, `cloudflare-worker`). Both publishing jobs build the
**legacy** artifact with `npm run build:release` (`RELEASE_TARGET` selects the
destination) into `dist/` and then deploy it. The `web/` build is not part of
this workflow. See [dual-deployment.md](dual-deployment.md) for the host
roles, the Cloudflare mirror parity rule, and the no-duplicate-deploy rule.

## Proposed dual-path workflow (NOT applied)

The intended cutover is a **dual-path** workflow so the legacy build remains an
immediately available rollback. It is a change to
`.github/workflows/deploy-static.yml` only; it is **not** applied by this task.

Add a `workflow_dispatch` input `pipeline` with values `legacy` (default) and
`web`:

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      pipeline:
        description: Which build to publish
        type: choice
        options: [legacy, web]
        default: legacy
```

- **`legacy` path — unchanged.** `npm run build:release` → `dist/`, published to
  both `github-pages` and `cloudflare-worker` exactly as today. This is the
  rollback path.
- **`web` path.** Build the Astro app with
  `npm --prefix web ci && npm --prefix web run build`, then publish
  `web/dist` to GitHub Pages and to the Cloudflare Worker.
- **Cloudflare mirror parity is kept in both paths.** The Worker job must remain
  a second destination of the same run (same `source_commit` / `snapshot_id`
  identity), per [dual-deployment.md](dual-deployment.md). Do not add a second
  Cloudflare trigger.

Prerequisites for the `web` path that must be satisfied before it is applied:

1. `web/package-lock.json` must be committed (untracked today) so
   `npm --prefix web ci` has a lockfile to install from.
2. The Astro build must emit a `release-manifest.json` with `source_commit` and
   `snapshot_id` so the dual-host parity check in
   [dual-deployment.md](dual-deployment.md) can compare both hosts. The legacy
   `site/release-build.mjs` already writes this; the `web` build does not yet.

## Rollback

Re-run the workflow with `pipeline=legacy`. The legacy artifact is rebuilt from
the same reviewed commit and republished to both hosts. No data loss: the legacy
and `web` trees coexist in the repository, the legacy output is reproducible
from `site/`, and the switch is a workflow input, not a destructive migration.
Follow the incident/rollback steps in
[dual-deployment.md](dual-deployment.md) (preserve evidence; use a reviewed
revert PR; never force-push or `git reset --hard`).

## Pre-deploy checklist

- [ ] **Pages base path verified** — `web/astro.config.mjs` `site` =
      `https://cristian-cardona-dev.github.io` and `base` =
      `/professional-evolution-portfolio/` match the GitHub Pages project-site
      URL, and `scripts/sitemap-generate.mjs` `SITE`/`BASE` stay in sync.
- [ ] **Sitemap has 18 URLs** — `web/dist/sitemap.xml` (one `<loc>` per built
      `index.html`).
- [ ] **Favicon loads** — `web/public/favicon.svg` is served and referenced.
- [ ] **Assistant index current** — re-run the canonical syncs
      (`npm run evidence:sync`, `npm run case-studies:sync`,
      `npm run evolution:generate`, `npm run data:validate`) so the build-time
      assistant index matches `data/*.json`.
- [ ] **Web3Forms key TODO** — set `formEndpoint` and `formKey` in
      `data/profile.json`, then run `npm run data:validate`. While both are
      `null`, `ContactForm.astro` renders the honest `mailto:` fallback instead
      of posting.
- [ ] **Issue templates present** — `.github/ISSUE_TEMPLATE/suggestion.yml`
      exists (the `SuggestionsPanel` deep-links to it).

## Post-deploy verification

- [ ] Home returns 200 at the canonical URL.
- [ ] `/es/` (Spanish mirror) returns 200 and renders translated chrome.
- [ ] At least one case study (`/work/<slug>/`) returns 200 and its content is
      intact.
- [ ] Assistant opens and returns the expected keyword results; no-match shows
      the honest fallback.
- [ ] Contact fallback works (mailto present while no form key is configured).
- [ ] No console errors on the checked pages.
- [ ] Mirror parity: both hosts expose the same `source_commit` and
      `snapshot_id` in `release-manifest.json`.

## Deferred (explicitly out of scope)

- **Spanish case-study bodies remain English** — the site's translation
  contract keeps canonical data English-only; `/es/` case-study bodies are the
  English text with localized chrome.
- **`favicon.ico`** — only `favicon.svg` ships today.
- **`og:image`** — no social share image is produced.
- **Worker `/api/assistant` v2** — blocked on a model API key and Worker deploy
  authorization; see [assistant.md](assistant.md).
- **Scroll-spy** — active-section highlighting in the numbered side nav is not
  implemented.
