import type { Payload } from 'payload'

/**
 * The marketing pages as Figma has them (copy from the frames on the "Marketing site" page),
 * so Dan doesn't have to type them in. Added as drafts by the super-admin's "Add the Figma pages"
 * button; a page whose address already exists is never touched.
 *
 * Every factual line here has a row in docs/marketing-site/claims-register.md.
 */
export type StarterPage = { slug: string; title: string; description: string; layout: unknown[] }

// Home (Figma "Home — Desktop" 176:2178).
const home: StarterPage = {
  slug: 'home',
  title: 'Home',
  description:
    'Golf club websites your team can update in minutes. See a demo club, then book a demo or get your homepage rebuilt free.',
  layout: [
    {
      blockType: 'mkHomeHero',
      title: 'Your club is better\nthan your website.',
      subhead:
        'A golf club website your team can update in minutes, and that still looks professional when they’re done. Tee-time booking is coming next.',
      primary: { label: 'Book a demo', href: '/book-a-demo' },
      secondary: { label: 'Get your free homepage', href: '/switching' },
      proofLine: '{price} a month · No setup fee · Your homepage rebuilt free in two working days',
      note: 'Three demo clubs, one set of blocks.',
      noteStrong: 'Each still looks like its own club.',
    },
    {
      blockType: 'mkSectionHeader',
      eyebrow: 'Why it matters',
      title: 'Most visitors meet your\nclub online first.',
      subhead:
        'Golfers look at the website before they book, visit or join. It’s where they decide whether the club is for them.',
      align: 'left',
    },
    {
      blockType: 'mkProofStats',
      // Sources exactly as the hand-off lists them (§9).
      stats: [
        {
          number: '84%',
          claim:
            'of visiting golfers are highly likely to look at a club’s website before they visit.',
          source: 'Golfshake survey, reported by The Golf Business · 13 Jan 2022',
        },
        {
          number: '64%',
          claim:
            'of golfers research a course online before booking. For under-65s it’s around 75%.',
          source: 'Golfshake survey of 800+ golfers · 24 Jul 2026',
        },
        {
          number: '3.44 / 5',
          claim: 'is how members rated their own club’s website.',
          source: 'Golfshake member survey, via The Golf Business · Jan 2022',
        },
      ],
    },
    {
      blockType: 'mkCompare',
      good: {
        label: 'A great website',
        title: 'The club sells itself.',
        points: [
          { text: 'Visitors book because the course looks as good as it plays.' },
          {
            text: 'Members find the draw, the course report and green fees without ringing the office.',
          },
          { text: 'A prospective member sees a well-run club before they ever visit.' },
          { text: 'Societies, sponsors and wedding parties take the club seriously.' },
        ],
      },
      poor: {
        label: 'A poor website',
        title: 'The club has to explain itself.',
        points: [
          {
            text: 'Nearly half of what people say about trusting a website is about how it looks.¹',
          },
          {
            text: 'Over half of phone visitors leave a page that takes more than three seconds to load.²',
          },
          { text: 'Out-of-date fees and fixtures send members to the phone instead.' },
          { text: 'The course, the food and the people never get seen.' },
        ],
      },
      footnotes:
        '¹ Stanford Persuasive Technology Lab (Fogg et al.), How Do People Evaluate a Web Site’s Credibility?, 2002.   ² Google, The Need for Mobile Speed, 2016.',
    },
    {
      blockType: 'mkSectionHeader',
      eyebrow: 'The editor',
      title: 'What you type is\nwhat members see.',
      subhead:
        'Edit the page as it looks on the site. Publish when it’s right, and members see it on their next visit.',
      align: 'center',
    },
    {
      blockType: 'mkEditLive',
      headline: 'Spring open week starts Saturday',
      toggleLabel: 'Show visitor tee times button',
    },
    {
      blockType: 'mkSectionHeader',
      title: 'The site keeps up\nwith the club.',
      subhead:
        'Course status on Monday, the Captain’s Day draw on Wednesday, winter green fees on Friday. Whoever’s on duty can post it, without waiting for anyone.',
      align: 'left',
    },
    {
      blockType: 'mkWeek',
      moments: [
        {
          time: 'Mon 06:12',
          preview: 'courseStatus',
          title: 'The course report, first thing',
          body: 'Conditions go up before the first tee time. Members check before they set off.',
        },
        {
          time: 'Wed 09:30',
          preview: 'news',
          title: 'Captain’s Day draw is out',
          body: 'Write it once. It shows on the homepage and the news page.',
        },
        {
          time: 'Fri 16:00',
          preview: 'greenFees',
          title: 'Winter green fees go in',
          body: 'Change the rate in one place. Every page that shows it follows.',
        },
        {
          time: 'Sat 08:15',
          preview: 'holeGuide',
          title: 'A new back tee on the 7th',
          body: 'The pro adds it to the hole guide. The yardages follow.',
        },
      ],
    },
    {
      blockType: 'mkSectionHeader',
      eyebrow: 'Switching',
      title: 'Your content\ncomes with you.',
      subhead:
        'We copy the pages, news, photos and documents from your current site, then build the new one with you. You start from your club, not a blank page.',
      align: 'left',
    },
    {
      blockType: 'mkContentMoves',
      found: [
        { label: 'Pages', count: '34' },
        { label: 'News posts', count: '126' },
        { label: 'Photos', count: '212' },
        { label: 'Course and hole details', count: '18 holes' },
        { label: 'PDFs and documents', count: '19' },
      ],
      built: [
        { label: 'Hero · Heritage' },
        { label: 'Course guide' },
        { label: 'Green fees' },
        { label: 'News' },
        { label: 'Documents' },
      ],
      chip: 'Copied across with AI',
      steps: [
        {
          title: 'We read your whole site',
          body: 'AI copies your pages, news posts, photos and PDFs, so nobody has to retype a thing.',
        },
        {
          title: 'We rebuild it in blocks',
          body: 'Your content goes into the same blocks as our demo club, in your colours.',
        },
        {
          title: 'You shape it with us',
          body: 'We go through it together and change anything you want before it goes live.',
        },
      ],
    },
    { blockType: 'mkFounder' },
    {
      blockType: 'mkCtaBand',
      title: 'See your club on it.',
      subhead: 'We’ll rebuild your homepage in your colours and send it straight to you, free.',
      primary: { label: 'Book a demo', href: '/book-a-demo' },
      secondary: { label: 'Get your free homepage', href: '/switching' },
    },
  ],
}

export const STARTER_PAGES: StarterPage[] = [home]

/** Adds each starter page as a draft unless its address is taken. Returns what happened. */
export const addStarterPages = async (payload: Payload) => {
  const added: string[] = []
  const skipped: string[] = []
  for (const page of STARTER_PAGES) {
    const { totalDocs } = await payload.count({
      collection: 'marketing-pages',
      where: { slug: { equals: page.slug } },
      overrideAccess: true,
    })
    if (totalDocs > 0) {
      skipped.push(page.title)
      continue
    }
    await payload.create({
      collection: 'marketing-pages',
      draft: true,
      overrideAccess: true,
      data: {
        _status: 'draft',
        title: page.title,
        slug: page.slug,
        meta: { description: page.description },
        layout: page.layout,
      } as never,
    })
    added.push(page.title)
  }
  return { added, skipped }
}
