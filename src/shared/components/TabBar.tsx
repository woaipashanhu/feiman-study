import { NavLink } from 'react-router-dom'
import { useBoardStore } from '@/stores/useBoardStore'
import { motion } from 'framer-motion'
import { getIcon } from './icon-registry'

export function TabBar({ onTabChange: _onTabChange }: { onTabChange?: (path: string) => void }) {
  const { boards } = useBoardStore()

  return (
    <nav className="shrink-0 h-16 bg-surface border-t border-border relative" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}>
      <div className="flex items-center justify-around h-full max-w-lg mx-auto px-2">
        {boards.map((board) => {
          const Icon = getIcon(board.icon)

          // 安全防护：图标名无效时显示默认占位符而不是渲染 undefined
          if (!Icon) {
            console.warn(`[TabBar] 板块 "${board.name}" 使用了无效的图标名: "${board.icon}"`)
            return (
              <div
                key={board.id}
                className="flex flex-col items-center justify-center gap-1 w-16 h-full relative"
                title={`${board.name}（图标配置错误: ${board.icon}）`}
              >
                <span className="text-lg">❓</span>
                <span className="text-[10px] text-red-400">{board.name}</span>
              </div>
            )
          }

          return (
            <NavLink
              key={board.id}
              to={board.path}
              className="flex flex-col items-center justify-center gap-1 w-16 h-full relative transition-colors"
              end={false}
            >
              {({ isActive: navActive }) => (
                <>
                  {/* 激活背景 */}
                  {navActive && (
                    <motion.div
                      layoutId="tabbar-active-bg"
                      className="absolute inset-x-1 inset-y-1 rounded-xl"
                      style={{ backgroundColor: board.color + '12' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  {/* 顶部指示条 */}
                  {navActive && (
                    <motion.div
                      layoutId="tabbar-indicator"
                      className="absolute -top-px left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full"
                      style={{ backgroundColor: board.color }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    size={22}
                    weight={navActive ? 'fill' : 'regular'}
                    style={{ color: navActive ? board.color : '#9AA0B8' }}
                    className="relative z-10 transition-colors duration-200"
                  />
                  <span
                    className={`text-sm font-medium relative z-10 transition-colors duration-200 leading-tight ${
                      navActive ? 'font-semibold' : ''
                    }`}
                    style={{ color: navActive ? board.color : '#9AA0B8' }}
                  >
                    {board.name}
                  </span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
