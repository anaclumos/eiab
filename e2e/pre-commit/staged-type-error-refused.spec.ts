import { expect, test } from "@playwright/test"
import { COMMIT_TEST_TIMEOUT, makeClone } from "./clone"

test("a staged type error refuses the commit and stays staged", () => {
  test.setTimeout(COMMIT_TEST_TIMEOUT)
  const clone = makeClone()
  try {
    const before = clone.head()
    clone.append(
      "packages/eiab/src/index.ts",
      '\nexport const qaBad: number = "not a number"\n'
    )
    clone.git("add", "packages/eiab/src/index.ts")

    const result = clone.commit("-m", "type error")

    expect(result.status, result.output).not.toBe(0)
    expect(result.output).toContain("TS2322")
    expect(clone.head()).toBe(before)
    expect(clone.staged()).toEqual(["packages/eiab/src/index.ts"])
    expect(clone.git("diff", "--cached").output).toContain("qaBad")
  } finally {
    clone.remove()
  }
})
