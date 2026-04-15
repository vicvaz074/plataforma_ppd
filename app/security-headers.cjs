function buildContentSecurityPolicy({ isDev = false } = {}) {
  const scriptSrc = ["'self'", "'unsafe-inline'"]
  const styleSrc = isDev
    ? ["'self'", "'unsafe-inline'"]
    : [
        "'self'",
        "'sha256-skqujXORqzxt1aE0NNXxujEanPTX6raoqSscTV/Ww/Y='",
        "'sha256-nzTgYzXYDNe6BAHiiI7NNlfK8n/auuOAhh2t92YvuXo='",
        "'sha256-vGQdhYJbTuF+M8iCn1IZCHpdkiICocWHDq4qnQF4Rjw='",
        "'sha256-441zG27rExd4/il+NvIqyL8zFx5XmyNQtE381kSkUJk='",
        "'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='",
      ]
  const connectSrc = ["'self'"]

  if (isDev) {
    scriptSrc.push("'unsafe-eval'")
    connectSrc.push("ws:", "wss:")
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    `style-src ${styleSrc.join(" ")}`,
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(" ")}`,
    "media-src 'self' blob: data:",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ")
}

function getSecurityHeaders({ isDev = false } = {}) {
  return [
    {
      key: "Content-Security-Policy",
      value: buildContentSecurityPolicy({ isDev }),
    },
    {
      key: "Cross-Origin-Embedder-Policy",
      value: "credentialless",
    },
    {
      key: "Cross-Origin-Opener-Policy",
      value: "same-origin",
    },
    {
      key: "Cross-Origin-Resource-Policy",
      value: "same-site",
    },
    {
      key: "Permissions-Policy",
      value:
        "accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()",
    },
    {
      key: "Origin-Agent-Cluster",
      value: "?1",
    },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "X-Frame-Options",
      value: "DENY",
    },
    {
      key: "X-Permitted-Cross-Domain-Policies",
      value: "none",
    },
    {
      key: "X-XSS-Protection",
      value: "1; mode=block",
    },
  ]
}

const securityHeaders = getSecurityHeaders()

module.exports = { buildContentSecurityPolicy, getSecurityHeaders, securityHeaders }
