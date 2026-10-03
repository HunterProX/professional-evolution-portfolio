# public-snapshot

A conservative, machine-readable snapshot of what can honestly be said about this
portfolio today — and, just as importantly, what cannot.

The problem this solves: the source material in this repository contains both real
professional history and unreviewed marketing copy (inflated tenure, "production
RAG", cost-reduction percentages, placeholder repository handles). Mixing the two
in public copy is how a portfolio starts making claims it cannot defend. This
directory makes the honest subset explicit and machine-checkable.

## Contents

| File | Purpose |
|---|---|
| `snapshot.json` | The data. Claim statuses, evidence, projects, draft goals. |
| `schema.json` | JSON Schema (draft 2020-12) for external tooling. |
| `validate.mjs` | Validator. Node built-ins only, zero dependencies. |
| `fixtures/invalid-snapshot.json` | Negative fixture. Must always fail validation. |

## Validate

```bash
node public-snapshot/validate.mjs
node public-snapshot/validate.mjs --expect-invalid public-snapshot/fixtures/invalid-snapshot.json
```

Exit codes: `0` valid · `1` validation failed · `2` harness error.

The second command is the self-test: it asserts the fixture is rejected. If the
fixture ever starts passing, the validator has lost a rule and the test fails.

## Editorial rules encoded here

These are enforced, not merely documented.

**1. Every statement carries an evidence status.** There are exactly four:

| Status | Meaning |
|---|---|
| `demonstrated` | At least one public, checkable artifact a third party can open. |
| `developing` | Partially built or prototype-level. No public artifact yet, or the available one does not cover the full claim. |
| `aspirational` | Stated direction or intent. Not started, or started but not verifiable. |
| `insufficient_evidence` | No public artifact exists today that could support the claim. |

`demonstrated` is the only status that requires a non-empty `evidence_refs`.

**2. Evidence is a public https URL or it is not evidence.**
`http://`, `mailto:`, `file://`, relative paths, Windows drive paths, POSIX
home/workspace paths, `localhost`, loopback, link-local, RFC1918 hosts and
reserved TLDs (`.local`, `.internal`, `.test`, `.example`, …) are all rejected.

**3. Personal facts stay out.** A denylist of keys (`location`, `city`,
`address`, `email`, `phone`, `salary`, `employer`, `company`, `client`,
`language_level`, `years_of_experience`, …) is rejected wherever it appears. A
parallel scan rejects email addresses, phone numbers, IBANs and long card-like
digit runs in any string value.

**4. No credentials.** Raw file text is scanned for private-key blocks, OpenAI /
GitHub / AWS / Slack token shapes, JWTs, and `key = value` credential
assignments.

**5. Goals stay drafts.** `short`, `medium` and `long` are all `draft` /
`requires_human_review` with `requires_human_review: true`. The schema makes
`target_date`, `deadline`, `metrics`, `kpis`, `baseline` and friends
*unrepresentable*, and the goal prose is additionally scanned for years,
percentages, currency, durations, counts and deadline phrases.

**6. Gaps are explicit.** A project at `prototype` maturity or below must list
what it does *not* demonstrate. Silence reads as completeness. A `prototype`
project may not carry `evidence_level: demonstrated`.

**7. Refs resolve.** Ids are unique and match a `claim-` / `ev-` / `proj-`
grammar. Every `evidence_refs` and `claim_refs` entry resolves to a real entry,
and every `supports_claims` entry resolves to a real claim.

**8. No drift.** The validator cross-checks its own allowed vocabularies against
the enums declared in `schema.json`, so the schema cannot quietly start allowing
values the validator forbids.

## How claims map to the current reality

- **AI Chat API Prototype** — `prototype`, `in_progress_prototype`, **not public**.
  A thin local request/response path against a model provider API. There is an
  explicit negative claim (`claim-no-production-rag`): no retrieval pipeline, no
  evaluation harness, no production operation, no measurements.
- **Cloud Dashboard** — `planned` / `not_started`, **not public**. No artifact.
- **SaaS MVP** — `planned` / `not_started`, **not public**. No artifact.

The single evidence entry is the public LinkedIn profile, marked
`unverified_self_reported`: it is a pointer to public material, not independent
verification of any capability claim.

## Deliberate omissions

Nothing from `profiles/linkedin-optimized.md` or `linkedin-sync/changes.json` is
carried over except safe identity context (the name and the public profile URL).
Those sources contain unreviewed claims — a tenure figure, cost-reduction
percentages, leadership headcounts, certifications not held, placeholder
repository handles, a pending location change and a pending language-level
upgrade. Two claims exist purely to fence that off:

- `claim-years-of-experience-unverified` — no tenure figure is asserted.
- `claim-public-code-artifact-missing` — no public repository URL is asserted.

Only `generated_at` is machine-set. No other date in the file is estimated.

## Extending it

1. Change the data in `snapshot.json`.
2. Change the shape in `schema.json` (keep `additionalProperties: false`).
3. Add the new rule to `validate.mjs`, and add a violating case to
   `fixtures/invalid-snapshot.json` so the new rule is proven to fire.
4. Bump `schema_version` — a human decision, not an automatic one.
5. `node public-snapshot/validate.mjs` must pass.