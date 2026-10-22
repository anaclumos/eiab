import { expect, test } from "@playwright/test"
import {
  commitSpec,
  killAll,
  makeInnerDir,
  pids,
  removeInnerDir,
  runInner,
  TIMEOUT_ERROR,
  uniqueSleep,
} from "./qa-inner-run"

const FAILED_QA_HUNG_HOOK_COMMIT = /✘.*QA hung hook commit/

test("a commit whose hook hangs fails at the spec's timeout and the run finishes", async () => {
  test.setTimeout(170_000)
  const sleep = uniqueSleep()
  const dir = makeInnerDir()
  try {
    const result = await runInner(
      dir,
      {
        "hangs.spec.ts": commitSpec("QA hung hook commit", `sleep ${sleep}`, {
          budgetAfterSetupMs: 5000,
        }),
      },
      { deadlineMs: 150_000 }
    )
    expect(result.killed, result.output).toBe(false)
    expect(result.code, result.output).toBe(1)
    expect(result.output).toMatch(TIMEOUT_ERROR)
    expect(result.output).toMatch(FAILED_QA_HUNG_HOOK_COMMIT)
    expect(result.output).toContain("1 failed")
  } finally {
    killAll(await pids(sleep))
    removeInnerDir(dir)
  }
})
