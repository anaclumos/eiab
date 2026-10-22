#!/bin/sh
set -eu

root=$(git rev-parse --show-toplevel)
snapshot=$(mktemp -d)
trap 'rm -rf "$snapshot" >/dev/null 2>&1 &' EXIT
trap 'exit 1' HUP INT TERM

cache="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")/.turbo/cache"

IFS='
'
set -f
set -- $(git -c core.quotePath=false diff --cached --name-only --diff-filter=ACMR -- '*.js' '*.jsx' '*.ts' '*.tsx' '*.json' '*.jsonc' '*.css')
set +f
unset IFS

git checkout-index --all --prefix="$snapshot/"
unset $(git rev-parse --local-env-vars)

cd "$snapshot"
bun install --frozen-lockfile --ignore-scripts >/dev/null
if [ "$#" -gt 0 ]; then
  bun x ultracite fix "$@"
fi
bun x turbo run typecheck lint --cache-dir="$cache" --output-logs=errors-only

for file; do
  cmp -s "$file" "$root/$file" || cp "$file" "$root/$file"
done
