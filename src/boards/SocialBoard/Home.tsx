/**
 * ============================================================
 *  社交绘本 — 卡片主页（App Store Today 风格）
 *
 *  纵向堆叠大卡片，1 屏 1 主题
 *  上半部分 2×2 封面网格自动轮播，下半部分绘本标题
 * ============================================================
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContentLoader } from '@/shared/hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { EnvelopeSimple } from 'phosphor-react'
import type { SocialData, SocialCatalogEntry } from '@/types/content'

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

  const carnegieItems = socialData?.carnegieCatalog || []
  const storyItems = socialData?.socialStoryCatalog || []

  const categories = [
    {
      id: 'carnegie',
      name: '卡耐基社交智慧',
      description: '人际关系的黄金法则',
      color: '#FF9F43',
      items: carnegieItems,
    },
    {
      id: 'social-story',
      name: '社交故事',
      description: '用绘本学社交',
      color: '#A55EEA',
      items: storyItems,
    },
  ]

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* 顶部栏 — 34px 大标题 */}
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

      {/* 大卡片列表 */}
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
            isLast={index === categories.length - 1}
            onNavigate={() => navigate(`/social/category/${cat.id}`)}
          />
        ))}
      </motion.div>
    </div>
  )
}

/**
 * 单个分类大卡片
 * 上半部分：单张封面自动轮播（不加标题文字）
 * 下半部分：当前绘本标题 + 系列名标签
 */
function CategoryCard({
  category,
  isLast,
  onNavigate,
}: {
  category: {
    id: string
    name: string
    description: string
    color: string
    items: SocialCatalogEntry[]
  }
  isLast: boolean
  onNavigate: () => void
}) {
  const allItems = category.items || []
  const total = allItems.length
  const [currentIdx, setCurrentIdx] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % total)
    }, 3500)
  }, [total])

  useEffect(() => {
    if (total <= 1) return
    startTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [total, startTimer])

  const currentItem = allItems[currentIdx]
  const currentTitle = currentItem?.title || category.name
  const bgColor = category.color || '#FF9F43'

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
        background: `linear-gradient(160deg, ${bgColor}25 0%, #1a1a2e 70%)`,
      }}
    >
      {/* 封面区 — 单图轮播 */}
      <div className="absolute inset-x-0 top-0 h-[68%] p-5 overflow-hidden">
        <div
          className="relative w-full h-full rounded-2xl overflow-hidden shadow-md"
          style={{ backgroundColor: bgColor + '18' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              className="absolute inset-0"
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              style={{
                backgroundImage: currentItem?.coverImage ? `url(${currentItem.coverImage})` : undefined,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: bgColor + '18',
              }}
            >
              {!currentItem?.coverImage && (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl opacity-40">📖</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>



      {/* 顶部渐变遮罩 */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1a1a2e] to-transparent pointer-events-none" />

      {/* 内容区（下半部分）— 三层文字布局 */}
      <div className="absolute inset-x-0 bottom-0 h-[32%] flex flex-col justify-center px-7 pb-5">
        {/* 第1层：小字标签（类似"常玩常新"） */}
        <p className="text-[14px] text-white/55 font-medium tracking-wider uppercase mb-1.5">
          {category.description}
        </p>

        {/* 第2层：系列主标题（类似"我的猫猫去过太空"） */}
        <h3 className="text-[28px] font-bold text-white leading-[1.1] tracking-tight mb-2.5">
          {category.name}
        </h3>

        {/* 第3层：当前绘本标题（类似"我的汤姆猫二"） */}
        <p className="text-[16px] text-white/70 font-normal leading-snug">
          {currentTitle}
        </p>

        {/* 底部色条 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ backgroundColor: bgColor }}
        />
      </div>
    </motion.button>
  )
}
