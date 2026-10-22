import { expect, test } from "@playwright/test"
import { COMMIT_TEST_TIMEOUT, makeClone } from "./clone"

test("a commit that only deletes a module other code imports is refused", () => {
  test.setTimeout(COMMIT_TEST_TIMEOUT)
  const dep = "packages/eiab/src/qa-dep.ts"
  const user = "packages/eiab/src/qa-consumer.ts"
  const clone = makeClone()
  try {
    clone.write(dep, "export const qaDep = 1\n")
    clone.write(
      user,
      'import { qaDep } from "./qa-dep"\n\nexport const qaConsumer = qaDep + 1\n'
    )
    clone.git("add", dep, user)
    const added = clone.commit("-m", "add module and its consumer")
    expect(added.status, added.output).toBe(0)
    const before = clone.head()

    clone.git("rm", "--quiet", dep)
    const result = clone.commit("-m", "delete imported module")

    expect(result.status, result.output).not.toBe(0)
    expect(result.output).toContain("TS2307")
    expect(clone.head()).toBe(before)
    expect(clone.show(dep)).toBe("export const qaDep = 1\n")
    expect(clone.status()).toEqual([`D  ${dep}`])
  } finally {
    clone.remove()
  }
})
