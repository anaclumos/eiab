import { expect } from "@playwright/test"
import { test } from "./clone"

const SCRIPT = "scripts/pre-commit.sh"
const GOOD = "packages/eiab/src/qa-probe.ts"

test("refuses a commit when the staged hook script references an unset variable", async ({
  makeClone,
}, testInfo) => {
  const clone = await makeClone()
  const before = await clone.head()
  clone.append(SCRIPT, '\necho "$EIAB_QA_TYPO_DIRR" >/dev/null\n')
  clone.write(GOOD, "export const qaProbe = 1\n")
  await clone.git("add", SCRIPT, GOOD)

  const result = await clone.commit("-m", "qa: probe")
  await testInfo.attach("commit output", {
    body: result.output,
    contentType: "text/plain",
  })

  expect(result.status).not.toBe(0)
  expect(await clone.head()).toBe(before)
  expect(await clone.staged()).toEqual(expect.arrayContaining([SCRIPT, GOOD]))
})
