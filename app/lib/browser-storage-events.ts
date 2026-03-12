export const DAVARA_STORAGE_EVENT = "davara:storage"

const SAME_TAB_EVENT_IGNORED_KEYS = new Set([
  "davara-notifications-v2",
  "davara-notifications-resolved-v2",
])

declare global {
  interface Window {
    __davaraStorageBridgeInstalled?: boolean
  }
}

type StorageMutationDetail = {
  action: "setItem" | "removeItem" | "clear"
  key: string | null
  oldValue?: string | null
  newValue?: string | null
}

function emitStorageMutation(detail: StorageMutationDetail) {
  window.dispatchEvent(new CustomEvent(DAVARA_STORAGE_EVENT, { detail }))
  window.dispatchEvent(new Event("storage"))
}

export function ensureBrowserStorageEvents() {
  if (typeof window === "undefined" || window.__davaraStorageBridgeInstalled) {
    return
  }

  window.__davaraStorageBridgeInstalled = true

  const storageProto = Object.getPrototypeOf(window.localStorage) as Storage
  const originalSetItem = storageProto.setItem
  const originalRemoveItem = storageProto.removeItem
  const originalClear = storageProto.clear

  storageProto.setItem = function setItemWithEvents(key: string, value: string) {
    const oldValue = this === window.localStorage ? this.getItem(key) : null
    originalSetItem.call(this, key, value)

    if (
      this === window.localStorage &&
      oldValue !== value &&
      !SAME_TAB_EVENT_IGNORED_KEYS.has(key)
    ) {
      emitStorageMutation({ action: "setItem", key, oldValue, newValue: value })
    }
  }

  storageProto.removeItem = function removeItemWithEvents(key: string) {
    const oldValue = this === window.localStorage ? this.getItem(key) : null
    originalRemoveItem.call(this, key)

    if (this === window.localStorage && oldValue !== null) {
      emitStorageMutation({ action: "removeItem", key, oldValue, newValue: null })
    }
  }

  storageProto.clear = function clearWithEvents() {
    const hadValues = this === window.localStorage && this.length > 0
    originalClear.call(this)

    if (this === window.localStorage && hadValues) {
      emitStorageMutation({ action: "clear", key: null })
    }
  }
}
