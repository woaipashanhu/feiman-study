/**
 * ⚠️ DEPRECATED — V3 不再使用
 * 移到 _legacy/ 防止误用。如确需恢复,从 git history 找回。
 * V3.8 死代码清理 — 2026-06-07
 *
 */

import { ShareNetwork, Download } from 'phosphor-react'

/**
 * ============================================================
 *  分享按钮 + 海报生成（架构 §七.4）
 *
 *  功能：
 *    1. 原生 Web Share API（移动端首选）
 *    2. 降级：复制链接
 *    3. 海报生成：Canvas 绘制精美分享卡片 → 保存图片
 * ============================================================
 */

interface ShareButtonProps {
  title: string
  description?: string
  url?: string
  posterData?: {
    subtitle?: string
    statsText?: string
    emoji?: string
  }
}

export async function generatePoster(data: {
  title: string
  description?: string
  subtitle?: string
  statsText?: string
  emoji?: string
}): Promise<string> {
  const W = 750
  const H = 1000

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // 背景渐变（品牌色调）
  const bgGrad = ctx.createLinearGradient(0, 0, W, H)
  bgGrad.addColorStop(0, '#4F6EF7')
  bgGrad.addColorStop(0.5, '#6B8CFD')
  bgGrad.addColorStop(1, '#A5B8FF')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, W, H)

  // 装饰圆圈
  ctx.globalAlpha = 0.08
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(W - 80, 120, 150, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(60, H - 200, 100, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  // 顶部品牌区
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.font = 'bold 42px Inter, PingFang SC, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('🦊 费曼科学课', W / 2, 90)

  ctx.font = '24px Inter, PingFang SC, system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.fillText('探索数学、科学与社会的奇妙世界', W / 2, 135)

  // 中间白色卡片
  const cardX = 40
  const cardY = 180
  const cardW = W - 80
  const cardH = 520
  roundRect(ctx, cardX, cardY, cardW, cardH, 24)
  ctx.fillStyle = '#fff'
  ctx.fill()

  // Emoji 装饰
  if (data.emoji) {
    ctx.font = '72px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(data.emoji, W / 2, cardY + 90)
  }

  // 主标题
  ctx.fillStyle = '#1A1D2B'
  ctx.font = 'bold 38px Inter, PingFang SC, system-ui, sans-serif'
  ctx.textAlign = 'center'
  wrapText(ctx, data.title, cardX + 30, cardY + (data.emoji ? 140 : 70), cardW - 60, 52)

  // 副标题
  if (data.subtitle) {
    ctx.fillStyle = '#4F6EF7'
    ctx.font = '28px Inter, PingFang SC, system-ui, sans-serif'
    ctx.fillText(data.subtitle, W / 2, cardY + (data.emoji ? 195 : 125))
  }

  // 分割线
  ctx.strokeStyle = '#eee'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(cardX + 60, cardY + (data.subtitle ? 230 : 160))
  ctx.lineTo(cardX + cardW - 60, cardY + (data.subtitle ? 230 : 160))
  ctx.stroke()

  // 描述文字
  if (data.description) {
    ctx.fillStyle = '#555'
    ctx.font = '26px Inter, PingFang SC, system-ui, sans-serif'
    ctx.textAlign = 'left'
    wrapText(ctx, data.description, cardX + 40, cardY + (data.subtitle ? 275 : 205), cardW - 80, 42)
  }

  // 统计文字
  if (data.statsText) {
    ctx.fillStyle = '#4F6EF7'
    ctx.font = 'bold 26px Inter, PingFang SC, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`✨ ${data.statsText}`, W / 2, cardY + cardH - 50)
  }

  // 底部引导区
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = '22px Inter, PingFang SC, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('长按识别二维码体验课程', W / 2, H - 110)

  // 二维码占位框
  const qrSize = 100
  const qrX = W / 2 - qrSize / 2
  const qrY = H - 95
  ctx.fillStyle = '#fff'
  roundRect(ctx, qrX, qrY, qrSize, qrSize, 8)
  ctx.fill()
  ctx.strokeStyle = '#ddd'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.fillStyle = '#ccc'
  ctx.font = '16px Inter, PingFang SC, system-ui, sans-serif'
  ctx.fillText('QR Code', W / 2, qrY + qrSize / 2 + 6)

  return canvas.toDataURL('image/png')
}

export async function downloadPoster(posterDataUrl: string, filename?: string): Promise<void> {
  const link = document.createElement('a')
  link.href = posterDataUrl
  link.download = filename || `feiman-poster-${Date.now()}.png`
  link.click()
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  let currentY = y
  let line = ''
  for (const char of text) {
    const testLine = line + char
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && line !== '') {
      ctx.fillText(line, x, currentY)
      line = char
      currentY += lineHeight
    } else {
      line = testLine
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY)
  }
}

export function ShareButton({ title, description, url, posterData }: ShareButtonProps) {
  const handleShare = async () => {
    const shareData = {
      title: title || '费曼科学课',
      text: description || '探索数学、科学与社会的奇妙世界',
      url: url || window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
        return
      } catch {
        // 用户取消或失败
      }
    }

    try {
      await navigator.clipboard.writeText(shareData.url)
      alert('链接已复制到剪贴板 ✅')
    } catch {
      alert('分享功能暂不可用')
    }
  }

  const handlePoster = async () => {
    try {
      const posterUrl = await generatePoster({
        title,
        description,
        subtitle: posterData?.subtitle,
        statsText: posterData?.statsText,
        emoji: posterData?.emoji || '🎓',
      })
      await downloadPoster(posterUrl)
    } catch (err) {
      console.error('海报生成失败:', err)
      alert('海报生成失败，请稍后重试')
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleShare}
        className="p-2 rounded-lg hover:bg-white/10 active:scale-95 transition-all"
        aria-label="分享"
        title="分享"
      >
        <ShareNetwork size={20} weight="fill" className="text-white" />
      </button>
      <button
        onClick={handlePoster}
        className="p-2 rounded-lg hover:bg-white/10 active:scale-95 transition-all"
        aria-label="保存海报"
        title="保存海报"
      >
        <Download size={20} weight="fill" className="text-white" />
      </button>
    </div>
  )
}
