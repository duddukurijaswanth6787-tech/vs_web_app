#!/bin/bash
# Installs the ponytail plugin (lazy-senior-dev / minimal-code-generation
# guidance) at the start of every Claude Code on the web session, since each
# session runs in a fresh container and plugins installed by hand don't
# carry over. Best-effort: never blocks or fails session startup -- if the
# marketplace is briefly unreachable, the session just starts without it.
set -uo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

claude plugin marketplace add DietrichGebert/ponytail >/dev/null 2>&1 || true
claude plugin install ponytail@ponytail >/dev/null 2>&1 || true

exit 0
