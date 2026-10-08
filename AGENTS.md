# eiab

## CI

- This repository runs its CI on the owner's self-hosted runners on `evergreen`, a Linux arm64 machine. The repository variable `CI_RUNNER` selects the runners: `github` selects the GitHub-hosted `ubuntu-24.04` image, and every other value, unset included, selects the self-hosted runners. The runner switch in the `ship` skill sets and deletes it.
- The `test` job of `ci.yml` runs on the runners with the label `check`. Its `runs-on` is `${{ vars.CI_RUNNER == 'github' && 'ubuntu-24.04' || fromJSON('["self-hosted","linux","arm64","check"]') }}`.
- A job on the self-hosted runners gets a fresh user with a memory-backed home, no root, and no Docker. It installs each tool it needs, such as Node.js through `actions/setup-node`.
- The `e2e` job of `ci.yml` runs on GitHub-hosted runners, because `playwright install --with-deps` installs Chromium's system libraries with root, and the self-hosted runners have neither root nor those libraries.
- `publish.yml` runs on GitHub-hosted runners, because npm trusted publishing supports only GitHub-hosted runners (https://docs.npmjs.com/trusted-publishers).
