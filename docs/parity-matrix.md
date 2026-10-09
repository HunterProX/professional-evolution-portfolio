# Parity matrix — legacy `site/` → new `web/` app

Validator: Task 7 validation battery (2026-10-09). Every legacy homepage section
from `en/index.html` is mapped to its new counterpart in `web/src/**` with a
status of `ported` (same behaviour, new home), `improved` (same intent,
better mechanics) or `superseded` (replaced by a stronger mechanic; the old
section no longer exists as such). Legacy `site/`, `en/`, `es/` and
`index.html` are untouched and keep passing `npm run check:all`.

| # | Legacy section (`en/index.html`) | New counterpart (`web/`) | Status | Notes |
|---|---|---|---|---|
| 1 | `<section class="hero" id="top">` — eyebrow, H1, lede, principle line, GitHub/LinkedIn links | `web/src/components/Hero.astro` on `/` and `/es/` (Home region 1) | improved | Same evidence-led hierarchy (eyebrow → H1 → lede → principle → dual CTAs → social links); now data-driven from the canonical profile instead of locale-template stitching, and bilingual from one file (`i18n/copy.ts`). |
| 2 | `proof-strip` — review banner, "Evidence before confidence" status dot, snapshot version | Hero principle paragraph (`Hero.astro`) + section ids preserved (`#projects`, `#evolution`, `#evidence`, `#contact`) | superseded | Draft-review banner was a pre-launch affordance; the new app keeps the principle statement in the hero and the evidence contract lives on `/evidence/`. Snapshot identity moved to commit/data provenance (`data/*.json` validated by `scripts/data-validate.mjs`). |
| 3 | Featured work `#projects` (client-rendered `#projects-grid`, 3 cards) | `Home.astro #projects` → `ProjectCard.astro` (3 curated slugs) + `/work/` full index | improved | Server-rendered (no loading-state flash); status labels (Live / Prototype / Lab-planned) ride in the card badge; home links to the full `/work/` index with tag filters and dedicated case-study pages. |
| 4 | `commercial-paths` — two path cards: Professional opportunities vs Services/systems review | `ContactForm.astro` (professional contact, `/` `#contact`) + `SuggestionsPanel.astro` (exploratory/suggestions) | improved | The two paths stay separated by intent: contacting about professional work is the email-backed contact block; exploratory/systems questions go to the public GitHub suggestion issue template (allowlist-checked in `lib/urls.ts`). No packaged-service claim is made anywhere (verified by legacy tests + copy). |
| 5 | `how-i-work` — "Make the evidence easy to judge." | `/evidence/` intro + status legend (`Evidence.astro`, `copy.evidence`) | superseded | Folded into the evidence page's own framing ("Every statement carries a status…"), where the how-to-judge copy does more work next to the actual claims. |
| 6 | `#evidence` claims-grid (snapshot claims with status) | `/evidence/` (`Evidence.astro` + `EvidenceBadge.astro`) | improved | One file serves EN + ES, statuses are rendered server-side from the canonical data layer, and each claim keeps its status-email/status wording; the legacy claims parity test's intent is carried by `i18n` completeness in a single catalog. |
| 7 | `github-activity` section (snapshot card, empty-by-design) | `/evolution/` full timeline with commit-link evidence | superseded | The activity snapshot was an empty-by-design duplication of public links; the evolution timeline is the single place where public activity is inspectable (each milestone links to its commits), so the separate snapshot card was not re-implemented. Legacy site keeps its own section unchanged. |
| 8 | `evidence-index` — inspectable proof grid | `/evidence/` evidence items (same data source: `scripts/evidence-sync.mjs` → `data/`) | ported | Same 4 evidence items, same repo/object URLs, now list-rendered statically instead of client-side. |
| 9 | `trajectory` — direction-of-travel copy | `/evolution/` header + home `#evolution` preview (`EvolutionTimeline.astro`) | improved | Copy intent kept ("direction, not destination"); now backed by milestone data with status badges. |
| 10 | `goals` — three horizon goal cards | `/evolution/` roadmap phases + "Direction ahead" timeline section (`Evolution.astro`, `copy.evolution.directionAhead*`) | superseded | Goal horizons became inspectable phases: what was covered/ongoing is separate from "Direction ahead" (dashed border styling reinforces intended-not-delivered). Delivered work always leads; planned items never masquerade as progress. |
| 11 | `boundaries` — "Clear boundaries make the work easier to judge." | Project status badges (`Live`/`Prototype`/`Lab-planned`, `projectStatus` in `copy.ts`) + boundary-focused copy on every case-study page (`CaseStudy.astro` H1 & body) + claim negative statuses on `/evidence/` | improved | Formerly one standalone section; now applied inline at every point where a claim could overreach, which is stricter than a single reminder block. |
| 12 | `final-cta` — "Two paths, one evidence base." | `ContactForm.astro` fallback (mailto present) + `SuggestionsPanel` | superseded | Merged into #4: the contact and suggestion blocks are the actionable close; the midway CTA card itself was dropped to avoid a third, lower-signal prompt. |
| 13 | `site-footer` — snapshot id, source repo link | `web/src/components/Footer.astro` | improved | Adds privacy notes ("No tracking and no third-party scripts", theme stored locally), © and repo link; still bilingual from one component. |

Status counts: ported 1, improved 7, superseded 5. Every legacy homepage
section has a counterpart; nothing was silently dropped — the superseded rows
(#2, #5, #7, #10, #12) are absorbed by stronger mechanics named in their notes.

## Coverage extras the legacy site did not have

| New capability | Counterpart |
|---|---|
| Dedicated case-study pages | `/work/[slug]/` × 5 (EN + ES) |
| Full project index | `/work/` with tag filtering (`astro`, `planned`, …) |
| Portfolio assistant | `AssistantWidget.astro` (floating FAB + suggestion chips, evidence-linked answers) |
| SEO | JSON-LD Person schema, sitemap (18 URLs), per-page titles — `lib/seo.ts`, `BaseLayout.astro` |
| Language switching | `/` ↔ `/es/` mirror pairs with `LangSwitch.astro` |
