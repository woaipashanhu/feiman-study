/**
 * ============================================================
 *  科学可视化 — 3D互动播放页（iframe 版）
 *
 *  独立HTML场景通过iframe加载，支持全屏沉浸式体验
 *  统一顶部按钮栏：← 返回 | 标题 | 📬 消息 | ☰ 列表
 *  列表抽屉：右侧滑出，展示所有场景，可切换
 * ============================================================
 */
import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useContentLoader } from '@/shared/hooks'
import type { ScienceData, ScienceScene } from '@/types/content'
import { setOGMeta } from '@/shared/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, EnvelopeSimple, List, Play, X } from 'phosphor-react'

export default function SciencePlayer() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showList, setShowList] = useState(false)
  const { data: scienceData } = useContentLoader<ScienceData>({
    url: '/data/science.json',
    type: 'science',
  })

  const sceneInfo = findScene(scienceData, id)

  useEffect(() => {
    setOGMeta({
      title: `${sceneInfo?.title || '3D科学探索'} - 费曼科学课`,
      description: sceneInfo?.description || '3D互动科学探索',
    })
  }, [id, sceneInfo])

  const navScenes = getNavScenes(scienceData, id)
  const goNext = useCallback(() => {
    if (navScenes.next) navigate(`/science/${navScenes.next}`)
  }, [navigate, navScenes.next])
  const goPrev = useCallback(() => {
    if (navScenes.prev) navigate(`/science/${navScenes.prev}`)
  }, [navigate, navScenes.prev])

  const iframeSrc = sceneInfo?.type === 'iframe' ? sceneInfo.src || `/science/${id}.html` : undefined

  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col z-50">
      <header className="flex items-center justify-between px-4 py-3 bg-gray-900/80 backdrop-blur-sm flex-shrink-0 z-20">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/science')}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={18} weight="regular" className="text-white/80" />
        </motion.button>

        <h1 className="text-sm font-medium text-white/90 truncate max-w-[40%] text-center">
          {sceneInfo?.title || '3D科学探索'}
        </h1>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors relative"
          >
            <EnvelopeSimple size={18} weight="regular" className="text-white/80" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-gray-900" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowList(true)}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <List size={18} weight="regular" className="text-white/80" />
          </motion.button>
        </div>
      </header>

      <div className="flex-1 relative">
        {iframeSrc ? (
          <iframe
            src={iframeSrc}
            className="w-full h-full border-0"
            allow="fullscreen"
            title={sceneInfo?.title || '3D科学场景'}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
            场景加载中...
          </div>
        )}
      </div>

      <footer className="flex-shrink-0 px-4 py-3 bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-white/40 truncate">{sceneInfo?.description || '3D互动探索'}</p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={goPrev}
              disabled={!navScenes.prev}
              className="p-2 rounded-full bg-white/10 disabled:opacity-30 hover:bg-white/20 transition-colors"
              title="上一个"
            >
              <svg viewBox="0 0 20 20" className="w-4 h-4 text-white/70" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={goNext}
              disabled={!navScenes.next}
              className="p-2 rounded-full bg-white/10 disabled:opacity-30 hover:bg-white/20 transition-colors"
              title="下一个"
            >
              <svg viewBox="0 0 20 20" className="w-4 h-4 text-white/70" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showList && (
          <SceneListDrawer
            scienceData={scienceData}
            currentId={id}
            onClose={() => setShowList(false)}
            onSelect={(sceneId) => {
              navigate(`/science/${sceneId}`)
              setShowList(false)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function SceneListDrawer({
  scienceData,
  currentId,
  onClose,
  onSelect,
}: {
  scienceData: ScienceData | null
  currentId: string
  onClose: () => void
  onSelect: (sceneId: string) => void
}) {
  const categories = scienceData?.categories || []

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm z-30"
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="absolute right-0 top-0 bottom-0 w-80 bg-gray-900/95 backdrop-blur-md z-40 flex flex-col"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white/90">场景列表</h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X size={16} weight="regular" className="text-white/70" />
          </motion.button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {categories.map((cat) => (
            <div key={cat.id} className="mb-4">
              <div className="flex items-center gap-2 px-4 py-2">
                <span className="text-lg">{cat.icon}</span>
                <span className="text-xs font-medium text-white/60">{cat.name}</span>
                <div className="flex-1 h-px bg-white/10 ml-2" />
              </div>
              <div className="px-2 space-y-1">
                {cat.scenes.map((scene) => {
                  const isActive = scene.id === currentId
                  return (
                    <motion.button
                      key={scene.id}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onSelect(scene.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                        isActive ? 'bg-white/15' : 'hover:bg-white/5'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold overflow-hidden"
                        style={{
                          backgroundColor: isActive ? cat.color + '30' : cat.color + '15',
                          color: cat.color,
                        }}
                      >
                        {scene.thumbnail ? (
                          <img src={scene.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          scene.title[0]
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${isActive ? 'text-white font-medium' : 'text-white/80'}`}>
                          {scene.title}
                        </p>
                        <p className="text-[10px] text-white/40 truncate">{scene.description}</p>
                      </div>
                      {isActive && (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: cat.color + '20' }}>
                          <Play size={10} weight="fill" style={{ color: cat.color }} />
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  )
}

function findScene(data: ScienceData | null, id: string): ScienceScene | undefined {
  if (!data) return undefined
  if (data.categories) {
    for (const cat of data.categories) {
      const found = cat.scenes.find((s) => s.id === id)
      if (found) return found
    }
  }
  if (data.scenes) {
    return data.scenes.find((s) => s.id === id)
  }
  return undefined
}

function getNavScenes(data: ScienceData | null, currentId: string): { prev?: string; next?: string } {
  if (!data) return {}
  let allScenes: ScienceScene[] = []
  if (data.categories) {
    data.categories.forEach((cat) => allScenes.push(...cat.scenes))
  } else if (data.scenes) {
    allScenes = data.scenes
  }
  const idx = allScenes.findIndex((s) => s.id === currentId)
  if (idx < 0) return {}
  return {
    prev: idx > 0 ? allScenes[idx - 1].id : undefined,
    next: idx < allScenes.length - 1 ? allScenes[idx + 1].id : undefined,
  }
}
