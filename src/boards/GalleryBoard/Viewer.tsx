/**
 * ============================================================
 *  童画廊 — 名画鉴赏播放页
 *
 *  翻转卡片交互（原始童画廊逻辑）：
 *    正面：名画图片 + 音频播放按钮
 *    点击翻转 → 背面：标题 + 作者 + 年代 + 鉴赏文字
 *  统一顶部按钮栏：← 返回 | 标题 | 📬 消息 | ☰ 列表
 *  左右滑动切换上/下一幅
 * ============================================================
 */
import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useContentLoader } from '@/shared/hooks'
import type { GalleryData, Artwork } from '@/types/content'
import { setOGMeta } from '@/shared/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, EnvelopeSimple, List, X, CaretLeft, CaretRight, SpeakerHigh, SpeakerSlash } from 'phosphor-react'

export default function GalleryViewer() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isFlipped, setIsFlipped] = useState(false)
  const [showTopBar, setShowTopBar] = useState(true)
  const [showList, setShowList] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { data: galleryData } = useContentLoader<GalleryData>({
    url: '/data/gallery.json',
    type: 'gallery',
  })

  const artwork = findArtwork(galleryData, id)
  const allArtworks = getAllArtworks(galleryData)
  const nav = getNavArtworks(allArtworks, id)

  // OG 标签
  useEffect(() => {
    if (artwork) {
      setOGMeta({
        title: `${artwork.title} - 费曼科学课`,
        description: `${artwork.artist || ''} ${artwork.year || ''} · ${artwork.description || ''}`.trim(),
      })
    }
  }, [id, artwork])

  // 切换作品时重置状态
  useEffect(() => {
    setIsFlipped(false)
    setShowTopBar(true)
    setIsPlaying(false)
  }, [id])

  // 自动隐藏顶栏
  useEffect(() => {
    const timer = setTimeout(() => setShowTopBar(false), 5000)
    return () => clearTimeout(timer)
  }, [id])

  // 音频自动播放
  useEffect(() => {
    if (!artwork?.audio) return
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = artwork.audio
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    }
    return () => {
      if (audioRef.current) audioRef.current.pause()
    }
  }, [id, artwork?.audio])

  // 触摸滑动
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    // 水平滑动 > 60px 且 > 垂直距离
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) goNext()
      else goPrev()
    }
  }, [nav.prev, nav.next])

  const goPrev = useCallback(() => {
    if (nav.prev) {
      setSlideDirection('right')
      navigate(`/gallery/${nav.prev}`)
    }
  }, [navigate, nav.prev])

  const goNext = useCallback(() => {
    if (nav.next) {
      setSlideDirection('left')
      navigate(`/gallery/${nav.next}`)
    }
  }, [navigate, nav.next])

  // 键盘导航
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'Escape') navigate('/gallery')
      if (e.key === ' ' || e.key === 'Enter') setIsFlipped((v) => !v)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goPrev, goNext, navigate])

  const toggleAudio = useCallback(() => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
    }
  }, [isPlaying])

  const handleCardClick = useCallback(() => {
    setIsFlipped((v) => !v)
  }, [])

  if (!artwork) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <p className="text-white/50 text-sm">作品未找到</p>
        <button onClick={() => navigate('/gallery')} className="ml-4 text-white/70 underline text-sm">返回</button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* 隐藏的 audio 元素 */}
      {artwork.audio && (
        <audio ref={audioRef} src={artwork.audio} preload="auto" />
      )}

      {/* 统一顶部按钮栏 */}
      <header
        className={`absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 transition-opacity duration-500 ${showTopBar ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'linear-gradient(rgba(0,0,0,0.6), transparent)' }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/gallery')}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center"
        >
          <ArrowLeft size={18} weight="regular" className="text-white/80" />
        </motion.button>
        <h1 className="text-sm font-medium text-white/90 truncate max-w-[40%] text-center">
          {artwork.title}
        </h1>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center relative"
          >
            <EnvelopeSimple size={18} weight="regular" className="text-white/80" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowList(true)}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center"
          >
            <List size={18} weight="regular" className="text-white/80" />
          </motion.button>
        </div>
      </header>

      {/* 翻转卡片主体 */}
      <div
        className="flex-1 flex items-center justify-center perspective-[1200px]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={id}
            initial={{ x: slideDirection === 'left' ? 300 : -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: slideDirection === 'left' ? -300 : 300, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full h-full cursor-pointer"
            style={{ transformStyle: 'preserve-3d' }}
            onClick={handleCardClick}
          >
            {/* 正面：画作图片 */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-transform duration-600 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              <img
                src={artwork.image}
                alt={artwork.title}
                className="max-w-full max-h-full object-contain select-none"
                draggable={false}
                loading="eager"
              />

              {/* 左右切换箭头（正面） */}
              {nav.prev && (
                <button
                  onClick={(e) => { e.stopPropagation(); goPrev() }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
                >
                  <CaretLeft size={20} weight="bold" className="text-white/70" />
                </button>
              )}
              {nav.next && (
                <button
                  onClick={(e) => { e.stopPropagation(); goNext() }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
                >
                  <CaretRight size={20} weight="bold" className="text-white/70" />
                </button>
              )}

              {/* 音频播放按钮 */}
              {artwork.audio && (
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={(e) => { e.stopPropagation(); toggleAudio() }}
                  className="absolute bottom-8 right-5 w-12 h-12 rounded-full bg-black/45 backdrop-blur border border-white/15 flex items-center justify-center"
                >
                  {isPlaying ? (
                    <SpeakerSlash size={22} weight="fill" className="text-white" />
                  ) : (
                    <SpeakerHigh size={22} weight="fill" className="text-white" />
                  )}
                </motion.button>
              )}

              {/* 底部计数器 */}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="text-xs text-white/25">
                  {nav.index + 1} / {nav.total} · 点击翻转
                </span>
              </div>
            </div>

            {/* 背面：鉴赏文字 */}
            <div
              className="absolute inset-0 overflow-y-auto transition-transform duration-600 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(-180deg)',
                background: '#111',
              }}
            >
              <div className="flex items-center justify-center min-h-full p-8 px-6">
                <div className="max-w-lg text-center">
                  {/* 标题 */}
                  <h2 className="text-2xl font-bold text-white mb-2 tracking-wider">
                    {artwork.title}
                  </h2>
                  {artwork.title_en && artwork.title_en !== artwork.title && (
                    <p className="text-xs text-white/30 mb-4">{artwork.title_en}</p>
                  )}

                  {/* 作者 + 年代 */}
                  <p className="text-sm text-white/50 mb-8">
                    {[artwork.artist, artwork.year].filter(Boolean).join(' · ')}
                  </p>

                  {/* 鉴赏文字 */}
                  {artwork.description && (
                    <p className="text-base text-white/80 leading-[1.9] text-justify">
                      {artwork.description}
                    </p>
                  )}

                  {/* 提示 */}
                  <p className="mt-10 text-xs text-white/20">点击翻回正面</p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 作品列表抽屉 */}
      <AnimatePresence>
        {showList && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowList(false)}
              className="fixed inset-0 bg-black/50 z-30"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-gray-900 z-40 flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <h2 className="text-sm font-medium text-white">作品列表</h2>
                <button onClick={() => setShowList(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <X size={16} className="text-white/70" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {allArtworks.map((art, i) => (
                  <button
                    key={art.id}
                    onClick={() => { navigate(`/gallery/${art.id}`); setShowList(false) }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${
                      i === nav.index ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                      {art.image ? (
                        <img src={art.image} alt={art.title} className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-purple-500/20 text-purple-400">{i + 1}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${i === nav.index ? 'text-purple-400' : 'text-white/80'}`}>{art.title}</p>
                      {art.artist && <p className="text-[10px] text-white/40 mt-0.5">{art.artist}</p>}
                    </div>
                    {i === nav.index && <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ==================== 工具函数 ====================

function findArtwork(data: GalleryData | null, id: string): Artwork | undefined {
  if (!data) return undefined
  if (data.categories) {
    for (const cat of data.categories) {
      const found = cat.artworks.find((a) => a.id === id)
      if (found) return found
    }
  }
  if (data.artworks) {
    return data.artworks.find((a) => a.id === id)
  }
  return undefined
}

function getAllArtworks(data: GalleryData | null): Artwork[] {
  if (!data) return []
  if (data.categories) {
    return data.categories.flatMap((cat) => cat.artworks)
  }
  if (data.artworks) return data.artworks
  return []
}

function getNavArtworks(allArtworks: Artwork[], currentId: string) {
  const idx = allArtworks.findIndex((a) => a.id === currentId)
  return {
    index: idx >= 0 ? idx : 0,
    total: allArtworks.length,
    prev: idx > 0 ? allArtworks[idx - 1].id : undefined,
    next: idx < allArtworks.length - 1 ? allArtworks[idx + 1].id : undefined,
  }
}
