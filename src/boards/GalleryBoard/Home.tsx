/**
 * ============================================================
 *  童画廊 — 卡片主页
 *
 *  展示4个画家系列卡片，每个卡片有真实封面图和画家介绍
 *  点击进入该系列的画作列表
 * ============================================================
 */
import { useNavigate } from 'react-router-dom'
import { useContentLoader } from '@/shared/hooks'
import { motion } from 'framer-motion'
import { EnvelopeSimple } from 'phosphor-react'
import type { GalleryData, GalleryCategory } from '@/types/content'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 25 },
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
      <div className="h-full flex flex-col px-5 pt-4 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-4 flex-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-100 rounded-2xl animate-pulse aspect-[3/4]" />
          ))}
        </div>
      </div>
    )
  }

  const categories = galleryData?.categories || []

  return (
    <div className="h-full flex flex-col px-5 pt-4 pb-6 overflow-y-auto">
      {/* 顶部栏 */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text font-display">童画廊</h1>
          <p className="text-sm text-text-secondary mt-1">名画鉴赏，培养艺术眼光</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/profile')}
          className="w-11 h-11 rounded-full bg-surface border border-border flex items-center justify-center shadow-sm relative"
        >
          <EnvelopeSimple size={20} weight="regular" className="text-text" />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        </motion.button>
      </header>

      {/* 系列卡片网格 */}
      <motion.div
        className="grid grid-cols-2 gap-4 flex-1 content-start"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {categories.map((cat) => (
          <SeriesCard key={cat.id} category={cat} />
        ))}
      </motion.div>
    </div>
  )
}

function SeriesCard({ category }: { category: GalleryCategory }) {
  const navigate = useNavigate()
  const artworkCount = category.artworks?.length || 0
  // 用该系列第一幅画作为封面
  const coverImage = category.artworks?.[0]?.image

  return (
    <motion.button
      variants={cardVariants}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/gallery/category/${category.id}`)}
      className="relative rounded-2xl overflow-hidden aspect-[3/4] shadow-sm hover:shadow-lg transition-shadow text-left group"
    >
      {/* 封面背景图 */}
      {coverImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${coverImage})` }}
        >
          {/* 渐变遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        </div>
      ) : (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: (category.color || '#8B5CF6') + '20' }}
        />
      )}

      {/* 内容 */}
      <div className="relative h-full flex flex-col p-4">
        {/* 图标 */}
        <div className="text-2xl mb-auto">{category.icon || '🎨'}</div>

        {/* 底部信息 */}
        <div>
          <h3 className="text-base font-bold text-white mb-1 drop-shadow-lg">
            {category.name}
          </h3>
          <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
            {category.description || `${artworkCount} 幅作品`}
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className="text-[10px] px-2 py-0.5 rounded-full text-white/80"
              style={{ backgroundColor: (category.color || '#8B5CF6') + '80' }}
            >
              {artworkCount} 幅
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  )
}
