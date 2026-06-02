import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { BoardLayout, LoadingScreen, PageTransition } from '@/shared/components'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'

const MathBoard = lazy(() => import('@/boards/MathBoard'))
const ScienceBoard = lazy(() => import('@/boards/ScienceBoard'))
const SocialBoard = lazy(() => import('@/boards/SocialBoard'))
const GalleryBoard = lazy(() => import('@/boards/GalleryBoard'))
const NeimenBoard = lazy(() => import('@/boards/NeimenBoard'))

// 社交绘本阅读器 — 全屏渲染（跳出 BoardLayout，无 TabBar）
const SocialPlayer = lazy(() => import('@/boards/SocialBoard/Player').then(m => ({ default: m.default })))

// 科学3D可视化 — 全屏渲染（跳出 BoardLayout，无 TabBar）
const SciencePlayer = lazy(() => import('@/boards/ScienceBoard/Player').then(m => ({ default: m.default })))
// 科学分类列表 — 带布局（有 TabBar）
const ScienceCategoryList = lazy(() => import('@/boards/ScienceBoard/CategoryList').then(m => ({ default: m.default })))

// 数学视频播放页 — 全屏渲染（跳出 BoardLayout，无 TabBar）
const MathPlayer = lazy(() => import('@/boards/MathBoard/Player').then(m => ({ default: m.default })))
// 数学章节列表 — 带布局（有 TabBar）
const MathChapterList = lazy(() => import('@/boards/MathBoard/ChapterList').then(m => ({ default: m.default })))

// 童画廊 — 全屏查看大图（跳出 BoardLayout，无 TabBar）
const GalleryViewer = lazy(() => import('@/boards/GalleryBoard/Viewer').then(m => ({ default: m.default })))
// 画廊分类列表 — 带布局（有 TabBar）
const GalleryCategoryList = lazy(() => import('@/boards/GalleryBoard/CategoryList').then(m => ({ default: m.default })))

// 内功养生法 — 卡片详情（跳出 BoardLayout，无 TabBar）
const NeimenCardDetail = lazy(() => import('@/boards/NeimenBoard/CardDetail').then(m => ({ default: m.default })))
// 内功分类列表 — 带布局（有 TabBar）
const NeimenCategoryList = lazy(() => import('@/boards/NeimenBoard/CategoryList').then(m => ({ default: m.default })))

// 个人中心页面（全屏）
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then(m => ({ default: m.default })))
// 社交绘本分类列表 — 带布局（有 TabBar）
const SocialCategoryList = lazy(() => import('@/boards/SocialBoard/CategoryList').then(m => ({ default: m.default })))

/** 带错误边界的 Suspense 包裹器 */
function SafeLazy({ children, location }: { children: React.ReactNode; location: string }) {
  return (
    <ErrorBoundary location={location}>
      <Suspense fallback={<LoadingScreen />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

export function AppRouter() {
  return (
    <Routes>
      {/* 全屏页面（无 TabBar） */}
      <Route
        path="/social/scene/:id"
        element={
          <PageTransition>
            <SafeLazy location="SocialPlayer">
              <SocialPlayer />
            </SafeLazy>
          </PageTransition>
        }
      />
      <Route
        path="/science/:id"
        element={
          <PageTransition>
            <SafeLazy location="SciencePlayer">
              <SciencePlayer />
            </SafeLazy>
          </PageTransition>
        }
      />
      <Route
        path="/math/lesson/:lessonId"
        element={
          <PageTransition>
            <SafeLazy location="MathPlayer">
              <MathPlayer />
            </SafeLazy>
          </PageTransition>
        }
      />
      <Route
        path="/gallery/:id"
        element={
          <PageTransition>
            <SafeLazy location="GalleryViewer">
              <GalleryViewer />
            </SafeLazy>
          </PageTransition>
        }
      />
      <Route
        path="/neimen/:id"
        element={
          <PageTransition>
            <SafeLazy location="NeimenCardDetail">
              <NeimenCardDetail />
            </SafeLazy>
          </PageTransition>
        }
      />
      <Route
        path="/profile"
        element={
          <PageTransition>
            <SafeLazy location="ProfilePage">
              <ProfilePage />
            </SafeLazy>
          </PageTransition>
        }
      />

      {/* 带布局的页面（有 TabBar） */}
      <Route element={<BoardLayout />}>
        <Route
          path="/math"
          element={
            <SafeLazy location="MathBoard">
              <MathBoard />
            </SafeLazy>
          }
        />
        <Route
          path="/math/section/:sectionId"
          element={
            <SafeLazy location="MathChapterList">
              <MathChapterList />
            </SafeLazy>
          }
        />
        <Route
          path="/science"
          element={
            <SafeLazy location="ScienceBoard">
              <ScienceBoard />
            </SafeLazy>
          }
        />
        <Route
          path="/science/category/:categoryId"
          element={
            <SafeLazy location="ScienceCategoryList">
              <ScienceCategoryList />
            </SafeLazy>
          }
        />
        <Route
          path="/social"
          element={
            <SafeLazy location="SocialBoard">
              <SocialBoard />
            </SafeLazy>
          }
        />
        <Route
          path="/social/category/:categoryId"
          element={
            <SafeLazy location="SocialCategoryList">
              <SocialCategoryList />
            </SafeLazy>
          }
        />
        <Route
          path="/gallery"
          element={
            <SafeLazy location="GalleryBoard">
              <GalleryBoard />
            </SafeLazy>
          }
        />
        <Route
          path="/gallery/category/:categoryId"
          element={
            <SafeLazy location="GalleryCategoryList">
              <GalleryCategoryList />
            </SafeLazy>
          }
        />
        <Route
          path="/neimen"
          element={
            <SafeLazy location="NeimenBoard">
              <NeimenBoard />
            </SafeLazy>
          }
        />
        <Route
          path="/neimen/category/:categoryId"
          element={
            <SafeLazy location="NeimenCategoryList">
              <NeimenCategoryList />
            </SafeLazy>
          }
        />
        <Route path="/" element={<Navigate to="/math" replace />} />
      </Route>
    </Routes>
  )
}
