const { test, expect } = require("@playwright/test")
const path = require("node:path")
const fs = require("node:fs/promises")

const rootDir = path.resolve(__dirname, "..")
const screenshotsDir = path.join(rootDir, "output", "doc", "evidence", "screenshots")
const runtimeMetadataPath = path.join(rootDir, "output", "doc", "evidence", "http", "EV-76-runtime-metadata.json")

const baseUrl = process.env.APP_BASE_URL || "https://127.0.0.1"
const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com"
const adminPassword = process.env.ADMIN_PASSWORD_PLAIN || "password"
const qaEmail = process.env.EVIDENCE_QA_EMAIL || "qa-evidence@example.com"
const qaPassword = process.env.EVIDENCE_QA_PASSWORD || "password"

test.describe.configure({ mode: "serial" })
test.use({ viewport: { width: 1440, height: 1024 } })
test.setTimeout(180_000)

async function ensureDir() {
  await fs.mkdir(screenshotsDir, { recursive: true })
}

async function loadRuntimeMetadata() {
  try {
    return JSON.parse(await fs.readFile(runtimeMetadataPath, "utf-8"))
  } catch {
    return {}
  }
}

async function login(page, email, password) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" })
  const loginResult = await page.evaluate(async ({ email, password }) => {
    const deviceKeyStorage = "davara_device_key_v1"
    const sessionSnapshotKey = "davara_session_snapshot_v1"
    const currentPermissionsKey = "current_user_permissions"
    const deviceKey = localStorage.getItem(deviceKeyStorage) || `pw-device-${Date.now()}`

    localStorage.setItem(deviceKeyStorage, deviceKey)

    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        deviceKey,
        deviceLabel: "Playwright Evidence Station",
      }),
    })

    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload?.user) {
      return {
        ok: false,
        status: response.status,
        payload,
      }
    }

    const expiry = payload.sessionExpiresAt ? new Date(payload.sessionExpiresAt).getTime() : Date.now() + 5 * 60 * 60 * 1000
    const modulePermissions = payload.user.modulePermissions || {}

    sessionStorage.setItem("session_token", `pw-session-${Date.now()}`)
    sessionStorage.setItem("session_expiry", String(expiry))
    sessionStorage.setItem("session_last_activity", String(Date.now()))

    localStorage.setItem("isAuthenticated", "true")
    localStorage.setItem("userRole", payload.user.role || "user")
    localStorage.setItem("userName", payload.user.name || payload.user.email)
    localStorage.setItem("userEmail", payload.user.email)
    localStorage.setItem("modulePermissions", JSON.stringify(modulePermissions))
    localStorage.setItem("showPostLoginWelcome", "true")
    localStorage.setItem(currentPermissionsKey, JSON.stringify(modulePermissions))
    localStorage.setItem(
      sessionSnapshotKey,
      JSON.stringify({
        email: payload.user.email,
        name: payload.user.name,
        role: payload.user.role,
        modulePermissions,
        sessionMode: "server",
        deviceKey,
        sessionExpiresAt: payload.sessionExpiresAt || null,
        lastSyncAt: null,
      }),
    )

    return {
      ok: true,
      email: payload.user.email,
      role: payload.user.role,
    }
  }, { email, password })

  if (!loginResult?.ok) {
    throw new Error(`No fue posible autenticar la sesión de evidencia para ${email}: ${JSON.stringify(loginResult)}`)
  }

  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" })
  await expect(page.locator("body")).toContainText(/Base conectada|Modo local|Sincronizando|Guardando local/i)
  await page.waitForTimeout(1500)
}

async function logout(page) {
  const userMenu = page.getByRole("button", { name: /admin|usuario|qa|cerrar sesión|perfil/i }).first()
  if (await userMenu.count()) {
    await userMenu.click().catch(() => {})
    const logoutItem = page.getByText(/cerrar sesión|logout/i).first()
    if (await logoutItem.count()) {
      await logoutItem.click().catch(() => {})
      await page.waitForTimeout(1000)
    }
  }
}

test("captura login y administración on-premise", async ({ browser }) => {
  await ensureDir()
  const adminContext = await browser.newContext({
    baseURL: baseUrl,
    ignoreHTTPSErrors: true,
  })
  const adminPage = await adminContext.newPage()

  await login(adminPage, adminEmail, adminPassword)
  await adminPage.screenshot({
    path: path.join(screenshotsDir, "EV-82-login-session-ok.png"),
    fullPage: true,
  })

  await adminPage.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" })
  await expect(adminPage.getByText(/Panel de Administración/i)).toBeVisible()
  await expect(adminPage.getByText(/Base conectada/i).first()).toBeVisible({ timeout: 20_000 })
  await adminPage.screenshot({
    path: path.join(screenshotsDir, "EV-83-header-base-conectada.png"),
    clip: { x: 260, y: 0, width: 460, height: 90 },
  })
  await adminPage.getByRole("tab", { name: /Usuarios/i }).click()
  await adminPage.locator('input[placeholder="Buscar usuario..."]').fill(qaEmail)
  await expect(adminPage.getByText(qaEmail)).toBeVisible()
  await adminPage.screenshot({
    path: path.join(screenshotsDir, "EV-86-admin-dashboard-users.png"),
    fullPage: true,
  })

  await adminContext.close()
})

test("captura inventario RAT con evidencia documental", async ({ browser }) => {
  await ensureDir()
  const runtimeMetadata = await loadRuntimeMetadata()
  const attachmentId = runtimeMetadata.attachmentId || "attachment-evidence-ui"

  const adminContext = await browser.newContext({
    baseURL: baseUrl,
    ignoreHTTPSErrors: true,
  })
  const adminPage = await adminContext.newPage()

  await login(adminPage, adminEmail, adminPassword)
  await adminPage.goto(`${baseUrl}/rat/registro`, { waitUntil: "networkidle" })
  await adminPage.evaluate(({ attachmentId, adminEmail }) => {
    const now = new Date().toISOString()
    const fileId = "ev-rat-file-ui"
    const storedFiles = [
      {
        id: fileId,
        name: "aviso-privacidad-rh.pdf",
        type: "application/pdf",
        size: 2048,
        content: "data:text/plain;base64,RXZpZGVuY2lhIHZpc3VhbCBvbi1wcmVtaXNl",
        uploadDate: now,
        category: "documento",
        metadata: {
          ownerEmail: adminEmail,
          moduleKey: "/rat",
          recordKey: "ev-rat-1",
          inventoryId: "ev-rat-1",
        },
        syncStatus: "synced",
        serverAttachmentId: attachmentId,
        serverUploadedAt: now,
        syncError: null,
      },
    ]

    const inventories = [
      {
        id: "ev-rat-1",
        databaseName: "Inventario evidencia on-premise",
        responsible: "Oficial de Privacidad",
        companyLogoDataUrl: null,
        companyLogoFileName: null,
        reportAccentColor: "#1E3A8A",
        riskLevel: "alto",
        createdAt: now,
        updatedAt: now,
        status: "completado",
        subInventories: [
          {
            id: "ev-rat-sub-1",
            databaseName: "Base RH Evidencia",
            responsibleArea: "Recursos Humanos",
            holderTypes: ["Empleados"],
            personalData: [
              {
                id: "ev-rat-pd-1",
                name: "Correo corporativo",
                category: "Identificación",
                proporcionalidad: true,
                riesgo: "medio",
                purposesPrimary: [],
                purposesSecondary: [],
              },
            ],
            privacyNoticeFileIds: [fileId],
            privacyNoticeFileNames: ["aviso-privacidad-rh.pdf"],
            consentFileId: fileId,
            consentFileName: "consentimiento-rh.pdf",
            transferConsentFileId: fileId,
            transferConsentFileName: "consentimiento-transferencia-rh.pdf",
            remissionContractFileId: fileId,
            remissionContractFileName: "remision-rh.pdf",
          },
        ],
      },
    ]

    window.localStorage.setItem("storedFiles", JSON.stringify(storedFiles))
    window.localStorage.setItem("inventories", JSON.stringify(inventories))
  }, { attachmentId, adminEmail })

  await adminPage.reload({ waitUntil: "networkidle" })
  await adminPage.getByText(/Ver y\/o editar inventarios existentes/i).click()
  await expect(adminPage.getByText(/Inventario evidencia on-premise/i)).toBeVisible()
  const inventoryRow = adminPage.locator("tr", { hasText: "Inventario evidencia on-premise" }).first()
  await inventoryRow.getByRole("button", { name: "Ver" }).click()
  await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 20_000 })
  await expect(adminPage.getByText(/Detalles del inventario/i)).toBeVisible()
  await adminPage.getByRole("tab", { name: /Documentos/i }).click()
  await expect(adminPage.getByText(/aviso-privacidad-rh\.pdf/i)).toBeVisible()
  await adminPage.getByRole("dialog").screenshot({
    path: path.join(screenshotsDir, "EV-85-rat-inventory-evidence.png"),
  })

  await adminContext.close()
})

test("captura vista compartidos para usuario receptor", async ({ browser }) => {
  await ensureDir()
  const qaContext = await browser.newContext({
    baseURL: baseUrl,
    ignoreHTTPSErrors: true,
  })
  const qaPage = await qaContext.newPage()

  await login(qaPage, qaEmail, qaPassword)
  await qaPage.goto(`${baseUrl}/shared`, { waitUntil: "networkidle" })
  await expect(qaPage.getByText(/Compartidos/i).first()).toBeVisible()
  await qaPage.getByRole("tab", { name: /Compartido conmigo/i }).click()
  await qaPage.waitForTimeout(1200)
  await qaPage.screenshot({
    path: path.join(screenshotsDir, "EV-84-shared-workspace.png"),
    fullPage: true,
  })

  await logout(qaPage)
  await qaContext.close()
})

test("captura módulo protegido con contraseña server-side", async ({ browser }) => {
  await ensureDir()

  const adminContext = await browser.newContext({
    baseURL: baseUrl,
    ignoreHTTPSErrors: true,
  })
  const adminPage = await adminContext.newPage()
  await login(adminPage, adminEmail, adminPassword)
  await adminPage.evaluate(async () => {
    await fetch("/api/admin/module-passwords", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        moduleSlug: "/data-policies",
        password: "Shield-Module-123",
        enabled: true,
      }),
    })
  })
  await adminContext.close()

  const qaContext = await browser.newContext({
    baseURL: baseUrl,
    ignoreHTTPSErrors: true,
  })
  const qaPage = await qaContext.newPage()
  await login(qaPage, qaEmail, qaPassword)
  await qaPage.goto(`${baseUrl}/data-policies`, { waitUntil: "networkidle" })
  await expect(qaPage.getByText(/Módulo Protegido/i)).toBeVisible({ timeout: 20_000 })
  await qaPage.screenshot({
    path: path.join(screenshotsDir, "EV-88-module-password-guard.png"),
    fullPage: true,
  })
  await qaContext.close()

  const cleanupContext = await browser.newContext({
    baseURL: baseUrl,
    ignoreHTTPSErrors: true,
  })
  const cleanupPage = await cleanupContext.newPage()
  await login(cleanupPage, adminEmail, adminPassword)
  await cleanupPage.evaluate(async () => {
    await fetch("/api/admin/module-passwords", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        moduleSlug: "/data-policies",
        enabled: false,
      }),
    })
  })
  await cleanupContext.close()
})
