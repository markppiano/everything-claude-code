#!/bin/bash
# SessionStart hook: install dependencies so tests, linters, and the
# build work in Claude Code on the web sessions.
set -euo pipefail

# Only run in the remote (Claude Code on the web) environment.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"

# Sightread uses Bun for package management, dev server, and testing.
# `bun install` (not --frozen-lockfile) so the cached container state
# stays usable even if the lockfile drifts.
bun install
