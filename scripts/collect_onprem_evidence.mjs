import { mkdir, writeFile } from "node:fs/promises"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import path from "node:path"

const execFileAsync = promisify(execFile)

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..")
const evidenceDir = path.join(rootDir, "output", "doc", "evidence")
const httpDir = path.join(evidenceDir, "http")
const sqlDir = path.join(evidenceDir, "sql")

const baseUrl = process.env.APP_BASE_URL || "http://127.0.0.1:3105"
const postgresContainer = process.env.POSTGRES_CONTAINER || "davara-onprem-postgres-1"
const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com"
const adminPassword = process.env.ADMIN_PASSWORD_PLAIN || "password"
const qaEmail = process.env.EVIDENCE_QA_EMAIL || "qa-evidence@example.com"
const qaPassword = process.env.EVIDENCE_QA_PASSWORD || "password"
const recordKey = `evidence-rat-${Date.now()}`

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

function prettyBody(bodyText, contentType) {
  if (!bodyText) return ""
  if (contentType?.includes("application/json")) {
    try {
      return `${JSON.stringify(JSON.parse(bodyText), null, 2)}\n`
    } catch {
      return `${bodyText}\n`
    }
  }
  return `${bodyText}\n`
}

async function writeHttpEvidence(filename, response, bodyText) {
  const lines = [`HTTP/1.1 ${response.status} ${response.statusText}`]
  response.headers.forEach((value, key) => {
    lines.push(`${key}: ${value}`)
  })
  lines.push("")
  lines.push(prettyBody(bodyText, response.headers.get("content-type")))
  await writeFile(path.join(httpDir, filename), lines.join("\n"), "utf-8")
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

async function writeSqlEvidence(filename, query) {
  const { stdout } = await execFileAsync("docker", [
    "exec",
    postgresContainer,
    "psql",
    "-U",
    "davara",
    "-d",
    "davara_onprem",
    "-c",
    query,
  ])
  await writeFile(path.join(sqlDir, filename), stdout, "utf-8")
}

async function main() {
  await mkdir(httpDir, { recursive: true })
  await mkdir(sqlDir, { recursive: true })

  const adminJar = new CookieJar()
  const qaJar = new CookieJar()

  const preSessionResponse = await request("/api/auth/session")
  await writeHttpEvidence("EV-58-auth-session-prelogin.http", preSessionResponse, await preSessionResponse.text())

  const adminLoginResponse = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    jar: adminJar,
    body: JSON.stringify({
      email: adminEmail,
      password: adminPassword,
      deviceLabel: "Estación evidencia administrativa",
    }),
  })
  const adminLoginBody = await adminLoginResponse.text()
  await writeHttpEvidence("EV-59-auth-login-admin.http", adminLoginResponse, adminLoginBody)

  const adminSessionResponse = await request("/api/auth/session", { jar: adminJar })
  await writeHttpEvidence("EV-60-auth-session-admin.http", adminSessionResponse, await adminSessionResponse.text())

  const upsertUserResponse = await request("/api/admin/users", {
    method: "POST",
    headers: { "content-type": "application/json" },
    jar: adminJar,
    body: JSON.stringify({
      email: qaEmail,
      name: "Usuario Evidencia",
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
  await writeHttpEvidence("EV-61-admin-users-upsert.http", upsertUserResponse, await upsertUserResponse.text())

  const qaLoginResponse = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    jar: qaJar,
    body: JSON.stringify({
      email: qaEmail,
      password: qaPassword,
      deviceLabel: "Estación evidencia QA",
    }),
  })
  await writeHttpEvidence("EV-62-auth-login-qa.http", qaLoginResponse, await qaLoginResponse.text())

  const shareLookupResponse = await request(`/api/share/lookup?email=${encodeURIComponent(qaEmail)}`, {
    jar: adminJar,
  })
  await writeHttpEvidence("EV-89-share-lookup-qa.http", shareLookupResponse, await shareLookupResponse.text())

  const moduleAccessResponse = await request("/api/admin/module-access", {
    method: "POST",
    headers: { "content-type": "application/json" },
    jar: adminJar,
    body: JSON.stringify({
      email: qaEmail,
      name: "Usuario Evidencia",
      role: "custom",
      approved: true,
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
  await writeHttpEvidence("EV-63-admin-module-access.http", moduleAccessResponse, await moduleAccessResponse.text())

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
  await writeHttpEvidence("EV-91-module-password-set.http", setModulePasswordResponse, await setModulePasswordResponse.text())

  const modulePasswordStatusResponse = await request(
    `/api/module-passwords/status?moduleSlug=${encodeURIComponent("/data-policies")}`,
    { jar: qaJar },
  )
  await writeHttpEvidence("EV-92-module-password-status.http", modulePasswordStatusResponse, await modulePasswordStatusResponse.text())

  const modulePasswordInvalidResponse = await request("/api/module-passwords/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    jar: qaJar,
    body: JSON.stringify({
      moduleSlug: "/data-policies",
      password: "incorrecta",
    }),
  })
  await writeHttpEvidence("EV-93-module-password-invalid.http", modulePasswordInvalidResponse, await modulePasswordInvalidResponse.text())

  const modulePasswordValidResponse = await request("/api/module-passwords/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    jar: qaJar,
    body: JSON.stringify({
      moduleSlug: "/data-policies",
      password: "Shield-Module-123",
    }),
  })
  await writeHttpEvidence("EV-94-module-password-valid.http", modulePasswordValidResponse, await modulePasswordValidResponse.text())

  const syncPushResponse = await request("/api/sync/push", {
    method: "POST",
    headers: { "content-type": "application/json" },
    jar: adminJar,
    body: JSON.stringify({
      deviceKey: "evidence-admin-device",
      operations: [
        {
          operationId: `evidence-op-${Date.now()}`,
          datasetId: `${adminEmail}::inventories`,
          moduleKey: "/rat",
          recordKey,
          type: "create",
          baseVersion: 0,
          payload: {
            ownerEmail: adminEmail,
            storageKey: "inventories",
            moduleLabel: "Inventarios de datos personales",
            visibility: "private",
            sharedScope: "private",
            sharedWith: [],
            data: [
              {
                id: recordKey,
                databaseName: "Inventario evidencia on-premise",
                status: "completado",
              },
            ],
            localUpdatedAt: new Date().toISOString(),
            deletedAt: null,
          },
          createdAt: new Date().toISOString(),
        },
      ],
    }),
  })
  await writeHttpEvidence("EV-64-sync-push-rat-record.http", syncPushResponse, await syncPushResponse.text())

  const formData = new FormData()
  formData.append(
    "file",
    new Blob(["Evidencia centralizada para cuestionario on-premise"], { type: "text/plain" }),
    "evidencia-cuestionario.txt",
  )
  formData.append("moduleKey", "/rat")
  formData.append("recordKey", recordKey)
  formData.append(
    "metadata",
    JSON.stringify({
      ownerEmail: adminEmail,
      inventoryId: recordKey,
      inventoryName: "Inventario evidencia on-premise",
      databaseName: "Inventario evidencia on-premise",
    }),
  )

  const uploadResponse = await request("/api/attachments/upload", {
    method: "POST",
    body: formData,
    jar: adminJar,
  })
  const uploadBodyText = await uploadResponse.text()
  await writeHttpEvidence("EV-65-attachment-upload.http", uploadResponse, uploadBodyText)
  const uploadPayload = JSON.parse(uploadBodyText)
  const attachmentId = uploadPayload.attachment.id

  const deniedDownloadResponse = await request(`/api/attachments/${encodeURIComponent(attachmentId)}/download`, {
    jar: qaJar,
  })
  await writeHttpEvidence("EV-66-attachment-download-denied.http", deniedDownloadResponse, await deniedDownloadResponse.text())

  const missingUserShareResponse = await request("/api/share/record", {
    method: "POST",
    headers: { "content-type": "application/json" },
    jar: adminJar,
    body: JSON.stringify({
      moduleKey: "/rat",
      recordKey,
      label: "Inventario evidencia on-premise",
      payload: {
        id: recordKey,
        databaseName: "Inventario evidencia on-premise",
      },
      targetEmails: ["missing-user@example.com"],
    }),
  })
  await writeHttpEvidence("EV-90-share-missing-user.http", missingUserShareResponse, await missingUserShareResponse.text())

  const shareRecordResponse = await request("/api/share/record", {
    method: "POST",
    headers: { "content-type": "application/json" },
    jar: adminJar,
    body: JSON.stringify({
      moduleKey: "/rat",
      recordKey,
      label: "Inventario evidencia on-premise",
      payload: {
        id: recordKey,
        databaseName: "Inventario evidencia on-premise",
      },
      targetEmails: [qaEmail],
    }),
  })
  await writeHttpEvidence("EV-67-share-record.http", shareRecordResponse, await shareRecordResponse.text())

  const sharedResponse = await request("/api/shared", { jar: qaJar })
  await writeHttpEvidence("EV-68-shared-workspace.http", sharedResponse, await sharedResponse.text())

  const allowedDownloadResponse = await request(`/api/attachments/${encodeURIComponent(attachmentId)}/download`, {
    jar: qaJar,
  })
  await writeHttpEvidence("EV-69-attachment-download-shared.http", allowedDownloadResponse, await allowedDownloadResponse.text())

  const revokeShareResponse = await request("/api/share/record", {
    method: "POST",
    headers: { "content-type": "application/json" },
    jar: adminJar,
    body: JSON.stringify({
      moduleKey: "/rat",
      recordKey,
      label: "Inventario evidencia on-premise",
      targetEmails: [qaEmail],
      active: false,
    }),
  })
  await writeHttpEvidence("EV-95-share-record-revoke.http", revokeShareResponse, await revokeShareResponse.text())

  await request("/api/admin/module-passwords", {
    method: "POST",
    headers: { "content-type": "application/json" },
    jar: adminJar,
    body: JSON.stringify({
      moduleSlug: "/data-policies",
      enabled: false,
    }),
  })

  const adminLogoutResponse = await request("/api/auth/logout", {
    method: "POST",
    jar: adminJar,
  })
  await writeHttpEvidence("EV-70-auth-logout-admin.http", adminLogoutResponse, await adminLogoutResponse.text())

  await writeSqlEvidence(
    "EV-71-sql-onprem-users.txt",
    "select email, role_name, approved, updated_at from onprem_users order by updated_at desc limit 10;",
  )
  await writeSqlEvidence(
    "EV-72-sql-onprem-sessions.txt",
    "select actor_email, device_key, expires_at, revoked_at from onprem_sessions order by created_at desc limit 10;",
  )
  await writeSqlEvidence(
    "EV-73-sql-module-records.txt",
    `select module_key, record_key, owner_email, version, updated_at from module_records where record_key = '${recordKey}' order by updated_at desc;`,
  )
  await writeSqlEvidence(
    "EV-74-sql-attachments.txt",
    `select id, module_key, record_key, owner_email, filename, byte_size, created_at from attachments where id = '${attachmentId}';`,
  )
  await writeSqlEvidence(
    "EV-75-sql-sharing.txt",
    `select owner_email, target_email, module_key, record_key, active, created_at from shared_records where record_key = '${recordKey}' order by created_at desc;`,
  )

  await writeFile(
    path.join(httpDir, "EV-76-runtime-metadata.json"),
    JSON.stringify(
      {
        baseUrl,
        adminEmail,
        qaEmail,
        recordKey,
        attachmentId,
        generatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    "utf-8",
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
