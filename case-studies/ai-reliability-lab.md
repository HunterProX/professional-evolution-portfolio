# AI Engineering Reliability Lab — public reproduction

## Classification

This is a **new public project / public reproduction**. It is not a production
assistant, client system, employer codebase, or proof of production RAG.

## Problem

Define a safe response contract for a public AI assistant before introducing a
model provider, retrieval system, tools, or persistent conversations.

## What was implemented

- Deterministic representative responses over an allowlisted knowledge fixture.
- Citation IDs constrained to approved fixture records.
- Explicit `insufficient_evidence` responses for unsupported questions.
- Request-size limit and rejection of conversation history.
- Stateless health endpoint exposing the active provider boundary.
- Node built-in tests for supported answers, unknown questions, limits, and the
  response contract.

## What this demonstrates

- Bounded AI API design without depending on a model provider.
- Fail-closed behavior when evidence is insufficient.
- A small response contract that can later sit behind a provider-neutral adapter.
- Testable privacy and citation boundaries.

## What this does not demonstrate

- Production RAG, embeddings, vector search, or retrieval quality.
- OpenAI or other model-provider operation.
- Streaming, agents, tools, authentication, rate limiting, or public abuse
  protection.
- Client or employer data.

## Evidence

- Repository: <https://github.com/HunterProX/ai-chat-app>
- Portfolio snapshot record: `ev-ai-reliability-lab-repository`
- Portfolio claim: `claim-ai-chat-prototype-exists`

## Next boundary

The next safe evolution is a mock/provider adapter with a fixed evaluation set.
A real provider remains disabled until privacy, cost, timeout, and abuse controls
are separately reviewed.
