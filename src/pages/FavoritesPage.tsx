/**
 * ============================================================
 *  收藏全屏页 — /favorites
 *
 *  按板块分组展示所有收藏内容
 *  - 缩略图 + 标题 + 副标题
 *  - 点击跳转对应播放页
 *  - 右上角删除按钮
 * ============================================================
 */
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Trash, Heart, BookOpen } from 'phosphor-react'
import { useFavorites, type BoardId, BOARD_LABELS, BOARD_EMOJIS, BOARD_COLORS as HOOK_BOARD_COLORS } from '@/shared/hooks/useFavorites'
import { VideoPreview } from '@/shared/components/VideoPreview'

const BOARD_ORDER: BoardId[] = ['math', 'science', 'social', 'gallery', 'neimen']

const BOARD_PATH: Record<BoardId, (contentId: string) => string> = {
  math: (id) => `/math/lesson/${id}`,
  science: (id) => `/science/${id}`,
  social: (id) => `/social/scene/${id}`,
  gallery: (id) => `/gallery/${id}`,
  neimen: (id) => `/neimen/${id}`,
}

const BOARD_COLORS: Record<BoardId, string> = HOOK_BOARD_COLORS

export default function FavoritesPage() {
  const navigate = useNavigate()
  const { getAllFavorites, removeFavorite } = useFavorites()
  const all = getAllFavorites()
  const total = all.length

  // 按板块分组
  const grouped: Record<BoardId, typeof all> = {
    math: [], science: [], social: [], gallery: [], neimen: [],
  }
  for (const item of all) {
    grouped[item.boardId].push(item)
  }

  const handleItemClick = (boardId: BoardId, contentId: string) => {
    navigate(BOARD_PATH[boardId](contentId))
  }

  const handleRemove = (boardId: BoardId, contentId: string) => {
    removeFavorite(boardId, contentId)
  }

  return (
    <div className="h-full flex flex-col bg-bg overflow-hidden">
      {/* 顶部栏 — 返回按钮 */}
      <header className="flex items-center gap-3 px-4 py-3 bg-surface border-b border-border shrink-0">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center shadow-sm"
        >
          <ArrowLeft size={18} weight="regular" className="text-text" />
        </motion.button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-text text-base flex items-center gap-2">
            <Heart size={18} weight="fill" className="text-red-500" />
            我的收藏
          </h1>
          <p className="text-[10px] text-text-tertiary mt-0.5">
            {total > 0 ? `共 ${total} 个内容` : '还没有收藏'}
          </p>
        </div>
      </header>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto">
        {total === 0 ? (
          <EmptyState onExplore={() => navigate('/')} />
        ) : (
          <>
            {/* 顶部大卡片 — App Store Today 风格 (参照数学课 ChapterList) */}
            <div className="px-4 pt-4 pb-2">
              <div
                className="w-full rounded-[20px] overflow-hidden shadow-lg ring-1 ring-black/5 relative"
                style={{ height: '320px' }}
              >
                {/* 上半部分 — 2x2 收藏预览网格 */}
                <div className="relative h-[60%] overflow-hidden">
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(160deg, #EF444420 0%, #0f172a 70%)`,
                    }}
                  />
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full blur-3xl opacity-15"
                    style={{ backgroundColor: '#EF4444' }}
                  />

                  {/* 2x2 预览网格 — 缩小居中，完整展示 */}
                  {all.length > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="grid grid-cols-2 grid-rows-2 gap-2.5">
                        {all.slice(0, 4).map((item, idx) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 + idx * 0.06, type: 'spring', stiffness: 300, damping: 25 }}
                            className="relative w-[72px] h-[72px] rounded-xl overflow-hidden bg-gray-900/50 shadow-md"
                            onClick={() => handleItemClick(item.boardId, item.contentId)}
                          >
                            {item.videoUrl ? (
                              <VideoPreview
                                src={item.videoUrl}
                                poster={item.cover}
                                fallbackColor={BOARD_COLORS[item.boardId]}
                                rounded={12}
                                className="w-full h-full"
                                fallback={
                                  <span className="text-sm font-bold" style={{ color: BOARD_COLORS[item.boardId] }}>
                                    {idx + 1}
                                  </span>
                                }
                              />
                            ) : item.cover ? (
                              <img
                                src={item.cover.startsWith('data:') || item.cover.startsWith('/') || item.cover.startsWith('http') ? item.cover : '/' + item.cover}
                                alt={item.title}
                                className="w-full h-full object-contain"
                                loading="lazy"
                              />
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center"
                                style={{
                                  background: `linear-gradient(135deg, ${BOARD_COLORS[item.boardId]}40, ${BOARD_COLORS[item.boardId]}20)`,
                                }}
                              >
                                <span className="text-2xl">{BOARD_EMOJIS[item.boardId]}</span>
                              </div>
                            )}
                            {/* 序号角标 */}
                            <div className="absolute top-1 left-1 w-4 h-4 rounded-md bg-black/40 backdrop-blur-sm flex items-center justify-center">
                              <span className="text-[9px] font-bold text-white">{idx + 1}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 顶部渐变遮罩 */}
                  <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/20 to-transparent pointer-events-none z-20" />
                </div>

                {/* 下半部分 — 文字信息 */}
                <div className="relative h-[40%] flex flex-col justify-end p-5 bg-white">
                  {/* 渐变过渡 */}
                  <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/8 to-transparent pointer-events-none" />

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-medium text-red-500/70 tracking-wide">
                        我的收藏
                      </span>
                      <span className="text-[11px] text-text-tertiary px-1.5 py-0.5 rounded-md bg-black/5">
                        {total} 个内容
                      </span>
                    </div>
                    <h2 className="text-[22px] font-bold text-text leading-tight">
                      收藏夹
                    </h2>
                    <p className="text-[13px] text-text-secondary mt-1.5 leading-relaxed line-clamp-2">
                      你的小纸条 + 啊哈时刻,纸短情长
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 分组列表 */}
            <div className="px-4 pb-6 space-y-5">
            {BOARD_ORDER.map((boardId) => {
              const items = grouped[boardId]
              if (items.length === 0) return null
              return (
                <section key={boardId}>
                  {/* 板块标题 */}
                  <div className="flex items-center gap-2 mb-2.5 px-1">
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                      style={{ backgroundColor: BOARD_COLORS[boardId] + '20' }}
                    >
                      {BOARD_EMOJIS[boardId]}
                    </span>
                    <h2 className="text-sm font-semibold text-text">{BOARD_LABELS[boardId]}</h2>
                    <span className="text-xs text-text-tertiary ml-auto">{items.length}</span>
                  </div>

                  {/* 收藏列表 */}
                  <div className="space-y-2">
                    <AnimatePresence>
                      {items.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ duration: 0.2 }}
                          className="bg-surface rounded-xl border border-border shadow-sm flex items-center gap-3 p-2.5"
                        >
                          {/* 缩略图 */}
                          <button
                            onClick={() => handleItemClick(item.boardId, item.contentId)}
                            className="w-12 h-12 rounded-lg overflow-hidden bg-border-light shrink-0"
                          >
                            {item.videoUrl ? (
                              <VideoPreview
                                src={item.videoUrl}
                                poster={item.cover}
                                fallbackColor={BOARD_COLORS[item.boardId]}
                                fallback={<span className="text-sm font-bold">{item.title[0] || '?'}</span>}
                                rounded={8}
                                className="w-full h-full"
                              />
                            ) : item.cover ? (
                              <img
                                src={item.cover.startsWith('data:') || item.cover.startsWith('/') || item.cover.startsWith('http') ? item.cover : '/' + item.cover}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center text-lg font-bold"
                                style={{ backgroundColor: BOARD_COLORS[item.boardId] + '20', color: BOARD_COLORS[item.boardId] }}
                              >
                                {item.title[0] || '?'}
                              </div>
                            )}
                          </button>

                          {/* 信息 */}
                          <button
                            onClick={() => handleItemClick(item.boardId, item.contentId)}
                            className="flex-1 min-w-0 text-left"
                          >
                            <p className="text-sm text-text font-medium truncate">{item.title}</p>
                            {item.subtitle && (
                              <p className="text-[10px] text-text-tertiary mt-0.5 truncate">
                                {item.subtitle}
                              </p>
                            )}
                          </button>

                          {/* 删除按钮 */}
                          <button
                            onClick={() => handleRemove(item.boardId, item.contentId)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-text-tertiary hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                            title="取消收藏"
                          >
                            <Trash size={14} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </section>
              )
            })}
          </div>
          </>
        )}
        <div className="h-6" />
      </div>
    </div>
  )
}

function EmptyState({ onExplore }: { onExplore: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center pt-20 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <Heart size={36} weight="duotone" className="text-red-300" />
      </div>
      <h3 className="text-base font-semibold text-text mb-1">还没有收藏内容</h3>
      <p className="text-xs text-text-tertiary mb-5 max-w-[240px]">
        打开任意一封信或啊哈时刻,点击右下角 ❤ 就能收藏到这里
      </p>
      <button
        onClick={onExplore}
        className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium flex items-center gap-1.5 hover:bg-brand-dark transition-colors"
      >
        <BookOpen size={16} />
        去探索内容
      </button>
    </div>
  )
}
