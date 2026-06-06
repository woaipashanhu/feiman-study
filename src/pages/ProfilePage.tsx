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
  ChartBar, PencilSimpleLine, Medal, BookOpen,
  ArrowLeft, FloppyDisk, CheckCircle, ChatCircleText,
  Sun, Moon, PaperPlaneRight, Heart, Quotes, CaretRight
} from 'phosphor-react'
import { useLearningTracker, type AchievementState, type LearningRecord } from '@/shared/hooks/useLearningTracker'
import { getDailyQuote, type DailyQuote } from '@/shared/utils/dailyQuotes'
import { useMoodTracker, type MoodEmoji } from '@/shared/hooks/useMoodTracker'
import { useFeedback, type FeedbackCategory } from '@/shared/hooks/useFeedback'
import { useTheme } from '@/shared/hooks/useTheme'
import { useFavorites } from '@/shared/hooks/useFavorites'
import { FavoriteMarquee } from '@/shared/components/FavoriteMarquee'

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
  const navigate = useNavigate()
  const [moodText, setMoodText] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState<MoodEmoji | ''>('')
  const [saved, setSaved] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const { submitFeedback, feedbackCategories } = useFeedback()
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategory>('suggestion')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  const { isDark, toggleDark } = useTheme()
  const { getTodayMood, saveMood, getRecentMoods, MOOD_OPTIONS } = useMoodTracker()
  const { getRecentFavorites, count: countFavorites } = useFavorites()

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
  const currentQuote = dailyQuote || { text: '每天进步一点点，一年后你会感谢今天的自己。', author: '' }

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
  const recentFavorites = getRecentFavorites(6)
  const totalFavorites = countFavorites()

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

        {/* 我的收藏 — App Store Today 大卡片 */}
        <div className="px-4">
          {totalFavorites === 0 ? (
            <section
              onClick={() => navigate('/favorites')}
              className="rounded-[20px] overflow-hidden shadow-lg ring-1 ring-black/5 bg-surface cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="p-5 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                  <Heart size={24} weight="fill" className="text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-text">我的收藏</h3>
                  <p className="text-[13px] text-text-secondary mt-0.5">
                    打开视频/绘本/名画/功法,点右下角 ❤ 就能收藏
                  </p>
                </div>
                <CaretRight size={18} className="text-text-tertiary shrink-0" />
              </div>
            </section>
          ) : (
            <section
              onClick={() => navigate('/favorites')}
              className="rounded-[20px] overflow-hidden shadow-lg ring-1 ring-black/5 cursor-pointer active:scale-[0.98] transition-transform"
              style={{ height: 'calc(100vh - 520px)', minHeight: '300px' }}
            >
              {/* 上半部分 — 2×2 收藏图标墙 (深色背景,融入卡片) */}
              <div className="relative h-[58%] overflow-hidden">
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(160deg, #EF444420 0%, #1a0f1a 70%)`,
                  }}
                />
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full blur-3xl opacity-15"
                  style={{ backgroundColor: '#EF4444' }}
                />

                {/* 2×2 跑马灯 */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <FavoriteMarquee items={recentFavorites} />
                </div>

                {/* 顶部渐变遮罩 */}
                <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/15 to-transparent pointer-events-none z-20" />
              </div>

              {/* 下半部分 — 文字信息 */}
              <div className="relative h-[42%] flex flex-col justify-end p-5 bg-white">
                {/* 渐变过渡 */}
                <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/8 to-transparent pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-medium text-red-500/70 tracking-wide">
                      我的收藏
                    </span>
                    <span className="text-[11px] text-text-tertiary px-1.5 py-0.5 rounded-md bg-black/5">
                      {totalFavorites} 个内容
                    </span>
                  </div>
                  <h2 className="text-[22px] font-bold text-text leading-tight">
                    收藏夹
                  </h2>
                  <p className="text-[13px] text-text-secondary mt-1.5 leading-relaxed line-clamp-2">
                    数学课、科学探索、社交故事、名画鉴赏、内功功法
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* 树洞入口 - 每日名言 */}
        <section
          onClick={() => navigate('/tree-hole')}
          className="relative rounded-xl p-4 border border-amber-300/20 shadow-sm overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
          style={{
            background: 'linear-gradient(135deg, #4a2c5e 0%, #2d1b4e 50%, #1a0f33 100%)',
          }}
        >
          {/* 装饰光斑 */}
          <div
            className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-40 blur-2xl"
            style={{ background: 'radial-gradient(circle, #fbbf24 0%, transparent 70%)' }}
          />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                <Quotes size={14} weight="fill" />
                树洞 · 每日一言
              </h3>
              <CaretRight size={14} className="text-amber-200/60" />
            </div>
            <blockquote className="text-sm text-white/95 italic leading-relaxed">
              「{currentQuote.text}」
            </blockquote>
            {currentQuote.author && (
              <p className="text-[10px] text-amber-200/60 mt-1.5 text-right">— {currentQuote.author}</p>
            )}
            <p className="text-[10px] text-amber-200/40 mt-2 text-center">点进来听我念给你听 ↓</p>
          </div>
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
