/**
 * ============================================================
 *  童画廊 — 卡片主页（App Store Today 风格）
 *
 *  纵向堆叠大卡片，1 屏 1 主题
 *  大圆角(20px)，上半部分画作缩略图网格（自动轮播）+ 下半部分文字
 *  图片容器用主题色低透明度背景，竖画留白更融合
 * ============================================================
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContentLoader } from '@/shared/hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { EnvelopeSimple } from 'phosphor-react'
import type { GalleryData, GalleryCategory, Artwork } from '@/types/content'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 28 },
  },
}

export default function GalleryHome() {
  const navigate = useNavigate()
  const { data: galleryData, loading } = useContentLoader<GalleryData>({
    url: '/data/gallery.json',
    type: 'gallery',
  })

  if (loading) {
    return (
      <div className="h-full flex flex-col px-5 pt-5 pb-6">
        <div className="h-[34px] w-40 bg-gray-200 rounded-lg animate-pulse mb-6" />
        <div className="space-y-4 flex-1">
          <div className="bg-gray-100 rounded-[20px] animate-pulse h-[70vh]" />
          <div className="bg-gray-100 rounded-[20px] animate-pulse h-[40vh]" />
        </div>
      </div>
    )
  }

  const categories = galleryData?.categories || []

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* 顶部栏 — 34px 大标题 */}
      <header className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
        <h1 className="text-[34px] font-bold text-text font-display leading-[1.1] tracking-tight">童画廊</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/profile')}
          className="w-11 h-11 rounded-full bg-surface border border-border flex items-center justify-center shadow-sm hover:shadow-md transition-shadow relative"
        >
          <EnvelopeSimple size={20} weight="regular" className="text-text" />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        </motion.button>
      </header>

      {/* 大卡片列表 - 纵向堆叠 */}
      <motion.div
        className="px-5 pb-32 space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {categories.map((cat, index) => (
          <SeriesCard
            key={cat.id}
            category={cat}
            index={index}
            isLast={index === categories.length - 1}
            onNavigate={() => navigate(`/gallery/category/${cat.id}`)}
          />
        ))}
      </motion.div>
    </div>
  )
}

function SeriesCard({
  category,
  index,
  isLast,
  onNavigate,
}: {
  category: GalleryCategory
  index: number
  isLast: boolean
  onNavigate: () => void
}) {
  const artworkCount = category.artworks?.length || 0
  const allArtworks = category.artworks || []
  const totalGroups = Math.max(1, Math.ceil(allArtworks.length / 4))

  // 轮播状态:当前显示第几组(0-indexed)
  const [groupIndex, setGroupIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setGroupIndex((prev) => (prev + 1) % totalGroups)
    }, 3500)
  }, [totalGroups])

  useEffect(() => {
    if (allArtworks.length <= 4) return // 不足4张不轮播
    startTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [allArtworks.length, startTimer])

  // 点击时重置计时器
  const handleClick = () => {
    onNavigate()
  }

  // 当前组4张图
  const startIdx = groupIndex * 4
  const currentGroup = allArtworks.slice(startIdx, startIdx + 4)
  // 补足4个占位
  const displayArtworks: (Artwork | null)[] = [...currentGroup]
  while (displayArtworks.length < 4) {
    displayArtworks.push(null)
  }

  const bgColor = category.color || '#8B5CF6'

  return (
    <motion.button
      variants={cardVariants}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.99 }}
      onClick={handleClick}
      className="relative w-full text-left overflow-hidden block shadow-lg ring-1 ring-black/5"
      style={{
        borderRadius: '20px',
        height: isLast ? 'auto' : 'calc(100vh - 300px)',
        minHeight: '420px',
        background: `linear-gradient(160deg, ${bgColor}25 0%, #1a1a2e 70%)`,
      }}
    >
      {/* 画作缩略图网格区 - 2x2 轮播 */}
      <div className="absolute inset-x-0 top-0 h-[70%] p-5">
        <div className="relative w-full h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={groupIndex}
              className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-2"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              {displayArtworks.map((art, i) => (
                <div
                  key={art ? art.id : `empty-${i}`}
                  className="rounded-2xl overflow-hidden shadow-md"
                  style={{ backgroundColor: bgColor + '18' }}
                >
                  {art && art.image ? (
                    <img
                      src={art.image}
                      alt={art.title}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-xs"
                      style={{ backgroundColor: bgColor + '10' }}
                    >
                      <span style={{ color: bgColor + '60' }}>🎨</span>
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 轮播指示点 */}
      {totalGroups > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
          {Array.from({ length: Math.min(totalGroups, 6) }).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === groupIndex % totalGroups ? 16 : 5,
                height: 5,
                backgroundColor: i === groupIndex % totalGroups ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
              }}
            />
          ))}
        </div>
      )}

      {/* 顶部渐变遮罩 */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1a1a2e] to-transparent pointer-events-none" />

      {/* 画作数量角标 */}
      <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-black/25 backdrop-blur-md text-[11px] text-white/85 font-medium tracking-wide z-20">
        {artworkCount} 幅作品
      </div>

      {/* 内容区（下半部分） */}
      <div className="absolute inset-x-0 bottom-0 h-[30%] flex flex-col justify-end p-5 pb-4">
        <span className="text-[11px] text-white/55 font-semibold uppercase tracking-wider mb-0.5">
          {index === 0 ? '今日推荐' : `专题 ${index + 1}`}
        </span>
        <h3 className="text-[24px] font-bold text-white leading-[1.15] tracking-tight mb-0.5">
          {category.name}
        </h3>
        <p className="text-[13px] text-white/70 leading-relaxed font-normal line-clamp-2">
          {category.description || `${artworkCount} 幅作品等你欣赏`}
        </p>
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ backgroundColor: bgColor }}
        />
      </div>
    </motion.button>
  )
}
