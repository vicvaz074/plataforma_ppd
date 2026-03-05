const { describe, it } = require("node:test")
const assert = require("node:assert/strict")
const path = require("node:path")

const appDir = path.join(__dirname, "..", "..")
const { securityHeaders } = require(path.join(appDir, "security-headers.cjs"))

const headersByKey = Object.fromEntries(
  securityHeaders.map(({ key, value }) => [key.toLowerCase(), value])
)

describe("production security headers", () => {
  it("defines hardened headers for HTML responses", () => {
    assert.ok(securityHeaders.length > 0, "securityHeaders should not be empty")

    const expectedHeaders = {
      "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
      "x-frame-options": "DENY",
      "x-content-type-options": "nosniff",
      "x-permitted-cross-domain-policies": "none",
      "referrer-policy": "strict-origin-when-cross-origin",
    }

    for (const [key, value] of Object.entries(expectedHeaders)) {
      assert.equal(
        headersByKey[key],
        value,
        `Expected header ${key} to equal ${value}`
      )
    }
  })

  it("locks down CSP directives for embedded and active content", () => {
    const csp = headersByKey["content-security-policy"] || ""

    assert.ok(csp.includes("frame-ancestors 'none'"))
    assert.ok(csp.includes("object-src 'none'"))
    assert.ok(csp.includes("default-src 'self'"))

    assert.ok(csp.includes("script-src 'self' 'unsafe-inline'"), "CSP should explicitly allow inline scripts required by Next.js runtime")
    assert.ok(csp.includes("style-src 'self' 'sha256-skqujXORqzxt1aE0NNXxujEanPTX6raoqSscTV/Ww/Y=' https://cdn.jsdelivr.net https://fonts.cdnfonts.com"), "CSP should use a specific hash for required inline styles instead of unsafe-inline")
    assert.ok(!csp.includes("style-src 'self' 'unsafe-inline'"), "CSP should not allow unsafe-inline styles")
    assert.ok(!/(^|[ ;])https:(?=$|[ ;])/.test(csp), "CSP should avoid broad wildcard-like https: sources")
    assert.ok(!/(^|[ ;])wss:(?=$|[ ;])/.test(csp), "CSP should avoid broad wildcard-like wss: sources")
  })
})
