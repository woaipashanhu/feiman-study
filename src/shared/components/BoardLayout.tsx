import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, type ReactNode } from 'react'
import { useBoardStore } from '@/stores/useBoardStore'
import { TabBar } from './TabBar'
import { PageTransition } from './PageTransition'
import { PullToRefresh } from './PullToRefresh'

/**
 * BoardLayout — 所有带 TabBar 的页面共享布局
 *
 * 布局结构（避免嵌套过深导致 iOS PWA 高度计算异常）：
 *   div.h-screen (100dvh + fallback)
 *     main.flex-min-h-0 (flex 子项，允许收缩)
 *       PullToRefresh (relative, 不设 overflow)
 *         div.min-h-0 (确保可滚动区域正确计算)
 *           PageTransition (min-h-full)
 *             内容区 (各板块 Home 组件)
 *     TabBar (shrink-0 固定底部)
 */
interface BoardLayoutProps {
  children?: ReactNode
  extraButtons?: ReactNode
}

export function BoardLayout({ children, extraButtons }: BoardLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { boards, setActiveBoard } = useBoardStore()

  useEffect(() => {
    const path = location.pathname
    const matched = boards.find((b) => path.startsWith(b.path))
    if (matched) {
      setActiveBoard(matched.id)
    }
  }, [location.pathname, boards, setActiveBoard])

  const handleTabChange = (path: string) => {
    navigate(path)
  }

  const handleRefresh = () => {
    window.dispatchEvent(new CustomEvent('feiman-refresh'))
  }

  return (
    <div className="flex flex-col h-[100dvh] h-[100vh] overflow-hidden bg-bg">
      {/* 内容区域：flex-1 + min-h-0 确保 flex 子项可以正确收缩 */}
      <main className="flex-1 min-h-0 overflow-hidden">
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="min-h-0 overflow-y-auto overflow-x-hidden scroll-smooth">
            <PageTransition>
              {children || <Outlet />}
            </PageTransition>
          </div>
        </PullToRefresh>
      </main>

      {/* 底部 TabBar — shrink-0 确保不被压缩 */}
      <div className="flex items-center justify-center bg-surface border-t border-border safe-area-pb shrink-0 relative z-10">
        <TabBar onTabChange={handleTabChange} />

        {extraButtons && (
          <div className="absolute right-12 bottom-2">{extraButtons}</div>
        )}
      </div>
    </div>
  )
}
