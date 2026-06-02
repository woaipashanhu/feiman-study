import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initGlobalErrorListeners } from '@/shared/utils/error-reporter'

// 初始化全局错误监听（生产环境自动收集错误）
initGlobalErrorListeners()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
