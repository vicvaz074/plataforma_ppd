// next.config.js
const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');
const path = require("path")
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const { getSecurityHeaders } = require("./security-headers.cjs")

/** @type {import('next').NextConfig} */
module.exports = (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  // SOLO usaremos este flag cuando queramos build para Electron
  const isElectronBuild = process.env.NEXT_TARGET === 'electron';
  const useElectronStaticExport = isElectronBuild && !isDev;

  return withBundleAnalyzer({
    poweredByHeader: false,
    reactStrictMode: true,
    outputFileTracingRoot: path.resolve(__dirname),

    async headers() {
      return [
        {
          source: "/(.*)",
          headers: getSecurityHeaders({ isDev }),
        },
      ]
    },

    // Para web (default) -> Next normal
    // Para Electron -> export estático y rutas relativas
    trailingSlash: useElectronStaticExport ? true : false,
    assetPrefix: useElectronStaticExport ? './' : '',
    output: useElectronStaticExport ? 'export' : undefined,
    images: {
      unoptimized: true,
    },
  });
};
