import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

interface EmptyStateProps {
  title?: string
  description?: string
  showAction?: boolean
  actionText?: string
  actionPath?: string
}

const ILLUSTRATIONS = [
  // 空盒子
  <svg key="box" viewBox="0 0 200 200" className="w-32 h-32 text-brand/30">
    <rect x="40" y="80" width="120" height="80" rx="12" fill="none" stroke="currentColor" strokeWidth="3" />
    <path d="M40 80 L100 40 L160 80" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="100" cy="55" r="8" fill="currentColor" opacity="0.5" />
    <path d="M85 130 L115 130" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
  </svg>,
]

export function EmptyState({
  title = '暂无内容',
  description = '该板块的内容正在准备中',
  showAction = false,
  actionText = '返回首页',
  actionPath = '/math',
}: EmptyStateProps) {
  const navigate = useNavigate()

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[40dvh] gap-4 px-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* 插画 */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        {ILLUSTRATIONS[0]}
      </motion.div>

      {/* 文字 */}
      <div className="text-center space-y-2">
        <h3 className="text-base font-semibold text-text">{title}</h3>
        <p className="text-sm text-text-secondary text-center max-w-xs">{description}</p>
      </div>

      {/* 操作按钮 */}
      {showAction && (
        <motion.button
          onClick={() => navigate(actionPath)}
          className="mt-2 px-5 py-2.5 bg-brand text-white text-sm font-medium rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all ripple-btn"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          {actionText}
        </motion.button>
      )}
    </motion.div>
  )
}
