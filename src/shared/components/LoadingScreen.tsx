import { motion } from 'framer-motion'

const TIPS = [
  '加载精彩内容...',
  '知识正在向你飞奔而来...',
  '准备好探索新世界了吗？',
  '每一天都是学习的好日子',
  '好奇心是最好的老师',
  '你比昨天更厉害了！',
]

interface LoadingScreenProps {
  progress?: number
  tip?: string
}

export function LoadingScreen({ progress, tip }: LoadingScreenProps) {
  const randomTip = tip || TIPS[Math.floor(Math.random() * TIPS.length)]

  return (
    <div className="flex flex-col items-center justify-center min-h-[50dvh] gap-5 px-6">
      {/* 品牌 Logo 区域 */}
      <motion.div
        className="relative"
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center shadow-lg">
          <span className="text-3xl">🦊</span>
        </div>
        {/* 光晕效果 */}
        <div className="absolute inset-0 rounded-2xl bg-brand/20 blur-xl -z-10" />
      </motion.div>

      {/* 品牌名 */}
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold text-text font-display">费曼科学课</h2>
        <p className="text-sm text-text-tertiary">{randomTip}</p>
      </div>

      {/* 进度条 */}
      <div className="w-48 h-1.5 bg-border rounded-full overflow-hidden">
        {progress !== undefined ? (
          <motion.div
            className="h-full bg-brand rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        ) : (
          <motion.div
            className="h-full bg-brand rounded-full"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: '50%' }}
          />
        )}
      </div>
    </div>
  )
}
