import { type ChildProcess, spawn, spawnSync } from "node:child_process"
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { test as playwrightTest } from "@playwright/test"

const REPO_ROOT = resolve(__dirname, "../..")

const COMMIT_TEST_TIMEOUT = 120_000
const STOP_GRACE = 5000

const localGitVars = spawnSync("git", ["rev-parse", "--local-env-vars"], {
  encoding: "utf8",
})
  .stdout.split("\n")
  .map((name) => name.trim())
  .filter(Boolean)

function cleanEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env }
  for (const name of [...localGitVars, "LEFTHOOK", "LEFTHOOK_EXCLUDE"]) {
    delete env[name]
  }
  return env
}

function signalGroup(child: ChildProcess, signal: NodeJS.Signals): void {
  if (child.pid === undefined) {
    return
  }
  try {
    process.kill(-child.pid, signal)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ESRCH") {
      throw error
    }
  }
}

function stop(child: ChildProcess): Promise<void> {
  return new Promise((done) => {
    const kill = setTimeout(() => {
      signalGroup(child, "SIGKILL")
      done()
    }, STOP_GRACE)
    child.once("close", () => {
      clearTimeout(kill)
      done()
    })
    signalGroup(child, "SIGINT")
  })
}

export interface RunResult {
  output: string
  status: number | null
}

export interface Clone {
  append: (path: string, content: string) => void
  commit: (...args: string[]) => Promise<RunResult & { seconds: number }>
  dir: string
  git: (...args: string[]) => Promise<RunResult>
  head: () => Promise<string>
  read: (path: string) => string
  show: (path: string) => Promise<string | null>
  staged: () => Promise<string[]>
  status: () => Promise<string[]>
  write: (path: string, content: string) => void
}

function createClone() {
  const base = mkdtempSync(join(tmpdir(), "eiab-pre-commit-"))
  const dir = join(base, "repo")
  const env = cleanEnv()
  const running = new Set<ChildProcess>()
  let removed = false

  const run = (command: string, args: string[]) =>
    new Promise<RunResult>((done, fail) => {
      if (removed) {
        fail(new Error(`${command} ${args.join(" ")} ran after the test ended`))
        return
      }
      const child = spawn(command, args, {
        cwd: existsSync(dir) ? dir : base,
        env,
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
      })
      running.add(child)
      let stdout = ""
      let stderr = ""
      child.stdout.setEncoding("utf8").on("data", (chunk: string) => {
        stdout += chunk
      })
      child.stderr.setEncoding("utf8").on("data", (chunk: string) => {
        stderr += chunk
      })
      child.on("error", (error) => {
        running.delete(child)
        fail(error)
      })
      child.on("close", (status) => {
        running.delete(child)
        done({ status, output: `${stdout}${stderr}` })
      })
    })
  const must = async (command: string, args: string[]): Promise<string> => {
    const result = await run(command, args)
    if (result.status !== 0) {
      throw new Error(`${command} ${args.join(" ")} failed:\n${result.output}`)
    }
    return result.output
  }

  const git = (...args: string[]) => run("git", args)
  const lines = (text: string) => text.split("\n").filter(Boolean)

  const clone: Clone = {
    dir,
    git,
    commit: async (...args) => {
      const started = Date.now()
      const result = await git("commit", ...args)
      return { ...result, seconds: (Date.now() - started) / 1000 }
    },
    head: async () => (await must("git", ["rev-parse", "HEAD"])).trim(),
    show: async (path) => {
      const result = await git("show", `HEAD:${path}`)
      return result.status === 0 ? result.output : null
    },
    status: async () =>
      lines(
        await must("git", ["status", "--porcelain", "--untracked-files=all"])
      ),
    staged: async () =>
      lines(await must("git", ["diff", "--cached", "--name-only"])),
    read: (path) => readFileSync(join(dir, path), "utf8"),
    write: (path, content) => {
      const target = join(dir, path)
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, content)
    },
    append: (path, content) => appendFileSync(join(dir, path), content),
  }

  return {
    clone,
    setup: async () => {
      await must("git", [
        "-C",
        REPO_ROOT,
        "checkout-index",
        "--all",
        `--prefix=${dir}/`,
      ])
      await must("git", ["init", "--quiet", "--initial-branch=main"])
      await must("git", ["config", "user.name", "Pre-commit QA"])
      await must("git", ["config", "user.email", "qa@example.com"])
      await must("git", ["add", "--all", "--force"])
      await must("git", [
        "commit",
        "--quiet",
        "--message",
        "the checkout's index",
      ])
      await must("bun", ["install"])
    },
    remove: async () => {
      removed = true
      await Promise.all([...running].map(stop))
      spawn("rm", ["-rf", base], { detached: true, stdio: "ignore" }).unref()
    },
  }
}

export const test = playwrightTest.extend<{ makeClone: () => Promise<Clone> }>({
  makeClone: async ({}, use, testInfo) => {
    testInfo.setTimeout(COMMIT_TEST_TIMEOUT)
    const clones: ReturnType<typeof createClone>[] = []
    await use(async () => {
      const made = createClone()
      clones.push(made)
      await made.setup()
      return made.clone
    })
    await Promise.all(clones.map((made) => made.remove()))
  },
})
