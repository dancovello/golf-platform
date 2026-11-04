// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

import { blockIndexOf } from '@/admin/blockRow'
import { blockElements, isHighlightMessage } from '@/site/blockHighlight'

const page = (html: string) => {
  document.body.innerHTML = html
  return document.body
}

describe('finding the block being edited in the page editor', () => {
  it('finds the block row around a field', () => {
    page('<div id="layout-row-2"><div><input id="f"></div></div>')
    expect(blockIndexOf(document.getElementById('f'))).toBe(2)
  })

  it('is null outside every block, and for rows inside a block', () => {
    page(
      '<input id="title"><div id="layout-row-1"><div id="layout-0-cards-row-3"><input id="n"></div></div>',
    )
    expect(blockIndexOf(document.getElementById('title'))).toBeNull()
    expect(blockIndexOf(document.getElementById('n'))).toBe(1)
    expect(blockIndexOf(null)).toBeNull()
  })
})

describe('finding a block in the live preview', () => {
  const html = `<main><h1 class="visually-hidden">T</h1>
    <section id="a"></section><template data-block-end="0"></template>
    <section id="b"></section><div id="b2"></div><template data-block-end="1"></template>
    <template data-block-end="2"></template>
    <section id="d"></section><template data-block-end="3"></template></main>`

  it('returns everything a block drew, and nothing from its neighbours', () => {
    const root = page(html)
    expect(blockElements(root, 0).map((e) => e.id)).toEqual(['a'])
    expect(blockElements(root, 1).map((e) => e.id)).toEqual(['b', 'b2'])
    expect(blockElements(root, 3).map((e) => e.id)).toEqual(['d'])
  })

  it('is empty for a block that drew nothing or does not exist', () => {
    const root = page(html)
    expect(blockElements(root, 2)).toEqual([])
    expect(blockElements(root, 9)).toEqual([])
  })
})

describe('the message between the editor and the preview', () => {
  it('accepts a block position or null, and nothing else', () => {
    expect(isHighlightMessage({ type: 'golf-highlight-block', index: 0 })).toBe(true)
    expect(isHighlightMessage({ type: 'golf-highlight-block', index: null })).toBe(true)
    expect(isHighlightMessage({ type: 'golf-highlight-block', index: -1 })).toBe(false)
    expect(isHighlightMessage({ type: 'golf-highlight-block', index: '1' })).toBe(false)
    expect(isHighlightMessage({ type: 'other', index: 1 })).toBe(false)
    expect(isHighlightMessage('golf-highlight-block')).toBe(false)
  })
})
