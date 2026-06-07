/**
 * ============================================================
 *  TermsPage — 服务条款
 *  静态页(App Store 必填,需部署到 https://<domain>/terms)
 * ============================================================
 */
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'phosphor-react'
import { motion } from 'framer-motion'
import { LETTER_PALETTE } from '@/shared/components/LetterPaper/palette'

export default function TermsPage() {
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
          服务条款
        </h1>
      </header>

      <div className="flex-1 px-6 py-4 max-w-2xl mx-auto w-full pb-12">
        <p className="text-xs text-text-tertiary mb-4">最后更新:2026-06-07</p>

        <Section title="1. 服务说明">
          <p>小纸条(以下"我们")是一个让你写和收信件的应用。我们尽力保证服务稳定,但不保证 100% 可用性。</p>
        </Section>

        <Section title="2. 用户行为">
          <p>使用本服务时,你承诺不会:</p>
          <ul>
            <li>发布违法、暴力、色情、歧视、骚扰内容</li>
            <li>发布侵犯他人隐私、个人信息、知识产权的内容</li>
            <li>利用本服务进行商业广告、诈骗、传销</li>
            <li>攻击、破解、滥用本服务的接口或基础设施</li>
            <li>冒用他人身份发布内容</li>
          </ul>
          <p>违反者我们会删除内容、暂停或终止账号。</p>
        </Section>

        <Section title="3. 你的内容">
          <p>你写的所有信件内容归你所有。我们:</p>
          <ul>
            <li>不会读你的信(除非你主动联系客服并明确授权)</li>
            <li>不会把你的信用于训练 AI 模型</li>
            <li>不会展示你的信给除收件人外的其他人</li>
            <li>不会因为账号删除而保留你的信(完全删除)</li>
          </ul>
        </Section>

        <Section title="4. AI 润色 / 改写 / 翻译">
          <p>当你使用 AI 功能时:</p>
          <ul>
            <li>只有你点击"AI 润色"时,我们才把信内容发给 AI 服务(目前是 LongCat)</li>
            <li>AI 返回结果后,我们不持久化保存原始内容到 AI 服务端</li>
            <li>你可以选择不开启 AI 功能,完全手动写作</li>
          </ul>
        </Section>

        <Section title="5. 服务变更">
          <p>我们保留:</p>
          <ul>
            <li>随时修改或终止服务的权利(会提前 30 天通知)</li>
            <li>移除违反条款内容 / 账号的权利</li>
            <li>调整定价的权利(目前免费,未来加 Pro 版会提前通知)</li>
          </ul>
        </Section>

        <Section title="6. 免责">
          <p>本服务"按现状"提供。在法律允许范围内,我们不对以下情况负责:</p>
          <ul>
            <li>服务中断或数据丢失(虽然我们会尽力备份)</li>
            <li>用户间的内容冲突(我们不是内容仲裁)</li>
            <li>第三方服务故障(阿里云、LongCat、Sentry)</li>
            <li>用户因使用本服务造成的任何间接损失</li>
          </ul>
        </Section>

        <Section title="7. 法律适用">
          <p>本条款适用中华人民共和国法律。争议提交北京仲裁委员会仲裁。</p>
        </Section>

        <Section title="联系方式">
          <p className="font-mono text-sm">legal@feiman.letters</p>
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
