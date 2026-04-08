const { before, after, describe, it } = require("node:test")
const assert = require("node:assert/strict")
const { spawn } = require("node:child_process")
const { mkdir, rm } = require("node:fs/promises")
const path = require("node:path")

const appDir = path.join(__dirname, "..", "..")
const uploadsDir = path.join(appDir, "..", "deploy", "runtime", "test-uploads-e2e")
const serverPort = process.env.E2E_PORT || "3305"
const baseUrl = `http://127.0.0.1:${serverPort}`
const databaseUrl = process.env.DATABASE_URL || "postgresql://davara:davara@127.0.0.1:5432/davara_onprem"

let serverProcess = null

class CookieJar {
  constructor() {
    this.cookies = new Map()
  }

  capture(response) {
    const setCookies =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : response.headers.get("set-cookie")
          ? [response.headers.get("set-cookie")]
          : []

    for (const rawCookie of setCookies) {
      if (!rawCookie) continue
      const pair = rawCookie.split(";", 1)[0]
      const separator = pair.indexOf("=")
      if (separator <= 0) continue
      const name = pair.slice(0, separator).trim()
      const value = pair.slice(separator + 1).trim()
      if (name && value) {
        this.cookies.set(name, value)
      }
    }
  }

  header() {
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join("; ")
  }
}

async function waitForServer(url, timeoutMs = 90_000) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { method: "GET" })
      if (response.ok) {
        return
      }
    } catch {
      // retry
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000))
  }

  throw new Error(`El servidor de prueba no respondió en ${timeoutMs} ms: ${url}`)
}

async function request(pathname, { method = "GET", headers = {}, body, jar } = {}) {
  const requestHeaders = new Headers(headers)
  if (jar) {
    const cookieHeader = jar.header()
    if (cookieHeader) {
      requestHeaders.set("cookie", cookieHeader)
    }
  }

  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: requestHeaders,
    body,
    redirect: "manual",
  })

  if (jar) {
    jar.capture(response)
  }

  return response
}

before(async () => {
  await rm(uploadsDir, { recursive: true, force: true })
  await mkdir(uploadsDir, { recursive: true })

  serverProcess = spawn(
    "node",
    ["./node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(serverPort)],
    {
      cwd: appDir,
      env: {
        ...process.env,
        NODE_ENV: "production",
        PORT: String(serverPort),
        DATABASE_URL: databaseUrl,
        UPLOADS_DIR: uploadsDir,
        NEXT_PUBLIC_ENABLE_EXTERNAL_ASSISTANT: "false",
        ADMIN_EMAIL: process.env.ADMIN_EMAIL || "admin@example.com",
        ADMIN_PASSWORD_PLAIN: process.env.ADMIN_PASSWORD_PLAIN || "password",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  )

  let startupOutput = ""
  serverProcess.stdout.on("data", (chunk) => {
    startupOutput += chunk.toString()
  })
  serverProcess.stderr.on("data", (chunk) => {
    startupOutput += chunk.toString()
  })
  serverProcess.once("exit", (code) => {
    if (code !== 0) {
      console.error(startupOutput)
    }
  })

  await waitForServer(`${baseUrl}/api/health`)
})

after(async () => {
  if (serverProcess) {
    serverProcess.kill("SIGTERM")
    await new Promise((resolve) => {
      serverProcess.once("exit", resolve)
      setTimeout(() => {
        serverProcess?.kill("SIGKILL")
        resolve()
      }, 5_000)
    })
  }
})

describe("runtime on-premise", () => {
  it("sostiene autenticación, sesiones, permisos y adjuntos compartidos", async () => {
    const adminJar = new CookieJar()
    const qaJar = new CookieJar()
    const qaEmail = "qa-e2e@example.com"
    const qaPassword = "password"
    const recordKey = `e2e-rat-record-${Date.now()}`
    const dpoHistoryRecordKey = "admin@example.com::dpo-accreditation-history"
    const securityStoreRecordKey = "admin@example.com::davara-sgsdp-storage"

    const adminLoginResponse = await request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "admin@example.com",
        password: "password",
        deviceLabel: "Node E2E Admin",
      }),
      jar: adminJar,
    })
    assert.equal(adminLoginResponse.status, 200)
    const adminLoginPayload = await adminLoginResponse.json()
    assert.equal(adminLoginPayload.user.role, "admin")

    const adminSessionResponse = await request("/api/auth/session", { jar: adminJar })
    assert.equal(adminSessionResponse.status, 200)
    const adminSessionPayload = await adminSessionResponse.json()
    assert.equal(adminSessionPayload.authenticated, true)
    assert.equal(adminSessionPayload.session.role, "admin")

    const upsertUserResponse = await request("/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      jar: adminJar,
      body: JSON.stringify({
        email: qaEmail,
        name: "QA E2E",
        role: "custom",
        approved: true,
        password: qaPassword,
        modulePermissions: {
          "/rat": false,
          "/privacy-notices": true,
          "/third-party-contracts": false,
          "/dpo": false,
          "/arco-rights": false,
          "/security-system": false,
          "/awareness": false,
          "/eipd": false,
          "/data-policies": true,
          "/davara-training": true,
          "/litigation-management": false,
          "/audit": false,
          "/incidents-breaches": false,
          "/audit-alarms": false,
        },
      }),
    })
    assert.equal(upsertUserResponse.status, 200)

    const qaLoginResponse = await request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: qaEmail,
        password: qaPassword,
        deviceLabel: "Node E2E QA",
      }),
      jar: qaJar,
    })
    assert.equal(qaLoginResponse.status, 200)
    const qaLoginPayload = await qaLoginResponse.json()
    assert.equal(qaLoginPayload.user.email, qaEmail)
    assert.equal(qaLoginPayload.user.modulePermissions["/rat"], false)
    assert.equal(qaLoginPayload.user.modulePermissions["/privacy-notices"], true)

    const lookupQaResponse = await request(`/api/share/lookup?email=${encodeURIComponent(qaEmail)}`, {
      jar: adminJar,
    })
    assert.equal(lookupQaResponse.status, 200)

    const setModulePasswordResponse = await request("/api/admin/module-passwords", {
      method: "POST",
      headers: { "content-type": "application/json" },
      jar: adminJar,
      body: JSON.stringify({
        moduleSlug: "/data-policies",
        password: "Shield-Module-123",
        enabled: true,
      }),
    })
    assert.equal(setModulePasswordResponse.status, 200)

    const modulePasswordStatusResponse = await request(
      `/api/module-passwords/status?moduleSlug=${encodeURIComponent("/data-policies")}`,
      { jar: qaJar },
    )
    assert.equal(modulePasswordStatusResponse.status, 200)
    const modulePasswordStatusPayload = await modulePasswordStatusResponse.json()
    assert.equal(modulePasswordStatusPayload.enabled, true)

    const modulePasswordInvalidResponse = await request("/api/module-passwords/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      jar: qaJar,
      body: JSON.stringify({
        moduleSlug: "/data-policies",
        password: "incorrecta",
      }),
    })
    assert.equal(modulePasswordInvalidResponse.status, 401)

    const modulePasswordValidResponse = await request("/api/module-passwords/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      jar: qaJar,
      body: JSON.stringify({
        moduleSlug: "/data-policies",
        password: "Shield-Module-123",
      }),
    })
    assert.equal(modulePasswordValidResponse.status, 200)

    const syncPushResponse = await request("/api/sync/push", {
      method: "POST",
      headers: { "content-type": "application/json" },
      jar: adminJar,
      body: JSON.stringify({
        deviceKey: "node-e2e-admin-device",
        operations: [
          {
            operationId: `node-e2e-op-${Date.now()}`,
            datasetId: `admin@example.com::inventories`,
            moduleKey: "/rat",
            recordKey,
            type: "create",
            baseVersion: 0,
            payload: {
              ownerEmail: "admin@example.com",
              storageKey: "inventories",
              moduleLabel: "Inventarios de datos personales",
              visibility: "private",
              sharedScope: "private",
              sharedWith: [],
              data: [
                {
                  id: recordKey,
                  databaseName: "Inventario E2E",
                  status: "completado",
                },
              ],
              localUpdatedAt: new Date().toISOString(),
              deletedAt: null,
            },
            createdAt: new Date().toISOString(),
          },
          {
            operationId: `node-e2e-dpo-${Date.now()}`,
            datasetId: "admin@example.com::dpo-accreditation-history",
            moduleKey: "/dpo",
            recordKey: dpoHistoryRecordKey,
            type: "create",
            baseVersion: 0,
            payload: {
              ownerEmail: "admin@example.com",
              storageKey: "dpo-accreditation-history",
              moduleLabel: "Historial de acreditación DPO",
              visibility: "private",
              sharedScope: "private",
              sharedWith: [],
              data: [
                {
                  id: `dpo-e2e-${Date.now()}`,
                  dpoName: "DPO E2E",
                  updatedAt: new Date().toISOString(),
                  analysis: {
                    score: 92,
                    level: "Acreditado",
                    criticalInvalidation: false,
                    criticalFindings: [],
                  },
                },
              ],
              localUpdatedAt: new Date().toISOString(),
              deletedAt: null,
            },
            createdAt: new Date().toISOString(),
          },
          {
            operationId: `node-e2e-sgsdp-${Date.now()}`,
            datasetId: "admin@example.com::davara-sgsdp-storage",
            moduleKey: "/security-system",
            recordKey: securityStoreRecordKey,
            type: "create",
            baseVersion: 0,
            payload: {
              ownerEmail: "admin@example.com",
              storageKey: "davara-sgsdp-storage",
              moduleLabel: "Sistema de gestión de seguridad",
              visibility: "private",
              sharedScope: "private",
              sharedWith: [],
              data: {
                stateVersion: 1,
                instancia: {
                  id: "SGSDP-E2E",
                  nombre: "Programa SGSDP E2E",
                },
                roles: [
                  {
                    id: "ROL-E2E",
                    nombreRol: "Analista",
                  },
                ],
              },
              localUpdatedAt: new Date().toISOString(),
              deletedAt: null,
            },
            createdAt: new Date().toISOString(),
          },
        ],
      }),
    })
    assert.equal(syncPushResponse.status, 200)
    const syncPushPayload = await syncPushResponse.json()
    assert.equal(syncPushPayload.results[0].status, "applied")

    const adminPullResponse = await request("/api/sync/pull", { jar: adminJar })
    assert.equal(adminPullResponse.status, 200)
    const adminPullPayload = await adminPullResponse.json()
    assert.ok(
      adminPullPayload.changes.some((change) => change.recordKey === dpoHistoryRecordKey && change.moduleKey === "/dpo"),
      "El pull del admin debe incluir el historial DPO centralizado",
    )
    assert.ok(
      adminPullPayload.changes.some(
        (change) => change.recordKey === securityStoreRecordKey && change.moduleKey === "/security-system",
      ),
      "El pull del admin debe incluir el store SGSDP centralizado",
    )

    const formData = new FormData()
    formData.append(
      "file",
      new Blob(["Evidencia on-premise E2E"], { type: "text/plain" }),
      "evidence-e2e.txt",
    )
    formData.append("moduleKey", "/rat")
    formData.append("recordKey", recordKey)
    formData.append(
      "metadata",
      JSON.stringify({
        ownerEmail: "admin@example.com",
        inventoryId: recordKey,
        inventoryName: "Inventario E2E",
      }),
    )

    const uploadResponse = await request("/api/attachments/upload", {
      method: "POST",
      body: formData,
      jar: adminJar,
    })
    assert.equal(uploadResponse.status, 200)
    const uploadPayload = await uploadResponse.json()
    const attachmentId = uploadPayload.attachment.id
    assert.ok(attachmentId)

    const unauthorizedDownloadResponse = await request(
      `/api/attachments/${encodeURIComponent(attachmentId)}/download`,
      { jar: qaJar },
    )
    assert.equal(unauthorizedDownloadResponse.status, 404)

    const missingUserShareResponse = await request("/api/share/record", {
      method: "POST",
      headers: { "content-type": "application/json" },
      jar: adminJar,
      body: JSON.stringify({
        moduleKey: "/rat",
        recordKey,
        label: "Inventario E2E",
        targetEmails: ["missing-user@example.com"],
        payload: {
          id: recordKey,
          databaseName: "Inventario E2E",
        },
      }),
    })
    assert.equal(missingUserShareResponse.status, 404)

    const shareRecordResponse = await request("/api/share/record", {
      method: "POST",
      headers: { "content-type": "application/json" },
      jar: adminJar,
      body: JSON.stringify({
        moduleKey: "/rat",
        recordKey,
        label: "Inventario E2E",
        targetEmails: [qaEmail],
        payload: {
          id: recordKey,
          databaseName: "Inventario E2E",
        },
      }),
    })
    assert.equal(shareRecordResponse.status, 200)

    const shareDpoModuleResponse = await request("/api/share/module", {
      method: "POST",
      headers: { "content-type": "application/json" },
      jar: adminJar,
      body: JSON.stringify({
        moduleKey: "/dpo",
        targetEmails: [qaEmail],
      }),
    })
    assert.equal(shareDpoModuleResponse.status, 200)

    const sharedResponse = await request("/api/shared", { jar: qaJar })
    assert.equal(sharedResponse.status, 200)
    const sharedPayload = await sharedResponse.json()
    assert.ok(
      sharedPayload.sharedWithMe.records.some((record) => record.record_key === recordKey),
      "El usuario QA debe ver el registro compartido",
    )
    assert.ok(
      sharedPayload.sharedWithMe.modules.some(
        (record) => record.module_key === "/dpo" && record.record_key === dpoHistoryRecordKey,
      ),
      "El usuario QA debe ver el dataset DPO compartido por módulo",
    )

    const authorizedDownloadResponse = await request(
      `/api/attachments/${encodeURIComponent(attachmentId)}/download`,
      { jar: qaJar },
    )
    assert.equal(authorizedDownloadResponse.status, 200)
    assert.equal(await authorizedDownloadResponse.text(), "Evidencia on-premise E2E")

    const revokeRecordResponse = await request("/api/share/record", {
      method: "POST",
      headers: { "content-type": "application/json" },
      jar: adminJar,
      body: JSON.stringify({
        moduleKey: "/rat",
        recordKey,
        label: "Inventario E2E",
        targetEmails: [qaEmail],
        active: false,
      }),
    })
    assert.equal(revokeRecordResponse.status, 200)

    const sharedAfterRevokeResponse = await request("/api/shared", { jar: qaJar })
    assert.equal(sharedAfterRevokeResponse.status, 200)
    const sharedAfterRevokePayload = await sharedAfterRevokeResponse.json()
    assert.ok(
      !sharedAfterRevokePayload.sharedWithMe.records.some((record) => record.record_key === recordKey),
      "El usuario QA ya no debe ver el registro una vez revocado",
    )

    const removeModulePasswordResponse = await request("/api/admin/module-passwords", {
      method: "POST",
      headers: { "content-type": "application/json" },
      jar: adminJar,
      body: JSON.stringify({
        moduleSlug: "/data-policies",
        enabled: false,
      }),
    })
    assert.equal(removeModulePasswordResponse.status, 200)

    const deleteUserResponse = await request(`/api/admin/users?email=${encodeURIComponent(qaEmail)}`, {
      method: "DELETE",
      jar: adminJar,
    })
    assert.equal(deleteUserResponse.status, 200)

    const qaLoginAfterDeleteResponse = await request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: qaEmail,
        password: qaPassword,
        deviceLabel: "Node E2E QA Reintento",
      }),
    })
    assert.equal(qaLoginAfterDeleteResponse.status, 401)

    const adminLogoutResponse = await request("/api/auth/logout", {
      method: "POST",
      jar: adminJar,
    })
    assert.equal(adminLogoutResponse.status, 200)

    const adminSessionAfterLogout = await request("/api/auth/session", { jar: adminJar })
    const adminSessionAfterLogoutPayload = await adminSessionAfterLogout.json()
    assert.equal(adminSessionAfterLogoutPayload.authenticated, false)
  })
})
