#!/usr/bin/env bash
# Fails when a change removes or rewrites lines in existing test files.
#
# Tests are the spec: adding tests (new files, new cases, new assertions) is
# fine, but touching an existing line means the spec changed and the PR has to
# say why. Usage: scripts/check-test-changes.sh <base-ref>   (default origin/main)
set -euo pipefail

base="${1:-origin/main}"

is_test_file() {
  case "$1" in
    *.spec.ts | *.int-spec.ts | *.test.tsx | *.test.ts | apps/frontend/e2e/*) return 0 ;;
    *) return 1 ;;
  esac
}

changed=()
# --numstat: "<added>\t<removed>\t<path>"; --no-renames reports a rename as a
# delete plus an add, so moving a test file counts as changing it.
while IFS=$'\t' read -r added removed path; do
  [ -z "${path:-}" ] && continue
  is_test_file "$path" || continue
  if [ "$removed" != "0" ]; then
    changed+=("$path (+$added -$removed)")
  fi
done < <(git diff --numstat --no-renames "$base"...HEAD)

if [ "${#changed[@]}" -gt 0 ]; then
  echo "::error::This change removes or rewrites lines in existing tests:"
  for file in "${changed[@]}"; do
    echo "  - $file"
  done
  echo
  echo "Tests are the spec. If this is intentional, explain why in the PR."
  exit 1
fi

echo "No existing test lines were removed or rewritten (compared with $base)."
