import { expect } from "@playwright/test"
import { test } from "./clone"

test("staged TypeScript, JSON, and CSS are committed formatted with a clean tree", async ({
  makeClone,
}) => {
  const clone = await makeClone()
  const files = {
    "packages/eiab/src/qa-format.ts":
      "export const qaFormatted = { a:1,b:2 };\n",
    "packages/eiab/qa-fixture.json": '{"a":1,"b":[1,2]}',
    "apps/demo/app/qa.css": ".qa-probe{color:red}",
  }
  for (const [path, content] of Object.entries(files)) {
    clone.write(path, content)
    await clone.git("add", path)
  }

  const result = await clone.commit("-m", "unformatted files")

  expect(result.status, result.output).toBe(0)
  expect(await clone.show("packages/eiab/src/qa-format.ts")).toBe(
    "export const qaFormatted = { a: 1, b: 2 }\n"
  )
  expect(await clone.show("packages/eiab/qa-fixture.json")).toBe(
    '{ "a": 1, "b": [1, 2] }\n'
  )
  expect(await clone.show("apps/demo/app/qa.css")).toBe(
    ".qa-probe {\n  color: red;\n}\n"
  )
  for (const path of Object.keys(files)) {
    expect(clone.read(path)).toBe(await clone.show(path))
  }
  expect(await clone.status()).toEqual([])
})
