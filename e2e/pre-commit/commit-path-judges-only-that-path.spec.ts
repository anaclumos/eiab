import { expect, test } from "@playwright/test"
import { COMMIT_TEST_TIMEOUT, makeClone } from "./clone"

test("git commit <path> judges only the path it commits", () => {
  test.setTimeout(COMMIT_TEST_TIMEOUT)
  const good = "apps/demo/lib/utils.ts"
  const bad = "packages/eiab/src/index.ts"
  const clone = makeClone()
  try {
    clone.append(bad, '\nexport const qaBad: number = "not a number"\n')
    clone.git("add", bad)
    clone.append(good, "\nexport const qaPathOnly = 1\n")

    const accepted = clone.commit("-m", "good path only", good)

    expect(accepted.status, accepted.output).toBe(0)
    expect(clone.show(good)).toContain("export const qaPathOnly = 1")
    expect(clone.show(bad)).not.toContain("qaBad")
    expect(clone.staged()).toEqual([bad])

    const afterGood = clone.head()
    const refused = clone.commit("-m", "bad path only", bad)

    expect(refused.status, refused.output).not.toBe(0)
    expect(refused.output).toContain("TS2322")
    expect(clone.head()).toBe(afterGood)
    expect(clone.show(bad)).not.toContain("qaBad")
  } finally {
    clone.remove()
  }
})
