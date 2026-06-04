/**
 * ============================================================
 *  内功养生法 — 卡片主页（App Store Today 风格）
 *
 *  纵向堆叠大卡片，1 屏 1 主题（参照 Science Home 风格）
 *  3 大分类：呼吸调息 / 静心冥想 / 体态调整
 * ============================================================
 */
import { useNavigate } from 'react-router-dom'
import { useContentLoader } from '@/shared/hooks'
import { motion } from 'framer-motion'
import { EnvelopeSimple } from 'phosphor-react'
import type { NeimenData, NeimenCategory } from '@/types/content'

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

export default function NeimenHome() {
  const navigate = useNavigate()
  const { data: neimenData, loading } = useContentLoader<NeimenData>({
    url: '/data/neimen.json',
    type: 'neimen',
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

  const categories = neimenData?.categories || []

  // 给每个分类配 emoji 图标
  const emojiMap: Record<string, string> = {
    breathing: '💨', // 风(之前 🌬️ 渲染成女孩吹气,不直观)
    meditation: '🧘',
    posture: '💺',
  }

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* 顶部栏 - 34px 大标题 */}
      <header className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
        <h1 className="text-[34px] font-bold text-text font-display leading-[1.1] tracking-tight">内功养生法</h1>
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

      {/* 大卡片列表 - 纵向堆叠,1 屏 1 主题 */}
      <motion.div
        className="px-5 pb-32 space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {categories.map((cat, index) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            index={index}
            isLast={index === categories.length - 1}
            emoji={emojiMap[cat.id] || '✨'}
            onNavigate={() => navigate(`/neimen/category/${cat.id}`)}
          />
        ))}
      </motion.div>
    </div>
  )
}

function CategoryCard({
  category,
  index,
  isLast,
  emoji,
  onNavigate,
}: {
  category: NeimenCategory
  index: number
  isLast: boolean
  emoji: string
  onNavigate: () => void
}) {
  const cardCount = category.cards?.length || 0
  const color = category.color || '#FF6B6B'

  return (
    <motion.button
      variants={cardVariants}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.99 }}
      onClick={onNavigate}
      className="relative w-full text-left overflow-hidden block shadow-lg ring-1 ring-black/5"
      style={{
        borderRadius: '20px',
        height: isLast ? 'auto' : 'calc(100vh - 300px)',
        minHeight: '420px',
        background: `linear-gradient(160deg, ${color}25 0%, #1a1a2e 70%)`,
      }}
    >
      {/* 大图标区(占 70% 上半部) - 去掉孤立小图标 */}
      <div className="absolute inset-x-0 top-0 h-[70%] flex items-center justify-center">
        <div
          className="absolute w-72 h-72 rounded-full blur-3xl opacity-30"
          style={{ backgroundColor: color }}
        />
        <div className="text-[160px] relative z-10 drop-shadow-2xl">
          {emoji}
        </div>
      </div>

      {/* 顶部渐变遮罩 */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1a1a2e] to-transparent pointer-events-none" />

      {/* 卡片数量角标 */}
      <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-black/25 backdrop-blur-md text-[11px] text-white/85 font-medium tracking-wide">
        {cardCount} 个功法
      </div>

      {/* 内容区(下半部分 30%) */}
      <div className="absolute inset-x-0 bottom-0 h-[30%] flex flex-col justify-end p-5 pb-4">
        <span className="text-[11px] text-white/55 font-semibold uppercase tracking-wider mb-0.5">
          {index === 0 ? '今日推荐' : `专题 ${index + 1}`}
        </span>

        <h3 className="text-[24px] font-bold text-white leading-[1.15] tracking-tight mb-0.5">
          {category.name}
        </h3>

        <p className="text-[13px] text-white/70 leading-relaxed font-normal line-clamp-2">
          {'传统养生,身心调和'}
        </p>

        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ backgroundColor: color }}
        />
      </div>
    </motion.button>
  )
}
