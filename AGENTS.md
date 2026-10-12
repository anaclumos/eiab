# eiab

## CI

- This repository runs its CI on the owner's self-hosted runners on `evergreen`, a Linux arm64 machine. No job runs on a GitHub-hosted runner, and no workflow reads a `CI_RUNNER` variable.
- The `test` and `e2e` jobs of `ci.yml` run on the runners with the label `check`. Their `runs-on` is `[self-hosted, linux, arm64, check]`.
- `publish.yml` runs on the runners with the label `build`. Its `runs-on` is `[self-hosted, linux, arm64, build]`.
- A job on the self-hosted runners gets a fresh user with a home on disk, no root, and no Docker. It installs each tool it needs, such as Node.js through `actions/setup-node`.
- The `e2e` job runs `playwright install chromium` without `--with-deps`, because the runner machine already has Chromium's system libraries and a job has no root.
- npm trusted publishing supports only GitHub-hosted runners (https://docs.npmjs.com/trusted-publishers), so the `npm publish --provenance` step of `publish.yml` cannot authenticate on the self-hosted runners until the publish credential changes.
