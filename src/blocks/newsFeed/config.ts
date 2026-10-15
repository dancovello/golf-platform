import type { Block } from 'payload'

import { NEWS_CATEGORIES } from '../../collections/newsCategories'
import { styleField } from '../shared'
import type { BlockDefinition } from '../types'

/** News (doc 14). One block, three design styles; always the club's latest published news. */
const config: Block = {
  slug: 'newsFeed',
  labels: { singular: 'Latest news', plural: 'Latest news' },
  interfaceName: 'NewsFeedBlock',
  fields: [
    styleField([
      { label: 'A · Card carousel: photo cards, ending on "All news"', value: 'carousel' },
      {
        label: 'B · Lead + list: the latest story large, three headlines beside it',
        value: 'leadList',
      },
      { label: 'C · Headlines: text only on the brand colour, for few photos', value: 'headlines' },
    ]),
    {
      name: 'eyebrow',
      label: 'Small line above the heading',
      type: 'text',
      defaultValue: 'News',
      maxLength: 40,
    },
    { name: 'heading', label: 'Heading', type: 'text', required: true, maxLength: 60 },
    {
      name: 'category',
      label: 'Only this category (optional)',
      type: 'select',
      options: [...NEWS_CATEGORIES],
      admin: { description: 'Leave empty for all news.' },
    },
  ],
}

export const newsFeed: BlockDefinition = { config, refs: () => [] }
