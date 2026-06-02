/**
 * ============================================================
 *  内功养生法 — 分类卡片列表页
 *
 *  从卡片主页进入，展示该分类下的所有功法卡片
 *  点击卡片进入详情页
 * ============================================================
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useContentLoader } from '@/shared/hooks'
import { motion } from 'framer-motion'
import { ArrowLeft, Play } from 'phosphor-react'
import type { NeimenData, Card } from '@/types/content'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 25 },
  },
}

export default function NeimenCategoryList() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const { data: neimenData, loading } = useContentLoader<NeimenData>({
    url: '/data/neimen.json',
    type: 'neimen',
  })

  const category = neimenData?.categories?.find((c) => c.id === categoryId)
  const cards = category?.cards || []

  if (loading) {
    return (
      <div className="h-full flex flex-col px-5 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-5">
        <p className="text-text-secondary">分类不存在</p>
        <button
          onClick={() => navigate('/neimen')}
          className="mt-4 px-4 py-2 bg-brand text-white rounded-lg text-sm"
        >
          返回主页
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col px-5 pt-4 pb-6 overflow-y-auto">
      {/* 顶部栏 */}
      <header className="flex items-center gap-3 mb-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/neimen')}
          className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center shadow-sm"
        >
          <ArrowLeft size={18} weight="regular" className="text-text" />
        </motion.button>
        <div className="flex items-center gap-2">
          <span className="text-xl">{category.icon}</span>
          <h1 className="text-xl font-bold text-text font-display">{category.name}</h1>
        </div>
      </header>

      {/* 功法卡片列表 */}
      <motion.div
        className="space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {cards.map((card, index) => (
          <CardListItem
            key={card.id}
            card={card}
            index={index}
            categoryColor={category.color || '#10B981'}
            onClick={() => navigate(`/neimen/${card.id}`)}
          />
        ))}
      </motion.div>
    </div>
  )
}

function CardListItem({
  card,
  index,
  categoryColor,
  onClick,
}: {
  card: Card
  index: number
  categoryColor: string
  onClick: () => void
}) {
  return (
    <motion.button
      variants={itemVariants}
      whileHover={{ scale: 1.01, x: 4 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full flex items-center gap-4 p-3 rounded-2xl bg-surface border border-border hover:shadow-md transition-all text-left group"
    >
      {/* 序号/缩略图 */}
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
        style={{
          backgroundColor: categoryColor + '12',
          color: categoryColor,
        }}
      >
        {card.image ? (
          <img
            src={card.image}
            alt={card.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-lg font-bold">{index + 1}</span>
        )}
      </div>

      {/* 信息 */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-text truncate">{card.title}</h3>
        <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
          {card.subtitle}
        </p>
      </div>

      {/* 查看按钮 */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: categoryColor + '18' }}
      >
        <Play size={16} weight="fill" style={{ color: categoryColor }} />
      </div>
    </motion.button>
  )
}
