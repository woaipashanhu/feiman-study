/**
 * ============================================================
 *  社交绘本列表页
 *  展示两大分类：卡耐基社交智慧 + 社交故事
 * ============================================================
 */
import { Link, useLocation } from 'react-router-dom'
import { useRef, useEffect } from 'react'
import { useContentLoader } from '@/shared/hooks'
import { Skeleton } from '@/shared/components'
import { motion } from 'framer-motion'
import { BookBookmark, ChatCircleText } from 'phosphor-react'
import type { SocialData } from '@/types/content'
import type { SceneCatalogEntry } from './types'

// 模块级变量：记录列表滚动位置（跨导航持久化）
let savedScrollY = 0

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } },
}

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

export default function SocialList() {
  const { data: scenesData, loading } = useContentLoader<SocialData>({
    url: '/data/social-scenes.json',
    type: 'social',
  })
  const location = useLocation()
  const listRef = useRef<HTMLDivElement>(null)

  // 返回列表时恢复滚动位置
  useEffect(() => {
    if (savedScrollY > 0 && listRef.current) {
      requestAnimationFrame(() => {
        if (listRef.current) {
          listRef.current.scrollTop = savedScrollY
        }
      })
    }
  }, [location, loading])

  // 离开列表时保存滚动位置
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const saveScroll = () => { savedScrollY = el.scrollTop }
    el.addEventListener('scroll', saveScroll, { passive: true })
    return () => el.removeEventListener('scroll', saveScroll)
  }, [loading])

  if (loading) {
    return <Skeleton type="list" count={4} categoryCount={2} showHeader showCategory />
  }

  if (!scenesData) return null

  const carnegieCatalog = scenesData.carnegieCatalog
  const socialStoryCatalog = scenesData.socialStoryCatalog

  return (
    <div ref={listRef} className="max-w-2xl mx-auto space-y-6 overflow-y-auto pb-6" style={{ maxHeight: 'calc(100vh - 120px)' }}>
      {/* 卡耐基社交智慧 */}
      <section>
        <motion.div
          className="flex items-center gap-2 mb-3 px-1"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <BookBookmark size={20} weight="fill" className="text-social" />
          <h2 className="font-display text-base text-social font-bold">卡耐基社交智慧</h2>
          <span className="text-xs text-text-tertiary ml-auto">
            {carnegieCatalog.filter(s => s.unlocked).length}/{carnegieCatalog.length}
          </span>
        </motion.div>
        <motion.div
          className="space-y-2"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {carnegieCatalog.map((scene, index) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              index={index}
              color="#FF9F43"
              to={`/social/scene/${scene.id}`}
            />
          ))}
        </motion.div>
      </section>

      {/* 社交故事 */}
      <section>
        <motion.div
          className="flex items-center gap-2 mb-3 px-1"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ChatCircleText size={20} weight="fill" className="text-gallery" />
          <h2 className="font-display text-base text-gallery font-bold">社交故事</h2>
          <span className="text-xs text-text-tertiary ml-auto">{socialStoryCatalog.length}篇</span>
        </motion.div>
        <motion.div
          className="space-y-2"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {socialStoryCatalog.map((scene, index) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              index={index}
              color="#A55EEA"
              to={`/social/scene/${scene.id}`}
            />
          ))}
        </motion.div>
      </section>
    </div>
  )
}

function SceneCard({
  scene,
  index,
  color,
  to,
}: {
  scene: SceneCatalogEntry
  index: number
  color: string
  to: string
}) {
  return (
    <motion.div variants={itemVariants}>
      <Link
        to={to}
        className={`group flex items-center gap-4 p-3 sm:p-4 rounded-xl bg-surface border border-border hover-card ${!scene.unlocked ? 'opacity-40 pointer-events-none' : ''}`}
      >
        {/* 渐变序号 */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm text-white shadow-sm"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}DD)` }}
        >
          {String(index + 1).padStart(2, '0')}
        </div>

        {/* 封面图 */}
        {scene.coverImage && (
          <div className="flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden bg-border-light">
            <img
              src={scene.coverImage.startsWith('/') ? scene.coverImage : '/' + scene.coverImage}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        {/* 标题和原则 */}
        <div className="min-w-0 flex-1">
          <div className="text-sm sm:text-[15px] font-semibold truncate" style={{ color }}>
            {scene.title}
          </div>
          <div className="text-xs text-text-tertiary truncate mt-0.5">{scene.principle}</div>
        </div>

        {/* 箭头 */}
        <svg viewBox="0 0 20 20" className="w-4 h-4 flex-shrink-0 text-border group-hover:text-text-tertiary transition-colors" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </Link>
    </motion.div>
  )
}
