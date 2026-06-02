import { useState, useEffect } from 'react'

interface ManifestVersion {
  version: string
  boards: Record<string, string>
}

const MANIFEST_URL = '/data/manifest.json'
const LOCAL_VERSION_KEY = 'feiman_manifest_version'

export function useVersionCheck() {
  const [hasUpdate, setHasUpdate] = useState(false)
  const [currentVersion, setCurrentVersion] = useState('')

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch(`${MANIFEST_URL}?t=${Date.now()}`)
        if (!res.ok) return

        const remote: ManifestVersion = await res.json()
        const local = localStorage.getItem(LOCAL_VERSION_KEY)

        setCurrentVersion(remote.version)

        if (local && local !== remote.version) {
          setHasUpdate(true)
        }

        localStorage.setItem(LOCAL_VERSION_KEY, remote.version)
      } catch {
        // 静默失败，不影响用户体验
      }
    }

    checkVersion()

    // 每5分钟检查一次
    const interval = setInterval(checkVersion, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const applyUpdate = () => {
    localStorage.removeItem(LOCAL_VERSION_KEY)
    window.location.reload()
  }

  return { hasUpdate, currentVersion, applyUpdate }
}
