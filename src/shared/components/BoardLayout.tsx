import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, type ReactNode } from 'react'
import { useBoardStore } from '@/stores/useBoardStore'
import { TabBar } from './TabBar'
import { PageTransition } from './PageTransition'
import { PullToRefresh } from './PullToRefresh'

/**
 * BoardLayout — 所有带 TabBar 的页面共享布局
 *
 * 布局结构（App Store Today 风格 - 悬浮 TabBar）：
 *   div.h-dvh (固定视口高度，不随内容撑高)
 *     main.flex-1.overflow-y-auto (内容独立滚动，pb-24 给悬浮 TabBar 留位)
 *       PullToRefresh
 *         PageTransition
 *           内容区
 *     悬浮 TabBar 容器 (absolute, 圆角胶囊, 浮在内容之上)
 *       TabBar (flex-1)
 *       刷新按钮 (独立小圆按钮, 与 TabBar 等高)
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
      {/* pb-24 给悬浮 TabBar 留出空间,让最后一张卡片不会被遮挡 */}
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-24">
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="min-h-full">
            <PageTransition>
              {children || <Outlet />}
            </PageTransition>
          </div>
        </PullToRefresh>
      </main>

      {/* 悬浮 TabBar 容器 (App Store Today 风格) */}
      <div
        className="absolute left-3 right-3 z-20 pointer-events-none flex items-center gap-2"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)' }}
      >
        <div className="flex-1 pointer-events-auto rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5">
          <TabBar onTabChange={handleTabChange} />
        </div>
        {/* 刷新按钮 — 仅测试用,后续会删除;缩小为 48x72 瘦矩形,跟 TabBar 等高但瘦一半 */}
        <button
          onClick={() => window.location.reload()}
          className="pointer-events-auto shrink-0 w-12 h-[4.5rem] rounded-2xl bg-white/72 backdrop-blur-xl shadow-2xl ring-1 ring-black/5 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-white/90 transition-colors"
          title="刷新页面（测试用）"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
        </button>
        {extraButtons && (
          <div className="pointer-events-auto">{extraButtons}</div>
        )}
      </div>
    </div>
  )
}
