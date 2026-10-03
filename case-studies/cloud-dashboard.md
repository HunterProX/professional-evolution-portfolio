# Cloud Dashboard — public reproduction

## Classification

This is a **new public project / public reproduction**. It is not client code,
live employer infrastructure, or a reconstruction of a private system.

## Problem

Create a small observability-style interface that can be inspected locally and
that makes operational limits visible instead of implying live cloud access.

## What was implemented

- Responsive dashboard UI built with Next.js, React, and TypeScript.
- Deterministic synthetic CPU, memory, request-volume, availability, service,
  and alert data.
- Local CPU and memory threshold controls.
- Accessible loading and error states.
- Unit tests, browser-flow tests, typecheck, lint, production build, and a
  focused privacy scan.
- Optional server-side AI explanation, disabled by default, using only the
  built-in synthetic metrics.

## What this demonstrates

- A public, reproducible cloud-oriented interface implementation.
- Full-stack component composition and typed data handling.
- Testable UI behavior and explicit failure states.
- A conservative boundary around optional AI behavior.

## What this does not demonstrate

- Live AWS, Azure, or GCP telemetry.
- Kubernetes, Prometheus, Terraform, or Helm operation.
- Real cloud costs, production availability, or customer infrastructure.
- Production authentication, authorization, rate limiting, or abuse controls.
- Historical work performed for Talan, Siigo, or another employer.

## Evidence

- Repository: <https://github.com/HunterProX/cloud-dashboard>
- Portfolio snapshot record: `ev-cloud-dashboard-repository`
- Portfolio claim: `claim-cloud-dashboard-planned` (the ID is retained for
  snapshot continuity; its current text describes the public reproduction).

## Next boundary

The next useful improvement is not a larger dashboard. It is a reviewed,
reproducible operational scenario with a documented failure case and an
evaluation of any optional AI explanation. No live integration is implied.
