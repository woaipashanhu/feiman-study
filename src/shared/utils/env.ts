/**
 * 环境检测工具
 * 预留 Capacitor App 检测，现在不依赖 @capacitor/core
 */

export const isNativeApp = (): boolean => {
  return !!(window as any).Capacitor
}

export const getPlatform = (): 'web' | 'ios' | 'android' => {
  const cap = (window as any).Capacitor
  return cap?.getPlatform?.() || 'web'
}

export const isIOS = (): boolean => getPlatform() === 'ios'
export const isAndroid = (): boolean => getPlatform() === 'android'
export const isWeb = (): boolean => getPlatform() === 'web'

/**
 * 资源路径适配
 * Web 端直接用绝对路径，App 端需要转换
 */
export const getAssetUrl = (path: string): string => {
  if (isNativeApp()) {
    return `/public${path}`
  }
  return path
}
