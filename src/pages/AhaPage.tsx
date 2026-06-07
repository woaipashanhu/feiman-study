/**
 * ============================================================
 *  AhaPage — 啊哈时刻主页面 (V4)
 *
 *  功能:
 *    1. 顶部 Tab: 文字 / 录音
 *    2. 文字模式: textarea + 写 + 保存(选 cloud/local)
 *    3. 录音模式: 录音按钮 + 录音中(音量条 + 倒计时) + 录音完播放/重录/保存
 *    4. 列表: 倒序显示所有 moments
 *    5. 长按 / 点击 删除
 *
 *  设计: 紧凑"灵感便签"风,3 秒完成一次记录
 * ============================================================
 */
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Microphone, Stop, PaperPlaneTilt, FloppyDisk, Trash, CloudArrowUp, DeviceMobile, Play, Pause, PencilSimple } from 'phosphor-react'
import { useAudioRecorder, saveAudioToLocalDB, getAudioFromLocalDB } from '@/shared/hooks/useAudioRecorder'
import { useAuth } from '@/shared/hooks/useAuth'
import { LETTER_PALETTE } from '@/shared/components/LetterPaper/palette'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher'

interface AhaMoment {
  id: string
  type: 'text' | 'audio'
  content: string | null
  audioUrl: string | null
  audioKey: string | null
  audioDurationMs: number | null
  storage: 'cloud' | 'local'
  tags: string | null
  mood: string | null
  createdAt: number
  updatedAt: number
}

type Tab = 'text' | 'audio'
type Storage = 'cloud' | 'local'

export default function AhaPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [tab, setTab] = useState<Tab>('text')
  const [storage, setStorage] = useState<Storage>('cloud')
  const [text, setText] = useState('')
  const [tags, setTags] = useState('')
  const [mood, setMood] = useState('💡')
  const [moments, setMoments] = useState<AhaMoment[]>([])
  const [total, setTotal] = useState(0)
  const [saving, setSaving] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const recorder = useAudioRecorder()

  // 加载列表
  const loadMoments = async () => {
    if (!isAuthenticated) return
    try {
      const res = await fetch('/api/aha/moments?limit=100', {
        headers: { Authorization: `Bearer ${localStorage.getItem('feiman_auth_access') || ''}` },
      })
      const data = await res.json()
      if (data.ok) {
        setMoments(data.moments)
        setTotal(data.total)
      }
    } catch (err) {
      console.warn('Failed to load aha moments', err)
    }
  }

  useEffect(() => {
    loadMoments()
  }, [isAuthenticated])

  // 保存文字
  const saveText = async () => {
    if (!text.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/aha/moments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('feiman_auth_access') || ''}`,
        },
        body: JSON.stringify({
          type: 'text',
          content: text.trim(),
          storage,
          tags: tags || undefined,
          mood,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setText('')
        setTags('')
        loadMoments()
      } else {
        alert(data.message || '保存失败')
      }
    } catch (err: any) {
      alert('保存失败:' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // 保存录音
  const saveAudio = async () => {
    if (!recorder.result) return
    setSaving(true)
    try {
      let audioUrl: string | undefined
      let localKey: string | undefined

      if (storage === 'cloud') {
        // 上传到后端(走 StorageProvider)
        const form = new FormData()
        form.append('file', recorder.result.blob, `aha.${recorder.result.mimeType.split('/')[1]}`)
        form.append('storage', 'cloud')
        const res = await fetch('/api/aha/upload-audio', {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('feiman_auth_access') || ''}` },
          body: form,
        })
        const data = await res.json()
        if (!data.ok) {
          alert('上传失败:' + (data.message || 'unknown'))
          setSaving(false)
          return
        }
        audioUrl = data.url
      } else {
        // 本地存到 IndexedDB
        localKey = `aha-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        await saveAudioToLocalDB(localKey, recorder.result.blob)
      }

      // 创建 moment
      const res = await fetch('/api/aha/moments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('feiman_auth_access') || ''}`,
        },
        body: JSON.stringify({
          type: 'audio',
          audioUrl,
          audioKey: localKey,
          audioDurationMs: recorder.result.durationMs,
          storage,
          tags: tags || undefined,
          mood,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setTags('')
        recorder.reset()
        loadMoments()
      } else {
        alert(data.message || '保存失败')
      }
    } catch (err: any) {
      alert('保存失败:' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // 删除
  const deleteMoment = async (id: string) => {
    if (!confirm('确定要删除这条啊哈时刻吗?')) return
    try {
      await fetch(`/api/aha/moments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('feiman_auth_access') || ''}` },
      })
      loadMoments()
    } catch (err) {
      console.warn(err)
    }
  }

  // 播放音频
  const playAudio = async (m: AhaMoment) => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (playingId === m.id) {
      setPlayingId(null)
      return
    }
    let url = m.audioUrl
    if (m.storage === 'local' && m.audioKey) {
      const blob = await getAudioFromLocalDB(m.audioKey)
      if (blob) url = URL.createObjectURL(blob)
      else {
        alert('本地音频丢失,可能清过浏览器数据')
        return
      }
    }
    if (!url) return
    const audio = new Audio(url)
    audio.onended = () => setPlayingId(null)
    audio.play()
    audioRef.current = audio
    setPlayingId(m.id)
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    const m = d.getMonth() + 1
    const day = d.getDate()
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${m}/${day} ${hh}:${mm}`
  }

  if (!isAuthenticated) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6" style={{ backgroundColor: LETTER_PALETTE.ivory }}>
        <p className="text-text-secondary text-sm mb-4">登录后才能记录啊哈时刻</p>
        <button onClick={() => navigate('/auth')} className="px-5 py-2.5 rounded-2xl bg-brand text-white text-sm font-semibold">
          去登录
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: LETTER_PALETTE.ivory }}>
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-4 pb-3 shrink-0">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/80 border border-black/5 flex items-center justify-center shadow-sm"
        >
          <ArrowLeft size={18} weight="regular" className="text-text" />
        </motion.button>
        <h1 className="font-semibold text-text text-base" style={{ fontFamily: '"Noto Serif SC","Songti SC",serif' }}>
          啊哈时刻
        </h1>
        <div className="flex-1" />
        <LanguageSwitcher />
      </header>

      {/* Tab 切换 */}
      <div className="px-4 pb-3">
        <div className="relative flex p-1 rounded-2xl bg-black/5">
          {(['text', 'audio'] as Tab[]).map((tt) => (
            <button
              key={tt}
              onClick={() => { setTab(tt); recorder.reset() }}
              className="relative flex-1 py-2 text-[13px] font-medium z-10 transition-colors"
              style={{ color: tab === tt ? '#1A1D2B' : 'rgba(26,29,43,0.55)' }}
            >
              {tab === tt && (
                <motion.div
                  layoutId="aha-tab"
                  className="absolute inset-0 rounded-xl bg-white shadow-sm"
                  style={{ zIndex: -1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <span className="inline-flex items-center gap-1.5">
                {tt === 'text' ? <PencilSimple size={14} /> : <Microphone size={14} weight="fill" />}
                {tt === 'text' ? '写' : '录'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 输入区 */}
      <div className="px-4 pb-3">
        <AnimatePresence mode="wait">
          {tab === 'text' ? (
            <motion.div
              key="text"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-white/80 rounded-2xl border border-black/5 p-4 shadow-sm"
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 2000))}
                placeholder="此刻的灵感、念头、顿悟…"
                className="w-full h-32 bg-transparent outline-none resize-none text-sm text-text placeholder:text-text-tertiary"
                autoFocus
              />
              <div className="flex items-center justify-between mt-2 text-xs text-text-tertiary">
                <span>{text.length} / 2000</span>
                <StorageToggle storage={storage} onChange={setStorage} />
              </div>
              <div className="flex items-center gap-2 mt-3">
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="标签(逗号分隔)"
                  className="flex-1 px-3 py-2 rounded-xl bg-black/5 text-[12px] outline-none"
                />
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="px-2 py-2 rounded-xl bg-black/5 text-[16px] outline-none"
                >
                  {['💡', '❤️', '🌱', '⚡', '🔭', '🎯', '🌀', '✨'].map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={saveText}
                  disabled={!text.trim() || saving}
                  className="px-4 py-2 rounded-xl bg-brand text-white text-[12px] font-semibold disabled:opacity-40 inline-flex items-center gap-1.5"
                >
                  {saving ? '保存中…' : <><PaperPlaneTilt size={14} weight="fill" />保存</>}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="audio"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-white/80 rounded-2xl border border-black/5 p-6 shadow-sm"
            >
              {/* 录音 UI */}
              <div className="flex flex-col items-center">
                {recorder.state.status === 'idle' && !recorder.result && (
                  <>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={recorder.start}
                      className="w-20 h-20 rounded-full bg-[#C73E3A] text-white shadow-lg flex items-center justify-center"
                    >
                      <Microphone size={32} weight="fill" />
                    </motion.button>
                    <p className="text-xs text-text-tertiary mt-3">点一下开始录音</p>
                  </>
                )}

                {recorder.state.status === 'permission' && (
                  <p className="text-sm text-text-secondary">请求麦克风权限…</p>
                )}

                {recorder.state.status === 'error' && (
                  <p className="text-sm text-red-500">错误:{recorder.state.errorMessage}</p>
                )}

                {recorder.state.status === 'recording' && (
                  <>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={recorder.stop}
                      className="w-20 h-20 rounded-full bg-[#C73E3A] text-white shadow-lg flex items-center justify-center"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Stop size={32} weight="fill" />
                    </motion.button>
                    <p className="text-sm text-text font-mono mt-3">
                      {Math.floor(recorder.state.durationMs / 1000)}s / {recorder.maxDurationMs / 1000}s
                    </p>
                    {/* 音量条 */}
                    <div className="w-32 h-1.5 bg-black/10 rounded-full overflow-hidden mt-2">
                      <motion.div
                        className="h-full bg-[#C73E3A]"
                        animate={{ width: `${recorder.state.level * 100}%` }}
                        transition={{ duration: 0.05 }}
                      />
                    </div>
                  </>
                )}

                {recorder.state.status === 'stopped' && recorder.result && (
                  <div className="w-full">
                    <div className="flex items-center justify-center gap-4 mb-3">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={recorder.start}
                        className="px-3 py-1.5 rounded-xl bg-black/5 text-text text-[12px]"
                      >
                        重录
                      </motion.button>
                      <span className="text-xs text-text-tertiary">
                        {Math.floor(recorder.result.durationMs / 1000)}s · {Math.round(recorder.result.blob.size / 1024)}KB
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="标签"
                        className="flex-1 px-3 py-2 rounded-xl bg-black/5 text-[12px] outline-none"
                      />
                      <select
                        value={mood}
                        onChange={(e) => setMood(e.target.value)}
                        className="px-2 py-2 rounded-xl bg-black/5 text-[16px] outline-none"
                      >
                        {['💡', '❤️', '🌱', '⚡', '🔭', '🎯', '🌀', '✨'].map((e) => (
                          <option key={e} value={e}>{e}</option>
                        ))}
                      </select>
                      <StorageToggle storage={storage} onChange={setStorage} />
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={saveAudio}
                        disabled={saving}
                        className="px-3 py-2 rounded-xl bg-brand text-white text-[12px] font-semibold disabled:opacity-40 inline-flex items-center gap-1"
                      >
                        {saving ? '保存中…' : <><FloppyDisk size={14} weight="fill" />保存</>}
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <h2 className="text-xs font-semibold text-text-tertiary mb-2 mt-2">
          {total > 0 ? `${total} 条记录` : '还没有记录'}
        </h2>
        {moments.map((m) => (
          <MomentCard
            key={m.id}
            moment={m}
            isPlaying={playingId === m.id}
            onPlay={() => playAudio(m)}
            onDelete={() => deleteMoment(m.id)}
            formatTime={formatTime}
          />
        ))}
      </div>
    </div>
  )
}

function StorageToggle({ storage, onChange }: { storage: Storage; onChange: (s: Storage) => void }) {
  return (
    <div className="flex rounded-xl bg-black/5 p-0.5 text-[11px]">
      <button
        onClick={() => onChange('cloud')}
        className={`px-2 py-1 rounded-lg inline-flex items-center gap-1 ${storage === 'cloud' ? 'bg-white shadow-sm' : 'text-text-tertiary'}`}
      >
        <CloudArrowUp size={11} weight="fill" />云
      </button>
      <button
        onClick={() => onChange('local')}
        className={`px-2 py-1 rounded-lg inline-flex items-center gap-1 ${storage === 'local' ? 'bg-white shadow-sm' : 'text-text-tertiary'}`}
      >
        <DeviceMobile size={11} weight="fill" />本地
      </button>
    </div>
  )
}

function MomentCard({ moment: m, isPlaying, onPlay, onDelete, formatTime }: {
  moment: AhaMoment
  isPlaying: boolean
  onPlay: () => void
  onDelete: () => void
  formatTime: (ts: number) => string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 rounded-2xl border border-black/5 p-3 mb-2 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0">{m.mood || '💡'}</span>
        <div className="flex-1 min-w-0">
          {m.type === 'text' && (
            <p className="text-sm text-text whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
          )}
          {m.type === 'audio' && (
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onPlay}
                className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center shrink-0"
              >
                {isPlaying ? <Pause size={14} weight="fill" /> : <Play size={14} weight="fill" />}
              </motion.button>
              <div className="flex-1">
                <p className="text-xs text-text-tertiary">
                  🎤 {m.audioDurationMs ? `${Math.floor(m.audioDurationMs / 1000)}s` : '录音'}
                </p>
                {m.storage === 'cloud' ? (
                  <p className="text-[10px] text-text-tertiary">☁️ 云端</p>
                ) : (
                  <p className="text-[10px] text-text-tertiary">📱 仅本机</p>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-text-tertiary">{formatTime(m.createdAt)}</span>
            {m.tags && (
              <div className="flex gap-1">
                {m.tags.split(',').slice(0, 3).map((t) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 text-text-secondary">
                    {t.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onDelete}
          className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center shrink-0"
        >
          <Trash size={14} className="text-text-tertiary" />
        </motion.button>
      </div>
    </motion.div>
  )
}
