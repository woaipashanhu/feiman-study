/**
 * ============================================================
 *  数学课 — 视频播放页（改造版）
 *
 *  统一顶部按钮栏：← 返回 | 标题 | 📬 消息 | ☰ 列表
 *  列表抽屉：右侧滑出，展示所有课程，可切换
 * ============================================================
 */
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useContentLoader } from '@/shared/hooks'
import { setOGMeta } from '@/shared/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, EnvelopeSimple, List, X, Play, Clock, Heart } from 'phosphor-react'
import { Aliplayer } from './Aliplayer'
import type { MathData } from '@/types/content'
import { useFavorites } from '@/shared/hooks/useFavorites'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MathPlayer() {
  const { lessonId = '' } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const [showList, setShowList] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const { isFavorited, toggleFavorite } = useFavorites()

  const { data: mathData } = useContentLoader<MathData>({
    url: '/data/math.json',
    type: 'math',
  })

  // 查找课程信息
  const allLessons = mathData?.sections?.flatMap((s) => s.lessons) || []
  const currentLesson = allLessons.find((l) => l.id === lessonId)
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId)

  // OG 标签
  useEffect(() => {
    setOGMeta({
      title: `${currentLesson?.title || '数学课'} - 费曼科学课`,
      description: currentLesson?.subtitle || '费曼数学视频课程',
    })
  }, [lessonId, currentLesson])

  // 上一个/下一个
  const goNext = useCallback(() => {
    if (currentIndex < allLessons.length - 1) {
      navigate(`/math/lesson/${allLessons[currentIndex + 1].id}`)
    }
  }, [currentIndex, allLessons, navigate])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      navigate(`/math/lesson/${allLessons[currentIndex - 1].id}`)
    }
  }, [currentIndex, allLessons, navigate])

  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col z-50">
      {/* 统一顶部按钮栏 */}
      <header className="flex items-center justify-between px-4 py-3 bg-gray-900/80 backdrop-blur-sm flex-shrink-0 z-20">
        {/* 左侧：返回按钮 */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/math')}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={18} weight="regular" className="text-white/80" />
        </motion.button>

        {/* 中间：标题 */}
        <h1 className="text-sm font-medium text-white/90 truncate max-w-[40%] text-center">
          {currentLesson?.title || '数学课'}
        </h1>

        {/* 右侧：消息 + 列表 */}
        <div className="flex items-center gap-2">
          {/* 消息按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors relative"
          >
            <EnvelopeSimple size={18} weight="regular" className="text-white/80" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-gray-900" />
          </motion.button>

          {/* 列表按钮 */}
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

      {/* 视频播放区域 */}
      <div className="flex-1 relative">
        {currentLesson ? (
          <>
            <Aliplayer
              videoId={currentLesson.videoId}
              playauthApi={mathData?.playauthApi || ''}
              cover={currentLesson.cover}
              onReady={() => setIsPlaying(true)}
            />

            {/* 播放控制遮罩 */}
            {!isPlaying && currentLesson.cover && (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${currentLesson.cover})` }}
              >
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <motion.div
                    className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl cursor-pointer"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsPlaying(true)}
                  >
                    <Play size={28} weight="fill" className="text-gray-900 ml-1" />
                  </motion.div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/50">
            课程未找到
          </div>
        )}
      </div>

      {/* 底部信息栏 */}
      <footer className="flex-shrink-0 px-4 py-3 bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-white/40 truncate">
              {currentLesson?.subtitle || '费曼数学课'}
            </p>
          </div>

          {/* 上一个 / 下一个 导航 */}
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={goPrev}
              disabled={currentIndex <= 0}
              className="px-3 py-1.5 rounded-lg bg-white/10 disabled:opacity-30 text-white/70 text-xs"
            >
              上一课
            </button>
            <span className="text-xs text-white/40">
              {currentIndex + 1} / {allLessons.length}
            </span>
            <button
              onClick={goNext}
              disabled={currentIndex >= allLessons.length - 1}
              className="px-3 py-1.5 rounded-lg bg-white/10 disabled:opacity-30 text-white/70 text-xs"
            >
              下一课
            </button>
          </div>

          {/* 收藏按钮 */}
          {currentLesson && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() =>
                toggleFavorite({
                  boardId: 'math',
                  contentId: currentLesson.id,
                  title: currentLesson.title,
                  cover: currentLesson.cover,
                  subtitle: currentLesson.subtitle,
                  videoUrl: currentLesson.previewUrl,
                })
              }
              className="w-9 h-9 rounded-full flex items-center justify-center ml-3 bg-white/10 hover:bg-white/20 transition-colors"
              title="收藏"
            >
              <Heart
                size={18}
                weight={isFavorited('math', currentLesson.id) ? 'fill' : 'regular'}
                className={isFavorited('math', currentLesson.id) ? 'text-red-500' : 'text-white/60'}
              />
            </motion.button>
          )}
        </div>
      </footer>

      {/* 课程列表抽屉 */}
      <AnimatePresence>
        {showList && (
          <>
            {/* 遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowList(false)}
              className="fixed inset-0 bg-black/50 z-30"
            />

            {/* 抽屉 */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-gray-900 z-40 flex flex-col"
            >
              {/* 抽屉头部 */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <h2 className="text-sm font-medium text-white">课程列表</h2>
                <button
                  onClick={() => setShowList(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <X size={16} className="text-white/70" />
                </button>
              </div>

              {/* 课程列表 */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {allLessons.map((lesson, i) => (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      navigate(`/math/lesson/${lesson.id}`)
                      setShowList(false)
                    }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${
                      i === currentIndex
                        ? 'bg-brand/20 border border-brand/30'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                      {lesson.cover ? (
                        <img src={lesson.cover} alt={lesson.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-brand/20 text-brand">
                          {i + 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${i === currentIndex ? 'text-brand' : 'text-white/80'}`}>
                        {lesson.title}
                      </p>
                      {lesson.duration && (
                        <p className="text-[10px] text-white/40 flex items-center gap-1 mt-0.5">
                          <Clock size={8} />
                          {formatDuration(lesson.duration)}
                        </p>
                      )}
                    </div>
                    {i === currentIndex && (
                      <div className="w-2 h-2 rounded-full bg-brand shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
