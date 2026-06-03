import { NavLink } from 'react-router-dom'
import { useBoardStore } from '@/stores/useBoardStore'
import { motion } from 'framer-motion'
import { getIcon } from './icon-registry'

export function TabBar({ onTabChange: _onTabChange }: { onTabChange?: (path: string) => void }) {
  const { boards } = useBoardStore()

  return (
    <nav
      className="shrink-0 h-[4.5rem] relative"
      style={{
        background: 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      }}
    >
      <div className="flex items-center justify-around h-full max-w-lg mx-auto px-2">
        {boards.map((board) => {
          const Icon = getIcon(board.icon)

          if (!Icon) {
            console.warn(`[TabBar] 板块 "${board.name}" 使用了无效的图标名: "${board.icon}"`)
            return (
              <div
                key={board.id}
                className="flex flex-col items-center justify-center gap-0.5 w-16 h-full relative"
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
              className="flex flex-col items-center justify-center w-16 h-full relative transition-colors"
              end={false}
            >
              {({ isActive: navActive }) => (
                <>
                  {/* 选中态:深色背景块包裹整个按钮 (App Store Today 风格) */}
                  {navActive && (
                    <motion.div
                      layoutId="tabbar-active-pill"
                      className="absolute inset-1.5 rounded-xl bg-gray-900/85 -z-0"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <motion.div
                    className="relative z-10"
                    whileTap={{ scale: 0.9 }}
                  >
                    <Icon
                      size={24}
                      weight={navActive ? 'fill' : 'regular'}
                      style={{ color: navActive ? '#fff' : '#8E8E93' }}
                      className="transition-colors duration-200"
                    />
                  </motion.div>
                  <span
                    className={`text-[10px] relative z-10 transition-colors duration-200 leading-tight ${
                      navActive ? 'font-semibold text-white' : 'font-medium text-[#8E8E93]'
                    }`}
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
