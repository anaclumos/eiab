import { readFileSync } from "node:fs"
import { join } from "node:path"
import { expect, test } from "@playwright/test"
import {
  commitSpec,
  killAll,
  makeInnerDir,
  pids,
  removeInnerDir,
  reportedSeconds,
  runInner,
  TIMEOUT_ERROR,
  uniqueSleep,
} from "./qa-inner-run"

const FAILED_QA_SLOW_COMMIT = /✘.*QA slow commit/

test("a commit that would finish only after the spec's budget fails at the budget instead of passing", async () => {
  test.setTimeout(170_000)
  const sleep = uniqueSleep()
  const hookSeconds = 10
  const dir = makeInnerDir()
  const record = join(dir, "setup-ms.txt")
  try {
    const result = await runInner(
      dir,
      {
        "slow.spec.ts": commitSpec(
          "QA slow commit",
          `sleep ${sleep} & pid=$!; sleep ${hookSeconds}; kill $pid; exit 0`,
          {
            budgetAfterSetupMs: 3000,
            before: `writeFileSync(${JSON.stringify(record)}, String(Date.now() - started))`,
            after: "expect(result.status).toBe(0)",
          }
        ),
      },
      { deadlineMs: 150_000 }
    )
    expect(result.killed, result.output).toBe(false)
    expect(result.code, result.output).toBe(1)
    expect(result.output).toMatch(FAILED_QA_SLOW_COMMIT)
    expect(result.output).toMatch(TIMEOUT_ERROR)
    const setupSeconds = Number(readFileSync(record, "utf8")) / 1000
    expect(reportedSeconds(result.output, "QA slow commit")).toBeLessThan(
      setupSeconds + hookSeconds
    )
  } finally {
    killAll(await pids(sleep))
    removeInnerDir(dir)
  }
})
