# Contributing to FireComm OS

## How to Fork and Start
1. Fork the repository on GitHub.
2. Clone your fork locally.
3. Create a feature branch from `main`.

## Branch Naming
- `feature/gps-tracking`
- `feature/drone-system`
- `fix/socket-bug`

## Commit Messages
- `feat: add gps tracking`
- `fix: resolve socket disconnect issue`

## Pull Request Guidelines
- Keep PRs focused and under ~400 lines when possible.
- Link related issues in the PR description.
- Add screenshots/GIFs for UI changes.
- Include testing notes (manual steps or commands run).

## Code Style
- TypeScript strict mode where applicable.
- Prefer functional React components with hooks.
- Keep components small; lift state into hooks when reusable.
- Write short, purposeful comments only where logic is non-obvious.

## Testing Expectations
- Manual: run through multi-tab scenario (Station 1, Station 2, Dispatch).
- Verify socket events and dispatch alerts propagate.
- Map and incident assignments update live.

## Security & Privacy
- Do not commit secrets or IP-specific configs.
- Report vulnerabilities per `SECURITY.md`.
