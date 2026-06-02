import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from '@/router'
import { ContentProtection } from '@/shared/components'
import { DevErrorPanel } from '@/shared/components/DevErrorPanel'

function App() {
  return (
    <BrowserRouter>
      <ContentProtection />
      <AppRouter />
      {/* 开发环境错误调试面板 — 生产环境自动隐藏 */}
      <DevErrorPanel />


        </BrowserRouter>
  )
}

export default App
