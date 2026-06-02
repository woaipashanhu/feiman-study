/**
 * ============================================================
 *  ProfileDrawer — 个人中心侧边栏
 *
 *  架构设计：ARCHITECTURE.md §七.3 + ADR-6
 * ============================================================
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChartBar, Gift, PencilSimpleLine, Medal, BookOpen, X,
  ArrowClockwise, FloppyDisk, CheckCircle, ChatCircleText,
  CaretUp, CaretDown, Sun, Moon, PaperPlaneRight
} from 'phosphor-react'
import type { AchievementState, LearningRecord } from '../../hooks/useLearningTracker'
import { getRandomQuote, type DailyQuote } from '../../utils/dailyQuotes'
import { useMoodTracker, type MoodEmoji } from '../../hooks/useMoodTracker'
import { useFeedback } from '../../hooks/useFeedback'
import type { FeedbackCategory } from '../../hooks/useFeedback'
import { useTheme } from '../../hooks/useTheme'

interface ProfileDrawerProps {
  todayStats?: {
    contentCount: number
    totalDuration: number
    streakDays: number
  }
  achievement?: AchievementState
  dailyQuote?: DailyQuote
  recentRecords?: LearningRecord[]
  isOpen?: boolean
  onClose: () => void
}

const BOARD_NAMES: Record<string, string> = {
  math: '数学课',
  science: '科学',
  social: '社交训练',
  gallery: '画廊',
  neimen: '内功养生',
}

export function ProfileDrawer({
  todayStats,
  achievement,
  dailyQuote,
  recentRecords = [],
  onClose,
}: ProfileDrawerProps) {
  const [moodText, setMoodText] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState<MoodEmoji | ''>('')
  const [saved, setSaved] = useState(false)
  const [quote, setQuote] = useState(dailyQuote)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const { submitFeedback, feedbackCategories } = useFeedback()
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategory>('suggestion')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  const { isDark, toggleDark } = useTheme()
  const { getTodayMood, saveMood, getRecentMoods, MOOD_OPTIONS } = useMoodTracker()

  useEffect(() => {
    const todayMood = getTodayMood()
    if (todayMood) {
      setMoodText(todayMood.text)
      setSelectedEmoji(todayMood.emoji)
      setSaved(true)
    }
  }, [getTodayMood])

  const stats = todayStats || { contentCount: 0, totalDuration: 0, streakDays: 0 }
  const ach = achievement || {
    totalLearned: 0, totalDuration: 0, streakDays: 0,
    stars: 0, badges: [], lastLearnDate: '',
  }
  const currentQuote = quote || { text: '每天进步一点点，一年后你会感谢今天的自己。', author: '' }

  const handleRefreshQuote = () => setQuote(getRandomQuote())

  const handleSaveMood = () => {
    if (!moodText.trim() || !selectedEmoji) return
    saveMood(moodText.trim(), selectedEmoji as MoodEmoji)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const recentMoods = getRecentMoods(5)
  const recentList = recentRecords
    .slice()
    .sort((a, b) => b.lastVisitAt - a.lastVisitAt)
    .slice(0, 5)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* 遮罩层 */}
      <motion.div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* 侧边栏内容 */}
      <motion.div
        className="relative w-80 max-w-[85vw] h-full bg-surface shadow-2xl overflow-y-auto"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex flex-col h-full">
          {/* 顶栏 */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-surface/95 backdrop-blur-md border-b border-border-light">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white text-base font-bold shadow-md">
                🦊
              </div>
              <div>
                <span className="font-semibold text-text text-sm">个人中心</span>
                <p className="text-[10px] text-text-tertiary">费曼科学课</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-border-light flex items-center justify-center transition-colors"
              aria-label="关闭"
            >
              <X size={18} className="text-text-tertiary" />
            </button>
          </div>

          {/* 内容区 */}
          <div className="flex-1 px-4 py-4 space-y-4">
            {/* 今日学习 */}
            <section className="bg-brand-light rounded-xl p-4 border border-brand/10">
              <h3 className="text-xs font-semibold text-brand uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <ChartBar size={14} weight="fill" />
                今日学习
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="已学内容" value={`${stats.contentCount}`} unit="个" />
                <StatCard label="学习时长" value={`${stats.totalDuration}`} unit="分钟" />
                <StatCard label="连续天数" value={`${stats.streakDays}`} unit="天" icon="🔥" />
              </div>
              <div className="mt-3 pt-3 border-t border-brand/10 flex justify-between text-[10px] text-brand/60">
                <span>累计学完 {ach.totalLearned} 个内容</span>
                <span>⭐ {ach.stars} 颗星</span>
              </div>
            </section>

            {/* 每日盲盒 */}
            <section className="bg-warning-light rounded-xl p-4 border border-warning/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-warning uppercase tracking-wider flex items-center gap-1.5">
                  <Gift size={14} weight="fill" />
                  每日盲盒
                </h3>
                <button
                  onClick={handleRefreshQuote}
                  className="p-1 rounded hover:bg-warning/20 transition-colors"
                  title="换一条"
                >
                  <ArrowClockwise size={12} className="text-warning/60" />
                </button>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed italic">
                &ldquo;{currentQuote.text}&rdquo;
              </p>
              {currentQuote.author && (
                <p className="text-xs text-text-tertiary mt-1.5 text-right">— {currentQuote.author}</p>
              )}
            </section>

            {/* 今日心情 */}
            <section className="bg-surface rounded-xl p-4 border border-border shadow-sm">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <PencilSimpleLine size={14} />
                  今日心情
                </h3>
                {saved && (
                  <span className="flex items-center gap-0.5 text-[10px] text-success animate-fade-in">
                    <CheckCircle size={12} weight="fill" />
                    已保存
                  </span>
                )}
              </div>
              <p className="text-xs text-text-tertiary mb-2">今天学了什么感受？</p>

              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {MOOD_OPTIONS.map((opt) => (
                  <motion.button
                    key={opt.emoji}
                    onClick={() => { setSelectedEmoji(opt.emoji); setSaved(false) }}
                    className={`px-2 py-1 rounded-lg text-base transition-all duration-150 ${
                      selectedEmoji === opt.emoji
                        ? 'bg-brand-light ring-2 ring-brand/30 scale-110 shadow-sm'
                        : 'bg-border-light hover:bg-border hover:scale-105'
                    }`}
                    title={opt.label}
                    whileTap={{ scale: 0.9 }}
                  >
                    {opt.emoji}
                  </motion.button>
                ))}
              </div>

              <div className="relative">
                <textarea
                  value={moodText}
                  onChange={(e) => { setMoodText(e.target.value); setSaved(false) }}
                  placeholder="写一句话记录今天..."
                  className="w-full px-3 py-2.5 pr-10 text-sm border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/30 transition-all bg-border-light/50"
                  rows={2}
                />
                {(moodText.trim() && selectedEmoji) && (
                  <motion.button
                    onClick={handleSaveMood}
                    disabled={saved}
                    className={`absolute right-2 bottom-2 p-1.5 rounded-lg transition-all duration-200 ${
                      saved
                        ? 'bg-success-light text-success cursor-default'
                        : 'bg-brand text-white hover:bg-brand-dark active:scale-95 shadow-sm'
                    }`}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FloppyDisk size={14} weight="fill" />
                  </motion.button>
                )}
              </div>

              {recentMoods.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border-light">
                  <p className="text-[10px] text-text-tertiary mb-1.5">最近记录</p>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto">
                    {recentMoods.map((m) => (
                      <div key={m.date} className="flex items-start gap-2 text-xs bg-border-light rounded-lg px-2 py-1.5">
                        <span className="text-sm mt-0.5">{m.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-text-secondary truncate">{m.text || '(无文字)'}</p>
                          <p className="text-[10px] text-text-tertiary">{m.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* 成就徽章 */}
            <section className="bg-surface rounded-xl p-4 border border-border shadow-sm">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <Medal size={14} weight="fill" />
                成就徽章
              </h3>
              <div className="flex items-center gap-3 flex-wrap">
                <BadgeIcon icon="⭐" count={ach.stars} label="星星" />
                <BadgeIcon icon="🔥" count={ach.streakDays} label="连续天" />
                <BadgeIcon icon="🏆" count={ach.totalLearned} label="已学完" />
                <BadgeIcon icon="🦊" count={ach.badges.length} label="徽章" />
              </div>
              {ach.stars === 0 && ach.totalLearned === 0 && (
                <p className="text-xs text-text-tertiary mt-2 text-center">开始学习解锁成就 ✨</p>
              )}
            </section>

            {/* 意见反馈 */}
            <section className="bg-success-light rounded-xl p-4 border border-success/20">
              <button
                onClick={() => setFeedbackOpen(!feedbackOpen)}
                className="w-full flex items-center justify-between"
              >
                <h3 className="text-xs font-semibold text-success uppercase tracking-wider flex items-center gap-1.5">
                  <ChatCircleText size={14} weight="fill" />
                  意见反馈
                </h3>
                {feedbackOpen ? (
                  <CaretUp size={14} className="text-success/60" />
                ) : (
                  <CaretDown size={14} className="text-success/60" />
                )}
              </button>

              <AnimatePresence>
                {feedbackOpen && (
                  <motion.div
                    className="mt-3 space-y-2.5"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {!feedbackSubmitted ? (
                      <>
                        <div className="flex flex-wrap gap-1.5">
                          {feedbackCategories.map((cat) => (
                            <button
                              key={cat.value}
                              onClick={() => setFeedbackCategory(cat.value)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] transition-all duration-150 ${
                                feedbackCategory === cat.value
                                  ? 'bg-success text-white shadow-sm'
                                  : 'bg-surface text-text-secondary hover:bg-success/10 border border-success/20'
                              }`}
                            >
                              {cat.icon} {cat.label}
                            </button>
                          ))}
                        </div>

                        <div className="relative">
                          <textarea
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="你的建议对我们很重要..."
                            className="w-full px-3 py-2.5 pr-10 text-sm border border-success/20 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-success/30 focus:border-success/30 transition-all bg-surface"
                            rows={3}
                          />
                          {feedbackText.trim() && (
                            <motion.button
                              onClick={() => {
                                submitFeedback(feedbackText.trim(), feedbackCategory)
                                setFeedbackSubmitted(true)
                                setFeedbackText('')
                                setTimeout(() => {
                                  setFeedbackSubmitted(false)
                                  setFeedbackOpen(false)
                                }, 2500)
                              }}
                              className="absolute right-2 bottom-2 p-1.5 rounded-lg bg-success text-white hover:bg-success/90 active:scale-95 shadow-sm transition-all"
                              whileTap={{ scale: 0.9 }}
                            >
                              <PaperPlaneRight size={13} weight="fill" />
                            </motion.button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center gap-2 py-3 text-sm text-success animate-fade-in">
                        <CheckCircle size={16} weight="fill" />
                        <span>感谢你的反馈！💚</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* 最近学习 */}
            <section className="bg-surface rounded-xl p-4 border border-border shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen size={14} />
                  最近学习
                </h3>
                <span className="text-[10px] text-text-tertiary">{recentList.length} 条记录</span>
              </div>
              {recentList.length > 0 ? (
                <div className="space-y-2">
                  {recentList.map((record, i) => (
                    <RecordItem key={`${record.boardId}-${record.contentId}-${i}`} record={record} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-text-tertiary">还没有学习记录</p>
                  <p className="text-[10px] text-text-tertiary/50 mt-1">去看看课程吧 →</p>
                </div>
              )}
            </section>
          </div>

          {/* 底部版本信息 + 主题切换 */}
          <div className="px-4 py-3 text-center border-t border-border-light flex items-center justify-between">
            <p className="text-[10px] text-text-tertiary">费曼科学课 v0.1 · 用心做教育 💙</p>
            <button
              onClick={toggleDark}
              className="p-1.5 rounded-lg hover:bg-border-light transition-colors"
              title={isDark ? '切换浅色模式' : '切换深色模式'}
            >
              {isDark ? (
                <Sun size={15} weight="fill" className="text-warning" />
              ) : (
                <Moon size={15} className="text-text-tertiary" />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function StatCard({ label, value, unit, icon }: { label: string; value: string; unit?: string; icon?: string }) {
  return (
    <div className="text-center">
      {icon && <div className="text-lg mb-0.5">{icon}</div>}
      <div className="text-xl font-bold text-brand">{value || '--'}</div>
      <div className="text-[10px] text-text-secondary">{unit ? `${unit}${label}` : label}</div>
    </div>
  )
}

function BadgeIcon({ icon, count, label }: { icon: string; count: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-3 py-2 bg-border-light rounded-xl min-w-[56px]">
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-bold text-text">{count}</span>
      <span className="text-[10px] text-text-tertiary">{label}</span>
    </div>
  )
}

function RecordItem({ record }: { record: LearningRecord }) {
  const boardName = BOARD_NAMES[record.boardId] || record.boardId
  const timeStr = new Date(record.lastVisitAt).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex items-start gap-2.5 p-2.5 bg-border-light rounded-xl">
      <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0 text-brand text-xs font-bold">
        {boardName.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-text truncate">{record.contentTitle}</p>
        <p className="text-[10px] text-text-tertiary mt-0.5">
          {boardName} · {timeStr}
        </p>
      </div>
      {record.completed && (
        <span className="text-xs text-success shrink-0">✓</span>
      )}
    </div>
  )
}
