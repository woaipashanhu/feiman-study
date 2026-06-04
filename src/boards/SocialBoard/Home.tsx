/**
 * ============================================================
 *  社交绘本 — 卡片主页（App Store Today 风格）
 *
 *  纵向堆叠大卡片，1 屏 1 主题（参照 Science Home 风格）
 *  2 大分类：卡耐基社交智慧 + 社交故事
 * ============================================================
 */
import { useNavigate } from 'react-router-dom'
import { useContentLoader } from '@/shared/hooks'
import { motion } from 'framer-motion'
import { EnvelopeSimple, BookBookmark, ChatCircleText } from 'phosphor-react'
import type { SocialData } from '@/types/content'

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

export default function SocialHome() {
  const navigate = useNavigate()
  const { data: socialData, loading } = useContentLoader<SocialData>({
    url: '/data/social-scenes.json',
    type: 'social',
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

  const categories = [
    {
      id: 'carnegie',
      name: '卡耐基社交智慧',
      description: '人际关系的黄金法则',
      icon: <BookBookmark size={24} weight="regular" />,
      color: '#FF9F43',
      count: socialData?.carnegieCatalog?.length || 0,
      iconEmoji: '🤝',
    },
    {
      id: 'social-story',
      name: '社交故事',
      description: '用绘本学社交',
      icon: <ChatCircleText size={24} weight="regular" />,
      color: '#A55EEA',
      count: socialData?.socialStoryCatalog?.length || 0,
      iconEmoji: '📖',
    },
  ]

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* 顶部栏 - 34px 大标题(参照科学风格,无副标题) */}
      <header className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
        <h1 className="text-[34px] font-bold text-text font-display leading-[1.1] tracking-tight">社交训练</h1>
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
            onNavigate={() => navigate(`/social/category/${cat.id}`)}
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
  onNavigate,
}: {
  category: {
    id: string
    name: string
    description: string
    icon: React.ReactNode
    color: string
    count: number
    iconEmoji: string
  }
  index: number
  isLast: boolean
  onNavigate: () => void
}) {
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
        background: `linear-gradient(160deg, ${category.color}25 0%, #1a1a2e 70%)`,
      }}
    >
      {/* 大图标区(占 70% 上半部) - 居中大图标 + 装饰 */}
      <div className="absolute inset-x-0 top-0 h-[70%] flex items-center justify-center">
        {/* 装饰光晕 */}
        <div
          className="absolute w-64 h-64 rounded-full blur-3xl opacity-30"
          style={{ backgroundColor: category.color }}
        />
        {/* 主图标 - 大号 emoji */}
        <div className="text-[120px] relative z-10 drop-shadow-2xl">
          {category.iconEmoji}
        </div>
        {/* 副图标(小图标) */}
        <div
          className="absolute bottom-6 right-6 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-md"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
        >
          {category.icon}
        </div>
      </div>

      {/* 顶部渐变遮罩 */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1a1a2e] to-transparent pointer-events-none" />

      {/* 数量角标 */}
      <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-black/25 backdrop-blur-md text-[11px] text-white/85 font-medium tracking-wide">
        {category.count} 个场景
      </div>

      {/* 内容区(下半部分 30%) */}
      <div className="absolute inset-x-0 bottom-0 h-[30%] flex flex-col justify-end p-5 pb-4">
        {/* 小标签 */}
        <span className="text-[11px] text-white/55 font-semibold uppercase tracking-wider mb-0.5">
          {index === 0 ? '今日推荐' : `专题 ${index + 1}`}
        </span>

        {/* 主标题 */}
        <h3 className="text-[24px] font-bold text-white leading-[1.15] tracking-tight mb-0.5">
          {category.name}
        </h3>

        {/* 描述 */}
        <p className="text-[13px] text-white/70 leading-relaxed font-normal line-clamp-2">
          {category.description}
        </p>

        {/* 底部色条 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ backgroundColor: category.color }}
        />
      </div>
    </motion.button>
  )
}
