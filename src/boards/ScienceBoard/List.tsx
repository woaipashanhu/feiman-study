/**
 * ============================================================
 *  科学可视化 — 场景列表页
 *  按分类展示所有3D科学场景，点击进入互动体验
 * ============================================================
 */
import { Link } from 'react-router-dom'
import { useContentLoader } from '@/shared/hooks'
import { Skeleton } from '@/shared/components'
import { useScrollRestoration } from '@/shared/hooks/useScrollRestoration'
import { motion } from 'framer-motion'
import { Atom, Planet, WaveSine, Cube, Globe, Flask, Moon, Heart, Mountains } from 'phosphor-react'
// phosphor-react 1.4.1 没有 Dna 和 Cell，用 Atom 替代
const Dna = Atom
const Cell = Atom
import type { ScienceData, ScienceCategory, ScienceScene } from '@/types/content'

const categoryIcons: Record<string, React.ReactNode> = {
  'physics': <Atom size={20} weight="fill" />,
  'astronomy': <Planet size={20} weight="fill" />,
  'biology': <Dna size={20} weight="fill" />,
  'chemistry': <Flask size={20} weight="fill" />,
}

const sceneIcons: Record<string, React.ReactNode> = {
  'atom-structure': <Atom size={32} weight="duotone" />,
  'solar-system': <Planet size={32} weight="duotone" />,
  'wave-interference': <WaveSine size={32} weight="duotone" />,
  'dna-helix': <Dna size={32} weight="duotone" />,
  'molecule-builder': <Cube size={32} weight="duotone" />,
  'crystal-lattice': <Cube size={32} weight="duotone" />,
  'cell-structure': <Cell size={32} weight="duotone" />,
  'blood-circulation': <Heart size={32} weight="duotone" />,
  'earth-layers': <Globe size={32} weight="duotone" />,
  'moon-phases': <Moon size={32} weight="duotone" />,
  'tectonic-plates': <Mountains size={32} weight="duotone" />,
}

const difficultyColors: Record<string, { bg: string; text: string }> = {
  '简单': { bg: 'bg-success-light', text: 'text-success' },
  '中等': { bg: 'bg-warning-light', text: 'text-warning' },
  '困难': { bg: 'bg-error-light', text: 'text-error' },
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

export default function ScienceList() {
  const { data: scienceData, loading } = useContentLoader<ScienceData>({
    url: '/data/science.json',
    type: 'science',
  })
  const { scrollRef } = useScrollRestoration('/science')

  if (loading) {
    return <Skeleton type="list" count={4} categoryCount={2} showHeader showCategory />
  }

  if (!scienceData) return null

  const categories = scienceData.categories || []
  const flatScenes = !categories.length && scienceData.scenes ? scienceData.scenes : []

  return (
    <div ref={scrollRef} className="max-w-2xl mx-auto space-y-6 overflow-y-auto pb-6" style={{ maxHeight: 'calc(100vh - 120px)' }}>
      {/* 头部 */}
      <motion.header
        className="space-y-1 px-1"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-text font-display">{scienceData.title}</h1>
        <p className="text-sm text-text-secondary">{scienceData.description}</p>
      </motion.header>

      {/* 分类展示 */}
      {categories.length > 0 && categories.map((cat) => (
        <CategorySection key={cat.id} category={cat} />
      ))}

      {/* 旧格式兼容 */}
      {flatScenes.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Atom size={18} weight="fill" className="text-brand" />
            <h2 className="font-display text-base text-brand font-bold">全部场景</h2>
            <span className="text-xs text-text-tertiary ml-auto">{flatScenes.length}个</span>
          </div>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {flatScenes.map((scene) => (
              <SceneCard key={scene.id} scene={scene} color="#4F6EF7" to={`/science/${scene.id}`} />
            ))}
          </motion.div>
        </section>
      )}
    </div>
  )
}

function CategorySection({ category }: { category: ScienceCategory }) {
  return (
    <section>
      <motion.div
        className="flex items-center gap-2 mb-3 px-1"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <span style={{ color: category.color || '#4F6EF7' }}>
          {categoryIcons[category.id] || <Atom size={20} weight="fill" />}
        </span>
        <h2 className="font-display text-base font-bold" style={{ color: category.color || '#4F6EF7' }}>
          {category.name}
        </h2>
        <span className="text-xs text-text-tertiary ml-auto">{category.scenes.length}个场景</span>
      </motion.div>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {category.scenes.map((scene) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            color={category.color || '#4F6EF7'}
            to={`/science/${scene.id}`}
          />
        ))}
      </motion.div>
    </section>
  )
}

function SceneCard({
  scene,
  color,
  to,
}: {
  scene: ScienceScene
  color: string
  to: string
}) {
  const diffStyle = scene.difficulty ? difficultyColors[scene.difficulty] : null
  const icon = sceneIcons[scene.id] || <Atom size={32} weight="duotone" />

  return (
    <motion.div variants={itemVariants}>
      <Link
        to={to}
        className="group block rounded-xl bg-surface border border-border overflow-hidden hover-card"
      >
        {/* 顶部色条 */}
        <div className="h-1" style={{ backgroundColor: color }} />

        <div className="p-4">
          {/* 图标 + 标题 */}
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: color + '12', color }}
            >
              {icon}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-text truncate">{scene.title}</h3>
              <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{scene.description}</p>
            </div>
          </div>

          {/* 标签 */}
          <div className="flex items-center gap-2 mt-3">
            {diffStyle && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium ${diffStyle.bg} ${diffStyle.text}`}>
                {scene.difficulty}
              </span>
            )}
            {scene.duration && (
              <span className="text-[10px] text-text-tertiary">{scene.duration}</span>
            )}
            <span className="text-[10px] text-text-tertiary ml-auto group-hover:text-brand transition-colors">
              进入探索 →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
