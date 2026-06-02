/**
 * ============================================================
 *  社交绘本阅读器引擎 — 一模一样复刻 fox-school ScenePage.tsx
 *  原始代码: 621 行，完整保留所有交互逻辑和 UI 细节
 *  适配: 数据从 JSON 加载（useContentLoader），路由集成 v3 架构
 * ============================================================
 */
import { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { SceneData, SceneCatalogEntry, StoryPart } from './types'
import ThoughtBubbleCard, { renderBilingual, type Lang } from './ThoughtBubbleCard'
import { useContentLoader } from '@/shared/hooks'
import type { SocialData } from '@/types/content'

// 确保图片路径以 / 开头（数据中存储的是相对路径如 images/s-01/xxx.png）
function fixPath(p: string): string {
  return p.startsWith('/') ? p : '/' + p
}

// ========== BookPicker（绘本选择侧栏）— 与原始一致 ==========
function BookPicker({
  currentId,
  carnegieCatalog,
  socialStoryCatalog,
  onSelect,
  onClose,
}: {
  currentId: string
  carnegieCatalog: SceneCatalogEntry[]
  socialStoryCatalog: SceneCatalogEntry[]
  onSelect: (id: string) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-72 sm:w-80 bg-white h-full shadow-float overflow-y-auto animate-slide-in-right">
        <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-bark/5 px-4 py-3 flex items-center justify-between z-10">
          <h3 className="font-display text-base text-forest font-bold">选择绘本</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bark/5 transition-colors">
            <svg viewBox="0 0 20 20" className="w-5 h-5 text-bark/50" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="p-2 space-y-1">
          {/* 卡耐基社交智慧 */}
          <div className="px-3 pt-1 pb-1 text-[10px] font-semibold text-bark/25 uppercase tracking-wider">卡耐基社交智慧</div>
          {carnegieCatalog.map((scene) => {
            const isActive = scene.id === currentId
            return (
              <button key={scene.id}
                onClick={() => { onSelect(scene.id); onClose() }}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all
                  ${isActive ? 'bg-forest/10 ring-1 ring-forest/20' : 'hover:bg-bark/5'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${isActive ? 'bg-forest text-white' : 'bg-bark/5 text-bark/40'}`}>
                  {String(carnegieCatalog.indexOf(scene) + 1).padStart(2, '0')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm truncate ${isActive ? 'text-forest font-medium' : 'text-bark'}`}>
                    {scene.title}
                  </div>
                  <div className="text-xs text-bark/30 truncate">{scene.principle}</div>
                </div>
                {isActive && (
                  <svg viewBox="0 0 20 20" className="w-4 h-4 text-forest flex-shrink-0" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            )
          })}
          {/* 社交故事系列 */}
          <div className="px-3 pt-3 pb-1 text-[10px] font-semibold text-bark/25 uppercase tracking-wider border-t border-bark/5 mt-1">社交故事</div>
          {socialStoryCatalog.map((scene) => {
            const isActive = scene.id === currentId
            return (
              <button key={scene.id}
                onClick={() => { onSelect(scene.id); onClose() }}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all
                  ${isActive ? 'bg-forest/10 ring-1 ring-forest/20' : 'hover:bg-bark/5'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${isActive ? 'bg-forest text-white' : 'bg-bark/5 text-bark/40'}`}>
                  {String(socialStoryCatalog.indexOf(scene) + 1).padStart(2, '0')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm truncate ${isActive ? 'text-forest font-medium' : 'text-bark'}`}>
                    {scene.title}
                  </div>
                  <div className="text-xs text-bark/30 truncate">{scene.principle}</div>
                </div>
                {isActive && (
                  <svg viewBox="0 0 20 20" className="w-4 h-4 text-forest flex-shrink-0" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ========== Main Player Component — 完整复刻 ScenePage ==========
export default function SocialPlayer() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // 从 JSON 加载数据
  const { data: scenesData, loading } = useContentLoader<SocialData>({
    url: '/data/social-scenes.json',
    type: 'social',
  })

  // ⚠️⚠️⚠️ 所有 Hooks（useState/useRef/useEffect/useCallback/useLayoutEffect）必须
  //       在任何条件 return 之前调用！违反此规则会导致 React Error #310 ⚠️⚠️⚠️
  const [currentPart, setCurrentPart] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [muted, setMuted] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const [lang, setLang] = useState<Lang>('zh')
  const [showBookPicker, setShowBookPicker] = useState(false)
  const [imageTopOffset, setImageTopOffset] = useState(0)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pausedMidPlayRef = useRef(false)
  const touchStartY = useRef<number | null>(null)

  // --- 派生数据（依赖 scenesData，但在 hooks 之后计算）---
  const _scene = scenesData ? (scenesData.sceneData as Record<string, SceneData>)[id ?? 'social-01'] : undefined
  const _carnegieCatalog = scenesData?.carnegieCatalog ?? []
  const _socialStoryCatalog = scenesData?.socialStoryCatalog ?? []
  const _parts = _scene?.parts ?? []
  const _part = _parts[currentPart]
  const _totalParts = _parts.length
  const _isSocial = (id ?? '').startsWith('social-')
  const _currentCatalog = _isSocial ? _socialStoryCatalog : _carnegieCatalog
  const _currentIdx = _currentCatalog.findIndex(s => s.id === id)

  // 路由变化时（切换绘本）重置所有状态
  useEffect(() => {
    setCurrentPart(0)
    setIsPlaying(true)
    setShowSummary(false)
    setAnimating(false)
    setAudioProgress(0)
    setLang('zh')
    setShowBookPicker(false)
    setImageTopOffset(0)
  }, [id])

  const clearAdvanceTimer = useCallback(() => {
    if (advanceTimer.current) { clearTimeout(advanceTimer.current); advanceTimer.current = null }
  }, [])

  const getAudioSrc = useCallback((p: StoryPart): string | undefined => {
    if (!p?.audio) return undefined
    if (typeof p.audio === 'string') return p.audio
    return p.audio[lang]
  }, [lang])

  const onTimeUpdate = useCallback((e: Event) => {
    const audio = e.target as HTMLAudioElement
    if (audio.duration) setAudioProgress(audio.currentTime / audio.duration)
  }, [])

  const onPause = useCallback((e: Event) => {
    const audio = e.target as HTMLAudioElement
    if (audio.currentTime > 0 && audio.currentTime < audio.duration) pausedMidPlayRef.current = true
  }, [])

  const onEnded = useCallback(() => {
    setAudioProgress(1)
    if (currentPart < _totalParts - 1) {
      advanceTimer.current = setTimeout(() => {
        setCurrentPart(p => p + 1)
        setAnimating(true)
        setTimeout(() => setAnimating(false), 50)
      }, 1200)
    } else {
      setTimeout(() => setShowSummary(true), 1500)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPart, _totalParts])

  // Use refs for event handlers to avoid stale closure issues when removing listeners
  const onTimeUpdateRef = useRef(onTimeUpdate)
  const onEndedRef = useRef(onEnded)
  const onPauseRef = useRef(onPause)
  onTimeUpdateRef.current = onTimeUpdate
  onEndedRef.current = onEnded
  onPauseRef.current = onPause

  const destroyAudio = useCallback(() => {
    if (audioRef.current) {
      const audio = audioRef.current
      audio.pause()
      audio.removeEventListener('timeupdate', onTimeUpdateRef.current)
      audio.removeEventListener('ended', onEndedRef.current)
      audio.removeEventListener('pause', onPauseRef.current)
      audio.src = ''
      audioRef.current = null
    }
    clearAdvanceTimer()
    setAudioProgress(0)
    pausedMidPlayRef.current = false
  }, [clearAdvanceTimer])

  // 音频播放 effect（依赖 part/muted/showSummary/lang）
  useEffect(() => {
    if (loading || !_part || showSummary) { destroyAudio(); return }
    const src = getAudioSrc(_part)
    if (!src || muted) { destroyAudio(); return }
    if (audioRef.current && pausedMidPlayRef.current) {
      audioRef.current.play().catch(() => {})
      return
    }
    destroyAudio()
    const audio = new Audio(src)
    audioRef.current = audio
    audio.addEventListener('timeupdate', onTimeUpdateRef.current)
    audio.addEventListener('ended', onEndedRef.current)
    audio.addEventListener('pause', onPauseRef.current)
    audio.play().catch(() => {})
    return () => { destroyAudio() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_part, muted, showSummary, lang, loading, getAudioSrc, destroyAudio])

  const stopAudio = useCallback(() => { destroyAudio(); pausedMidPlayRef.current = false }, [destroyAudio])

  const handlePlay = useCallback(() => {
    if (showSummary || loading || !_part) return
    if (audioRef.current && pausedMidPlayRef.current) {
      audioRef.current.play().catch(() => {})
      setIsPlaying(true)
      return
    }
    const src = getAudioSrc(_part)
    if (!src) return
    destroyAudio()
    const audio = new Audio(src)
    audioRef.current = audio
    audio.addEventListener('timeupdate', onTimeUpdateRef.current)
    audio.addEventListener('ended', onEndedRef.current)
    audio.addEventListener('pause', onPauseRef.current)
    audio.play().catch(() => {})
    setIsPlaying(true)
    pausedMidPlayRef.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_part, showSummary, loading, getAudioSrc, destroyAudio])

  const handlePause = useCallback(() => {
    if (audioRef.current) audioRef.current.pause()
    setIsPlaying(false)
  }, [])

  const handleNext = useCallback(() => {
    if (showSummary || loading) return
    if (currentPart < _totalParts - 1) {
      stopAudio(); setCurrentPart(p => p + 1); setIsPlaying(true)
      setAnimating(true)
      setTimeout(() => setAnimating(false), 50)
    } else { setShowSummary(true) }
  }, [currentPart, _totalParts, showSummary, loading, stopAudio])

  const handlePrev = useCallback(() => {
    if (showSummary) {
      setShowSummary(false)
      return
    }
    if (currentPart > 0) {
      stopAudio(); setCurrentPart(p => p - 1); setIsPlaying(true)
      setAnimating(true)
      setTimeout(() => setAnimating(false), 50)
    }
  }, [currentPart, showSummary, stopAudio])

  // 键盘事件监听
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); handleNext() }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); handlePrev() }
    }
    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
    }
  }, [handleNext, handlePrev])

  const handleToggleMute = useCallback(() => {
    const next = !muted; setMuted(next)
    if (!next && audioRef.current && pausedMidPlayRef.current) audioRef.current.play().catch(() => {})
  }, [muted])

  const handleGoHome = useCallback(() => { stopAudio(); navigate('/social') }, [stopAudio, navigate])

  const handleSelectBook = useCallback((bookId: string) => {
    stopAudio(); setShowSummary(false); setCurrentPart(0); setIsPlaying(true)
    navigate(`/social/scene/${bookId}`)
  }, [stopAudio, navigate])

  const handlePrevBook = useCallback(() => {
    if (_currentIdx > 0) {
      const prevId = _currentCatalog[_currentIdx - 1].id
      stopAudio(); navigate(`/social/scene/${prevId}`)
    }
  }, [_currentIdx, stopAudio, navigate, _currentCatalog])

  const handleNextBook = useCallback(() => {
    if (_currentIdx < _currentCatalog.length - 1) {
      const nextId = _currentCatalog[_currentIdx + 1].id
      stopAudio(); navigate(`/social/scene/${nextId}`)
    }
  }, [_currentIdx, stopAudio, navigate, _currentCatalog])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }, [])
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartY.current) return
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dy) > 50) {
      if (dy < 0) handleNextBook()
      else handlePrevBook()
    }
    touchStartY.current = null
  }, [handlePrevBook, handleNextBook])

  // 图片位置计算
  useLayoutEffect(() => {
    const container = imageContainerRef.current
    if (!container) return
    const img = container.querySelector('img') as HTMLImageElement
    if (!img) return
    function calcOffset() {
      if (!container || !img || !img.naturalWidth) return
      const containerW = container.clientWidth
      const containerH = container.clientHeight
      const imgRatio = img.naturalWidth / img.naturalHeight
      const containerRatio = containerW / containerH
      let offset = 0
      if (imgRatio > containerRatio) {
        const displayH = containerW / imgRatio
        offset = (containerH - displayH) / 2
      }
      setImageTopOffset(offset)
    }
    calcOffset()
    window.addEventListener('resize', calcOffset)
    return () => window.removeEventListener('resize', calcOffset)
  })

  const goTo = useCallback((idx: number) => {
    if (idx < 0 || idx >= _totalParts) return
    stopAudio(); setCurrentPart(idx); setIsPlaying(true)
    setAnimating(true)
    setTimeout(() => setAnimating(false), 50)
  }, [_totalParts, stopAudio])

  const handleToggleLang = useCallback(() => {
    setLang(l => l === 'zh' ? 'en' : 'zh')
  }, [])

  // ===== Early returns 在所有 Hooks 之后 =====
  if (loading || !scenesData) {
    return (
      <div className="h-screen w-screen bg-cream flex items-center justify-center">
        <div className="text-bark/40 font-display">加载中...</div>
      </div>
    )
  }

  const scene = _scene!
  const carnegieCatalog = _carnegieCatalog
  const socialStoryCatalog = _socialStoryCatalog

  if (!scene) {
    return (
      <div className="h-screen w-screen bg-cream flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-bark/60 font-display">未找到该绘本</p>
          <button onClick={() => navigate('/social')} className="px-4 py-2 bg-forest text-white rounded-xl font-display">
            返回列表
          </button>
        </div>
      </div>
    )
  }

  const parts = _parts
  const part = _part
  const totalParts = _totalParts
  const currentCatalog = _currentCatalog
  const currentIdx = _currentIdx

  // ========== Summary view ==========
  const storyImages = parts.map((p) => p.image)

  // ========== Data for current part ==========
  const thoughts = part.thoughts ?? []
  const leftBubbles = thoughts.filter(t => t.character.includes('阿布'))
  const rightBubbles = thoughts.filter(t => !t.character.includes('阿布'))
  const allBubbles = [...leftBubbles, ...rightBubbles]
  const narrationMain = renderBilingual(part.narration, lang)

  // ========== Fixed layout dimensions（与原始完全一致）==========
  const LAYOUT_W = 960
  const LAYOUT_H = 560
  const THOUGHTS_W = 148
  const CONTROLS_W = 50
  const CONTENT_H = LAYOUT_H
  const IMAGE_W = LAYOUT_W - THOUGHTS_W - CONTROLS_W
  const IMAGE_H = CONTENT_H

  // ========== Fixed-layout Scene Page（与原始完全一致的渲染）==========
  return (
    <div
      className="h-screen w-screen bg-cream overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 竖屏提示遮罩 - 手机竖屏时显示 */}
      <div className="portrait-hint fixed inset-0 z-[100] bg-forest flex flex-col items-center justify-center text-white hidden">
        <div className="animate-bounce mb-4">
          <svg viewBox="0 0 24 24" className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M12 10v4M9 10l3-2 3 2" />
          </svg>
        </div>
        <p className="font-display text-lg font-bold mb-2">请横屏使用</p>
        <p className="text-white/60 text-sm">请将手机旋转 90 度以获得最佳体验</p>
      </div>

      <div className="fixed-layout-root w-full h-full flex items-center justify-center">
        <div
          className="fixed-layout-frame relative bg-cream"
          style={{ width: LAYOUT_W, height: LAYOUT_H }}
        >

          {/* ===== Top Navigation Bar ===== */}
          <div className="absolute left-0 right-0 h-12 bg-cream flex items-center gap-3 px-4 z-20"
            style={{ top: 8 }}>
            <button onClick={handleGoHome}
              className="w-9 h-9 rounded-xl bg-cream shadow-soft flex items-center justify-center hover:shadow-card transition-shadow"
              title="返回列表">
              <svg viewBox="0 0 20 20" className="w-5 h-5 text-bark" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
            </button>
            <h2 className="font-display text-base text-forest font-bold truncate flex-1">
              {scene?.title ?? ''}
            </h2>
          </div>

          {!showSummary && (<>
          {/* ===== Left: Thoughts ===== */}
          <div className="absolute overflow-y-auto bg-cream border-r border-bark/5 px-3 py-1"
            style={{
              top: 48 + imageTopOffset,
              left: 0,
              width: THOUGHTS_W,
            }}>
{allBubbles.length > 0 && allBubbles.map((b, i) => (
              <ThoughtBubbleCard key={`b-${i}`} thought={b} lang={lang} showDivider={i > 0} />
            ))}

            {/* Narration - below thoughts */}
            <div className="mt-3">
              <p className="text-[12px] text-bark/60 leading-relaxed">{narrationMain}</p>
            </div>
          </div>

          </>)}

          {!showSummary && (<>
          {/* ===== Center: Image ===== */}
          <div ref={imageContainerRef}
            className="absolute overflow-hidden bg-cream"
            style={{
              top: 48,
              left: THOUGHTS_W,
              width: IMAGE_W,
              height: IMAGE_H - 48,
            }}>
            <div className={`w-full h-full ${animating ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
              <img src={fixPath(part.image)} alt="" className="w-full h-full object-contain" />
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/10">
              <div className="h-full bg-forest/70 rounded-full transition-all duration-300"
                style={{ width: `${((currentPart + (audioProgress || 0)) / totalParts) * 100}%` }} />
            </div>
          </div>

          </>)}

          {/* ===== Summary Content（与原始完全一致）===== */}
          {showSummary && (
            <main className="absolute top-[68px] left-[8px] right-[58px] bottom-[8px] flex gap-3 items-start overflow-y-auto">
              {/* Left: story thumbnails (first half) */}
              <div className="w-44 flex-shrink-0 space-y-2">
                {storyImages.slice(0, Math.ceil(storyImages.length / 2)).map((src: string, i: number) => (
                  <button key={i} onClick={() => { setShowSummary(false); goTo(i) }}
                    className="w-full aspect-video rounded-xl overflow-hidden shadow-soft hover:shadow-card transition-all cursor-pointer animate-thumb-breathe">
                    <img src={fixPath(src)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              {/* Center: 也许这样更好 + 猫头鹰 + 再读一遍 */}
              <div className="flex-1 min-w-0">
                {scene?.summary?.socialSteps && (
                  <div className="mb-4">
                    <h4 className="font-display text-sm text-bark/60 mb-3">也许这样更好</h4>
                    <div className="space-y-2">
                      {scene.summary.socialSteps.map((step: string, i: number) => (
                        <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-3 shadow-soft">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-forest-light text-forest text-xs flex items-center justify-center font-bold">{i + 1}</span>
                          <p className="text-sm text-bark leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {parts[parts.length - 1]?.owlWisdom && (
                  <div className="bg-amber-50 rounded-2xl p-4 border-l-[3px] border-amber-400 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🦉</span>
                      <span className="font-display text-sm text-amber-700 font-bold">猫头鹰老师</span>
                    </div>
                    <p className="text-sm text-bark/70 leading-relaxed">
                      {renderBilingual(parts[parts.length - 1].owlWisdom!, lang)}
                    </p>
                  </div>
                )}
                <button onClick={() => { setShowSummary(false); setCurrentPart(0) }} className="w-full py-3 bg-forest text-white rounded-2xl font-display font-medium shadow-warm hover:shadow-float transition-shadow">再读一遍</button>
              </div>
              {/* Right: story thumbnails (second half) */}
              <div className="w-44 flex-shrink-0 space-y-2">
                {storyImages.slice(Math.ceil(storyImages.length / 2)).map((src: string, i: number) => (
                  <button key={i} onClick={() => { setShowSummary(false); goTo(i + Math.ceil(storyImages.length / 2)) }}
                    className="w-full aspect-video rounded-xl overflow-hidden shadow-soft hover:shadow-card transition-all cursor-pointer animate-thumb-breathe">
                    <img src={fixPath(src)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </main>
          )}

          {/* ===== Right: Controls（与原始完全一致）===== */}
          <div className="absolute bg-cream border-l border-bark/5 flex flex-col items-center py-2 px-0.5 z-10"
            style={{
              top: 48 + imageTopOffset,
              right: 0,
              width: CONTROLS_W,
              height: CONTENT_H - 48 - imageTopOffset,
            }}>
            {/* Book list */}
            <button onClick={() => setShowBookPicker(true)}
              className="w-10 h-8 rounded-lg bg-white shadow-soft flex items-center justify-center hover:bg-bark/5 transition-colors"
              title="绘本列表">
              <svg viewBox="0 0 20 20" className="w-4 h-4 text-bark/50" fill="currentColor"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/></svg>
            </button>

            {/* Book switch: up/down */}
            <div className="flex flex-col items-center gap-0.5 bg-white rounded-lg p-0.5 shadow-soft mt-2">
              <button onClick={handlePrevBook} disabled={currentIdx <= 0}
                className="w-9 h-7 rounded-md flex items-center justify-center disabled:opacity-20 hover:bg-bark/5 transition-colors"
                title="上一本">
                <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 text-bark/50" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
              </button>
              <div className="text-[9px] text-bark/40 font-medium tabular-nums">{currentIdx + 1}</div>
              <button onClick={handleNextBook} disabled={currentIdx >= currentCatalog.length - 1}
                className="w-9 h-7 rounded-md flex items-center justify-center disabled:opacity-20 hover:bg-bark/5 transition-colors"
                title="下一本">
                <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 text-bark/50" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>

            {/* Play/Pause */}
            <button onClick={isPlaying ? handlePause : handlePlay}
              className="w-10 h-10 rounded-xl bg-forest text-white flex items-center justify-center shadow-warm hover:bg-forest-dark active:scale-95 transition-all mt-3"
              title={isPlaying ? '暂停' : '播放'}>
              {isPlaying ? (
                <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              ) : (
                <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
              )}
            </button>

            {/* Part nav: left/right */}
            <div className="flex flex-col items-center gap-0.5 bg-white rounded-lg p-0.5 shadow-soft mt-3">
              <button onClick={handlePrev} disabled={currentPart === 0 && !showSummary}
                className="w-9 h-7 rounded-md flex items-center justify-center disabled:opacity-20 hover:bg-bark/5 transition-colors"
                title="上一页">
                <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 text-bark/50" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              </button>
              <div className="text-[9px] text-bark/40 font-medium tabular-nums">{showSummary ? '★' : `${currentPart + 1}/${totalParts}`}</div>
              {currentPart === totalParts - 1 ? (
                <button onClick={() => setShowSummary(true)}
                  className="w-9 h-7 rounded-md flex items-center justify-center hover:bg-bark/5 transition-colors"
                  title="总结">
                  <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 text-forest" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/></svg>
                </button>
              ) : (
                <button onClick={handleNext} disabled={currentPart === totalParts - 1 || showSummary}
                  className="w-9 h-7 rounded-md flex items-center justify-center disabled:opacity-20 hover:bg-bark/5 transition-colors"
                  title="下一页">
                  <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 text-bark/50" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                </button>
              )}
            </div>

            {/* Mute */}
            <button onClick={handleToggleMute}
              className="w-10 h-8 rounded-lg bg-white shadow-soft flex items-center justify-center hover:bg-bark/5 transition-colors mt-2"
              title={muted ? '取消静音' : '静音'}>
              {muted ? (
                <svg viewBox="0 0 20 20" className="w-4 h-4 text-bark/30" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              ) : (
                <svg viewBox="0 0 20 20" className="w-4 h-4 text-bark/50" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" /></svg>
              )}
            </button>

            {/* EN/中 toggle */}
            <button onClick={handleToggleLang}
              className="w-10 h-7 rounded-lg bg-white shadow-soft flex items-center justify-center hover:bg-bark/5 transition-colors text-[11px] font-medium text-forest mt-1"
              title="切换语言">
              {lang === 'zh' ? 'EN' : '中'}
            </button>
          </div>

        </div>
      </div>

      {/* Book Picker Modal */}
      {showBookPicker && (
        <BookPicker
          currentId={id ?? 'social-01'}
          carnegieCatalog={carnegieCatalog}
          socialStoryCatalog={socialStoryCatalog}
          onSelect={handleSelectBook}
          onClose={() => setShowBookPicker(false)}
        />
      )}

      {/* ========== Responsive scaling =========== */}
      <style>{`
        @keyframes thumb-breathe {
          0%, 100% { transform: scale(1); box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
          50% { transform: scale(1.03); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        }
        .animate-thumb-breathe {
          animation: thumb-breathe 3s ease-in-out infinite;
        }
        .animate-thumb-breathe:nth-child(2) { animation-delay: 0.5s; }
        .animate-thumb-breathe:nth-child(3) { animation-delay: 1s; }
        .animate-thumb-breathe:nth-child(4) { animation-delay: 1.5s; }
        .animate-thumb-breathe:nth-child(5) { animation-delay: 2s; }
        .animate-thumb-breathe:nth-child(6) { animation-delay: 2.5s; }
        .fixed-layout-root {
          perspective: 1000px;
        }
        .fixed-layout-frame {
          transform-origin: center center;
        }
        /* 桌面端 / 手机横屏：正常显示 */
        @media (orientation: landscape) {
          .fixed-layout-frame {
            width: min(960px, 100vw);
            height: min(560px, 100vh);
          }
          .portrait-hint { display: none !important; }
        }
        /* 手机竖屏：显示横屏提示 */
        @media (orientation: portrait) and (max-width: 768px) {
          .portrait-hint { display: flex !important; }
          .fixed-layout-frame {
            display: none;
          }
        }
        /* iPad 竖屏：允许使用，但缩小适配 */
        @media (orientation: portrait) and (min-width: 769px) {
          .portrait-hint { display: none !important; }
          .fixed-layout-frame {
            width: min(960px, 100vw);
            height: min(560px, 100vh * 960 / 560);
            transform: scale(min(1, 100vw / 960));
          }
        }
      `}</style>

    </div>
  )
}
