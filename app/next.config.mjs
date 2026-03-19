import { PHASE_DEVELOPMENT_SERVER } from "next/constants"
import securityHeadersConfig from "./security-headers.cjs"

const { getSecurityHeaders } = securityHeadersConfig

/** @type {import('next').NextConfig} */
const createConfig = (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER

  return {
    poweredByHeader: false,
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true,
    },
    images: {
      unoptimized: true,
    },
    async headers() {
      return [
        {
          source: "/(.*)",
          headers: getSecurityHeaders({ isDev }),
        },
      ]
    },
  }
}

export default createConfig
