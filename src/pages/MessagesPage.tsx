/**
 * ============================================================
 *  消息中心页面
 *
 *  类似微信的消息列表，展示系统通知、学习提醒等
 * ============================================================
 */
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ChatCircleDots, Trash, CheckCircle } from 'phosphor-react'
import { useState } from 'react'

interface Message {
  id: string
  title: string
  content: string
  time: string
  unread: boolean
  type: 'system' | 'study' | 'achievement'
}

const mockMessages: Message[] = [
  {
    id: '1',
    title: '系统通知',
    content: '欢迎使用费曼科学课！开始你的学习之旅吧。',
    time: '今天',
    unread: true,
    type: 'system',
  },
  {
    id: '2',
    title: '学习提醒',
    content: '你已经连续学习了3天，继续保持！',
    time: '昨天',
    unread: true,
    type: 'study',
  },
  {
    id: '3',
    title: '成就解锁',
    content: '恭喜获得「初次探索」成就！',
    time: '2天前',
    unread: false,
    type: 'achievement',
  },
]

const typeIcons = {
  system: <ChatCircleDots size={20} weight="fill" className="text-brand" />,
  study: <CheckCircle size={20} weight="fill" className="text-green-500" />,
  achievement: <ChatCircleDots size={20} weight="fill" className="text-amber-500" />,
}

const typeColors = {
  system: 'bg-brand/10',
  study: 'bg-green-500/10',
  achievement: 'bg-amber-500/10',
}

export default function MessagesPage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>(mockMessages)

  const markAsRead = (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, unread: false } : m))
    )
  }

  const deleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }

  const unreadCount = messages.filter((m) => m.unread).length

  return (
    <div className="h-full flex flex-col bg-bg">
      {/* 顶部栏 */}
      <header className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center shadow-sm"
          >
            <ArrowLeft size={18} weight="regular" className="text-text" />
          </motion.button>
          <div>
            <h1 className="text-lg font-bold text-text font-display">消息中心</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-text-secondary">{unreadCount} 条未读</p>
            )}
          </div>
        </div>

        {messages.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMessages((prev) => prev.map((m) => ({ ...m, unread: false })))}
            className="text-sm text-brand px-3 py-1.5 rounded-lg hover:bg-brand/5 transition-colors"
          >
            全部已读
          </motion.button>
        )}
      </header>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-secondary">
            <ChatCircleDots size={48} weight="thin" className="text-border mb-4" />
            <p>暂无消息</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-3 p-4 hover:bg-surface-hover transition-colors cursor-pointer ${
                  message.unread ? 'bg-brand/5' : ''
                }`}
                onClick={() => markAsRead(message.id)}
              >
                {/* 图标 */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeColors[message.type]}`}>
                  {typeIcons[message.type]}
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-sm font-semibold text-text">{message.title}</h3>
                    <span className="text-xs text-text-tertiary">{message.time}</span>
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-2">{message.content}</p>
                </div>

                {/* 未读红点 + 删除 */}
                <div className="flex items-center gap-2 shrink-0">
                  {message.unread && (
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                  )}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteMessage(message.id)
                    }}
                    className="p-1.5 rounded-lg text-text-tertiary hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash size={14} />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
