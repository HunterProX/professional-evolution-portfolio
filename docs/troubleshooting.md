# Troubleshooting

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
