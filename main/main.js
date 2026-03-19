// main.js
const { app, BrowserWindow, ipcMain, session } = require("electron")
const path = require("path")
const express = require("express")
const serveStatic = require("serve-static")

// ⬇️ Nuevo: ruta basada en __dirname, sin usar `..`
const securityHeadersPath = path.join(__dirname, "security-headers.cjs")
const { securityHeaders } = require(securityHeadersPath)


app.commandLine.appendSwitch("disable-renderer-backgrounding")
app.commandLine.appendSwitch("disable-background-timer-throttling")

const isDev = process.env.NODE_ENV === "development"
const PORT = 3456
let server
const devAppIconPath = path.join(__dirname, "../assets/Logo_plataforma_ppd.png")

const allowedOrigins = isDev
  ? ["http://localhost:3000"]
  : [`http://localhost:${PORT}`]

const isAllowedUrl = (url) => {
  try {
    const parsed = new URL(url)
    return allowedOrigins.includes(parsed.origin)
  } catch {
    return false
  }
}

const applySecurityHeaders = (res) => {
  securityHeaders.forEach(({ key, value }) => res.setHeader(key, value))
}

ipcMain.handle("app:getRuntime", () => ({
  isElectron: true,
  environment: isDev ? "development" : "production",
}))

app.on("web-contents-created", (event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    if (isAllowedUrl(url)) {
      return { action: "allow" }
    }

    return { action: "deny" }
  })

  contents.on("will-navigate", (navEvent, url) => {
    if (!isAllowedUrl(url)) {
      navEvent.preventDefault()
    }
  })

  contents.on("will-attach-webview", (attachEvent) => {
    attachEvent.preventDefault()
  })
})

const stopServer = () => {
  if (!server) return
  server.close(() => {
    server = undefined
  })
}

// Durante desarrollo apunta a out de Next.js,
// en producción al out generado por next export
const outDir = isDev
  ? path.join(__dirname, "../app/out")
  : path.join(__dirname, "out")

async function createServer() {
  return new Promise((resolve) => {
    const expApp = express()

    expApp.disable("x-powered-by")
    expApp.use((_, res, next) => {
      applySecurityHeaders(res)
      next()
    })

    // 1) Sirve _next, manifest.json e iconos en cualquier subruta
    expApp.get("*/_next/*", (req, res, next) => {
      // Ej: /rat/_next/static/...
      const rel = req.path.replace(/^.*\/_next\//, "")
      const assetPath = path.join(outDir, "_next", rel)
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable")
      res.sendFile(assetPath, (err) => {
        if (err) return next()
      })
    })
    expApp.get("*/manifest.json", (req, res) => {
      res.sendFile(path.join(outDir, "manifest.json"))
    })
    expApp.get("*/icon-192x192.svg", (req, res) => {
      res.sendFile(path.join(outDir, "icon-192x192.svg"))
    })
    expApp.get("*/icon-512x512.svg", (req, res) => {
      res.sendFile(path.join(outDir, "icon-512x512.svg"))
    })

    // 2) Sirve carpeta _next estática
    expApp.use("/_next", express.static(path.join(outDir, "_next")))

    // 3) Resto de assets estáticos (CSS, JS, JSON, imágenes, etc.)
    expApp.use(
      serveStatic(outDir, {
        index: false,
        fallthrough: true,
        extensions: ["html", "css", "js", "json", "png", "svg", "jpg", "jpeg", "webp", "avif"],
        setHeaders: (res, servedPath) => {
          if (/\.(?:js|css|woff2|png|svg|jpg|jpeg|webp|avif)$/.test(servedPath)) {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable")
          }
        },
      })
    )

    // 4) Fallback para rutas HTML: si existe outDir/<ruta>/index.html lo sirve,
    //    si no, vuelve a la raíz index.html
    expApp.get("*", (req, res) => {
      const requested = req.path.replace(/\/$/, "")
      const file = requested === ""
        ? path.join(outDir, "index.html")
        : path.join(outDir, requested, "index.html")

      res.sendFile(file, (err) => {
        if (err) {
          if (err.code !== "ENOENT") {
            console.warn("❌ Error sirviendo", file, err)
          }
          res.sendFile(path.join(outDir, "index.html"))
        }
      })
    })

    server = expApp.listen(PORT, () => {
      console.log(`✅ Servidor Express iniciado en http://localhost:${PORT}`)
      resolve()
    })
  })
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: isDev ? devAppIconPath : undefined,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      spellcheck: false,
      backgroundThrottling: false,
      v8CacheOptions: "bypassHeatCheck",
      preload: path.join(__dirname, "preload.js"),
    },
  })

  const url = isDev
    ? "http://localhost:3000"
    : `http://localhost:${PORT}`

  await win.loadURL(url)

  try {
    await win.webContents.setVisualZoomLevelLimits(1, 1)
  } catch (err) {
    console.warn("No se pudo fijar el zoom", err)
  }
}

app.whenReady().then(async () => {
  if (isDev && process.platform === "darwin") {
    app.dock.setIcon(devAppIconPath)
  }

  session.defaultSession.setPermissionRequestHandler((_, __, callback) => {
    callback(false)
  })

  if (!isDev) await createServer()
  await createWindow()
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (!isDev) stopServer()
    app.quit()
  }
})

app.on("before-quit", () => {
  if (!isDev) stopServer()
})

app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    if (!isDev && (!server || server.listening === false)) {
      await createServer()
    }
    await createWindow()
  }
})
