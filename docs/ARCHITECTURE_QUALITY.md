# Architecture quality programme

**Status:** Enforced documentation gate introduced; complete architecture audit not performed. Owner: maintainers. Date: 2026-11-15.

## Canonical sources

[Architecture](architecture.md), [Security](../SECURITY.md), [Data contracts](agent/data-and-schema.md), [Operations](operations.md), [Documentation map](living-docs.json), [Quality journal](QUALITY_JOURNAL.md).

## Quality invariants

- Next.js UI and administrative actions delegate database and ordering logic to canonical services.
- Supabase RLS and administrator verification protect writes; public form submissions are validated and rate limited.
- Cloudflare R2 object operations have explicit replacement and recovery behavior; failed uploads cannot erase the old file.
- Orders and inquiries report success only after confirmed persistence and required delivery semantics.
- A normal logout is an explicit POST mutation and revokes only the current session.
- Failed DB reads never become writable empty editors and maintenance never executes on GET/startup.
- Negative tests cover authorization, provider outages, idempotency, retries and partial persistence.

## Acceptance evidence

| Gate | State |
| --- | --- |
| Full module/call-graph and storage dataflow review | Not established |
| P0/P1 debt remediation plus regression tests | Not established |
| Live RLS, interrupted uploads, order and message delivery | Not fully verified |
| Production monitoring/SLO/rollback drill | Not established |
| PR living docs diff check and contract tests | Added in PR; required branch check still necessary |

Every change must identify root cause and owning service, update mapped Markdown, add a dated seven-field journal entry, and cite actual tests and residual risk. Human reviewers must compare claims to source and real behavior.
