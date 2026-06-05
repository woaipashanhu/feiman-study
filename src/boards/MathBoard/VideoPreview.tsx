/**
 * ============================================================
 *  视频缩略图 — 通用组件
 *
 *  三种状态:
 *  1. 有 src + poster → <video> 静音循环播放,显示静态 poster 占位
 *  2. 有 src 无 poster → <video> 不显示背景
 *  3. 无 src → Fallback(显示数字/CSS 动效,模拟"活感")
 *
 *  性能控制:
 *  - 用 IntersectionObserver 进入视口才播,离开暂停
 *  - 接入全局 videoPool,超过 12 并发自动暂停最久的
 *  - unmount 时主动 release
 *
 *  iOS Safari 注意:
 *  - 必须 muted (静音)
 *  - 必须 playsinline (不全屏)
 *  - 必须 loop (循环)
 *  - 必须有 src 才能自动播放
 * ============================================================
 */
import { useEffect, useRef, useState } from 'react'
import { videoPool } from './videoPool'

export interface VideoPreviewProps {
  /** 视频源 URL(后端生成的脱敏预览 mp4) */
  src?: string
  /** 静态封面图(src 加载前/失败时显示) */
  poster?: string
  /** 兜底色(无 src 时的背景色) */
  fallbackColor?: string
  /** 兜底内容(无 src 时显示,ReactNode) */
  fallback?: React.ReactNode
  /** 圆角 px */
  rounded?: number
  /** 自定义 className */
  className?: string
}

export function VideoPreview({
  src,
  poster,
  fallbackColor = '#3B82F6',
  fallback,
  rounded = 14,
  className = '',
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  // 唯一 id,用于 videoPool 注册/释放
  const poolId = useRef(`vpreview-${Math.random().toString(36).slice(2, 9)}`)

  // IntersectionObserver: 进入视口才播,离开暂停
  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setInView(entry.isIntersecting)
      },
      { threshold: 0.3 } // 至少 30% 可见才播
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // 控制 video 的 play/pause
  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    if (inView) {
      // 进入视口:注册到池,获取播放权
      videoPool.acquire(poolId.current, video)
    } else {
      // 离开视口:释放
      videoPool.release(poolId.current, video)
    }
  }, [inView, src])

  // 组件卸载:释放
  useEffect(() => {
    return () => {
      videoPool.release(poolId.current, videoRef.current ?? undefined)
    }
  }, [])

  // src 变化:重置 ready 状态
  useEffect(() => {
    setVideoReady(false)
  }, [src])

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-gray-100 ${className}`}
      style={{ borderRadius: rounded }}
    >
      {/* 1. Fallback 层(永远存在,作为底层) */}
      {!videoReady && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            backgroundColor: `${fallbackColor}15`,
            color: fallbackColor,
          }}
        >
          {fallback}
        </div>
      )}

      {/* 2. Poster 层(src 加载前显示,加载完成后 video 会覆盖) */}
      {poster && !videoReady && (
        <img
          src={poster}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      )}

      {/* 3. Video 层(有 src 才渲染) */}
      {src && (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedData={() => setVideoReady(true)}
          onError={() => setVideoReady(false)}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
          style={{ opacity: videoReady ? 1 : 0 }}
        />
      )}

      {/* 4. "Live" 角标(显示正在播放,小细节提升专业感) */}
      {src && videoReady && inView && (
        <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 shadow-sm animate-pulse" />
      )}
    </div>
  )
}
