import { readFileSync } from "node:fs"
import { expect, test } from "@playwright/test"
import {
  FIXTURE,
  makeInnerDir,
  removeInnerDir,
  reportedSeconds,
  runInner,
} from "./qa-inner-run"

const PASSED_QA_SETUP_BASELINE = /✓.*QA setup baseline/
const FAILED_QA_SETUP_PAST_BUDGET = /✘.*QA setup past budget/
const SETUP_TIMEOUT = /Test timeout of 300 ?ms exceeded\./

test("a spec whose throwaway repository's setup outlasts its budget fails at that budget", async () => {
  test.setTimeout(170_000)
  const dir = makeInnerDir()
  try {
    const result = await runInner(
      dir,
      {
        "setup.spec.ts": `import { test } from ${JSON.stringify(FIXTURE)}
import { writeFileSync } from "node:fs"

test("QA setup baseline", async ({ makeClone }) => {
  const started = Date.now()
  await makeClone()
  writeFileSync("setup-ms.txt", String(Date.now() - started))
})

test("QA setup past budget", async ({ makeClone }) => {
  test.setTimeout(300)
  await makeClone()
})
`,
      },
      { workers: 2, deadlineMs: 150_000 }
    )
    expect(result.killed, result.output).toBe(false)
    expect(result.output).toMatch(PASSED_QA_SETUP_BASELINE)
    expect(result.output).toMatch(FAILED_QA_SETUP_PAST_BUDGET)
    expect(result.output).toMatch(SETUP_TIMEOUT)
    const setupSeconds =
      Number(readFileSync(`${dir}/setup-ms.txt`, "utf8")) / 1000
    const timedOutAfter = reportedSeconds(result.output, "QA setup past budget")
    expect(timedOutAfter).toBeLessThan(setupSeconds)
  } finally {
    removeInnerDir(dir)
  }
})
