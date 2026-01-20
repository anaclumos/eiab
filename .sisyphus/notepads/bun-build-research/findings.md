# Bun Native CLI Build Commands Research

## Executive Summary

**Recommendation: KEEP current `build.ts` approach with minor improvements**

Bun's native `bun build` CLI is powerful but has a critical limitation for TypeScript libraries: **it does NOT generate `.d.ts` files natively**. This requires a plugin or external tool regardless of approach.

---

## 1. Bun's Native `bun build` CLI

### Available Flags (from `bun build --help`)

**Core Options:**
- `--target=<val>` - "browser", "bun", or "node"
- `--format=<val>` - "esm", "cjs", or "iife" (defaults to "esm")
- `--outdir=<val>` - Output directory (defaults to "dist")
- `--outfile=<val>` - Single output file
- `--sourcemap=<val>` - "linked", "inline", "external", or "none"
- `--minify` - Enable all minification
- `--production` - Set NODE_ENV=production + minify
- `--no-bundle` - **Transpile only, do not bundle**
- `--watch` - Auto-reload on file changes

**Advanced Options:**
- `--splitting` - Code splitting
- `--external=<val>` - Exclude modules from bundling
- `--packages=<val>` - "external" or "bundle" (defaults to "bundle")
- `--banner=<val>` - Add banner (e.g., "use client")
- `--footer=<val>` - Add footer
- `--env=<val>` - Inline environment variables
- `--conditions=<val>` - Custom package.json export conditions

### Example Usage

```bash
# Basic bundling
bun build --outfile=bundle.js ./src/index.ts

# With minification and sourcemaps
bun build --minify --sourcemap=external --outdir=dist ./src/index.ts

# Transpile only (no bundling)
bun build --no-bundle --outdir=dist ./src/index.ts

# Watch mode
bun build --watch --outdir=dist ./src/index.ts
```

---

## 2. TypeScript Declaration Generation

### Critical Finding: NO Native `.d.ts` Support

**Bun's `bun build` CLI does NOT generate `.d.ts` files natively.**

This is a known limitation documented in GitHub issue #5141 (oven-sh/bun).

### Solutions Available

#### Option A: Use a Bun Plugin (Recommended for `bun build` CLI)

Several community plugins exist:

1. **`bun-plugin-dts`** (most popular)
   - npm: `bun add -d bun-plugin-dts`
   - Uses `dts-bundle-generator` internally
   - Works with `Bun.build()` API (not CLI)
   - 30+ dependents on npm

2. **`@shtse8/bun-plugin-dts`**
   - Uses TypeScript Compiler API
   - Generates `.d.ts` during build process

3. **`bun-plugin-isolated-decl`**
   - Ultra-fast using Bun + oxc
   - Newer, less tested

#### Option B: Use `tsc` (Current Approach)
- Standard TypeScript compiler
- Reliable, well-tested
- Requires separate invocation
- What we're currently doing

#### Option C: Use Plain `tsc` Only (No Bundling)
- Skip bundling entirely
- Just transpile + generate types
- Simplest for small libraries

---

## 3. Comparison: Three Approaches

### Approach A: `bun build` CLI + Plugin

**Pros:**
- Native Bun CLI experience
- Fast bundling
- Plugin ecosystem growing
- Can use `--watch` mode

**Cons:**
- Requires plugin dependency
- Plugins less mature than tsc
- Still need to manage plugin in build script
- Not much simpler than current approach

**Example:**
```bash
bun build --outdir=dist --minify --sourcemap=external ./src/index.ts
# (with plugin in bunfig.toml or build.ts)
```

---

### Approach B: `build.ts` with Bun.build() API + tsc (CURRENT)

**Pros:**
- Full control over build process
- Can customize bundling and type generation
- Bun.build() API is stable and documented
- tsc is battle-tested for type generation
- Easy to add plugins if needed

**Cons:**
- Requires custom build script
- Two-step process (bundle + types)
- Temporary config file cleanup

**Current Implementation:**
```typescript
// build.ts
await build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  target: "browser",
  format: "esm",
  minify: true,
  sourcemap: "external",
});

// Then run tsc for .d.ts
```

---

### Approach C: Plain `tsc` Only (No Bundling)

**Pros:**
- Simplest approach
- No bundling overhead
- Single tool (tsc)
- Smallest output
- Fastest build

**Cons:**
- No minification
- No bundling (dependencies not included)
- Larger output if dependencies exist
- Less optimization

**Example:**
```bash
tsc --outDir dist --declaration --declarationMap --sourceMap
```

---

## 4. Library Context Analysis

### Current Library: `eiab`

**Characteristics:**
- Single file: `src/index.ts`
- ~2KB unminified
- Zero runtime dependencies
- ESM-only
- Browser target

**Assessment:**
- **Bundling is optional** - no dependencies to bundle
- **Minification is nice** - saves ~0.5KB
- **Sourcemaps are useful** - for debugging
- **Type declarations are essential** - for TypeScript consumers

---

## 5. Production Library Patterns (2025)

### What Real Libraries Do

**Small libraries (like eiab):**
- Many use plain `tsc` + no bundling
- Some use esbuild for minification
- Few use Bun (still new)

**Medium/Large libraries:**
- Use bundlers (esbuild, rollup, Bun)
- Always generate `.d.ts` files
- Use plugins for type generation

**Bun-native libraries:**
- Still emerging pattern
- Most use `build.ts` + plugins or tsc
- Few use pure CLI approach

---

## 6. Recommendation

### **KEEP: Current `build.ts` + tsc Approach**

**Reasoning:**

1. **No native `.d.ts` support** - Any approach requires external tooling
2. **Current approach is clean** - Separates concerns (bundling vs. types)
3. **Minimal complexity** - Only 41 lines, easy to understand
4. **Proven pattern** - Works reliably
5. **Plugin approach not simpler** - Still requires build.ts or CLI wrapper
6. **tsc is battle-tested** - More reliable than new Bun plugins

### **Minor Improvements to Consider**

1. **Simplify temp config cleanup:**
   ```typescript
   // Use try/finally instead of separate cleanup
   try {
     writeFileSync("tsconfig.build.json", JSON.stringify(tempConfig, null, 2));
     const result = await Bun.spawn(["tsc", "-p", "tsconfig.build.json"], {
       stdout: "inherit",
       stderr: "inherit",
     });
     const exitCode = await result.exited;
     if (exitCode !== 0) process.exit(exitCode);
   } finally {
     unlinkSync("tsconfig.build.json");
   }
   ```

2. **Consider `--no-bundle` alternative** (if you want to skip minification):
   ```bash
   bun build --no-bundle --outdir=dist ./src/index.ts
   ```
   - Faster builds
   - Slightly larger output
   - Good for development

3. **Add `--watch` support:**
   ```bash
   bun build --watch --outdir=dist ./src/index.ts
   ```

### **When to Reconsider**

- If Bun adds native `.d.ts` generation (check future releases)
- If you need more complex bundling (multiple entry points, code splitting)
- If you want to eliminate tsc dependency entirely

---

## 7. Key Findings Summary

| Aspect | Status |
|--------|--------|
| `bun build` CLI exists | ✅ Yes, fully featured |
| Native `.d.ts` generation | ❌ No, requires plugin or tsc |
| Simpler than current approach | ❌ No, similar complexity |
| Recommended for eiab | ❌ No, current approach is better |
| Future-proof | ✅ Yes, Bun is actively developed |

---

## 8. References

- Bun Bundler Docs: https://bun.com/docs/bundler
- Bun.build() API: https://bun.sh/reference/bun/build
- GitHub Issue #5141: Generate type declarations during `bun build`
- Community Plugins: bun-plugin-dts, @shtse8/bun-plugin-dts, bun-plugin-isolated-decl

