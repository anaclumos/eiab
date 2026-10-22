import { expect, test } from "@playwright/test"
import {
  commitSpec,
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

test("a commit that times out leaves none of the processes its hook started", async () => {
  test.setTimeout(170_000)
  const sleep = uniqueSleep()
  const dir = makeInnerDir()
  const watch = watchPids(sleep)
  try {
    const result = await runInner(
      dir,
      {
        "hangs.spec.ts": commitSpec("QA hook left running", `sleep ${sleep}`, {
          budgetAfterSetupMs: 5000,
        }),
      },
      { deadlineMs: 150_000 }
    )
    await watch.stop()
    expect(result.output).toMatch(TIMEOUT_ERROR)
    expect(watch.seen.size, "the hung hook never started").toBeGreaterThan(0)
    expect(await settledPids(sleep, 10_000)).toEqual([])
  } finally {
    await watch.stop()
    killAll(await pids(sleep))
    removeInnerDir(dir)
  }
})
