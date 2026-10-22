import { expect, test } from "@playwright/test"
import {
  FIXTURE,
  killAll,
  makeInnerDir,
  pids,
  removeInnerDir,
  runInner,
  settledPids,
  TIMEOUT_ERROR,
  uniqueSleep,
  watchPids,
} from "./qa-inner-run"

const aliasSpec = (
  alias: string
) => `import { test } from ${JSON.stringify(FIXTURE)}

test("QA alias left running", async ({ makeClone }) => {
  const started = Date.now()
  const clone = await makeClone()
  test.setTimeout(Date.now() - started + 5000)
  await clone.git("-c", ${JSON.stringify(`alias.hang=${alias}`)}, "hang")
})
`

test("a git command that times out leaves none of the background processes it started", async () => {
  test.setTimeout(170_000)
  const sleep = uniqueSleep()
  const dir = makeInnerDir()
  const watch = watchPids(sleep)
  try {
    const result = await runInner(
      dir,
      {
        "hangs.spec.ts": aliasSpec(
          `!sleep ${sleep} </dev/null >/dev/null 2>&1 & sleep ${sleep}`
        ),
      },
      { deadlineMs: 150_000 }
    )
    await watch.stop()
    expect(result.output).toMatch(TIMEOUT_ERROR)
    expect(watch.seen.size, "the alias never started").toBeGreaterThan(0)
    expect(await settledPids(sleep, 10_000)).toEqual([])
  } finally {
    await watch.stop()
    killAll(await pids(sleep))
    removeInnerDir(dir)
  }
})
