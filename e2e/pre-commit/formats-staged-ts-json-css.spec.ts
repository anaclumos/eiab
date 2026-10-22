import { expect, test } from "@playwright/test"
import { COMMIT_TEST_TIMEOUT, makeClone } from "./clone"

test("staged TypeScript, JSON, and CSS are committed formatted with a clean tree", () => {
  test.setTimeout(COMMIT_TEST_TIMEOUT)
  const clone = makeClone()
  try {
    const files = {
      "packages/eiab/src/qa-format.ts":
        "export const qaFormatted = { a:1,b:2 };\n",
      "packages/eiab/qa-fixture.json": '{"a":1,"b":[1,2]}',
      "apps/demo/app/qa.css": ".qa-probe{color:red}",
    }
    for (const [path, content] of Object.entries(files)) {
      clone.write(path, content)
      clone.git("add", path)
    }

    const result = clone.commit("-m", "unformatted files")

    expect(result.status, result.output).toBe(0)
    expect(clone.show("packages/eiab/src/qa-format.ts")).toBe(
      "export const qaFormatted = { a: 1, b: 2 }\n"
    )
    expect(clone.show("packages/eiab/qa-fixture.json")).toBe(
      '{ "a": 1, "b": [1, 2] }\n'
    )
    expect(clone.show("apps/demo/app/qa.css")).toBe(
      ".qa-probe {\n  color: red;\n}\n"
    )
    for (const path of Object.keys(files)) {
      expect(clone.read(path)).toBe(clone.show(path))
    }
    expect(clone.status()).toEqual([])
  } finally {
    clone.remove()
  }
})
