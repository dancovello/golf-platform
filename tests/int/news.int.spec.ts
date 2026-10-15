import { beforeAll, describe, expect, it } from 'vitest'

import type { News } from '@/payload-types'
import { loadNewsPost, NEWS_PER_PAGE, newsArchive } from '@/site/news'

import { seedWorld, type World } from './helpers/seed'

let w: World

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

const addNews = (data: Partial<News>, tenant = w.clubA.id) =>
  w.payload.create({
    collection: 'news',
    data: {
      title: 'An article',
      status: 'published',
      category: 'club',
      publishedAt: daysAgo(1),
      ...data,
      tenant,
    } as never,
  })

beforeAll(async () => {
  w = await seedWorld()
  // Club A: seven more live articles (eight with the seeded one), a draft and a future one.
  for (let i = 1; i <= 7; i++) {
    await addNews({
      title: `Course update ${i}`,
      category: i <= 3 ? 'course' : 'competitions',
      excerpt: i === 2 ? 'Greens are being hollow tined this week.' : null,
      publishedAt: daysAgo(i + 1),
    })
  }
  await addNews({ title: 'Draft piece', status: 'draft', slug: 'draft-piece' })
  await addNews({ title: 'Next month', slug: 'next-month', publishedAt: daysAgo(-30) })
})

describe('news article web addresses', () => {
  it('are made from the title when none is typed', () => {
    expect(w.newsA.slug).toBe('club-a-news')
  })

  it('stay within 80 characters when made from a long title', async () => {
    const long = await addNews({
      title: `${'Greens '.repeat(12)}update`.slice(0, 90),
      status: 'draft',
    })
    expect(long.slug?.length).toBeLessThanOrEqual(80)
    expect(long.slug).not.toMatch(/-$/)
  })

  it('can repeat across clubs but not within one club', async () => {
    expect(w.newsB.slug).toBe(w.newsA.slug)
    await expect(addNews({ title: 'Club A news' })).rejects.toThrow()
  })

  it('refuse anything but lower-case letters, numbers and dashes', async () => {
    await expect(addNews({ slug: 'Bad Address/..' })).rejects.toThrow()
  })
})

describe('news articles can only use their own club’s photos', () => {
  it('refuses another club’s photo as the main photo', async () => {
    await expect(
      w.payload.update({
        collection: 'news',
        id: w.newsA.id,
        data: { image: w.mediaB.id },
        user: w.editorA,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('refuses it even through a trusted script that skips the editor checks', async () => {
    await expect(addNews({ title: 'Borrowed photo', image: w.mediaB.id })).rejects.toThrow(
      /own photos|field is invalid/,
    )
  })

  it('accepts the club’s own photo', async () => {
    const saved = await w.payload.update({
      collection: 'news',
      id: w.newsA.id,
      data: { image: w.mediaA.id },
      user: w.editorA,
      overrideAccess: false,
    })
    expect(saved.image).toBeTruthy()
  })
})

describe('the website shows only live articles from its own club', () => {
  it('finds a published article by its address in its own club', async () => {
    const post = await loadNewsPost(w.clubA.id, 'club-a-news')
    expect(post?.title).toBe('Club A news')
    // Club B has an article at the same address; club B's site shows its own.
    expect((await loadNewsPost(w.clubB.id, 'club-a-news'))?.title).toBe('Club B news')
  })

  it('hides drafts and articles whose publish date has not arrived', async () => {
    expect(await loadNewsPost(w.clubA.id, 'draft-piece')).toBeNull()
    expect(await loadNewsPost(w.clubA.id, 'next-month')).toBeNull()
    const all = await newsArchive(w.clubA.id, { category: null, q: null, page: 1 })
    expect(all.total).toBe(8)
  })

  it('links an article to its older and newer neighbours, and up to six more to read', async () => {
    const post = await loadNewsPost(w.clubA.id, 'course-update-2')
    expect(post?.previous?.slug).toBe('course-update-3')
    expect(post?.next?.slug).toBe('course-update-1')
    expect(post?.more.map((p) => p.slug)).toEqual([
      'club-a-news',
      'course-update-1',
      'course-update-3',
      'course-update-4',
      'course-update-5',
      'course-update-6',
    ])
  })
})

describe('the news archive', () => {
  it('shows seven to a page (a lead story and six), newest first', async () => {
    const first = await newsArchive(w.clubA.id, { category: null, q: null, page: 1 })
    expect(first.cards).toHaveLength(NEWS_PER_PAGE)
    expect(first.cards[0].slug).toBe('club-a-news')
    expect(first.pages).toBe(2)
    const second = await newsArchive(w.clubA.id, { category: null, q: null, page: 2 })
    expect(second.cards.map((c) => c.slug)).toEqual(['course-update-7'])
  })

  it('filters by category, ignoring categories it doesn’t know', async () => {
    const course = await newsArchive(w.clubA.id, { category: 'course', q: null, page: 1 })
    expect(course.total).toBe(3)
    const unknown = await newsArchive(w.clubA.id, { category: 'nonsense', q: null, page: 1 })
    expect(unknown.category).toBeNull()
    expect(unknown.total).toBe(8)
  })

  it('searches titles and summaries', async () => {
    const found = await newsArchive(w.clubA.id, { category: null, q: 'hollow tined', page: 1 })
    expect(found.cards.map((c) => c.slug)).toEqual(['course-update-2'])
    const none = await newsArchive(w.clubA.id, { category: null, q: 'bunker', page: 1 })
    expect(none.total).toBe(0)
  })
})
