/**
 * ============================================================
 *  开发调试面板 — 在页面右下角显示最近的错误
 *
 *  只在开发环境显示，生产环境自动隐藏
 *  功能:
 *    - 实时显示捕获到的 JS 错误
 *    - 点击展开查看完整堆栈
 *    - 一键复制错误详情
 *    - 清除所有错误记录
 *
 *  使用: 直接放在 App.tsx 中即可
 * ============================================================
 */
import { useState, useEffect, useCallback } from 'react'
import { X, Copy, Trash, CaretDown, CaretUp, Bug } from 'phosphor-react'

interface CapturedError {
  id: number
  message: string
  stack?: string
  source?: string
  type: 'js' | 'promise' | 'react' | 'resource'
  timestamp: Date
}

let errorId = 0
const errors: CapturedError[] = []
const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach(fn => fn())
}

/** 供 error-reporter.ts 调用，注册错误 */
export function registerDevError(error: Omit<CapturedError, 'id' | 'timestamp'>) {
  if (import.meta.env.PROD) return
  errors.unshift({
    id: ++errorId,
    timestamp: new Date(),
    ...error,
  })
  // 最多保留 20 条
  if (errors.length > 20) errors.pop()
  notifyListeners()
}

/** 拦截原始 console.error，捕获 React 警告 */
const originalConsoleError = console.error
console.error = function (...args: unknown[]) {
  originalConsoleError.apply(console, args)

  if (import.meta.env.PROD) return

  // 过滤掉 React 的 StrictMode 重复渲染警告
  const firstArg = String(args[0] || '')
  if (firstArg.includes('StrictMode') || firstArg.includes('findDOMNode')) return

  // 捕获 Minified React error
  if (firstArg.includes('Minified React error')) {
    registerDevError({
      message: firstArg.slice(0, 200),
      stack: args.map(a => String(a)).join('\n'),
      type: 'react',
    })
  }
}

export function DevErrorPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [, forceUpdate] = useState({})

  useEffect(() => {
    const fn = () => forceUpdate({})
    listeners.add(fn)
    return () => { listeners.delete(fn) }
  }, [])

  const handleClear = useCallback(() => {
    errors.length = 0
    forceUpdate({})
  }, [])

  const handleCopy = useCallback((err: CapturedError) => {
    const text = `
[${err.type.toUpperCase()}] ${err.message}
时间: ${err.timestamp.toLocaleTimeString()}
来源: ${err.source || 'unknown'}
堆栈:
${err.stack || '无'}
    `.trim()
    navigator.clipboard.writeText(text)
  }, [])

  // 生产环境不渲染
  if (import.meta.env.PROD) return null

  if (errors.length === 0) {
    return (
      <div
        className="fixed bottom-20 right-4 z-[9999] flex items-center gap-1.5 px-3 py-1.5 bg-green-500/90 text-white rounded-full text-xs font-medium shadow-lg cursor-pointer hover:bg-green-600 transition-colors"
        onClick={() => setIsOpen(true)}
        title="暂无错误，点击打开面板"
      >
        <Bug size={14} weight="fill" />
        正常
      </div>
    )
  }

  if (!isOpen) {
    return (
      <div
        className="fixed bottom-20 right-4 z-[9999] flex items-center gap-1.5 px-3 py-1.5 bg-red-500/90 text-white rounded-full text-xs font-medium shadow-lg cursor-pointer hover:bg-red-600 transition-colors animate-pulse"
        onClick={() => setIsOpen(true)}
        title={`${errors.length} 个错误，点击查看`}
      >
        <Bug size={14} weight="fill" />
        {errors.length} 个错误
      </div>
    )
  }

  return (
    <div className="fixed bottom-20 right-4 z-[9999] w-96 max-h-[60vh] bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-red-50">
        <div className="flex items-center gap-2">
          <Bug size={16} className="text-red-500" weight="fill" />
          <span className="text-sm font-semibold text-red-700">
            错误面板 ({errors.length})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
            title="清除所有"
          >
            <Trash size={14} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
            title="关闭"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 错误列表 */}
      <div className="overflow-y-auto flex-1 p-2 space-y-1">
        {errors.map((err) => (
          <div
            key={err.id}
            className="rounded-xl border border-red-100 bg-red-50/50 overflow-hidden"
          >
            <button
              className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-red-50 transition-colors"
              onClick={() => setExpandedId(expandedId === err.id ? null : err.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`
                    text-[10px] px-1.5 py-0.5 rounded font-bold uppercase
                    ${err.type === 'react' ? 'bg-purple-100 text-purple-700' : ''}
                    ${err.type === 'js' ? 'bg-red-100 text-red-700' : ''}
                    ${err.type === 'promise' ? 'bg-orange-100 text-orange-700' : ''}
                    ${err.type === 'resource' ? 'bg-yellow-100 text-yellow-700' : ''}
                  `}>
                    {err.type}
                  </span>
                  <span className="text-xs text-red-800 truncate">
                    {err.message.slice(0, 60)}
                  </span>
                </div>
                <div className="text-[10px] text-red-400 mt-0.5">
                  {err.timestamp.toLocaleTimeString()}
                  {err.source && ` · ${err.source}`}
                </div>
              </div>
              <div className="flex items-center gap-0.5 ml-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleCopy(err) }}
                  className="p-1 rounded hover:bg-red-100 text-red-400 transition-colors"
                  title="复制"
                >
                  <Copy size={12} />
                </button>
                {expandedId === err.id ? <CaretUp size={14} /> : <CaretDown size={14} />}
              </div>
            </button>

            {expandedId === err.id && (
              <div className="px-3 pb-2">
                <pre className="text-[10px] text-red-700 bg-red-100/50 rounded-lg p-2 overflow-auto max-h-40 whitespace-pre-wrap font-mono">
                  {err.stack || '无堆栈信息'}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
