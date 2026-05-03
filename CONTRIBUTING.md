# Contributing

Thank you for your interest in contributing to SONORATIVA!

## Getting Started

1. Fork the repository and clone it locally
2. Follow the setup instructions in [docs/development.md](docs/development.md)
3. Create a new branch: `git checkout -b feat/my-feature`

## Guidelines

- All code, comments, and documentation must be in **English**
- Run `npx tsc --noEmit` and `npm test` before opening a PR
- Follow the service result pattern (`ok`/`err`) for all data-access functions
- Use Zod schemas at service boundaries
- Do not bypass the pre-commit hook (`--no-verify` is not allowed)

## Pull Request Checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `npm test` passes (no regressions)
- [ ] New code is covered by tests
- [ ] No German strings added
- [ ] PR description explains what changed and why

## Questions?

Open an issue or start a discussion in the repository.
