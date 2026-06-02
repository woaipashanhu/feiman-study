import { useEffect, useRef, useState, useCallback } from 'react'

interface AliplayerProps {
  videoId: string
  playauthApi: string
  cover?: string
  onReady?: () => void
  onError?: (error: Error) => void
}

// Aliplayer CDN 配置
const ALIPLAYER_SCRIPT = 'https://g.alicdn.com/de/prismplayer/2.15.2/aliplayer-min.js'
const ALIPLAYER_CSS = 'https://g.alicdn.com/de/prismplayer/2.15.2/skins/default/aliplayer-min.css'

declare global {
  interface Window {
    Aliplayer: any
  }
}

export function Aliplayer({ videoId, playauthApi, cover, onReady, onError }: AliplayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [playauth, setPlayauth] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 加载 Aliplayer SDK
  useEffect(() => {
    if (window.Aliplayer) {
      setScriptLoaded(true)
      return
    }

    // 加载 CSS
    if (!document.querySelector(`link[href="${ALIPLAYER_CSS}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = ALIPLAYER_CSS
      document.head.appendChild(link)
    }

    // 加载 JS
    const script = document.createElement('script')
    script.src = ALIPLAYER_SCRIPT
    script.onload = () => setScriptLoaded(true)
    script.onerror = () => setError('播放器加载失败')
    document.head.appendChild(script)

    return () => {
      // 清理脚本
      const existing = document.querySelector(`script[src="${ALIPLAYER_SCRIPT}"]`)
      if (existing) document.head.removeChild(existing)
    }
  }, [])

  // 获取 playauth（带重试）
  const fetchPlayauth = useCallback(async (retryCount = 0): Promise<string | null> => {
    try {
      const res = await fetch(`${playauthApi}?videoId=${videoId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const data = await res.json()
      return data.playAuth || null
    } catch (err) {
      if (retryCount < 2) {
        await new Promise((r) => setTimeout(r, 1000 * (retryCount + 1)))
        return fetchPlayauth(retryCount + 1)
      }
      throw err
    }
  }, [videoId, playauthApi])

  // 获取 playauth
  useEffect(() => {
    if (!scriptLoaded || !videoId) return

    setLoading(true)
    setError(null)

    fetchPlayauth()
      .then((auth) => {
        if (auth) {
          setPlayauth(auth)
        } else {
          setError('获取播放凭证失败')
          onError?.(new Error('获取播放凭证失败'))
        }
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : '网络错误'
        setError(`播放凭证获取失败: ${msg}`)
        onError?.(err)
      })
      .finally(() => setLoading(false))
  }, [scriptLoaded, videoId, fetchPlayauth, onError])

  // 初始化播放器
  useEffect(() => {
    if (!scriptLoaded || !playauth || !containerRef.current) return

    // 销毁旧播放器
    if (playerRef.current) {
      playerRef.current.dispose()
      playerRef.current = null
    }

    try {
      playerRef.current = new window.Aliplayer({
        id: containerRef.current.id,
        vid: videoId,
        playauth: playauth,
        width: '100%',
        height: '100%',
        cover: cover || '',
        autoplay: false,
        isLive: false,
        rePlay: false,
        playsinline: true,
        preload: true,
        controlBarVisibility: 'hover',
        useH5Prism: true,
        language: 'zh-cn',
      })

      playerRef.current.on('ready', () => {
        onReady?.()
      })

      playerRef.current.on('error', (err: any) => {
        console.error('Aliplayer error:', err)
        // 自动重建
        setTimeout(() => {
          if (playerRef.current) {
            playerRef.current.dispose()
            playerRef.current = null
          }
          setPlayauth(null)
          fetchPlayauth().then((auth) => auth && setPlayauth(auth))
        }, 2000)
      })
    } catch (err) {
      console.error('初始化播放器失败:', err)
      setError('播放器初始化失败')
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose()
        playerRef.current = null
      }
    }
  }, [scriptLoaded, playauth, videoId, cover, onReady, fetchPlayauth])

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white gap-3">
        <div className="text-4xl">😵</div>
        <p className="text-sm opacity-80">{error}</p>
        <button
          onClick={() => {
            setError(null)
            setPlayauth(null)
            fetchPlayauth().then((auth) => auth && setPlayauth(auth))
          }}
          className="px-4 py-2 bg-white/20 rounded-lg text-sm active:scale-95 transition-transform"
        >
          重试
        </button>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        id={`aliplayer-${videoId}`}
        className="w-full h-full"
      />
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white gap-3">
          <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-sm opacity-80">加载视频中...</p>
        </div>
      )}
    </div>
  )
}
