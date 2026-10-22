import { expect } from "@playwright/test"
import { test } from "./clone"

const SCRIPT = "scripts/pre-commit.sh"
const BAD = "packages/eiab/src/qa-probe.ts"

test("an unstaged exit 0 in the hook script does not let a type error land", async ({
  makeClone,
}, testInfo) => {
  const clone = await makeClone()
  const before = await clone.head()
  const lines = clone.read(SCRIPT).split("\n")
  lines.splice(1, 0, "exit 0")
  clone.write(SCRIPT, lines.join("\n"))
  clone.write(BAD, 'export const qaProbe: number = "one"\n')
  await clone.git("add", BAD)

  const result = await clone.commit("-m", "qa: probe")
  await testInfo.attach("commit output", {
    body: result.output,
    contentType: "text/plain",
  })

  expect(result.status).not.toBe(0)
  expect(await clone.head()).toBe(before)
  expect(await clone.show(BAD)).toBeNull()
  expect(await clone.staged()).toEqual([BAD])
})
