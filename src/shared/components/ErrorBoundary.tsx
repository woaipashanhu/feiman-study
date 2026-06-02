import { Component, type ReactNode } from 'react'
import { reportError } from '@/shared/utils/error-reporter'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  /** 用于标识这个 ErrorBoundary 的位置，帮助定位错误 */
  location?: string
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo: errorInfo.componentStack || undefined })

    // 自动上报错误（包含位置信息）
    reportError(error, {
      type: 'react_error_boundary',
      location: this.props.location || 'unknown',
      componentStack: errorInfo.componentStack,
    })

    // 开发环境额外打印
    if (import.meta.env.DEV) {
      console.group(`[ErrorBoundary] ${this.props.location || 'unknown'}`)
      console.error('错误:', error)
      console.log('组件栈:', errorInfo.componentStack)
      console.groupEnd()
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleCopyDetails = () => {
    const details = `
错误信息: ${this.state.error?.message || '未知'}
位置: ${this.props.location || 'unknown'}
页面: ${window.location.href}
时间: ${new Date().toISOString()}
堆栈: ${this.state.error?.stack || '无'}
组件栈: ${this.state.errorInfo || '无'}
    `.trim()

    navigator.clipboard.writeText(details).then(() => {
      alert('错误详情已复制到剪贴板，可以粘贴给开发者')
    }).catch(() => {
      // 复制失败时显示在页面上
      const el = document.createElement('textarea')
      el.value = details
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      alert('错误详情已复制到剪贴板')
    })
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 默认错误 UI
      return (
        <div className="flex flex-col items-center justify-center min-h-[50dvh] gap-4 px-6">
          <div className="text-4xl">😵</div>
          <h2 className="text-lg font-semibold text-text">页面出错了</h2>
          <p className="text-sm text-text-secondary text-center">
            加载过程中出现了问题，请刷新重试
          </p>

          {/* 开发环境显示详细错误信息 */}
          {import.meta.env.DEV && (
            <div className="w-full max-w-md mt-4 p-4 bg-red-50 rounded-xl border border-red-200 text-left">
              <p className="text-xs font-mono text-red-700 break-all">
                <strong>错误:</strong> {this.state.error?.message}
              </p>
              {this.props.location && (
                <p className="text-xs font-mono text-red-600 mt-1">
                  <strong>位置:</strong> {this.props.location}
                </p>
              )}
              <details className="mt-2">
                <summary className="text-xs text-red-500 cursor-pointer">查看堆栈</summary>
                <pre className="text-[10px] text-red-800 mt-2 overflow-auto max-h-40 whitespace-pre-wrap">
                  {this.state.error?.stack}
                </pre>
              </details>
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 bg-brand text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all"
            >
              刷新页面
            </button>
            <button
              onClick={this.handleCopyDetails}
              className="px-5 py-2.5 bg-surface border border-border text-text rounded-xl text-sm font-medium hover:bg-surface-hover transition-all"
            >
              复制错误信息
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
