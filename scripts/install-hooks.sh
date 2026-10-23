#!/bin/sh
set -eu

lefthook install

hook=$(git rev-parse --git-path hooks/pre-commit)
if grep -qs LEFTHOOK "$hook"; then
  rm "$hook"
  if [ -f "$hook.old" ]; then
    mv "$hook.old" "$hook"
  fi
fi
