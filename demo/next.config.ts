import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import type { NextConfig } from "next"

const __dirname = dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig
