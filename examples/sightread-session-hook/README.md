# Sightread — Claude Code on the web SessionStart hook

A validated `SessionStart` hook for [`sightread/sightread`](https://github.com/sightread/sightread)
so Claude Code on the web sessions have dependencies installed before running
tests, linters, or builds.

It is delivered here (not pushed to sightread) because the sightread repo is
third-party, has PRs disabled, and no push credentials are available in this
environment.

## Contents

- `.claude/hooks/session-start.sh` — installs deps with `bun install` (remote-only).
- `.claude/settings.json` — registers the hook on `SessionStart`.
- `sightread-session-hook.patch` — the same two files as a git patch.

## How to apply to sightread

From the root of a `sightread` checkout:

```bash
git apply /path/to/sightread-session-hook.patch
chmod +x .claude/hooks/session-start.sh
git add .claude && git commit -m "chore: add Claude Code web SessionStart hook"
```

Or just copy the `.claude/` directory into the repo root.

Once merged into sightread's default branch, all future Claude Code on the web
sessions use it.

## Why this design

Sightread uses **Bun** for package management, dev server, and testing
(`bun.lockb`, `oven-sh/setup-bun` in CI). The hook runs `bun install` (not
`--frozen-lockfile`) so the cached container layer stays usable even if the
lockfile drifts. It is gated on `CLAUDE_CODE_REMOTE=true` so it is a no-op
locally, and runs synchronously so dependencies are guaranteed ready before
the session starts.

## Validation (run against the real sightread tree)

| Step | Command | Result |
|------|---------|--------|
| Hook execution | `CLAUDE_CODE_REMOTE=true .claude/hooks/session-start.sh` | ✅ 555 packages installed |
| Linter / format | `bun run check-fmt` | ✅ Prettier clean |
| Tests | `bun test src/features/parsers/parse-midi.test.ts` | ✅ 48 pass, 0 fail |
| Type check | `bun run check-types` | ✅ passes |
| Build | `bun run build` | ✅ built |

Bun blocks the `sharp` and `esbuild` lifecycle scripts during install; none of
the pipeline steps above depend on them, so no `bun pm trust` step is needed.
