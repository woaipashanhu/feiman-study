/**
 * ⚠️ DEPRECATED — V3 不再使用
 * 移到 _legacy/ 防止误用。如确需恢复,从 git history 找回。
 * V3.8 死代码清理 — 2026-06-07
 *
 */

import { X, List } from 'phosphor-react'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface MenuItem {
  id: string
  title: string
  subtitle?: string
  active?: boolean
}

interface ContentMenuProps {
  isOpen: boolean
  onClose: () => void
  title: string
  items: MenuItem[]
  onSelect: (id: string) => void
}

export function ContentMenu({ isOpen, onClose, title, items, onSelect }: ContentMenuProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* 遮罩 */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 菜单面板 */}
          <motion.div
            className="relative w-80 max-w-[80vw] h-full bg-surface shadow-xl flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <List size={18} className="text-text-secondary" />
                <span className="font-medium text-sm text-text">{title}</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-border-light active:scale-95 transition-all"
              >
                <X size={20} className="text-text-secondary" />
              </button>
            </div>

            {/* 列表 */}
            <div className="flex-1 overflow-y-auto py-2">
              {items.map((item, index) => (
                <motion.button
                  key={item.id}
                  onClick={() => {
                    onSelect(item.id)
                    onClose()
                  }}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                    item.active
                      ? 'bg-brand-soft border-l-[3px] border-brand'
                      : 'hover:bg-border-light border-l-[3px] border-transparent'
                  }`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-xs text-text-tertiary w-6 shrink-0">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${item.active ? 'font-medium text-brand' : 'text-text'}`}>
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p className="text-xs text-text-tertiary truncate">{item.subtitle}</p>
                    )}
                  </div>
                  {item.active && (
                    <div className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
