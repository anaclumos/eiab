import { chmodSync } from "node:fs"
import { join } from "node:path"
import { expect } from "@playwright/test"
import { test } from "./clone"

test("a commit the hook refuses within budget does not land", async ({
  makeClone,
}) => {
  const clone = await makeClone()
  const before = await clone.head()
  clone.write(
    "scripts/pre-commit.sh",
    "#!/bin/sh\nsleep 1\necho qa-hook-says-no >&2\nexit 1\n"
  )
  chmodSync(join(clone.dir, "scripts/pre-commit.sh"), 0o755)
  clone.write("refused-note.txt", "never committed\n")
  await clone.git("add", "scripts/pre-commit.sh", "refused-note.txt")
  const result = await clone.commit("-m", "add a refused note")
  expect(result.status).not.toBe(0)
  expect(result.output).toContain("qa-hook-says-no")
  expect(await clone.head()).toBe(before)
  expect(await clone.show("refused-note.txt")).toBeNull()
  expect(await clone.staged()).toContain("refused-note.txt")
})
