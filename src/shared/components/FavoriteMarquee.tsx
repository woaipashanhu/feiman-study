/**
 * ============================================================
 *  FavoriteMarquee — 2x2 卡牌式滑动轮播(用户原话:"上面两个下面两个")
 *
 *  行为(完全对应 App Store Today 顶部图标墙):
 *    - **固定 2x2 窗口:4 个图标(2 上面 + 2 下面)**
 *    - **一格一格滑动**:每 3.5s 整体左移 1 格,平滑过渡 0.8s
 *    - 两行同步滑动:上排 items[N,N+1],下排 items[N+2,N+3]
 *    - 8 个收藏 → 8 步循环(每移动一步换 4 个)
 *    - 任意数量都按 items.length 步循环
 *    - 点击**任何位置** → 跳 /favorites 列表页
 *    - hover / touch 暂停
 *
 *  卡片风格(2x2 squircle 110x110):
 *    - 1 个图标 = 1 个内容(有 videoUrl 的用 VideoPreview 播放)
 *    - 圆角 22%(App Store squircle)
 *    - 微微 shadow,浮起感
 *
 *  实现:
 *    - React state offset 0..items.length-1
 *    - setInterval 推进 offset
 *    - 两行 track = items × 2 复制(无缝环绕)
 *    - 上排 transform: translateX(-offset * step)
 *    - 下排 transform: translateX(-(offset+2) * step)(下排比上排多移 2 步)
 * ============================================================
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BOARD_EMOJIS,
  BOARD_COLORS,
  type FavoriteItem,
} from '@/shared/hooks/useFavorites'
import { VideoPreview } from '@/shared/components/VideoPreview'

interface FavoriteMarqueeProps {
  items: FavoriteItem[]
}

const ICON_SIZE = 150
const GAP = 14
const ICON_STEP = ICON_SIZE + GAP // 164
const STEP_INTERVAL_MS = 3500
const SLIDE_MS = 800

export function FavoriteMarquee({ items }: FavoriteMarqueeProps) {
  const navigate = useNavigate()
  const [offset, setOffset] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  if (items.length === 0) return null

  // 复制一份做无缝环绕
  const looped = [...items, ...items]
  // 上排 transform: 移动 offset 步
  // 下排 transform: 多移 2 步(下排显示 items[offset+2, offset+3])
  const topTransform = `translateX(${-offset * ICON_STEP}px)`
  const bottomTransform = `translateX(${-(offset + 2) * ICON_STEP}px)`
  const transitionStyle = `transform ${SLIDE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`

  // setInterval 推进 offset(暂停时不动)
  useEffect(() => {
    if (isPaused || items.length <= 4) return
    const timer = setInterval(() => {
      setOffset((prev) => (prev + 1) % items.length)
    }, STEP_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [isPaused, items.length])

  // 收藏数量变化时重置
  useEffect(() => {
    setOffset(0)
  }, [items.length])

  const renderRow = (transformValue: string, keyPrefix: string) => (
    <div
      className="overflow-hidden flex justify-center"
      style={{
        // 左右边缘渐隐,避免露半截图标(15% 透明区)
        maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
      }}
    >
      <div
        className="flex gap-3.5"
        style={{
          transform: transformValue,
          transition: transitionStyle,
          width: 'fit-content',
        }}
      >
        {looped.map((item, idx) => (
          <MarqueeIcon
            key={`${keyPrefix}-${item.id}-${idx}`}
            item={item}
            onClick={() => navigate('/favorites')}
          />
        ))}
      </div>
    </div>
  )

  return (
    <div
      className="overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {renderRow(topTransform, 'top')}
      <div className="h-3" />
      {renderRow(bottomTransform, 'bot')}
    </div>
  )
}

/** 单个图标 */
function MarqueeIcon({
  item,
  onClick,
}: {
  item: FavoriteItem
  onClick: () => void
}) {
  const color = BOARD_COLORS[item.boardId]
  const coverSrc = item.cover
    ? item.cover.startsWith('data:') || item.cover.startsWith('http') || item.cover.startsWith('/')
      ? item.cover
      : '/' + item.cover
    : null
  const videoSrc = item.videoUrl
    ? item.videoUrl.startsWith('http') || item.videoUrl.startsWith('/') || item.videoUrl.startsWith('data:')
      ? item.videoUrl
      : '/' + item.videoUrl
    : null

  // 静态图(非视频)加载失败 → 切到 emoji 兜底
  const [coverBroken, setCoverBroken] = useState(false)

  return (
    <button
      onClick={onClick}
      className="shrink-0 relative group active:scale-95 transition-transform"
      style={{
        width: ICON_SIZE,
        height: ICON_SIZE,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
      }}
      aria-label={`查看 ${item.title}`}
    >
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ borderRadius: '22%' }}
      >
        {videoSrc ? (
          <VideoPreview
            src={videoSrc}
            poster={coverSrc ?? undefined}
            fallbackColor={color}
            fallback={
              <span style={{ fontSize: 44 }}>{BOARD_EMOJIS[item.boardId]}</span>
            }
            rounded={22}
            className="w-full h-full"
          />
        ) : coverSrc && !coverBroken ? (
          <img
            src={coverSrc}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setCoverBroken(true)}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${color}40, ${color}20)`,
            }}
          >
            <span style={{ fontSize: 44 }}>{BOARD_EMOJIS[item.boardId]}</span>
          </div>
        )}
      </div>
    </button>
  )
}
