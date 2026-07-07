<!-- Thanks for contributing! Keep PRs small and focused. -->

## What & why

<!-- What does this change, and why? Link any issue: Closes #NNN -->

## Type

- [ ] Fix
- [ ] Feature
- [ ] Docs
- [ ] Refactor / chore

## Checklist

- [ ] `pnpm verify` is green (owner-string gate + config-doc gate + typecheck + build + tests)
- [ ] New behavior has tests; new config fields are documented in `docs/CONFIG.md`
- [ ] No owner-specific strings in `packages/*`; `core` stays pure (I/O only in `server`)
- [ ] Commits follow `type(scope): summary`
- [ ] Widget still within the 60 KB gzip budget (if the widget changed)

## Notes for the reviewer

<!-- Anything non-obvious: trade-offs, follow-ups, screenshots. -->
