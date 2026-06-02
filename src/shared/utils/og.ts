/**
 * OG (Open Graph) 动态标签设置
 * 用于微信分享、社交媒体卡片
 */

interface OGMeta {
  title: string
  description?: string
  image?: string
  url?: string
}

export function setOGMeta({ title, description, image, url }: OGMeta) {
  document.title = title

  const setMeta = (property: string, content: string) => {
    let meta = document.querySelector(`meta[property="${property}"]`)
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('property', property)
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', content)
  }

  setMeta('og:title', title)
  if (description) setMeta('og:description', description)
  if (image) setMeta('og:image', image)
  if (url) setMeta('og:url', url)

  // 微信专用
  const setWechatMeta = (name: string, content: string) => {
    let meta = document.querySelector(`meta[name="${name}"]`)
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', name)
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', content)
  }

  setWechatMeta('description', description || '探索数学、科学与社会的奇妙世界')
}

export function resetOGMeta() {
  setOGMeta({
    title: '费曼科学课',
    description: '探索数学、科学与社会的奇妙世界',
    url: window.location.href,
  })
}
