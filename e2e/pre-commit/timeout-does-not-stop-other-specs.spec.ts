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

const FAILED_QA_HUNG_NEIGHBOUR = /✘.*QA hung neighbour/
const PASSED_QA_QUICK_COMMIT_LANDS = /✓.*QA quick commit lands/

test("a spec that times out still lets the other specs run and report", async () => {
  test.setTimeout(170_000)
  const sleep = uniqueSleep()
  const dir = makeInnerDir()
  try {
    const result = await runInner(
      dir,
      {
        "hangs.spec.ts": commitSpec("QA hung neighbour", `sleep ${sleep}`, {
          budgetAfterSetupMs: 5000,
        }),
        "lands.spec.ts": commitSpec("QA quick commit lands", "exit 0", {
          budgetAfterSetupMs: 60_000,
          after: `expect(result.status).toBe(0)
  expect(await clone.show("note.txt")).toBe("a note\\n")`,
        }),
      },
      { workers: 2, deadlineMs: 150_000 }
    )
    expect(result.killed, result.output).toBe(false)
    expect(result.code, result.output).toBe(1)
    expect(result.output).toMatch(FAILED_QA_HUNG_NEIGHBOUR)
    expect(result.output).toMatch(TIMEOUT_ERROR)
    expect(result.output).toMatch(PASSED_QA_QUICK_COMMIT_LANDS)
    expect(result.output).toContain("1 failed")
    expect(result.output).toContain("1 passed")
  } finally {
    killAll(await pids(sleep))
    removeInnerDir(dir)
  }
})
