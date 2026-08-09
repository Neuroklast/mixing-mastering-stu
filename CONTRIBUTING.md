# Contributing

Thank you for your interest in contributing to SONORATIVA!

## Getting Started

1. Fork the repository and clone it locally
2. Follow the setup instructions in [docs/development.md](docs/development.md) and [README.md](README.md)
3. Create a new branch: `git checkout -b feat/my-feature`
4. Read [AGENTS.md](AGENTS.md) (rules apply to humans and agents)

## Guidelines

- All code, comments, and documentation must be in **English**
- Run `npx tsc --noEmit`, `npm test`, and `npm run lint` before opening a PR
- Run `npm run build` before opening a PR
- Follow the service result pattern (`ok`/`err`) for data-access functions
- Use Zod schemas at service boundaries
- Storage is **Cloudflare R2 only** — do not reintroduce Supabase Storage / TUS
- Do not bypass the pre-commit hook (`--no-verify` is not allowed)
- Update living docs when product behavior changes: `CHANGELOG.md`, `QA_CHECKLIST.md`, `docs/agent/*` as applicable (see [docs/agent/workflow.md](docs/agent/workflow.md))

## Pull Request Checklist

Use the GitHub PR template (`.github/pull_request_template.md`). Minimum:

- [ ] `npx tsc --noEmit` passes
- [ ] `npm test` passes (no regressions)
- [ ] `npm run build` passes
- [ ] New code is covered by tests where appropriate
- [ ] No German strings added to code/admin UI
- [ ] Docs updated when behavior changed (or “n/a” noted)
- [ ] PR description explains what changed and why

## Questions?

Open an issue or start a discussion in the repository.
