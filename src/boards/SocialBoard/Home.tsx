/**
 * ============================================================
 *  社交绘本 — 卡片主页
 *
 *  展示2大分类卡片，点击进入分类列表页
 *  右上角 📬 个人中心按钮
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
    transition: { staggerChildren: 0.1 },
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

export default function SocialHome() {
  const navigate = useNavigate()
  const { data: socialData, loading } = useContentLoader<SocialData>({
    url: '/data/social-scenes.json',
    type: 'social',
  })

  if (loading) {
    return (
      <div className="h-full flex flex-col px-5 pt-4 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-4 flex-1">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const categories = [
    {
      id: 'carnegie',
      name: '卡耐基社交智慧',
      description: `${socialData?.carnegieCatalog?.length || 0} 个场景`,
      icon: <BookBookmark size={24} weight="regular" />,
      color: '#FF9F43',
    },
    {
      id: 'social-story',
      name: '社交故事',
      description: `${socialData?.socialStoryCatalog?.length || 0} 个场景`,
      icon: <ChatCircleText size={24} weight="regular" />,
      color: '#A55EEA',
    },
  ]

  return (
    <div className="h-full flex flex-col px-5 pt-4 pb-6 overflow-y-auto">
      {/* 顶部栏 */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text font-display">社交训练</h1>
          <p className="text-sm text-text-secondary mt-1">培养社交智慧</p>
        </div>
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

      {/* 分类卡片网格 */}
      <motion.div
        className="grid grid-cols-2 gap-4 flex-1 content-start"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {categories.map((cat) => (
          <CategoryCard key={cat.id} category={cat} />
        ))}
      </motion.div>
    </div>
  )
}

function CategoryCard({ category }: { category: { id: string; name: string; description: string; icon: React.ReactNode; color: string } }) {
  const navigate = useNavigate()

  return (
    <motion.button
      variants={cardVariants}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/social/category/${category.id}`)}
      className="relative rounded-2xl overflow-hidden aspect-[4/5] shadow-sm hover:shadow-lg transition-shadow text-left group"
      style={{ backgroundColor: category.color + '10' }}
    >
      {/* 背景装饰 */}
      <div
        className="absolute inset-0 opacity-10 group-hover:opacity-15 transition-opacity"
        style={{
          background: `radial-gradient(circle at 80% 20%, ${category.color}40 0%, transparent 60%)`,
        }}
      />

      {/* 内容 */}
      <div className="relative h-full flex flex-col p-4">
        {/* 图标 */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-auto"
          style={{ backgroundColor: category.color + '18', color: category.color }}
        >
          {category.icon}
        </div>

        {/* 底部信息 */}
        <div>
          <h3 className="text-base font-bold text-text mb-1">{category.name}</h3>
          <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
            {category.description}
          </p>
        </div>
      </div>

      {/* 底部色条 */}
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: category.color }} />
    </motion.button>
  )
}
