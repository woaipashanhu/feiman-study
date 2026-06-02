/**
 * 安全存储工具
 * 阶段1：Base64 简单混淆（比明文强）
 * 阶段2：AES 加密（引入 crypto-js）
 */

const STORAGE_PREFIX = 'feiman_'

function encrypt(data: string): string {
  // 先用 encodeURIComponent 处理中文等非 Latin1 字符，再 Base64 编码
  return btoa(encodeURIComponent(data).split('').reverse().join(''))
}

function decrypt(encrypted: string): string {
  try {
    return decodeURIComponent(atob(encrypted).split('').reverse().join(''))
  } catch {
    return ''
  }
}

export function saveSecure<T>(key: string, value: T): void {
  try {
    const fullKey = STORAGE_PREFIX + key
    const encrypted = encrypt(JSON.stringify(value))
    localStorage.setItem(fullKey, encrypted)
  } catch {
    // 加密或存储失败时静默降级（如 localStorage 已满等）
  }
}

export function loadSecure<T>(key: string): T | null {
  const fullKey = STORAGE_PREFIX + key
  const encrypted = localStorage.getItem(fullKey)
  if (!encrypted) return null

  try {
    const decrypted = decrypt(encrypted)
    return JSON.parse(decrypted) as T
  } catch {
    // 解密失败，清除脏数据
    localStorage.removeItem(fullKey)
    return null
  }
}

export function removeSecure(key: string): void {
  localStorage.removeItem(STORAGE_PREFIX + key)
}

export function clearAllData(): void {
  Object.keys(localStorage)
    .filter((key) => key.startsWith(STORAGE_PREFIX))
    .forEach((key) => localStorage.removeItem(key))
}
