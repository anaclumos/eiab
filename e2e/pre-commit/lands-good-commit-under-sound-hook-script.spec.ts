import { expect } from "@playwright/test"
import { test } from "./clone"

const GOOD = "packages/eiab/src/qa-probe.ts"
const CONTENT = "export const qaProbe = 1\n"

test("lands a good commit under the sound hook script", async ({
  makeClone,
}, testInfo) => {
  const clone = await makeClone()
  const before = await clone.head()
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
  expect(await clone.staged()).toEqual([])
})
