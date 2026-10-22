import { expect, test } from "@playwright/test"
import { COMMIT_TEST_TIMEOUT, makeClone } from "./clone"

test("git commit -a is refused for a tracked type error and passes once it is fixed", () => {
  test.setTimeout(COMMIT_TEST_TIMEOUT)
  const path = "packages/eiab/src/index.ts"
  const clone = makeClone()
  try {
    const before = clone.head()
    const original = clone.read(path)
    clone.write(
      path,
      `${original}\nexport const qaAll: number = "not a number"\n`
    )

    const refused = clone.commit("-a", "-m", "commit all with error")

    expect(refused.status, refused.output).not.toBe(0)
    expect(refused.output).toContain("TS2322")
    expect(clone.head()).toBe(before)
    expect(clone.show(path)).not.toContain("qaAll")

    clone.write(path, `${original}\nexport const qaAll = 1\n`)
    const accepted = clone.commit("-a", "-m", "commit all fixed")

    expect(accepted.status, accepted.output).toBe(0)
    expect(clone.show(path)).toContain("export const qaAll = 1")
    expect(clone.status()).toEqual([])
  } finally {
    clone.remove()
  }
})
