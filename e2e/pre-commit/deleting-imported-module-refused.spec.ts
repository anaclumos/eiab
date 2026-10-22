import { expect } from "@playwright/test"
import { test } from "./clone"

test("a commit that only deletes a module other code imports is refused", async ({
  makeClone,
}) => {
  const dep = "packages/eiab/src/qa-dep.ts"
  const user = "packages/eiab/src/qa-consumer.ts"
  const clone = await makeClone()
  clone.write(dep, "export const qaDep = 1\n")
  clone.write(
    user,
    'import { qaDep } from "./qa-dep"\n\nexport const qaConsumer = qaDep + 1\n'
  )
  await clone.git("add", dep, user)
  const added = await clone.commit("-m", "add module and its consumer")
  expect(added.status, added.output).toBe(0)
  const before = await clone.head()

  await clone.git("rm", "--quiet", dep)
  const result = await clone.commit("-m", "delete imported module")

  expect(result.status, result.output).not.toBe(0)
  expect(result.output).toContain("TS2307")
  expect(await clone.head()).toBe(before)
  expect(await clone.show(dep)).toBe("export const qaDep = 1\n")
  expect(await clone.status()).toEqual([`D  ${dep}`])
})
