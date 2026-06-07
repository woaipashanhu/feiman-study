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
import { ArrowLeft, Microphone, Stop, PaperPlaneTilt, FloppyDisk, Trash, CloudArrowUp, DeviceMobile, Play, Pause, PencilSimple, MagnifyingGlass, X, DownloadSimple, UploadSimple, ChartBar } from 'phosphor-react'
import { useAudioRecorder, saveAudioToLocalDB, getAudioFromLocalDB } from '@/shared/hooks/useAudioRecorder'
import { useReminder } from '@/shared/hooks/useReminder'
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
  // V4.1: 搜索 + 筛选
  const [searchQ, setSearchQ] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'text' | 'audio'>('all')
  const [filterMood, setFilterMood] = useState<string | null>(null)
  // V4.6: 统计
  const [stats, setStats] = useState<AhaStats | null>(null)
  const [showStats, setShowStats] = useState(false)
  // V4.7: 每日提醒
  const reminder = useReminder()
  const [saving, setSaving] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const recorder = useAudioRecorder()

  // 加载列表
  const loadMoments = async () => {
    if (!isAuthenticated) return
    try {
      const params = new URLSearchParams({ limit: '200' })
      if (searchQ.trim()) params.set('q', searchQ.trim())
      if (filterType !== 'all') params.set('type', filterType)
      if (filterMood) params.set('mood', filterMood)
      const res = await fetch(`/api/aha/moments?${params}`, {
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
  }, [isAuthenticated, searchQ, filterType, filterMood])

  // V4.6: 加载统计
  const loadStats = async () => {
    if (!isAuthenticated) return
    try {
      const res = await fetch('/api/aha/stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('feiman_auth_access') || ''}` },
      })
      const data = await res.json()
      if (data.ok) setStats(data)
    } catch {}
  }

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

  // V4.5: aha → letter 一键转公开
  const promoteToLetter = async (ahaId: string) => {
    if (!confirm('这条啊哈时刻会转成公开小纸条,确认吗?')) return
    try {
      const res = await fetch(`/api/aha/moments/${ahaId}/promote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('feiman_auth_access') || ''}` },
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.letterId) {
          alert('已经转过了,跳到小纸条查看')
          navigate(`/letters/letter/${data.letterId}`)
          return
        }
        alert(data.message || '转公开失败')
        return
      }
      alert('已转成公开小纸条!')
      navigate(`/letters/letter/${data.letterId}`)
    } catch (err: any) {
      alert('失败:' + err.message)
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

  // V4.4: 导出 JSON 备份
  const exportJson = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      total,
      moments,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aha-moments-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // V4.4: 导入 JSON 备份
  const importJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (!data.moments || !Array.isArray(data.moments)) {
          alert('JSON 格式错误:缺少 moments 数组')
          return
        }
        if (!confirm(`导入 ${data.moments.length} 条记录?(重复 ID 会被跳过)`)) return
        let imported = 0
        for (const m of data.moments) {
          const res = await fetch('/api/aha/moments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('feiman_auth_access') || ''}`,
            },
            body: JSON.stringify({
              type: m.type,
              content: m.content,
              audioUrl: m.audioUrl,
              audioKey: m.audioKey,
              audioDurationMs: m.audioDurationMs,
              storage: m.storage || 'cloud',
              tags: m.tags,
              mood: m.mood,
            }),
          })
          if (res.ok) imported++
        }
        alert(`导入完成:${imported}/${data.moments.length} 条`)
        loadMoments()
      } catch (err: any) {
        alert('JSON 解析失败:' + err.message)
      }
    }
    reader.readAsText(file)
  }

  if (!isAuthenticated) {
    return (
      <div className="h-full flex flex-col" style={{ backgroundColor: LETTER_PALETTE.ivory }}>
        {/* NavBar — 跟登录态保持一致 */}
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
        {/* 空状态: 居中 + 充足留白 */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-brand-soft flex items-center justify-center mb-6">
            <Microphone size={32} weight="regular" className="text-brand" />
          </div>
          <p className="text-text text-base font-medium mb-2">记录你每一次"啊哈"</p>
          <p className="text-text-secondary text-sm mb-6 max-w-[280px]">
            登录后,你可以用文字或录音抓住每一个闪现的灵感,云端或本地,任你选。
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="px-6 py-3 rounded-2xl bg-brand text-white text-sm font-semibold shadow-warm active:scale-95 transition-transform"
          >
            去登录
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <AnimatePresence>
          {showStats && stats && (
            <StatsPanel stats={stats} onClose={() => setShowStats(false)} reminder={reminder} />
          )}
      </AnimatePresence>
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
        {/* V4.6 统计按钮 */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { setShowStats(true); loadStats() }}
          className="w-10 h-10 rounded-full bg-white/80 border border-black/5 flex items-center justify-center shadow-sm"
          aria-label="统计"
        >
          <ChartBar size={18} weight="regular" className="text-text" />
        </motion.button>
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
                    {/* V4.3 实时波形 */}
                    <div className="w-48 mt-2">
                      <Waveform active peaks={recorder.peaks} />
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
                    {/* V4.3 静态波形(录音完回看) */}
                    <div className="w-full mb-3">
                      <Waveform blob={recorder.result.blob} />
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

      {/* 搜索 + 筛选 */}
      <div className="px-4 pb-3 space-y-2">
        {/* 搜索框 */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 border border-black/5">
          <MagnifyingGlass size={14} className="text-text-tertiary shrink-0" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="搜索内容或标签…"
            className="flex-1 bg-transparent outline-none text-[13px] text-text placeholder:text-text-tertiary"
          />
          {searchQ && (
            <button onClick={() => setSearchQ('')} className="text-text-tertiary">
              <X size={14} />
            </button>
          )}
        </div>
        {/* 筛选 chips: 全部/文字/录音 */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <FilterChip active={filterType === 'all'} onClick={() => setFilterType('all')} label="全部" />
          <FilterChip active={filterType === 'text'} onClick={() => setFilterType('text')} label="文字" />
          <FilterChip active={filterType === 'audio'} onClick={() => setFilterType('audio')} label="录音" />
          <div className="w-px h-4 bg-black/10 mx-1" />
          {/* 心情 emoji chips */}
          {['💡', '❤️', '🌱', '⚡', '🔭', '🎯', '🌀', '✨'].map((emoji) => (
            <FilterChip
              key={emoji}
              active={filterMood === emoji}
              onClick={() => setFilterMood(filterMood === emoji ? null : emoji)}
              label={emoji}
            />
          ))}
          {(filterType !== 'all' || filterMood || searchQ) && (
            <button
              onClick={() => { setFilterType('all'); setFilterMood(null); setSearchQ('') }}
              className="ml-1 text-[11px] text-text-tertiary underline shrink-0"
            >
              清空
            </button>
          )}
        </div>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="flex items-center justify-between mb-2 mt-2">
          <h2 className="text-xs font-semibold text-text-tertiary">
            {total > 0 ? `${total} 条记录` : '还没有记录'}
          </h2>
          {total > 0 && (
            <div className="flex items-center gap-3">
              <label className="text-[11px] text-text-tertiary inline-flex items-center gap-1 cursor-pointer">
                <UploadSimple size={12} />导入
                <input type="file" accept="application/json" onChange={importJson} className="hidden" />
              </label>
              <button
                onClick={exportJson}
                className="text-[11px] text-text-tertiary inline-flex items-center gap-1"
                title="导出 JSON 备份"
              >
                <DownloadSimple size={12} />导出
              </button>
            </div>
          )}
        </div>
        {moments.map((m) => (
          <MomentCard
            key={m.id}
            moment={m}
            isPlaying={playingId === m.id}
            onPlay={() => playAudio(m)}
            onDelete={() => deleteMoment(m.id)}
            onPromote={() => promoteToLetter(m.id)}
            formatTime={formatTime}
          />
         ))}
      </div>
      </div>
    </>
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

function MomentCard({ moment: m, isPlaying, onPlay, onDelete, onPromote, formatTime }: {
  moment: AhaMoment
  isPlaying: boolean
  onPlay: () => void
  onDelete: () => void
  onPromote: () => void
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
        <div className="flex flex-col items-center gap-1 shrink-0">
          {m.type === 'text' && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onPromote}
              className="w-7 h-7 rounded-full bg-[#C73E3A]/10 flex items-center justify-center"
              title="转成公开小纸条"
            >
              <PaperPlaneTilt size={14} weight="fill" style={{ color: '#C73E3A' }} />
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onDelete}
            className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center"
          >
            <Trash size={14} className="text-text-tertiary" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}


// =============== V4.1 FilterChip ===============
function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  const cls = `px-2.5 py-1 rounded-full text-[12px] font-medium shrink-0 transition-colors ${
    active ? 'bg-brand text-white' : 'bg-white/80 border border-black/5 text-text-secondary'
  }`
  return (
    <button
      onClick={onClick}
      className={cls}
    >
      {label}
    </button>
  )
}

// =============== V4.1 波形可视化 ===============
function Waveform({ active, blob, peaks: livePeaks, height = 32 }: { active?: boolean; blob?: Blob | null; peaks?: number[]; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [blobPeaks, setBlobPeaks] = useState<number[]>([])

  // 录音停止后解码 blob 画静态波形
  useEffect(() => {
    if (!blob) {
      setBlobPeaks([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const arrayBuf = await blob.arrayBuffer()
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const audioBuf = await audioCtx.decodeAudioData(arrayBuf.slice(0))
        const data = audioBuf.getChannelData(0)
        const samples = 80
        const blockSize = Math.floor(data.length / samples)
        const out: number[] = []
        for (let i = 0; i < samples; i++) {
          let max = 0
          for (let j = 0; j < blockSize; j++) {
            const v = Math.abs(data[i * blockSize + j] || 0)
            if (v > max) max = v
          }
          out.push(max)
        }
        if (!cancelled) setBlobPeaks(out)
        audioCtx.close()
      } catch {}
    })()
    return () => { cancelled = true }
  }, [blob])

  // 录音中实时画波形(livePeaks 来自 recorder)
  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#C73E3A'
    const p = livePeaks || []
    const barWidth = w / Math.max(p.length, 1)
    for (let i = 0; i < p.length; i++) {
      const barH = p[i] * h * 0.8
      const x = i * barWidth
      ctx.fillRect(x, (h - barH) / 2, barWidth - 1, barH)
    }
  }, [active, livePeaks])

  if (active) {
    return (
      <div className="w-full bg-black/5 rounded-lg overflow-hidden" style={{ height }}>
        <canvas ref={canvasRef} width={300} height={height * 2} className="w-full h-full" />
      </div>
    )
  }
  if (blobPeaks.length > 0) {
    return <StaticWaveform peaks={blobPeaks} height={height} />
  }
  return (
    <div className="w-full bg-black/5 rounded-lg overflow-hidden flex items-center justify-center text-[10px] text-text-tertiary" style={{ height }}>
      🎤
    </div>
  )
}

function StaticWaveform({ peaks, height }: { peaks: number[]; height: number }) {
  return (
    <div className="w-full h-full flex items-center justify-around px-1">
      {peaks.map((p, i) => (
        <div
          key={i}
          className="bg-[#C73E3A]/60 rounded-sm"
          style={{ width: 2, height: Math.max(2, p * height * 0.85) }}
        />
      ))}
    </div>
  )
}


// =============== V4.6 统计面板 ===============

interface AhaStats {
  total: number
  byMood: Record<string, number>
  byType: Record<string, number>
  byStorage: Record<string, number>
  byDay: { date: string; count: number }[]
}

const MOOD_COLORS: Record<string, string> = {
  '💡': '#FFB800',
  '❤️': '#FF4F6D',
  '🌱': '#52C41A',
  '⚡': '#FFC53D',
  '🔭': '#722ED1',
  '🎯': '#1890FF',
  '🌀': '#13C2C2',
  '✨': '#F5222D',
}

function StatsPanel({ stats, onClose, reminder }: { stats: AhaStats; onClose: () => void; reminder: ReturnType<typeof useReminder> }) {
  const maxDay = Math.max(...stats.byDay.map((d) => d.count), 1)
  const totalMood = Object.values(stats.byMood).reduce((a, b) => a + b, 0) || 1

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/30 flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#FAF7F2] rounded-t-3xl max-h-[80vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-[#FAF7F2]/95 backdrop-blur px-5 pt-4 pb-3 flex items-center justify-between border-b border-black/5">
          <h2 className="text-lg font-semibold text-text" style={{ fontFamily: '"Noto Serif SC","Songti SC",serif' }}>
            灵感统计
          </h2>
          <button onClick={onClose} className="text-text-tertiary text-sm">
            关闭
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* 4 个统计卡片 */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="总数" value={stats.total} color="#1A1D2B" />
            <StatCard label="文字" value={stats.byType.text || 0} color="#4F6EF7" />
            <StatCard label="录音" value={stats.byType.audio || 0} color="#00C9A7" />
            <StatCard label="云端/本地" value={`${stats.byStorage.cloud || 0}/${stats.byStorage.local || 0}`} color="#FF9F43" />
          </div>

          {/* 心情饼图 */}
          {Object.keys(stats.byMood).length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-text mb-3">心情分布</h3>
              <div className="space-y-2">
                {Object.entries(stats.byMood)
                  .sort((a, b) => b[1] - a[1])
                  .map(([mood, count]) => {
                    const pct = Math.round((count / totalMood) * 100)
                    return (
                      <div key={mood} className="flex items-center gap-2">
                        <span className="text-lg w-6">{mood}</span>
                        <div className="flex-1 h-6 bg-black/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: MOOD_COLORS[mood] || '#888' }}
                          />
                        </div>
                        <span className="text-xs text-text-tertiary tabular-nums w-12 text-right">
                          {count} · {pct}%
                        </span>
                      </div>
                    )
                  })}
              </div>
            </section>
          )}

          {/* 30 天柱状图 */}
          {stats.byDay.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-text mb-3">最近 30 天</h3>
              <div className="flex items-end gap-[2px] h-24">
                {stats.byDay.map((d) => {
                  const h = (d.count / maxDay) * 100
                  return (
                    <div
                      key={d.date}
                      className="flex-1 rounded-t-sm"
                      style={{
                        backgroundColor: d.count > 0 ? '#C73E3A' : 'rgba(0,0,0,0.06)',
                        height: `${Math.max(h, 4)}%`,
                      }}
                      title={`${d.date} · ${d.count} 条`}
                    />
                  )
                })}
              </div>
              <div className="flex justify-between text-[10px] text-text-tertiary mt-1">
                <span>{stats.byDay[0]?.date.slice(5)}</span>
                <span>{stats.byDay[15]?.date.slice(5)}</span>
                <span>{stats.byDay[29]?.date.slice(5)}</span>
              </div>
            </section>
          )}

          {stats.total === 0 && (
            <p className="text-center text-text-tertiary text-sm py-8">还没有记录,先去记录第一条灵感吧</p>
          )}

          {/* V4.7 每日提醒设置 */}
          <section className="pt-2 border-t border-black/5">
            <h3 className="text-sm font-semibold text-text mb-3">每日提醒</h3>
            <div className="flex items-center justify-between bg-white rounded-2xl p-3 border border-black/5">
              <div className="flex-1">
                <p className="text-sm text-text">每天提醒我记录灵感</p>
                <p className="text-[10px] text-text-tertiary mt-0.5">
                  PWA 通知(需浏览器授权)
                </p>
              </div>
              <div className="flex items-center gap-2">
                {reminder.enabled && (
                  <input
                    type="time"
                    value={reminder.time}
                    onChange={(e) => reminder.setTime(e.target.value)}
                    className="px-2 py-1 rounded-lg bg-black/5 text-[12px] outline-none"
                  />
                )}
                <button
                  onClick={() => reminder.setEnabled(!reminder.enabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    reminder.enabled ? 'bg-brand' : 'bg-black/15'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      reminder.enabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
            {reminder.enabled && (
              <button
                onClick={reminder.testNow}
                className="mt-2 w-full py-2 rounded-xl bg-black/5 text-text text-[12px] font-medium"
              >
                立即测试通知
              </button>
            )}
          </section>
        </div>
      </motion.div>
    </motion.div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-black/5">
      <p className="text-[11px] text-text-tertiary mb-1">{label}</p>
      <p className="text-2xl font-bold tabular-nums" style={{ color }}>
        {value}
      </p>
    </div>
  )
}
