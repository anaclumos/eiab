import { resolve } from "node:path"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  turbopack: {
    root: resolve("."),
  },
}

export default nextConfig
