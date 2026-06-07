/**
 * ============================================================
 *  LanguageSwitcher — 顶栏语言切换
 *
 *  极简:右上角小按钮,点击在 zh-CN / en 间切
 *  持久:localStorage('feiman_lang')
 * ============================================================
 */
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Globe } from 'phosphor-react'

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { i18n } = useTranslation()
  const isEn = i18n.language.startsWith('en')

  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={() => i18n.changeLanguage(isEn ? 'zh-CN' : 'en')}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/80 border border-black/5 text-[12px] font-medium text-text-secondary ${className}`}
      aria-label="Switch language"
    >
      <Globe size={14} weight="regular" />
      <span>{isEn ? 'EN' : '中'}</span>
    </motion.button>
  )
}
