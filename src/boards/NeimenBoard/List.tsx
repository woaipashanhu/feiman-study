/**
 * ============================================================
 *  内功养生法 — 卡片列表页
 *  按分类展示养生卡片，点击翻看详情
 * ============================================================
 */
import { Link } from 'react-router-dom'
import { useContentLoader } from '@/shared/hooks'
import { Skeleton } from '@/shared/components'
import { useScrollRestoration } from '@/shared/hooks/useScrollRestoration'
import { motion } from 'framer-motion'
import { Sparkle, ArrowRight } from 'phosphor-react'
import type { NeimenData, NeimenCategory, Card } from '@/types/content'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

export default function NeimenList() {
  const { data: neimenData, loading } = useContentLoader<NeimenData>({
    url: '/data/neimen.json',
    type: 'neimen',
  })
  const { scrollRef } = useScrollRestoration('/neimen')

  if (loading) {
    return <Skeleton type="neimen" count={4} categoryCount={2} showHeader showCategory />
  }

  if (!neimenData) return null

  const categories = neimenData.categories || []
  const flatCards = !categories.length && neimenData.cards ? neimenData.cards : []

  return (
    <div ref={scrollRef} className="max-w-2xl mx-auto space-y-6 overflow-y-auto pb-6" style={{ maxHeight: 'calc(100vh - 120px)' }}>
      {/* 头部 */}
      <motion.header
        className="space-y-1 px-1"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-text font-display">{neimenData.title}</h1>
        <p className="text-sm text-text-secondary">{neimenData.description}</p>
      </motion.header>

      {/* 分类展示 */}
      {categories.length > 0 && categories.map((cat) => (
        <CategorySection key={cat.id} category={cat} />
      ))}

      {/* 旧格式兼容 */}
      {flatCards.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Sparkle size={18} weight="fill" className="text-neimen" />
            <h2 className="font-display text-base text-neimen font-bold">全部卡片</h2>
          </div>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {flatCards.map((card) => (
              <CardItem key={card.id} card={card} to={`/neimen/${card.id}`} />
            ))}
          </motion.div>
        </section>
      )}
    </div>
  )
}

function CategorySection({ category }: { category: NeimenCategory }) {
  return (
    <section>
      <motion.div
        className="flex items-center gap-2 mb-3 px-1"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Sparkle size={18} weight="fill" style={{ color: category.color || '#FF6B6B' }} />
        <h2 className="font-display text-base font-bold" style={{ color: category.color || '#FF6B6B' }}>
          {category.name}
        </h2>
        <span className="text-xs text-text-tertiary ml-auto">{category.cards.length}张卡片</span>
      </motion.div>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {category.cards.map((card) => (
          <CardItem key={card.id} card={card} to={`/neimen/${card.id}`} color={category.color} />
        ))}
      </motion.div>
    </section>
  )
}

function CardItem({
  card,
  to,
  color,
}: {
  card: Card
  to: string
  color?: string
}) {
  const accentColor = color || '#FF6B6B'

  return (
    <motion.div variants={itemVariants}>
      <Link
        to={to}
        className="group block rounded-xl overflow-hidden bg-surface border border-border hover-card"
      >
        {/* 顶部渐变条 */}
        <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)` }} />

        <div className="p-4 space-y-3">
          {/* 图标 + 标题 */}
          <div className="flex items-start gap-3">
            <div
              className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: accentColor + '12', color: accentColor }}
            >
              {card.image ? (
                <img
                  src={card.image.startsWith('data:') || card.image.startsWith('/') ? card.image : '/' + card.image}
                  alt=""
                  className="w-full h-full object-cover rounded-xl"
                  loading="lazy"
                />
              ) : (
                <Sparkle size={24} weight="duotone" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-text truncate leading-tight">{card.title}</h3>
              {card.subtitle && (
                <p className="text-xs text-text-tertiary mt-0.5">{card.subtitle}</p>
              )}
            </div>

            <ArrowRight
              size={16}
              className="flex-shrink-0 text-border group-hover:text-text-tertiary group-hover:translate-x-0.5 transition-all mt-1"
            />
          </div>

          {/* 内容预览 */}
          {card.content && (
            <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
              {card.content}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
