# Quality journal

Append-only, evidence-based record for each source/config/workflow PR.

## 2026-11-15 | Add enforced living architecture documentation
- Scope: Mixing/mastering website documentation mapping, quality baseline and standalone CI contract.
- Root cause: Existing Markdown guidelines alone could not stop code changes that omitted relevant owner docs.
- Owner: Repository maintainers own service boundaries, storage semantics and reviewed documentation.
- Tests: Node tests verify path classification and reject malformed journal entries independently of Vitest.
- Failure path: Missing required docs or unknown merge-base reject the PR rather than marking it successful.
- Docs updated: Architecture quality baseline, quality journal, agent instructions and operations guide.
- Residual risk: Human review and real Supabase/R2/payment smoke tests remain mandatory; branch protection is separate.
