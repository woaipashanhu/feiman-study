/**
 * ============================================================
 *  内功养生法 — 卡片详情页（改造版）
 *
 *  统一顶部按钮栏：← 返回 | 标题 | 📬 消息 | ☰ 列表
 *  列表抽屉：右侧滑出，展示所有功法，可切换
 * ============================================================
 */
import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useContentLoader } from '@/shared/hooks'
import type { NeimenData, Card } from '@/types/content'
import { setOGMeta } from '@/shared/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, EnvelopeSimple, List, X } from 'phosphor-react'

export default function CardDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [flipped, setFlipped] = useState(false)
  const [showList, setShowList] = useState(false)
  const { data: neimenData } = useContentLoader<NeimenData>({
    url: '/data/neimen.json',
    type: 'neimen',
  })

  // 查找当前卡片
  const card = findCard(neimenData, id)

  // 所有卡片（用于列表和导航）
  const allCards = getAllCards(neimenData)
  const nav = getNavCards(allCards, id)

  // OG 标签
  useEffect(() => {
    if (card) {
      setOGMeta({
        title: `${card.title} - 费曼科学课`,
        description: card.content?.slice(0, 80) || card.subtitle || '',
      })
    }
  }, [id, card])

  // 导航
  const goPrev = useCallback(() => {
    if (nav.prev) navigate(`/neimen/${nav.prev}`)
  }, [navigate, nav.prev])
  const goNext = useCallback(() => {
    if (nav.next) navigate(`/neimen/${nav.next}`)
  }, [navigate, nav.next])

  // 键盘导航
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'Escape') navigate('/neimen')
      if (e.key === ' ' || e.key === 'Enter') setFlipped((f) => !f)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goPrev, goNext, navigate])

  if (!card) {
    return (
      <div className="fixed inset-0 bg-bg z-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-text-muted">卡片未找到</p>
          <button
            onClick={() => navigate('/neimen')}
            className="px-4 py-2 rounded-xl bg-forest text-white text-sm"
          >
            返回列表
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-cream flex flex-col z-50">
      {/* 统一顶部按钮栏 */}
      <header className="flex items-center justify-between px-4 py-3 bg-cream/80 backdrop-blur-sm flex-shrink-0 z-20">
        {/* 左侧：返回按钮 */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/neimen')}
          className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors shadow-sm"
        >
          <ArrowLeft size={18} weight="regular" className="text-bark/80" />
        </motion.button>

        {/* 中间：标题 */}
        <h1 className="text-sm font-medium text-bark truncate max-w-[40%] text-center">
          {card.title}
        </h1>

        {/* 右侧：消息 + 列表 */}
        <div className="flex items-center gap-2">
          {/* 消息按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors shadow-sm relative"
          >
            <EnvelopeSimple size={18} weight="regular" className="text-bark/80" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-cream" />
          </motion.button>

          {/* 列表按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowList(true)}
            className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors shadow-sm"
          >
            <List size={18} weight="regular" className="text-bark/80" />
          </motion.button>
        </div>
      </header>

      {/* 翻转卡片区域 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div
          className="relative w-full max-w-md cursor-pointer"
          style={{ perspective: '1000px' }}
          onClick={() => setFlipped((f) => !f)}
        >
          <div
            className="relative w-full transition-transform duration-500"
            style={{
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* 正面 — 标题 + 封面 */}
            <CardFace front>
              <div className="space-y-4">
                {/* 封面图或图标 */}
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-forest-light to-forest/10 flex items-center justify-center">
                  {card.image ? (
                    <img
                      src={card.image.startsWith('data:') || card.image.startsWith('/') ? card.image : '/' + card.image}
                      alt={card.title}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <span className="text-6xl">🃏</span>
                  )}
                </div>

                {/* 标题信息 */}
                <div className="text-center space-y-1 px-2">
                  <h2 className="text-xl font-bold text-bark font-display">{card.title}</h2>
                  {card.subtitle && (
                    <p className="text-sm text-bark/50">{card.subtitle}</p>
                  )}
                </div>

                {/* 点击翻转提示 */}
                <p className="text-xs text-bark/30 text-center pt-2">点击查看详情 →</p>
              </div>
            </CardFace>

            {/* 背面 — 详细内容 */}
            <CardFace back>
              <div className="space-y-4 h-full flex flex-col">
                {/* 标题 */}
                <div className="border-b border-bark/10 pb-3">
                  <h2 className="text-lg font-bold text-bark font-display">{card.title}</h2>
                  {card.subtitle && (
                    <p className="text-xs text-bark/40 mt-0.5">{card.subtitle}</p>
                  )}
                </div>

                {/* 正文内容 */}
                <div className="flex-1 overflow-y-auto">
                  {card.content ? (
                    <div className="text-sm text-bark/70 leading-relaxed whitespace-pre-line">
                      {card.content}
                    </div>
                  ) : (
                    <p className="text-sm text-bark/30 italic">暂无详细内容</p>
                  )}
                </div>

                {/* 要点提示 */}
                {card.tips && card.tips.length > 0 && (
                  <div className="space-y-1.5 pt-3 border-t border-bark/10">
                    <p className="text-xs font-medium text-forest">💡 要点</p>
                    <ul className="space-y-1">
                      {card.tips.map((tip: string, i: number) => (
                        <li key={i} className="text-xs text-bark/60 flex items-start gap-1.5">
                          <span className="text-forest mt-0.5 flex-shrink-0">·</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 点击返回提示 */}
                <p className="text-xs text-bark/30 text-center pt-1">← 点击返回正面</p>
              </div>
            </CardFace>
          </div>
        </div>

        {/* 底部导航 */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={(e) => { e.stopPropagation(); goPrev() }}
            disabled={!nav.prev}
            className="px-4 py-2 rounded-xl bg-white shadow-soft text-sm text-bark/60 disabled:opacity-30 hover:shadow-float transition-all"
          >
            ← 上一张
          </button>
          <span className="text-xs text-bark/30 min-w-[3rem] text-center">
            {nav.index + 1} / {nav.total}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); goNext() }}
            disabled={!nav.next}
            className="px-4 py-2 rounded-xl bg-white shadow-soft text-sm text-bark/60 disabled:opacity-30 hover:shadow-float transition-all"
          >
            下一张 →
          </button>
        </div>
      </div>

      {/* 功法列表抽屉 */}
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
                <h2 className="text-sm font-medium text-white">功法列表</h2>
                <button
                  onClick={() => setShowList(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <X size={16} className="text-white/70" />
                </button>
              </div>

              {/* 功法列表 */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {allCards.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      navigate(`/neimen/${c.id}`)
                      setShowList(false)
                    }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${
                      i === nav.index
                        ? 'bg-brand/20 border border-brand/30'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                      {c.image ? (
                        <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-brand/20 text-brand">
                          {i + 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${i === nav.index ? 'text-brand' : 'text-white/80'}`}>
                        {c.title}
                      </p>
                      {c.subtitle && (
                        <p className="text-[10px] text-white/40 mt-0.5">{c.subtitle}</p>
                      )}
                    </div>
                    {i === nav.index && (
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

/** 卡片正反面通用容器 */
function CardFace({ children, back }: { children: React.ReactNode; front?: boolean; back?: boolean }) {
  return (
    <div
      className="absolute inset-0 w-full rounded-2xl bg-white shadow-card p-5 backface-hidden"
      style={{
        backfaceVisibility: 'hidden',
        transform: back ? 'rotateY(180deg)' : undefined,
      }}
    >
      {children}
    </div>
  )
}

// ==================== 工具函数 ====================

function findCard(data: NeimenData | null, id: string): Card | undefined {
  if (!data) return undefined
  if (data.categories) {
    for (const cat of data.categories) {
      const found = cat.cards.find((c) => c.id === id)
      if (found) return found
    }
  }
  if (data.cards) {
    return data.cards.find((c) => c.id === id)
  }
  return undefined
}

function getAllCards(data: NeimenData | null): Card[] {
  if (!data) return []
  if (data.categories) {
    return data.categories.flatMap((cat) => cat.cards)
  }
  if (data.cards) {
    return data.cards
  }
  return []
}

function getNavCards(allCards: Card[], currentId: string): { prev?: string; next?: string; index: number; total: number } {
  const idx = allCards.findIndex((c) => c.id === currentId)
  return {
    index: idx >= 0 ? idx : 0,
    total: allCards.length,
    prev: idx > 0 ? allCards[idx - 1].id : undefined,
    next: idx < allCards.length - 1 ? allCards[idx + 1].id : undefined,
  }
}
