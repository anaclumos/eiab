import { chmodSync } from "node:fs"
import { join } from "node:path"
import { expect } from "@playwright/test"
import { test } from "./clone"

test("a commit whose hook is slow but finishes within budget lands", async ({
  makeClone,
}) => {
  const clone = await makeClone()
  const before = await clone.head()
  clone.write("scripts/pre-commit.sh", "#!/bin/sh\nsleep 4\nexit 0\n")
  chmodSync(join(clone.dir, "scripts/pre-commit.sh"), 0o755)
  clone.write("slow-note.txt", "written slowly\n")
  await clone.git("add", "scripts/pre-commit.sh", "slow-note.txt")
  const result = await clone.commit("-m", "add a slow note")
  expect(result.status, result.output).toBe(0)
  expect(result.seconds).toBeGreaterThanOrEqual(4)
  expect(await clone.head()).not.toBe(before)
  expect(await clone.show("slow-note.txt")).toBe("written slowly\n")
  expect(await clone.staged()).toEqual([])
})
