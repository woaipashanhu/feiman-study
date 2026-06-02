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
        {extraButtons && (
          <div className="absolute right-12 bottom-2">{extraButtons}</div>
        )}
      </div>
    </div>
  )
}
