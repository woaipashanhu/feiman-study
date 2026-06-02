import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, type ReactNode } from 'react'
import { useBoardStore } from '@/stores/useBoardStore'
import { TabBar } from './TabBar'
import { PageTransition } from './PageTransition'
import { PullToRefresh } from './PullToRefresh'

/**
 * BoardLayout — 所有带 TabBar 的页面共享布局
 *
 * 布局结构：
 *   div.h-dvh (固定视口高度，不随内容撑高)
 *     main.flex-1.overflow-y-auto (内容独立滚动)
 *       PullToRefresh
 *         PageTransition
 *           内容区
 *     TabBar (shrink-0 固定底部，不随内容滚动)
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
    <div className="flex flex-col h-dvh overflow-hidden bg-bg" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* 内容区域：flex-1 占满剩余空间，overflow-y-auto 让内容独立滚动 */}
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="min-h-full">
            <PageTransition>
              {children || <Outlet />}
            </PageTransition>
          </div>
        </PullToRefresh>
      </main>

      {/* 底部 TabBar — shrink-0 固定底部，永远不随内容滚动 */}
      <div className="shrink-0 relative z-10" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <TabBar onTabChange={handleTabChange} />
        {/* 刷新按钮 — 用于代码更新后手动刷新PWA */}
        <button
          onClick={() => window.location.reload()}
          className="absolute right-3 top-2 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          title="刷新页面"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
        </button>
        {extraButtons && (
          <div className="absolute right-12 bottom-2">{extraButtons}</div>
        )}
      </div>
    </div>
  )
}
