# Release candidate checklist

## Current status

The portfolio is release-ready as a static candidate, but deployment is not
authorized and the public origin is not configured.

Run the normal checks:

```powershell
npm run check
```

Node.js 22 or newer is required for deployment because the workflow uses
Wrangler 4.147.0.

Run the release-specific check only when an approved origin exists:

```powershell
$env:SITE_ORIGIN = "https://approved-domain.example"
npm run release:check
```

Without `SITE_ORIGIN`, the command must fail with `RELEASE BLOCKED`. This is
intentional: canonical URLs, hreflang, sitemap, and deployment metadata must not
be generated with an invented domain.

## Before deployment

```text
[ ] Public origin approved.
[ ] English and Spanish routes verified.
[ ] Canonical metadata generated.
[ ] hreflang links are bidirectional.
[ ] Sitemap and robots policy reviewed.
[ ] Snapshot validator passes.
[ ] Evidence links resolve.
[ ] Privacy and secret scans pass.
[ ] AI provider remains disabled unless separately approved.
[ ] Rollback instructions are ready.
[ ] Required reviewers/protection rules are configured externally for both the
    `github-pages` and `cloudflare-worker` environments, and approval is recorded.
[ ] Cloudflare Workers Builds Git integration is disabled/disconnected.
[ ] Cloudflare Deploy Hooks for this repository are disabled/disconnected.
[ ] `cloudflare-worker` has its required secrets and production URL variable.
```

## After deployment

The expected result is one GitHub Actions run with both `github-pages` and
`cloudflare-worker` successful. Check `release-manifest.json` at both public
destinations. Their `source_commit` and `snapshot_id` must be identical; the
destination fields (`deployment_id`, `site_origin`, and `base_path`) may differ.

If parity fails, preserve both manifests and the run URL, investigate duplicate
Cloudflare triggers or a bad source snapshot, and redeploy through GitHub
Actions after correction. Do not use a dashboard-only Cloudflare deployment.

## Rollback

Preferred rollback is a reviewed revert PR to `main`; after it is merged, the
normal push trigger runs the single GitHub Actions orchestrator so Pages and the
Worker roll back together. Do not rewrite public history, force-push, or reset.
Preserve the failed deployment evidence and open the corrective PR.

For an emergency/manual rollback, use GitHub Actions `workflow_dispatch` and
select the `main` ref only after confirming it points to the reviewed commit to
restore. After the run, fetch both public `release-manifest.json` files and
confirm matching `source_commit` and `snapshot_id`. Never use an out-of-band
Cloudflare deploy as the rollback mechanism.
