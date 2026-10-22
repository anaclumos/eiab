import { expect } from "@playwright/test"
import { test } from "./clone"

const SCRIPT = "scripts/pre-commit.sh"
const GOOD = "packages/eiab/src/qa-probe.ts"
const CONTENT = "export const qaProbe = 1\n"

test("an unstaged break in the hook script does not block a good commit", async ({
  makeClone,
}, testInfo) => {
  const clone = await makeClone()
  const before = await clone.head()
  const sound = clone.read(SCRIPT)
  const lines = sound.split("\n")
  lines.splice(1, 0, "done")
  clone.write(SCRIPT, lines.join("\n"))
  clone.write(GOOD, CONTENT)
  await clone.git("add", GOOD)

  const result = await clone.commit("-m", "qa: probe")
  await testInfo.attach("commit output", {
    body: result.output,
    contentType: "text/plain",
  })

  expect(result.status).toBe(0)
  expect(await clone.head()).not.toBe(before)
  expect(await clone.show(GOOD)).toBe(CONTENT)
  expect(await clone.show(SCRIPT)).toBe(sound)
  expect(clone.read(SCRIPT)).not.toBe(sound)
})
