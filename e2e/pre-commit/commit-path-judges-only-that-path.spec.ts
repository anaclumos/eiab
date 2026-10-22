import { expect } from "@playwright/test"
import { test } from "./clone"

test("git commit <path> judges only the path it commits", async ({
  makeClone,
}) => {
  const good = "apps/demo/lib/utils.ts"
  const bad = "packages/eiab/src/index.ts"
  const clone = await makeClone()
  clone.append(bad, '\nexport const qaBad: number = "not a number"\n')
  await clone.git("add", bad)
  clone.append(good, "\nexport const qaPathOnly = 1\n")

  const accepted = await clone.commit("-m", "good path only", good)

  expect(accepted.status, accepted.output).toBe(0)
  expect(await clone.show(good)).toContain("export const qaPathOnly = 1")
  expect(await clone.show(bad)).not.toContain("qaBad")
  expect(await clone.staged()).toEqual([bad])

  const afterGood = await clone.head()
  const refused = await clone.commit("-m", "bad path only", bad)

  expect(refused.status, refused.output).not.toBe(0)
  expect(refused.output).toContain("TS2322")
  expect(await clone.head()).toBe(afterGood)
  expect(await clone.show(bad)).not.toContain("qaBad")
})
