/**
 * ============================================================
 *  童画廊 — 系列画作列表页
 *
 *  从系列卡片进入，展示该画家/系列下所有画作
 *  列表项：缩略图 + 中文标题 + 英文标题 + 年代
 * ============================================================
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useContentLoader } from '@/shared/hooks'
import { motion } from 'framer-motion'
import { ArrowLeft, CaretRight } from 'phosphor-react'
import type { GalleryData } from '@/types/content'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 25 } },
}

export default function GalleryCategoryList() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const { data: galleryData, loading } = useContentLoader<GalleryData>({
    url: '/data/gallery.json',
    type: 'gallery',
  })

  const category = galleryData?.categories?.find((c) => c.id === categoryId)
  const artworks = category?.artworks || []

  if (loading) {
    return (
      <div className="h-full flex flex-col px-5 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-5">
        <p className="text-text-secondary">系列不存在</p>
        <button onClick={() => navigate('/gallery')} className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg text-sm">返回</button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col px-5 pt-4 pb-6 overflow-y-auto">
      {/* 顶部栏 */}
      <header className="flex items-center gap-3 mb-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/gallery')}
          className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center shadow-sm"
        >
          <ArrowLeft size={18} weight="regular" className="text-text" />
        </motion.button>
        <div className="flex items-center gap-2">
          <span className="text-xl">{category.icon}</span>
          <h1 className="text-lg font-bold text-text font-display">{category.name}</h1>
        </div>
      </header>

      {/* 系列简介 */}
      {category.description && (
        <p className="text-xs text-text-secondary leading-relaxed mb-4 ml-[52px]">
          {category.description}
        </p>
      )}

      {/* 作品列表 */}
      <motion.div className="space-y-2" variants={containerVariants} initial="hidden" animate="show">
        {artworks.map((artwork, index) => (
          <motion.button
            key={artwork.id}
            variants={itemVariants}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/gallery/${artwork.id}`)}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-surface border border-border text-left group active:bg-gray-50 transition-colors"
          >
            {/* 缩略图 */}
            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
              {artwork.image ? (
                <img
                  src={artwork.image}
                  alt={artwork.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: (category.color || '#8B5CF6') + '15', color: category.color || '#8B5CF6' }}
                >
                  {index + 1}
                </div>
              )}
            </div>

            {/* 信息 */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-text truncate">{artwork.title}</h3>
              {artwork.title_en && (
                <p className="text-[11px] text-text-tertiary truncate mt-0.5">{artwork.title_en}</p>
              )}
              <p className="text-[11px] text-text-tertiary mt-0.5">
                {[artwork.artist, artwork.year].filter(Boolean).join(' · ') || ''}
              </p>
            </div>

            {/* 箭头 */}
            <CaretRight size={16} weight="bold" className="text-text-tertiary shrink-0" />
          </motion.button>
        ))}
      </motion.div>

      {/* 底部留白 */}
      <div className="flex-1 min-h-4" />
    </div>
  )
}
