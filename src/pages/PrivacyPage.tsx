/**
 * ============================================================
 *  PrivacyPage — 隐私政策
 *  静态页,中文优先(App Store 必填,需部署到 https://<domain>/privacy)
 * ============================================================
 */
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'phosphor-react'
import { motion } from 'framer-motion'
import { LETTER_PALETTE } from '@/shared/components/LetterPaper/palette'

export default function PrivacyPage() {
  const navigate = useNavigate()
  return (
    <div className="h-full flex flex-col overflow-y-auto" style={{ backgroundColor: LETTER_PALETTE.ivory }}>
      <header className="flex items-center gap-3 px-4 pt-4 pb-3 shrink-0 sticky top-0 z-10" style={{ backgroundColor: LETTER_PALETTE.ivory }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/80 border border-black/5 flex items-center justify-center shadow-sm"
        >
          <ArrowLeft size={18} weight="regular" className="text-text" />
        </motion.button>
        <h1 className="font-semibold text-text text-base" style={{ fontFamily: '"Noto Serif SC","Songti SC",serif' }}>
          隐私政策
        </h1>
      </header>

      <div className="flex-1 px-6 py-4 max-w-2xl mx-auto w-full pb-12">
        <p className="text-xs text-text-tertiary mb-4">最后更新:2026-06-07</p>

        <Section title="我们收集什么">
          <p>为了让你使用小纸条的服务,我们只收集最少必要的信息:</p>
          <ul>
            <li><strong>账号信息</strong>:邮箱或手机号(用于登录)</li>
            <li><strong>头像</strong>(可选):你上传的图片</li>
            <li><strong>信内容</strong>:你写的、收藏的、收到的信</li>
            <li><strong>设备信息</strong>:浏览器类型、操作系统(用于错误监控,可选)</li>
          </ul>
        </Section>

        <Section title="我们不收集什么">
          <ul>
            <li>不在你未授权时收集位置信息</li>
            <li>不收集通讯录、短信、相册(除非你主动选择)</li>
            <li>不卖给任何第三方你的个人信息</li>
            <li>不展示第三方广告</li>
          </ul>
        </Section>

        <Section title="第三方服务">
          <p>为了让服务可用,我们使用以下第三方(均在中国大陆或国际通用):</p>
          <ul>
            <li><strong>阿里云 OSS</strong>:存储你上传的头像和插图</li>
            <li><strong>阿里云短信</strong>:发送手机验证码(只在手机号登录时)</li>
            <li><strong>LongCat AI</strong>:AI 润色 / 改写 / 翻译(只在你主动使用时)</li>
            <li><strong>Sentry</strong>:错误监控(只收集 JS 错误栈和设备信息,不含信内容)</li>
          </ul>
          <p>这些服务各自有自己的隐私政策,数据通过 HTTPS 加密传输。</p>
        </Section>

        <Section title="你的权利">
          <p>你对自己的数据拥有完全的权利:</p>
          <ul>
            <li><strong>导出</strong>:在 App 内请求,我们打包你的所有信件和账号信息为 JSON</li>
            <li><strong>删除</strong>:在 App 内一键删除账号(连带所有信件)</li>
            <li><strong>更正</strong>:昵称、头像、邮箱可随时修改</li>
            <li><strong>撤回同意</strong>:随时可以停用 AI 润色、Sentry 监控等可选功能</li>
          </ul>
        </Section>

        <Section title="Cookies 与本地存储">
          <p>我们使用浏览器 localStorage 存储:</p>
          <ul>
            <li>登录 token(access + refresh)</li>
            <li>语言偏好(中/英)</li>
            <li>主题偏好(预留)</li>
          </ul>
          <p>不投放广告 cookies,不跨站追踪。</p>
        </Section>

        <Section title="未成年人">
          <p>本应用面向 13 岁以上用户。未满 13 岁的儿童请在父母或监护人陪同下使用。如发现 13 岁以下用户,我们会主动删除其账号和数据。</p>
        </Section>

        <Section title="政策变更">
          <p>如果本政策有重大变更,我们会在 App 内通知。继续使用即视为同意新政策。</p>
        </Section>

        <Section title="联系方式">
          <p>如有任何隐私问题,请邮件联系:</p>
          <p className="font-mono text-sm">privacy@feiman.letters</p>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-lg font-semibold text-text mb-2" style={{ fontFamily: '"Noto Serif SC","Songti SC",serif' }}>
        {title}
      </h2>
      <div className="text-sm text-text-secondary leading-relaxed space-y-2 [&>ul]:list-disc [&>ul]:ml-5 [&>ul]:space-y-1 [&>strong]:font-semibold [&>strong]:text-text">
        {children}
      </div>
    </section>
  )
}
