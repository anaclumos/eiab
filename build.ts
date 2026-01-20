import { build } from "bun";
import { writeFileSync } from "fs";

// Build the library with Bun
await build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  target: "browser",
  format: "esm",
  minify: true,
  sourcemap: "external",
});

// Generate .d.ts files using tsc with a temporary config
const tempConfig = {
  extends: "./tsconfig.json",
  compilerOptions: {
    noEmit: false,
    emitDeclarationOnly: true,
    outDir: "./dist",
  },
  include: ["src/index.ts"],
};

writeFileSync("tsconfig.build.json", JSON.stringify(tempConfig, null, 2));

const result = await Bun.spawn(["tsc", "-p", "tsconfig.build.json"], {
  stdout: "inherit",
  stderr: "inherit",
});

const exitCode = await result.exited;

// Clean up temp config
import { unlinkSync } from "fs";
unlinkSync("tsconfig.build.json");

if (exitCode !== 0) {
  process.exit(exitCode);
}
