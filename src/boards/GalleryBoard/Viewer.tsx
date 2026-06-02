/**
 * ============================================================
 *  童画廊 — 作品大图欣赏页（改造版）
 *
 *  统一顶部按钮栏：← 返回 | 标题 | 📬 消息 | ☰ 列表
 *  列表抽屉：右侧滑出，展示所有作品，可切换
 * ============================================================
 */
import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useContentLoader } from '@/shared/hooks'
import type { GalleryData, Artwork } from '@/types/content'
import { setOGMeta } from '@/shared/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, EnvelopeSimple, List, X } from 'phosphor-react'

export default function GalleryViewer() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showInfo, setShowInfo] = useState(true)
  const [showList, setShowList] = useState(false)
  const { data: galleryData } = useContentLoader<GalleryData>({
    url: '/data/gallery.json',
    type: 'gallery',
  })

  // 查找当前作品
  const artwork = findArtwork(galleryData, id)

  // 所有作品（用于列表和导航）
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

  // 自动隐藏信息栏
  useEffect(() => {
    const timer = setTimeout(() => setShowInfo(false), 5000)
    return () => clearTimeout(timer)
  }, [id])

  // 导航
  const goPrev = useCallback(() => {
    if (nav.prev) navigate(`/gallery/${nav.prev}`)
  }, [navigate, nav.prev])
  const goNext = useCallback(() => {
    if (nav.next) navigate(`/gallery/${nav.next}`)
  }, [navigate, nav.next])

  // 键盘导航
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'Escape') navigate('/gallery')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goPrev, goNext, navigate])

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* 统一顶部按钮栏 */}
      <header
        className={`flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-sm transition-opacity duration-300 flex-shrink-0 z-20 ${showInfo ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {/* 左侧：返回按钮 */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/gallery')}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={18} weight="regular" className="text-white/80" />
        </motion.button>

        {/* 中间：标题 */}
        <h1 className="text-sm font-medium text-white/90 truncate max-w-[40%] text-center">
          {artwork?.title || '作品欣赏'}
        </h1>

        {/* 右侧：消息 + 列表 */}
        <div className="flex items-center gap-2">
          {/* 消息按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors relative"
          >
            <EnvelopeSimple size={18} weight="regular" className="text-white/80" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black" />
          </motion.button>

          {/* 列表按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowList(true)}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <List size={18} weight="regular" className="text-white/80" />
          </motion.button>
        </div>
      </header>

      {/* 图片区域 — 点击显示/隐藏信息 */}
      <div
        className="flex-1 relative flex items-center justify-center cursor-pointer"
        onClick={() => setShowInfo((v) => !v)}
      >
        {artwork?.image ? (
          <img
            src={artwork.image.startsWith('data:') || artwork.image.startsWith('/') ? artwork.image : '/' + artwork.image}
            alt={artwork.title}
            className="max-w-full max-h-full object-contain select-none"
            draggable={false}
          />
        ) : (
          <div className="text-center space-y-4">
            <span className="text-8xl opacity-30">🎨</span>
            <p className="text-white/40 text-sm">{artwork?.title || '暂无图片'}</p>
          </div>
        )}

        {/* 左右切换按钮（始终可见） */}
        <button
          onClick={(e) => { e.stopPropagation(); goPrev() }}
          disabled={!nav.prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 disabled:opacity-20 hover:bg-black/60 transition-colors"
          title="上一幅"
        >
          <svg viewBox="0 0 20 20" className="w-5 h-5 text-white/80" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); goNext() }}
          disabled={!nav.next}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 disabled:opacity-20 hover:bg-black/60 transition-colors"
          title="下一幅"
        >
          <svg viewBox="0 0 20 20" className="w-5 h-5 text-white/80" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* 底部信息栏 */}
      <footer
        className={`px-4 py-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 flex-shrink-0 ${showInfo ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {artwork && (
          <div className="max-w-lg mx-auto space-y-2">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white">{artwork.title}</h2>
                <p className="text-xs text-white/50 mt-0.5">
                  {[artwork.artist, artwork.year].filter(Boolean).join(' · ') || ''}
                </p>
              </div>
              {/* 计数器 */}
              <span className="text-xs text-white/30 flex-shrink-0 pb-0.5">
                {nav.index + 1} / {nav.total}
              </span>
            </div>
            {artwork.description && (
              <p className="text-xs text-white/50 leading-relaxed line-clamp-3">
                {artwork.description}
              </p>
            )}
          </div>
        )}
      </footer>

      {/* 作品列表抽屉 */}
      <AnimatePresence>
        {showList && (
          <>
            {/* 遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowList(false)}
              className="fixed inset-0 bg-black/50 z-30"
            />

            {/* 抽屉 */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-gray-900 z-40 flex flex-col"
            >
              {/* 抽屉头部 */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <h2 className="text-sm font-medium text-white">作品列表</h2>
                <button
                  onClick={() => setShowList(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <X size={16} className="text-white/70" />
                </button>
              </div>

              {/* 作品列表 */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {allArtworks.map((art, i) => (
                  <button
                    key={art.id}
                    onClick={() => {
                      navigate(`/gallery/${art.id}`)
                      setShowList(false)
                    }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${
                      i === nav.index
                        ? 'bg-brand/20 border border-brand/30'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                      {art.image ? (
                        <img src={art.image} alt={art.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-brand/20 text-brand">
                          {i + 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${i === nav.index ? 'text-brand' : 'text-white/80'}`}>
                        {art.title}
                      </p>
                      {art.artist && (
                        <p className="text-[10px] text-white/40 mt-0.5">{art.artist}</p>
                      )}
                    </div>
                    {i === nav.index && (
                      <div className="w-2 h-2 rounded-full bg-brand shrink-0" />
                    )}
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
  if (data.artworks) {
    return data.artworks
  }
  return []
}

function getNavArtworks(allArtworks: Artwork[], currentId: string): { prev?: string; next?: string; index: number; total: number } {
  const idx = allArtworks.findIndex((a) => a.id === currentId)
  return {
    index: idx >= 0 ? idx : 0,
    total: allArtworks.length,
    prev: idx > 0 ? allArtworks[idx - 1].id : undefined,
    next: idx < allArtworks.length - 1 ? allArtworks[idx + 1].id : undefined,
  }
}
