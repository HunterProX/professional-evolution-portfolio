# Troubleshooting

## Two Cloudflare deployments appear for one push

The expected shape is one GitHub Actions run containing both `github-pages` and
`cloudflare-worker`. The Cloudflare deployment should come from the Wrangler
step in that run. A Cloudflare deployment without a matching job, or an extra
deployment for the same commit, indicates that Workers Builds Git integration
or a Deploy Hook is still connected.

Disable/disconnect those Cloudflare integrations for this repository. Keep the
Actions run and Cloudflare deployment evidence, then use the normal GitHub
Actions workflow for the next deployment. Do not deploy manually to make the
two systems "catch up."

## Release manifests do not match

Fetch `/release-manifest.json` from GitHub Pages and the Cloudflare Worker.
`source_commit` and `snapshot_id` must match exactly. If they do not, treat the
hosts as out of parity: preserve both responses and the run URL, check for a
duplicate Cloudflare trigger, and rerun the reviewed GitHub Actions deployment
after correcting the source or snapshot. Do not announce the release until the
values match.

The expected difference is destination metadata: `deployment_id`,
`site_origin`, and `base_path` identify each host and may differ.

## Snapshot validation fails

Run:

```powershell
node public-snapshot/validate.mjs
```

Fix the first reported error before publishing. Do not bypass the validator.

## The page is blank or stale

Run `npm run build` again, stop any previous preview server, and start a new
`python -m http.server 4173` process from the repository root.

## A project link is missing

The project must have a public HTTPS URL and an evidence record before it can be
shown as public. Update the snapshot through a reviewed PR.

## Spanish content is missing

Run `npm run build` and inspect `/es/`. Translation catalogs must have the same
claim, project, and goal IDs in both locales.
