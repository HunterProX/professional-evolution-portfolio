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
[ ] Human deployment approval recorded.
```

## Rollback

Rollback means redeploying the previous reviewed public `main` commit. Do not
rewrite public history or force-push. Preserve the failed deployment evidence
and open a corrective PR.
