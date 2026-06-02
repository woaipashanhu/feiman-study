/**
 * ============================================================
 *  个人中心页面（全屏）
 *
 *  从消息中心入口进入，展示个人学习数据、每日名言、心情等
 *  顶部用返回按钮，不用关闭按钮
 * ============================================================
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ChartBar, Gift, PencilSimpleLine, Medal, BookOpen,
  ArrowLeft, ArrowClockwise, FloppyDisk, CheckCircle, ChatCircleText,
  Sun, Moon, PaperPlaneRight
} from 'phosphor-react'
import { useLearningTracker, type AchievementState, type LearningRecord } from '@/shared/hooks/useLearningTracker'
import { getDailyQuote, getRandomQuote, type DailyQuote } from '@/shared/utils/dailyQuotes'
import { useMoodTracker, type MoodEmoji } from '@/shared/hooks/useMoodTracker'
import { useFeedback, type FeedbackCategory } from '@/shared/hooks/useFeedback'
import { useTheme } from '@/shared/hooks/useTheme'

const BOARD_NAMES: Record<string, string> = {
  math: '数学课',
  science: '科学',
  social: '社交训练',
  gallery: '画廊',
  neimen: '内功养生',
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { getAchievement, getRecords } = useLearningTracker()

  const achievement = getAchievement()
  const records = getRecords()
  const dailyQuote = getDailyQuote()

  const todayStr = new Date().toISOString().split('T')[0]
  const todayRecords = records.filter((r) => r.lastVisitAt && new Date(r.lastVisitAt).toISOString().split('T')[0] === todayStr)
  const todayStats = {
    contentCount: todayRecords.length,
    totalDuration: Math.round(todayRecords.reduce((sum, r) => sum + r.duration, 0) / 60),
    streakDays: achievement.streakDays,
  }

  return (
    <ProfileContent
      todayStats={todayStats}
      achievement={achievement}
      dailyQuote={dailyQuote}
      recentRecords={records}
      onBack={() => navigate(-1)}
    />
  )
}

interface ProfileContentProps {
  todayStats?: {
    contentCount: number
    totalDuration: number
    streakDays: number
  }
  achievement?: AchievementState
  dailyQuote?: DailyQuote
  recentRecords?: LearningRecord[]
  onBack: () => void
}

function ProfileContent({
  todayStats,
  achievement,
  dailyQuote,
  recentRecords = [],
  onBack,
}: ProfileContentProps) {
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
    <div className="h-full flex flex-col bg-bg overflow-hidden">
      {/* 顶部栏 — 返回按钮 */}
      <header className="flex items-center gap-3 px-4 py-3 bg-surface border-b border-border shrink-0">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center shadow-sm"
        >
          <ArrowLeft size={18} weight="regular" className="text-text" />
        </motion.button>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white text-base font-bold shadow-md">
            🦊
          </div>
          <div>
            <span className="font-semibold text-text text-sm">个人中心</span>
            <p className="text-[10px] text-text-tertiary">费曼科学课</p>
          </div>
        </div>
      </header>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* 今日学习 */}
        <section className="bg-brand-light rounded-xl p-4 border border-brand/10">
          <h3 className="text-xs font-semibold text-brand uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <ChartBar size={14} weight="bold" />
            今日学习
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <StatBox value={stats.contentCount} label="已学内容" />
            <StatBox value={stats.totalDuration} label="学习分钟" />
            <StatBox value={stats.streakDays} label="连续天数" />
          </div>
        </section>

        {/* 每日名言 */}
        <section className="bg-surface rounded-xl p-4 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <Gift size={14} weight="bold" />
              每日名言
            </h3>
            <button
              onClick={handleRefreshQuote}
              className="text-text-tertiary hover:text-brand transition-colors p-1 rounded"
              title="换一句"
            >
              <ArrowClockwise size={14} />
            </button>
          </div>
          <blockquote className="text-sm text-text italic leading-relaxed border-l-2 border-brand/30 pl-3">
            「{currentQuote.text}」
          </blockquote>
          {currentQuote.author && (
            <p className="text-[10px] text-text-tertiary mt-1.5 text-right">— {currentQuote.author}</p>
          )}
        </section>

        {/* 心情记录 */}
        <section className="bg-surface rounded-xl p-4 border border-border shadow-sm">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <PencilSimpleLine size={14} weight="bold" />
            心情记录
          </h3>

          {/* 表情选择 */}
          <div className="flex gap-2 mb-3">
            {MOOD_OPTIONS.map((opt) => (
              <button
                key={opt.emoji}
                onClick={() => setSelectedEmoji(opt.emoji)}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                  selectedEmoji === opt.emoji
                    ? 'bg-brand/15 scale-110 shadow-sm'
                    : 'bg-border-light hover:bg-border'
                }`}
                title={opt.label}
              >
                {opt.emoji}
              </button>
            ))}
          </div>

          {/* 文字输入 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={moodText}
              onChange={(e) => setMoodText(e.target.value)}
              placeholder="今天感觉怎么样？"
              className="flex-1 px-3 py-2 rounded-lg bg-bg border border-border text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-brand/50"
              maxLength={50}
            />
            <button
              onClick={handleSaveMood}
              disabled={!moodText.trim() || !selectedEmoji}
              className="px-3 py-2 rounded-lg bg-brand text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-dark transition-colors flex items-center gap-1"
            >
              {saved ? <CheckCircle size={16} /> : <FloppyDisk size={16} />}
              {saved ? '已保存' : '保存'}
            </button>
          </div>

          {/* 最近心情 */}
          {recentMoods.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border-light">
              <p className="text-[10px] text-text-tertiary mb-2">最近记录</p>
              <div className="flex gap-2 flex-wrap">
                {recentMoods.map((m, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-border-light text-xs text-text-secondary"
                  >
                    <span>{m.emoji}</span>
                    <span className="truncate max-w-[80px]">{m.text}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 成就 */}
        <section className="bg-surface rounded-xl p-4 border border-border shadow-sm">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Medal size={14} weight="bold" />
            成就
          </h3>
          <div className="grid grid-cols-4 gap-3">
            <AchievementItem
              icon="⭐"
              value={ach.stars}
              label="星星"
            />
            <AchievementItem
              icon="📚"
              value={ach.totalLearned}
              label="已学"
            />
            <AchievementItem
              icon="⏱️"
              value={Math.round(ach.totalDuration / 60)}
              label="分钟"
            />
            <AchievementItem
              icon="🔥"
              value={ach.streakDays}
              label="连续"
            />
          </div>
          {ach.badges.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border-light flex gap-2 flex-wrap">
              {ach.badges.map((badge) => (
                <span
                  key={badge}
                  className="px-2 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-medium border border-amber-100"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* 最近学习 */}
        <section className="bg-surface rounded-xl p-4 border border-border shadow-sm">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <BookOpen size={14} weight="bold" />
            最近学习
          </h3>
          {recentList.length === 0 ? (
            <p className="text-xs text-text-tertiary py-2">还没有学习记录，快去探索吧！</p>
          ) : (
            <div className="space-y-2">
              {recentList.map((record) => (
                <RecordItem key={record.contentId} record={record} />
              ))}
            </div>
          )}
        </section>

        {/* 反馈 */}
        <section className="bg-surface rounded-xl p-4 border border-border shadow-sm">
          <button
            onClick={() => setFeedbackOpen((v) => !v)}
            className="w-full flex items-center justify-between text-left"
          >
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <ChatCircleText size={14} weight="bold" />
              意见反馈
            </h3>
            <span className="text-text-tertiary text-xs">{feedbackOpen ? '收起' : '展开'}</span>
          </button>

          {feedbackOpen && (
            <div className="mt-3 space-y-3">
              {!feedbackSubmitted ? (
                <>
                  <div className="flex gap-2 flex-wrap">
                    {feedbackCategories.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setFeedbackCategory(cat.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                          feedbackCategory === cat.value
                            ? 'bg-brand text-white'
                            : 'bg-border-light text-text-secondary hover:bg-border'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="请输入您的建议或遇到的问题..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-brand/50 resize-none"
                  />
                  <button
                    onClick={() => {
                      if (!feedbackText.trim()) return
                      submitFeedback(feedbackText.trim(), feedbackCategory)
                      setFeedbackSubmitted(true)
                      setFeedbackText('')
                      setTimeout(() => {
                        setFeedbackSubmitted(false)
                        setFeedbackOpen(false)
                      }, 3000)
                    }}
                    disabled={!feedbackText.trim()}
                    className="w-full py-2.5 rounded-lg bg-brand text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-dark transition-colors flex items-center justify-center gap-1.5"
                  >
                    <PaperPlaneRight size={16} />
                    提交反馈
                  </button>
                </>
              ) : (
                <div className="py-4 text-center">
                  <CheckCircle size={32} weight="fill" className="text-success mx-auto mb-2" />
                  <p className="text-sm text-text">感谢您的反馈！</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 主题切换 */}
        <section className="bg-surface rounded-xl p-4 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              {isDark ? <Moon size={14} weight="bold" /> : <Sun size={14} weight="bold" />}
              主题模式
            </h3>
            <button
              onClick={toggleDark}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isDark ? 'bg-brand' : 'bg-border'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  isDark ? 'left-0.5 translate-x-6' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </section>

        {/* 底部留白 */}
        <div className="h-6" />
      </div>
    </div>
  )
}

// ==================== 子组件 ====================

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold text-brand">{value}</p>
      <p className="text-[10px] text-text-secondary mt-0.5">{label}</p>
    </div>
  )
}

function AchievementItem({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className="text-center">
      <span className="text-lg">{icon}</span>
      <p className="text-sm font-bold text-text mt-0.5">{value}</p>
      <p className="text-[10px] text-text-secondary">{label}</p>
    </div>
  )
}

function RecordItem({ record }: { record: LearningRecord }) {
  const boardName = BOARD_NAMES[record.boardId] || record.boardId
  const timeStr = record.lastVisitAt
    ? new Date(record.lastVisitAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    : ''

  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center text-xs shrink-0">
        {boardName[0]}
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
