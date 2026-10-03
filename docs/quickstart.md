# Portfolio quickstart

## Prerequisites

- Git
- Node.js 22 or newer (required by Wrangler 4.147.0 for deployment)
- Python 3 for the static preview server

## Validate and build

```powershell
npm run check
npm run build
```

`npm run check` validates the snapshot, generates English/Spanish pages, and
runs the Node tests. No `npm install` is required because the portfolio has no
runtime dependencies.

## Preview

```powershell
python -m http.server 4173
```

Open `/`, `/en/`, and `/es/`. The browser should load the snapshot, project
cards, evidence links, case-study boundaries, and localized content.

## What this does not require

- OpenAI or another model provider.
- A database.
- A Personal OS checkout.
- Credentials.
- A deployment platform.
