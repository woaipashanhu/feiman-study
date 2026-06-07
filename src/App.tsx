import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from '@/router'
import { ContentProtection } from '@/shared/components'
import { DevErrorPanel } from '@/shared/components/DevErrorPanel'
import { PWAUpdatePrompt } from '@/shared/components/PWAUpdatePrompt'
import { WSNotificationToast } from '@/shared/components/WSNotificationToast'

function App() {
  return (
    <BrowserRouter>
      <ContentProtection />
      <AppRouter />
      {/* 开发环境错误调试面板 — 生产环境自动隐藏 */}
      <DevErrorPanel />
      {/* PWA 新版本提示(部署后用户主动确认刷新) */}
      <PWAUpdatePrompt />
      {/* WebSocket 实时事件 toast(有人 star/collect 你的信时弹) */}
      <WSNotificationToast />
    </BrowserRouter>
  )
}

export default App
