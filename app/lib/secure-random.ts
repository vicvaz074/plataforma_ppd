function getCrypto() {
  return typeof globalThis !== "undefined" ? globalThis.crypto : undefined
}

function randomUint32() {
  const cryptoObj = getCrypto()
  if (cryptoObj?.getRandomValues) {
    return cryptoObj.getRandomValues(new Uint32Array(1))[0]
  }

  return Date.now() & 0xffffffff
}

export function secureRandomInt(maxExclusive: number) {
  if (maxExclusive <= 0) return 0
  return randomUint32() % maxExclusive
}

export function secureRandomToken(length = 8) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789"
  return Array.from({ length }, () => alphabet[secureRandomInt(alphabet.length)]).join("")
}

export function secureRandomId(prefix: string) {
  const cryptoObj = getCrypto()

  if (cryptoObj?.randomUUID) {
    return `${prefix}-${cryptoObj.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${secureRandomToken(8)}`
}
