import type { MarketingFaqBlock, MarketingPricingBlock } from '@/payload-types'

import { marketingSettings } from '../../settings'
import { fillTokens } from '../../tokens'
import { FaqItem } from '../controls/interactive'
import { CalculatorClient } from './CalculatorClient'

/** The calculator, with every number from Settings. */
export const Pricing = async ({ block }: { block: MarketingPricingBlock }) => {
  const settings = await marketingSettings()
  const fill = (text: string | null | undefined) => fillTokens(text ?? '', settings)
  return (
    <CalculatorClient
      title={block.title}
      terms={fill(block.terms)}
      coursesText={block.coursesText ?? ''}
      comingNext={(block.comingNext ?? []).map((m) => ({ title: m.title, body: m.body }))}
      included={(block.included ?? []).map((i) => i.text)}
      footnote={fill(block.footnote)}
      price={settings.pricing?.monthlyPrice ?? 149}
      secondCourse={settings.pricing?.secondCoursePrice ?? null}
      vatLabel={settings.pricing?.vatLabel ?? '+ VAT'}
    />
  )
}

/** Committee questions (185:3944): a compact header beside the questions. */
export const Faq = async ({ block }: { block: MarketingFaqBlock }) => {
  const settings = await marketingSettings()
  return (
    <div className="mk-faq-section">
      <header className="mk-header mk-header--compact">
        <h2 className="mk-header-title">{block.title}</h2>
        {block.body ? <p className="mk-header-body">{block.body}</p> : null}
      </header>
      <div className="mk-faq-list">
        {block.items.map((item, i) => (
          <FaqItem key={item.id ?? i} question={item.question} defaultOpen={i === 0}>
            <p>{fillTokens(item.answer, settings)}</p>
          </FaqItem>
        ))}
      </div>
    </div>
  )
}

/** Section Header body text, with values from Settings filled in. */
export const Filled = async ({ text }: { text: string }) =>
  fillTokens(text, await marketingSettings())
