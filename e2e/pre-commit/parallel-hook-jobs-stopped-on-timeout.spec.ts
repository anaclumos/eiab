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

test("a timed-out commit whose hook runs jobs in parallel leaves none of them running", async () => {
  test.setTimeout(170_000)
  const first = uniqueSleep()
  const second = uniqueSleep()
  const dir = makeInnerDir()
  const watchFirst = watchPids(first)
  const watchSecond = watchPids(second)
  try {
    const result = await runInner(
      dir,
      {
        "parallel.spec.ts": commitSpec(
          "QA parallel hook jobs",
          `sh -c "sleep ${first}" &\nsleep ${second} &\nwait`,
          { budgetAfterSetupMs: 5000 }
        ),
      },
      { deadlineMs: 150_000 }
    )
    await watchFirst.stop()
    await watchSecond.stop()
    expect(result.output).toMatch(TIMEOUT_ERROR)
    expect(
      watchFirst.seen.size,
      "the nested job never started"
    ).toBeGreaterThan(0)
    expect(
      watchSecond.seen.size,
      "the plain job never started"
    ).toBeGreaterThan(0)
    expect(await settledPids(first, 10_000)).toEqual([])
    expect(await settledPids(second, 10_000)).toEqual([])
  } finally {
    await watchFirst.stop()
    await watchSecond.stop()
    killAll([...(await pids(first)), ...(await pids(second))])
    removeInnerDir(dir)
  }
})
