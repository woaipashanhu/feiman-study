/**
 * ============================================================
 *  童画廊 — 名画鉴赏列表页
 *  按分类展示艺术作品，点击进入大图欣赏
 * ============================================================
 */
import { Link } from 'react-router-dom'
import { useContentLoader } from '@/shared/hooks'
import { Skeleton } from '@/shared/components'
import { useScrollRestoration } from '@/shared/hooks/useScrollRestoration'
import { motion } from 'framer-motion'
import { Palette } from 'phosphor-react'
import type { GalleryData, GalleryCategory, Artwork } from '@/types/content'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
}

export default function GalleryList() {
  const { data: galleryData, loading } = useContentLoader<GalleryData>({
    url: '/data/gallery.json',
    type: 'gallery',
  })
  const { scrollRef } = useScrollRestoration('/gallery')

  if (loading) {
    return <Skeleton type="gallery" count={4} categoryCount={2} showHeader showCategory />
  }

  if (!galleryData) return null

  const categories = galleryData.categories || []
  const flatArtworks = !categories.length && galleryData.artworks ? galleryData.artworks : []

  return (
    <div ref={scrollRef} className="max-w-2xl mx-auto space-y-6 overflow-y-auto pb-6" style={{ maxHeight: 'calc(100vh - 120px)' }}>
      {/* 头部 */}
      <motion.header
        className="space-y-1 px-1"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-text font-display">{galleryData.title}</h1>
        <p className="text-sm text-text-secondary">{galleryData.description}</p>
      </motion.header>

      {/* 分类展示 */}
      {categories.length > 0 && categories.map((cat) => (
        <CategorySection key={cat.id} category={cat} />
      ))}

      {/* 旧格式兼容 */}
      {flatArtworks.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Palette size={18} weight="fill" className="text-gallery" />
            <h2 className="font-display text-base text-gallery font-bold">全部作品</h2>
          </div>
          <motion.div
            className="grid grid-cols-2 gap-3"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {flatArtworks.map((art) => (
              <ArtworkCard key={art.id} artwork={art} to={`/gallery/${art.id}`} />
            ))}
          </motion.div>
        </section>
      )}
    </div>
  )
}

function CategorySection({ category }: { category: GalleryCategory }) {
  return (
    <section>
      <motion.div
        className="flex items-center gap-2 mb-3 px-1"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Palette size={18} weight="fill" style={{ color: category.color || '#A55EEA' }} />
        <h2 className="font-display text-base font-bold" style={{ color: category.color || '#A55EEA' }}>
          {category.name}
        </h2>
        <span className="text-xs text-text-tertiary ml-auto">{category.artworks.length}幅</span>
      </motion.div>
      <motion.div
        className="grid grid-cols-2 gap-3"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {category.artworks.map((art) => (
          <ArtworkCard key={art.id} artwork={art} to={`/gallery/${art.id}`} />
        ))}
      </motion.div>
    </section>
  )
}

function ArtworkCard({
  artwork,
  to,
}: {
  artwork: Artwork
  to: string
}) {
  return (
    <motion.div variants={itemVariants}>
      <Link
        to={to}
        className="group block rounded-xl overflow-hidden bg-surface border border-border hover-card"
      >
        {/* 图片区域 */}
        <div className="aspect-[4/3] overflow-hidden bg-border-light relative">
          {artwork.image ? (
            <img
              src={artwork.image.startsWith('data:') || artwork.image.startsWith('/') ? artwork.image : '/' + artwork.image}
              alt={artwork.title}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gallery/10 to-gallery/5">
              <Palette size={40} weight="duotone" className="text-gallery/30" />
            </div>
          )}
          {/* 渐变遮罩 */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* 悬停显示描述 */}
          <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <p className="text-xs text-white/90 line-clamp-2">{artwork.description || '暂无描述'}</p>
          </div>
        </div>

        {/* 信息区域 */}
        <div className="p-3 space-y-1">
          <h3 className="text-sm font-semibold text-text truncate leading-tight">{artwork.title}</h3>
          <p className="text-xs text-text-tertiary truncate">
            {[artwork.artist, artwork.year].filter(Boolean).join(' · ') || '未知'}
          </p>
        </div>
      </Link>
    </motion.div>
  )
}
