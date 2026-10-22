import { expect } from "@playwright/test"
import { test } from "./clone"

const BAD = "packages/eiab/src/qa-probe.ts"

test("refuses a staged type error under the sound hook script", async ({
  makeClone,
}, testInfo) => {
  const clone = await makeClone()
  const before = await clone.head()
  clone.write(BAD, 'export const qaProbe: number = "one"\n')
  await clone.git("add", BAD)

  const result = await clone.commit("-m", "qa: probe")
  await testInfo.attach("commit output", {
    body: result.output,
    contentType: "text/plain",
  })

  expect(result.status).not.toBe(0)
  expect(result.output).toContain("TS2322")
  expect(await clone.head()).toBe(before)
  expect(await clone.show(BAD)).toBeNull()
  expect(await clone.staged()).toContain(BAD)
})
