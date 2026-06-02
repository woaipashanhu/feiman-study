import type { BilingualText } from './types'

type Lang = 'zh' | 'en'

function renderBilingual(t: BilingualText, lang: Lang): string {
  if (typeof t === 'string') return t
  return t[lang] ?? t.zh
}

interface ThoughtBubbleCardProps {
  thought: { character: string; characterColor: string; text: BilingualText }
  lang: Lang
  showDivider?: boolean
}

export default function ThoughtBubbleCard({ thought, lang, showDivider }: ThoughtBubbleCardProps) {
  const text = renderBilingual(thought.text, lang)
  const label = thought.character
  const initial = label.replace('在想', '').replace('说', '').charAt(0)

  return (
    <div>
      {showDivider && <div className="h-2" />}
      <div className="bg-white rounded-xl p-2.5 shadow-soft border-l-[3px]"
        style={{ borderColor: thought.characterColor }}>
        <div className="flex items-center gap-1 mb-1">
          <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
            style={{ backgroundColor: thought.characterColor }}>
            {initial}
          </div>
          <span className="text-[10px] font-semibold" style={{ color: thought.characterColor }}>{label}</span>
        </div>
        <p className="text-[13px] text-bark/85 leading-relaxed">{text}</p>
      </div>
    </div>
  )
}

export type { Lang }
export { renderBilingual }
