import { expect } from "@playwright/test"
import { test } from "./clone"

test("a good staged change commits in seconds despite broken files outside the commit", async ({
  makeClone,
}) => {
  const clone = await makeClone()
  const before = await clone.head()
  clone.append("apps/demo/lib/utils.ts", "\nexport const qaGoodChange = 1\n")
  await clone.git("add", "apps/demo/lib/utils.ts")
  clone.write(
    "packages/eiab/src/qa-scratch.ts",
    'export const qaScratch: number = "not a number"\n'
  )
  clone.append(
    "packages/eiab/src/index.ts",
    '\nexport const qaUnstaged: number = "not a number"\n'
  )

  const result = await clone.commit("-m", "good change")

  expect(result.status, result.output).toBe(0)
  expect(result.seconds).toBeLessThan(60)
  expect(await clone.head()).not.toBe(before)
  expect(await clone.show("apps/demo/lib/utils.ts")).toContain(
    "export const qaGoodChange = 1"
  )
  expect(await clone.show("packages/eiab/src/index.ts")).not.toContain(
    "qaUnstaged"
  )
  expect(await clone.status()).toEqual(
    expect.arrayContaining([
      " M packages/eiab/src/index.ts",
      "?? packages/eiab/src/qa-scratch.ts",
    ])
  )
  expect(clone.read("packages/eiab/src/index.ts")).toContain("qaUnstaged")
})
