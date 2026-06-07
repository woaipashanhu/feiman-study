/**
 * ============================================================
 *  i18n.ts — V3.8 国际化(中/英)
 *
 *  用法:
 *    import { useTranslation } from 'react-i18next'
 *    const { t, i18n } = useTranslation()
 *    t('app.name')  // '小纸条' / 'Letters'
 *    i18n.changeLanguage('en')  // 切换
 *
 *  自动检测: navigator.language(浏览器语言)
 *  切换持久: localStorage('feiman_lang')
 *  fallback: zh-CN
 * ============================================================
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zhCN from './locales/zh-CN.json'
import en from './locales/en.json'

const STORAGE_KEY = 'feiman_lang'

const savedLang = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
const browserLang = typeof navigator !== 'undefined' ? navigator.language : 'zh-CN'
const initialLang = savedLang || (browserLang.startsWith('en') ? 'en' : 'zh-CN')

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { translation: zhCN },
      en: { translation: en },
    },
    lng: initialLang,
    fallbackLng: 'zh-CN',
    interpolation: {
      escapeValue: false,  // React 已经 escape
    },
  })

// 切换语言时持久化
if (typeof window !== 'undefined') {
  const origChange = i18n.changeLanguage.bind(i18n)
  i18n.changeLanguage = (lang: string) => {
    localStorage.setItem(STORAGE_KEY, lang)
    return origChange(lang)
  }
}

export default i18n
