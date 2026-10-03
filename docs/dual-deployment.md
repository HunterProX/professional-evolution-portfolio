# Dual-host deployment

GitHub Actions is the **single deployment orchestrator**. One successful run of
`.github/workflows/deploy-static.yml` builds and publishes the same reviewed
commit to two destinations:

| Destination | Role | Indexing | Workflow job |
| --- | --- | --- | --- |
| GitHub Pages | Canonical public site | Canonical and indexable | `github-pages` |
| Cloudflare Worker | Root-path mirror and fallback | Non-indexable | `cloudflare-worker` |

The two jobs run after `validate`; they are two destinations of one GitHub
Actions run, not two independent release systems. GitHub Pages remains the
source of canonical URLs and search indexing. The Worker is for availability,
root-path access, and fallback use only.

Node.js 22 or newer is required. The Worker deployment uses Wrangler 4.147.0.

## Prevent duplicate Cloudflare deployments

In the Cloudflare dashboard, Workers Builds Git integration and Deploy Hooks
for this repository must be **disabled or disconnected**. They must not build or
deploy this repository. Otherwise a push can cause both the `cloudflare-worker`
GitHub Actions job and a Cloudflare-managed build to publish independently,
making the Worker version and release provenance ambiguous.

Do not add a second Cloudflare trigger to the repository. The GitHub Actions job
is the only Cloudflare deployment owner.

## GitHub Pages environment

Enable GitHub Pages with the Actions source in repository settings. No custom
secret is required for the GitHub Pages deployment job.

## Cloudflare Worker environment

Create a protected repository environment named `cloudflare-worker` with:

Secrets:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

Variables:

```text
CLOUDFLARE_PRODUCTION_URL=https://professional-evolution-portfolio.crisss198.workers.dev
```

The token must be scoped to Cloudflare Workers/Assets deployment only. Never put it
in the repository, a build artifact, a pull request, or this documentation.

The `cloudflare-worker` environment must be available to the job before a
production run. Missing secrets or an unavailable protected environment should
fail closed; do not replace them with hard-coded values or broad personal
credentials.

## Security note

The workflow currently uses versioned action/CLI references. Before the first
production deployment, review and pin third-party GitHub Actions to full commit
SHAs according to the repository security policy.

## If Cloudflare is configured as a Worker

The `workers.dev` URL indicates a Worker deployment rather than a Pages project.
In that mode, the dashboard may not show a build output directory field.
`wrangler.jsonc` is the source of truth and points Worker assets to `./dist`.

```text
Build command: RELEASE_TARGET=cloudflare-worker npm run build:release
Deploy command: npx --yes wrangler@4.147.0 deploy
Assets directory: ./dist
```

Never deploy the repository root as Worker assets. That can publish development
files and `node_modules` and causes the 25 MiB asset error.

## Release parity check

Each release build writes `dist/release-manifest.json`. After the run, fetch
`release-manifest.json` from both public destinations and compare:

```text
GitHub Pages:    https://hunterprox.github.io/professional-evolution-portfolio/release-manifest.json
Cloudflare Worker: https://professional-evolution-portfolio.crisss198.workers.dev/release-manifest.json
```

The manifests must have identical `source_commit` and `snapshot_id`. Other
fields may differ because `deployment_id`, `site_origin`, and `base_path`
describe the destination. A successful GitHub Actions run should therefore
produce the same source and snapshot identity at both hosts.

If either value differs, treat the release as inconsistent: do not announce the
release or repair it with a dashboard-only deploy. Preserve both manifests and
the Actions run URL, confirm that Workers Builds and Deploy Hooks are disabled,
then rerun the reviewed GitHub Actions workflow (or open a corrective PR if the
source or snapshot is wrong). Recheck both manifests before closing the incident.

## Expected dual deployment versus a duplicate Cloudflare deployment

**Expected:** one GitHub Actions run has `github-pages` and
`cloudflare-worker` jobs, both based on the same commit; both manifests have the
same `source_commit` and `snapshot_id`; Cloudflare shows the deployment created
by the Wrangler step in that run.

**Duplicate:** Cloudflare shows an additional build/deployment for the same
push, a deployment with no matching `cloudflare-worker` job, different source
or snapshot identity, or a timestamp/commit that points to a Cloudflare Build
or Deploy Hook execution. Disable/disconnect that integration, retain the
evidence, and redeploy only through GitHub Actions.

## Safe rollback and incident handling

1. Record the failing URLs, both manifests, the GitHub Actions run, and any
   Cloudflare deployment/build IDs. Do not delete evidence.
2. If the canonical site is unsafe or incorrect, temporarily communicate the
   incident and stop further releases; do not force-push, rewrite history, or
   delete deployments as a first response.
3. Select the previous reviewed commit on `main` and open/approve the normal
   corrective path. Redeploy that commit through GitHub Actions so both jobs
   publish together.
4. Confirm parity at both manifests and verify that the Worker remains
   non-indexable and GitHub Pages remains canonical.
5. Open a corrective PR for the root cause. Use a new forward fix rather than
   `git reset --hard`, force-push, or an out-of-band Cloudflare deployment.
