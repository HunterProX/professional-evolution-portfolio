# Dual deployment workflow

The repository now contains a deployment workflow for two static hosts:

- GitHub Pages: canonical project site.
- Cloudflare Pages: root-path mirror/fallback.

The workflow is intentionally fail-closed until the required environment
configuration exists.

## GitHub Pages environment

Enable GitHub Pages with the Actions source in repository settings. No custom
secret is required for the GitHub Pages deployment job.

## Cloudflare Pages environment

Create a Pages project named `cristian-cardona` (or an approved alternative).
Create a protected repository environment named `cloudflare-pages` with:

Secrets:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

Variables:

```text
CLOUDFLARE_PROJECT_NAME=cristian-cardona
```

The token must be scoped to Cloudflare Pages write/edit access only. Never put it
in the repository, a build artifact, a pull request, or this documentation.

## Security note

The workflow currently uses versioned action/CLI references. Before the first
production deployment, review and pin third-party GitHub Actions to full commit
SHAs according to the repository security policy.
