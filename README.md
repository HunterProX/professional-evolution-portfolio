# Professional Evolution Portfolio

Evidence-backed professional evolution from a Full Stack + Cloud foundation
toward AI Engineering, AI Automation, and Agentic Systems.

## Quickstart

Requirements: Node.js 20+ and Python 3.

```powershell
git clone https://github.com/HunterProX/professional-evolution-portfolio.git
cd professional-evolution-portfolio
npm run check
npm run build
python -m http.server 4173
```

Open:

- <http://localhost:4173/> — English fallback
- <http://localhost:4173/en/> — English
- <http://localhost:4173/es/> — Español

The site is static and works without AI, a database, or a Personal OS
connection. See [docs/quickstart.md](docs/quickstart.md) for the complete
verification flow.

## Documentation

- [Products and local ports](docs/products.md)
- [Quickstart](docs/quickstart.md)
- [Evidence boundary](docs/evidence-boundary.md)
- [Troubleshooting](docs/troubleshooting.md)

## Public boundary

The approved snapshot is the only public content source. Historical LinkedIn
sync material is not the source of truth. Claims distinguish public artefacts,
developing work, aspirations, and insufficient evidence.

## Public GitHub activity

The portfolio includes a build-time snapshot in [`github-activity/`](github-activity/).
It is limited to an explicit allowlist of public repositories and supports selected
public pull requests, commits, releases, and deployment objects. The browser never
calls GitHub and no token is required. The checked-in first snapshot is intentionally
empty when verified activity is unavailable; it must not be read as a complete live
contribution feed. Validate it with `npm run activity:check`.
