#!/bin/sh
set -eu

commits=
refs=0
if [ ! -t 0 ]; then
  while read -r local_ref local_sha remote_ref remote_sha; do
    case ${#local_sha} in
      40 | 64) ;;
      *) continue ;;
    esac
    case $local_sha in
      *[!0-9a-f]*) continue ;;
    esac
    refs=$((refs + 1))
    case $local_sha in
      *[!0]*) ;;
      *) continue ;;
    esac
    commit=$(git rev-parse --verify --quiet "$local_sha^{commit}") || continue
    case " $commits " in
      *" $commit "*) ;;
      *) commits="$commits $commit" ;;
    esac
  done
fi
if [ "$refs" -eq 0 ]; then
  commits=$(git rev-parse --verify HEAD)
fi
if [ -z "$commits" ]; then
  echo "pre-push: the push only deletes refs, so there is no tree to judge"
  exit 0
fi

scratch=${TMPDIR:-/tmp}
for dir in "$scratch"/eiab-pre-push.*; do
  if [ -f "$dir/pid" ] && ! kill -0 "$(cat "$dir/pid")" 2>/dev/null; then
    rm -rf "$dir"
  fi
done

run=$(mktemp -d "$scratch/eiab-pre-push.XXXXXX")
trap 'status=$?; [ -z "${ultracite:-}" ] || kill "$ultracite" 2>/dev/null; cd /; rm -rf "$run" >/dev/null 2>&1 & exit "$((status ? status : 1))"' EXIT
trap 'exit 1' HUP INT TERM
echo $$ >"$run/pid"

cache="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")/.turbo/cache"
for commit in $commits; do
  GIT_INDEX_FILE="$run/index" git read-tree "$commit"
  GIT_INDEX_FILE="$run/index" git checkout-index --all --prefix="$run/$commit/"
done
unset $(git rev-parse --local-env-vars)

for commit in $commits; do
  echo "pre-push: judging the tree of $commit"
  cd "$run/$commit"
  bun install --frozen-lockfile --ignore-scripts >/dev/null
  bun x ultracite check >"$run/ultracite.log" 2>&1 &
  ultracite=$!
  if bun x turbo run build test typecheck lint --cache-dir="$cache" --output-logs=errors-only && bun x playwright test; then
    suite=0
  else
    suite=1
  fi
  if wait "$ultracite"; then
    format=0
  else
    format=1
  fi
  ultracite=
  cat "$run/ultracite.log"
  if [ "$suite" -ne 0 ] || [ "$format" -ne 0 ]; then
    echo "pre-push: the tree of $commit fails the checks above"
    exit 1
  fi
done

cd /
rm -rf "$run" >/dev/null 2>&1 &
trap - EXIT
