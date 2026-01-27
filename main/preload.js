// preload.js
// Exponemos solo una bandera mínima para el renderer manteniendo el aislamiento.
const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("appRuntime", {
  isElectron: true,
  getRuntime: () => ipcRenderer.invoke("app:getRuntime"),
})
