- Library packaging: `exports` with `types` + dual `import`/`require` outputs from `tsup`.
- Escape behavior by platform:
  - KakaoTalk: `kakaotalk://web/openExternal?url=...`
  - LINE: append `openExternalBrowser=1`
  - Android in-app: Chrome intent URI
  - iOS in-app: always `x-safari-https://` / `x-safari-http://` (no iOS version branching in `getEscapeUrl()`; `getIOSVersion()` remains available for consumers).
- Vitest in `jsdom` can cover default `navigator.userAgent` / `location.href` access via `vi.stubGlobal()`.

## Bun Migration (Jan 21, 2026)

### Successful Patterns
- **Bun test runner**: Jest-compatible, 13 tests pass with `bun:test` imports. Global stubs use `globalThis` assignment + restore pattern instead of `vi.stubGlobal()`.
- **Bun bundler**: `Bun.build()` API generates minified ESM output with sourcemaps. Requires separate `tsc` invocation for `.d.ts` generation.
- **Type declaration generation**: Use temporary `tsconfig.build.json` with `noEmit: false` + `emitDeclarationOnly: true` to override main config's `noEmit: true`. Prevents tsc from emitting JS files.
- **ESM-only exports**: Removed `require` and `main` fields from package.json. Single export entry: `{ "types": "./dist/index.d.ts", "import": "./dist/index.js" }`.
- **GitHub Actions**: `oven-sh/setup-bun@v1` replaces pnpm setup. No node-version matrix needed (Bun is self-contained).
- **npm publish**: Use `npm publish` (not `bun publish`) with `--provenance` flag in CI. Bun handles auth via NODE_AUTH_TOKEN.

### Key Gotchas
- **tsconfig.json declaration flag**: Must set `declaration: true` for tsc to emit `.d.ts` files, even with `emitDeclarationOnly`.
- **Global stubs in Bun tests**: No `vi.unstubAllGlobals()`. Must manually restore original values: `globalThis.navigator = originalNavigator`.
- **Build script complexity**: Bun.build() doesn't generate .d.ts natively. Hybrid approach: Bun for JS bundling + tsc for types.
- **Temporary config cleanup**: Must delete `tsconfig.build.json` after tsc runs to avoid polluting repo.

### Migration Checklist
- [x] Deleted pnpm-lock.yaml, tsup.config.ts, vitest.config.ts
- [x] Updated package.json: ESM-only exports, Bun scripts, removed packageManager
- [x] Updated test/index.test.ts: bun:test imports, globalThis stubs
- [x] Created build.ts: Bun.build() + tsc hybrid approach
- [x] Updated CI/publish workflows: oven-sh/setup-bun@v1
- [x] Updated README: bun add + ESM-only note
- [x] All 13 tests pass
- [x] Build generates dist/index.js + dist/index.d.ts
- [x] TypeScript: zero errors

## Knip Dead Code Analysis (Jan 21, 2026)

### Findings
- **Knip installed**: v5.82.1
- **Analysis result**: ZERO issues found
  - No unused files
  - No unused exports
  - No unused dependencies
  - No unused devDependencies
  - No unused types

### Code Quality Assessment
The codebase is **clean and well-maintained**:
- All 4 public API exports are used: `isInAppBrowser`, `getEscapeUrl`, `attemptEscape`, `getIOSVersion`
- All internal helper functions are actively used:
  - `getDefaultUserAgent()` - used by all public functions
  - `getDefaultUrl()` - used by `getEscapeUrl()` and `attemptEscape()`
  - `isIOS()` - used by `getEscapeUrl()` and `getIOSVersion()`
  - `isAndroid()` - used by `getEscapeUrl()`
  - `addQueryParam()` - used by LINE escape logic
  - `replaceScheme()` - used by iOS escape logic
  - `toAndroidChromeIntent()` - used by Android escape logic
- All regex patterns are actively used in detection logic
- All devDependencies are necessary:
  - `@types/bun` - for Bun test runner types
  - `@types/node` - for Node.js types (used in build.ts)
  - `typescript` - for type checking and .d.ts generation

### Verification
- ✅ 13 tests pass
- ✅ Build succeeds
- ✅ TypeScript typecheck passes
- ✅ LSP diagnostics: zero errors
- ✅ No dead code to remove
