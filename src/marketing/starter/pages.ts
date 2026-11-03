import type { Payload } from 'payload'

import { BRAND } from '@/brand'
import { rt } from '@/demo/richText'

/**
 * The marketing pages as Figma has them (copy from the frames on the "Marketing site" page),
 * so Dan doesn't have to type them in. Added as drafts by the super-admin's "Add the Figma pages"
 * button; a page whose address already exists is never touched.
 *
 * Every factual line here has a row in docs/marketing-site/claims-register.md.
 */
export type StarterPage = { slug: string; title: string; description: string; layout: unknown[] }

// Shared v2 content (Figma "marketing site v2", 2 Nov 2026).
const SWITCHER_POINTS = [
  { title: 'Three designs of every block', body: 'Pick the layout that suits each page.' },
  { title: 'Your colours, everywhere', body: 'Set them once. Every block follows.' },
  { title: 'Your font pack', body: 'A matched heading and body pair, on every page.' },
  { title: 'Yours, not your neighbour’s', body: 'Mix the designs for a look that’s your own.' },
]

const ROLES = [
  {
    tab: 'Secretary',
    eyebrow: 'For the secretary',
    headline: 'Post it once. Members see it.',
    points: [
      { text: 'Course status posted before the phone starts ringing.' },
      { text: 'News, results and notices published in minutes.' },
      { text: 'No agency queue, and no waiting for the member who’s good with computers.' },
    ],
    visual: 'courseStatus',
  },
  {
    tab: 'Committee',
    eyebrow: 'For the committee',
    headline: 'A website the whole club is proud of.',
    points: [
      { text: 'Your colours, your photos, your layout.' },
      { text: 'Competitions and socials listed the moment they’re set.' },
      { text: 'However many people post, the site still looks right.' },
    ],
    visual: 'events',
  },
  {
    tab: 'Treasurer',
    eyebrow: 'For the treasurer',
    headline: 'One fee your committee can sign off.',
    points: [
      { text: 'One monthly fee, with hosting, security and backups included.' },
      { text: 'Unlimited editors at no extra cost.' },
      { text: 'No agency invoices for small changes.' },
    ],
    visual: 'greenFees',
  },
  {
    tab: 'Members & visitors',
    eyebrow: 'For members and visitors',
    headline: 'The answers they want, on their phone.',
    points: [
      { text: 'Is the course open? Course status, kept up to date.' },
      { text: 'What does a round cost? Green fees for every season.' },
      { text: 'Search that goes straight to the answer.' },
    ],
    visual: 'search',
  },
]

const SWITCH_STEPS = [
  {
    title: 'See your club on it',
    body: 'Your demo shows your own homepage, rebuilt on the platform.',
  },
  {
    title: 'We move your content',
    body: 'Pages, news, photos and documents, copied across from your current site.',
  },
  {
    title: 'We build it with you',
    body: 'Your colours, your photos, your layout. Your committee signs off.',
  },
  {
    title: 'You run it',
    body: 'Your team updates the site from day one, with us on hand until launch.',
  },
]

// "Old page addresses redirect" is softened (claims-register D8, open question N7): the platform
// doesn't forward old page addresses yet.
const OBJECTIONS = [
  {
    topic: 'Switching',
    question: '“We already have a website.”',
    answer:
      'Keep your domain. We move your content across and keep your page titles, so visitors and search engines can follow you.',
  },
  {
    topic: 'Cost',
    question: '“What will it cost?”',
    answer:
      'One monthly fee, plus a one-off setup fee agreed with your club. Unlimited editors are included.',
  },
  {
    topic: 'Contract',
    question: '“What happens when our contract ends?”',
    answer:
      'Renew and nothing changes. If you’d rather move on, you’re free to: the website is leased, not sold, so it comes down when your contract ends.',
  },
  {
    topic: 'Day to day',
    question: '“Who keeps it up to date?”',
    answer: 'Your team, in minutes. And when you need help, you speak to the person who built it.',
  },
]

// Home v2 (Figma "Home v2 — Desktop" 352:1886): sell the outcome, then prove it with the
// product. Stats keep the sources exactly as the hand-off lists them (§9), and lines the product
// can't back yet stay softened (claims-register D-rows).
const home: StarterPage = {
  slug: 'home',
  title: 'Home',
  description:
    'Golf club websites your team can update in minutes. See a demo club, then book a demo or ask for your homepage.',
  layout: [
    {
      blockType: 'mkBuilderHero',
      eyebrow: 'The website platform for golf clubs',
      title: 'Golf club websites,\nbuilt to be run by the club.',
      subhead:
        'Your team updates course status, fees and news in minutes, and every page still looks professionally designed. We move your content across and stay with you until you’re live.',
      primary: { label: 'Book a demo', href: '/book-a-demo' },
      secondary: { label: 'Request your homepage', href: '/request-your-homepage' },
    },
    {
      blockType: 'mkAssurance',
      items: [
        { title: 'Unlimited editors', body: 'Your whole committee can post, at no extra cost.' },
        {
          title: 'Your content moved across',
          body: 'Pages, news, photos and documents come with you.',
        },
        {
          title: 'Supported until you’re live',
          body: 'One person from your first call to launch day.',
        },
        {
          title: 'Designed for phones first',
          body: 'Every page works on the phone in a visitor’s pocket.',
        },
      ],
    },
    {
      blockType: 'mkSectionHeader',
      eyebrow: 'The problem',
      title: 'Most club websites are run by whoever has time.',
      subhead:
        'Updates wait for an agency or a volunteer. Meanwhile, the website is the first thing visitors, societies and new members see.',
      align: 'left',
    },
    {
      blockType: 'mkCompareRows',
      oldLabel: 'How it usually goes',
      ourLabel: `With ${BRAND.name}`,
      rows: [
        {
          oldWay: 'Every change goes to an agency and waits in a queue.',
          ourWay: 'Change it yourself and publish in minutes.',
        },
        {
          oldWay: 'It all depends on the member who’s good with computers.',
          ourWay: 'Anyone you invite can post, at no extra cost.',
        },
        {
          oldWay: 'Last winter’s green fees are still up in spring.',
          ourWay: 'Fees, course status and news change the day things change.',
        },
        {
          oldWay: 'One wrong edit and the layout falls apart.',
          ourWay: 'Every block fits every other. It still looks designed.',
        },
        {
          oldWay: 'Pages that are hard to use on a phone.',
          ourWay: 'Designed for the phone in a visitor’s pocket.',
        },
      ],
    },
    {
      blockType: 'mkProofStats',
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
      blockType: 'mkSectionHeader',
      eyebrow: 'How it works',
      title: 'Your team runs it. It still looks designed.',
      subhead:
        'Edit the page as it looks on the site, and publish when it’s right. Fixed blocks and your club’s colours keep every page professional.',
      align: 'center',
    },
    {
      blockType: 'mkEditLive',
      headline: 'Spring open week starts Saturday',
      toggleLabel: 'Show visitor tee times button',
    },
    {
      blockType: 'mkSectionHeader',
      eyebrow: 'Make it yours',
      title: 'Every block, three ways. All of them yours.',
      subhead:
        'Choose a design for each block and it takes on your club’s colours and font pack, on every screen. Mix them across the site and it looks like your club, not your neighbour’s.',
      align: 'left',
    },
    { blockType: 'mkLiveDemo', demo: 'blockSwitcher' },
    { blockType: 'mkAssurance', items: SWITCHER_POINTS },
    {
      blockType: 'mkSectionHeader',
      eyebrow: 'Who it’s for',
      title: 'Easier for everyone at the club.',
      subhead:
        'From the club office to the first tee, each person gets what they need from the website.',
      align: 'left',
    },
    { blockType: 'mkRoleTabs', roles: ROLES },
    {
      blockType: 'mkSectionHeader',
      eyebrow: 'A week at the club',
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
      eyebrow: 'Switching to us',
      title: 'We do the heavy lifting.',
      subhead:
        'Switching is a service, not a project. We set the site up with you for a one-off fee, and stay with you until it’s live.',
      align: 'left',
    },
    { blockType: 'mkSteps', steps: SWITCH_STEPS },
    { blockType: 'mkFounder' },
    {
      blockType: 'mkSectionHeader',
      eyebrow: 'Committee questions',
      title: 'The questions your committee will ask.',
      subhead: 'Answered plainly, so you can take them straight to the next meeting.',
      align: 'left',
    },
    { blockType: 'mkObjections', items: OBJECTIONS },
    {
      blockType: 'mkCtaBand',
      title: 'See your club on it.',
      subhead:
        'Book a demo and we’ll walk you through it, or ask for your homepage and we’ll send it over to look at in your own time.',
      primary: { label: 'Book a demo', href: '/book-a-demo' },
      secondary: { label: 'Request your homepage', href: '/request-your-homepage' },
    },
  ],
}

// Pricing (Figma "Pricing — Desktop" 185:3821). Numbers come from Settings ({price} etc.).
const pricing: StarterPage = {
  slug: 'pricing',
  title: 'Pricing',
  description:
    'One price per club, with hosting, every live block and unlimited editors included, plus a one-off setup fee agreed with your club.',
  layout: [
    {
      blockType: 'mkSectionHeader',
      eyebrow: 'Pricing',
      title: 'One club, one price.',
      subhead:
        '{price} a month {vat} for your website, on a {term}-month term, plus a one-off setup fee agreed with your club. No charge per editor.',
      align: 'center',
    },
    {
      blockType: 'mkPricing',
      title: 'Build your plan',
      terms: 'Billed monthly · {term}-month minimum, then rolling',
      coursesText: 'Each course gets its own guide, scorecard and hole-by-hole pages.',
      comingNext: [
        {
          title: 'Tee-time bookings',
          body: 'Members and visitors book online, with your rules and prices.',
        },
        { title: 'Members area', body: 'Logins, notices and the members’ directory.' },
        { title: 'Facilities booking', body: 'Range bays, simulators, spa and function rooms.' },
      ],
      included: [
        { text: 'Hosting, security and backups' },
        { text: 'Every live block, on every page' },
        { text: 'Unlimited editors' },
        { text: 'We move your old site across' },
      ],
      footnote:
        'Prices exclude VAT. Plus a one-off setup fee. {notice} days’ notice after the first {term} months.',
    },
    {
      blockType: 'mkFaq',
      title: 'Answers for\nyour committee.',
      body: 'Forward this page before the meeting. If a question’s missing, ask us and we’ll add it.',
      items: [
        {
          question: 'How long is the contract?',
          answer:
            'A {term}-month minimum, then it rolls monthly. Either side gives {notice} days’ notice.',
        },
        {
          question: 'Who owns our content and data?',
          answer: 'You do. Everything you publish, upload or collect belongs to the club.',
        },
        {
          question: 'What happens if we leave?',
          answer:
            'Your site stays live for as long as your contract runs. If you decide not to renew, you’re free to move elsewhere, and the site comes down at the end of the term. Your domain was always yours.',
        },
        {
          question: 'What do you move across from our old site?',
          answer:
            'Your public pages, news posts, PDFs and photos. We agree the exact list with you before any work starts.',
        },
        {
          question: 'Is it GDPR compliant?',
          answer:
            'We follow UK GDPR, and we’ll send our data processing agreement before you sign anything.',
        },
        {
          question: 'Do we need a developer?',
          answer: 'No. If you can write an email, you can update the site.',
        },
        {
          question: 'Can we keep our domain and email?',
          answer: 'Yes. You keep your domain, and your club email stays where it is.',
        },
      ],
    },
    {
      blockType: 'mkCtaBand',
      title: 'One price your committee can sign off.',
      subhead:
        'Book a demo and we’ll walk you through it, or ask for your homepage and we’ll send it over to look at in your own time.',
      primary: { label: 'Book a demo', href: '/book-a-demo' },
      secondary: { label: 'Request your homepage', href: '/request-your-homepage' },
    },
  ],
}

// Switching to us v2 (Figma "Switching to us — Desktop" 356:4477): the form now sends the
// homepage, and four Step Cards replace the Migration section. Lines about old page addresses
// forwarding stay softened (claims-register D8, N7).
const switching: StarterPage = {
  slug: 'switching',
  title: 'Switching to us',
  description:
    'We set your club up on our platform for a one-off fee, agreed with you, and support you until your site is live.',
  layout: [
    {
      blockType: 'mkRequestHero',
      eyebrow: 'Switching to us',
      title: 'We do the heavy lifting.',
      subhead:
        'Switching is a service, not a project. See your own homepage on the platform first, then we set the site up with you for a one-off fee.',
      points: [
        { text: 'Your logo, colours and photos, on our blocks' },
        { text: 'Sent over to look at in your own time' },
        { text: 'No commitment until you sign up' },
      ],
      form: {
        title: 'Your club',
        button: 'Send me my homepage',
        footnote: 'We build it from your current site. Nothing on your live site changes.',
        sentTitle: 'Thanks. We’ll be in touch.',
        sentBody: 'We’ll email {email} when your homepage is ready.',
      },
    },
    {
      blockType: 'mkSectionHeader',
      eyebrow: 'How switching works',
      title: 'Four steps to a live site.',
      subhead: 'Four steps from your first look to a live site, at your committee’s pace.',
      align: 'left',
    },
    {
      blockType: 'mkSteps',
      steps: [
        {
          title: 'See your homepage',
          body: 'Book a demo, or ask us to send your homepage over to look at first.',
        },
        {
          title: 'We move your content',
          body: 'Pages, news, photos and documents, copied across from your current site.',
        },
        {
          title: 'We build it with you',
          body: 'Your colours, your photos, your layout. Your committee signs off.',
        },
        {
          title: 'You run it',
          body: 'Your team updates the site from day one, with us on hand until launch.',
        },
      ],
    },
    {
      blockType: 'mkSectionHeader',
      eyebrow: 'Your content',
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
          title: 'AI reads your whole site',
          body: 'It copies your pages, news posts, photos and PDFs across, so nobody has to retype a thing.',
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
    {
      blockType: 'mkFaq',
      title: 'What happens to\nmy domain and emails?',
      items: [
        {
          question: 'Do we keep our domain?',
          answer: 'Yes. You keep owning it. We only change where the website part points.',
        },
        {
          question: 'Will our club emails stop working?',
          answer:
            'No. Your club email stays exactly where it is. We only change where the website points.',
        },
        {
          question: 'Will we lose our place on Google?',
          // Figma promises redirects of old page addresses; held back until N7 is answered.
          answer:
            'Your domain stays the same and we keep your page titles, so search engines can follow you across. Nobody can honestly promise rankings, so we don’t.',
        },
        {
          question: 'What about old PDFs and minutes?',
          answer:
            'They come with you. We flag any that screen readers can’t read, and can supply accessible versions on request.',
        },
        {
          question: 'Will the site go down during the switch?',
          answer:
            'We switch over on a quiet weekday morning and check the site straight after, so any gap is short.',
        },
      ],
    },
    {
      blockType: 'mkCtaBand',
      title: 'Ready when your committee is.',
      subhead:
        'Book a demo and we’ll walk you through it, or ask for your homepage and we’ll send it over to look at in your own time.',
      primary: { label: 'Book a demo', href: '/book-a-demo' },
      secondary: { label: 'Request your homepage', href: '/request-your-homepage' },
    },
  ],
}

// Book a demo (Figma "Book a demo — Desktop" 187:7336, "Book a demo — Mobile" 275:9525). No
// CTA band: the page is the call to action. Never says how long the call lasts (hand-off §6).
const bookADemo: StarterPage = {
  slug: 'book-a-demo',
  title: 'Book a demo',
  description:
    'Book a video call. We’ll show you the platform with your own homepage on it, and answer anything your committee wants to know.',
  layout: [
    {
      blockType: 'mkDemoIntro',
      eyebrow: 'Book a demo',
      title: 'Let’s talk about\nyour club.',
      subhead:
        'We’ll show you the platform with your own homepage on it, and answer anything your committee wants to know.',
      expect: [
        { text: 'Your homepage, rebuilt in your colours' },
        { text: 'How updates work, day to day' },
        { text: 'What switching involves, and what it costs' },
        { text: 'Pricing and contract, in plain terms' },
      ],
      emailLead: 'Rather email?',
      alt: {
        title: 'Not ready for a call?',
        body: 'Ask for your homepage instead. We’ll rebuild it on the platform and send it over to look at in your own time.',
        label: 'Request your homepage',
        href: '/request-your-homepage',
      },
    },
    {
      blockType: 'mkFounder',
      message: 'I run every demo myself, so you get straight answers from the person who built it.',
    },
  ],
}

// Request your homepage (Figma "Request your homepage — Desktop" 356:5156): for people not ready
// for a call. Dan sends the homepage by hand; nothing is emailed to the person (3 Nov decision).
const requestHomepage: StarterPage = {
  slug: 'request-your-homepage',
  title: 'Request your homepage',
  description:
    'Tell us about your club and we’ll rebuild your homepage on the platform, then send it over to look at in your own time.',
  layout: [
    {
      blockType: 'mkRequestHero',
      eyebrow: 'Request your homepage',
      title: 'See your homepage before you decide.',
      subhead:
        'Not ready for a demo? Tell us about your club and we’ll rebuild your homepage on the platform, then send it over to look at in your own time.',
      points: [
        { text: 'Your logo, colours, photos and words, on our blocks' },
        { text: 'Sent to you, ready to share with your committee' },
        { text: 'No call needed, and no commitment' },
      ],
      form: {
        title: 'Your club',
        intro: 'Three details and we’ll get started.',
        button: 'Send me my homepage',
        footnote: 'Built from your current site. Nothing on your live site changes.',
        sentTitle: 'Thanks. We’ll be in touch.',
        sentBody: 'We’ll email {email} when your homepage is ready.',
      },
      alt: { title: 'Rather talk it through?', label: 'Book a demo', href: '/book-a-demo' },
    },
    {
      blockType: 'mkSectionHeader',
      eyebrow: 'What happens next',
      title: 'Your homepage, then your decision.',
      subhead:
        'No sales call to sit through. Look at it properly, share it with your committee, and come back when you’re ready.',
      align: 'left',
    },
    {
      blockType: 'mkSteps',
      steps: [
        {
          title: 'Tell us your club',
          body: 'Your club name, current website and email. That’s all we need.',
        },
        {
          title: 'We rebuild your homepage',
          body: 'Using the logo, colours, photos and words from your current site.',
        },
        {
          title: 'Decide in your own time',
          body: 'Share it with your committee. If you like it, we’ll talk about the rest.',
        },
      ],
    },
    {
      blockType: 'mkFounder',
      message: 'You’ll deal with me from the first call to launch day, and after it.',
    },
  ],
}

// Who it's for (Figma "Who it's for — Desktop" 356:3785).
const whoItsFor: StarterPage = {
  slug: 'who-its-for',
  title: 'Who it’s for',
  description:
    'Members’ clubs, links courses, pay and play and resorts. One platform, set up around the way your club runs.',
  layout: [
    {
      blockType: 'mkSectionHeader',
      eyebrow: 'Who it’s for',
      title: 'Built for every kind of golf club.',
      subhead:
        'Members’ clubs, links courses, pay and play and resorts. One platform, set up around the way your club runs.',
      align: 'center',
    },
    { blockType: 'mkClubMorph' },
    {
      blockType: 'mkSectionHeader',
      eyebrow: 'Every kind of club',
      title: 'Set up around how your club runs.',
      subhead: 'The same blocks, arranged for what matters most to your members and visitors.',
      align: 'left',
    },
    {
      blockType: 'mkFeatureCards',
      style: 'cards',
      cards: [
        {
          icon: 'players',
          title: 'Members’ clubs',
          body: 'Member news, competitions and course status up front, with a warm welcome for visitors and societies.',
        },
        {
          icon: 'pin',
          title: 'Pay & play and proprietary',
          body: 'Green fees and visitor information first, so golfers can see what it costs and how to book.',
        },
        {
          icon: 'flag',
          title: 'Links, resorts and hotel golf',
          body: 'Show the course hole by hole, and send visitors straight to where they book.',
        },
      ],
    },
    {
      blockType: 'mkSectionHeader',
      eyebrow: 'Everyone at the club',
      title: 'Easier for everyone at the club.',
      subhead:
        'From the club office to the first tee, each person gets what they need from the website.',
      align: 'left',
    },
    { blockType: 'mkRoleTabs', roles: ROLES },
    {
      blockType: 'mkCtaBand',
      title: 'See your club on it.',
      subhead:
        'Book a demo and we’ll walk you through it, or ask for your homepage and we’ll send it over to look at in your own time.',
      primary: { label: 'Book a demo', href: '/book-a-demo' },
      secondary: { label: 'Request your homepage', href: '/request-your-homepage' },
    },
  ],
}

// How it works (Figma "How it works — Desktop" 356:2760; was Website builder). Lines the product
// can't back yet stay as the earlier reworded versions (design notes D12–D14: colours aren't
// blocked (Q5), photo descriptions are optional (N8), old page addresses don't forward (N7)).
const howItWorks: StarterPage = {
  slug: 'how-it-works',
  title: 'How it works',
  description:
    'Every block was designed to fit every other block. Add your colours and photos, move things around, and your club’s site still looks right.',
  layout: [
    {
      blockType: 'mkBuilderHero',
      eyebrow: 'How it works',
      title: 'Make it yours.\nIt’ll still look right.',
      subhead:
        'Every block was designed to fit every other block. Change the layout, add your colours and photos, move things around. The design holds, so your site never looks thrown together.',
      primary: { label: 'Book a demo', href: '/book-a-demo' },
      secondary: { label: 'Request your homepage', href: '/request-your-homepage' },
    },
    {
      blockType: 'mkSectionHeader',
      eyebrow: 'Three designs',
      title: 'Same block. A different club.',
      subhead:
        'Every block comes in three designs. Each one picks up your colours and font pack the moment you add it.',
      align: 'left',
    },
    { blockType: 'mkLiveDemo', demo: 'blockSwitcher' },
    { blockType: 'mkAssurance', items: SWITCHER_POINTS },
    {
      blockType: 'mkSectionHeader',
      eyebrow: 'Built for golf',
      title: 'Everything the club needs to say.',
      subhead:
        'Fees, fixtures, course conditions and answers, kept current by the people who know them.',
      align: 'left',
    },
    {
      blockType: 'mkFeatureShowcase',
      items: [
        { feature: 'greenFees', title: 'Green fees', body: 'As flexible as you need them to be' },
        {
          feature: 'events',
          title: 'Competitions',
          body: 'Take the stress away and enjoy the day',
        },
        { feature: 'search', title: 'Site search', body: 'Every answer, one search away' },
        {
          feature: 'courseStatus',
          title: 'Course status',
          body: 'The first question, answered before the phone rings',
        },
      ],
    },
    {
      blockType: 'mkSectionHeader',
      eyebrow: 'Built in',
      title: 'Sorted before you log in.',
      subhead:
        'The parts nobody notices until they go wrong. They come with every site, at no extra cost.',
      align: 'left',
    },
    {
      blockType: 'mkFeatureCards',
      style: 'cards',
      cards: [
        {
          icon: 'check',
          title: 'Readable for everyone',
          body: 'Text is checked against what it sits on, and photos missing a description are flagged.',
        },
        {
          icon: 'expand',
          title: 'Looks right on a phone',
          body: 'Blocks rearrange for small screens. There’s no separate mobile site to keep up.',
        },
        {
          icon: 'lock',
          title: 'The right access for each person',
          body: 'Invite your committee. Give each person only the access they need.',
          availability: 'coming-next',
        },
        {
          icon: 'clock',
          title: 'Undo any change',
          body: 'The last 50 versions of every page are kept. Bring an earlier one back from its history.',
        },
        {
          icon: 'mail',
          title: 'Keep your domain and email',
          body: 'We point your domain at the new site. Your club email stays where it is.',
        },
        {
          icon: 'sun',
          title: 'Photos that load quickly',
          body: 'Upload a photo and we resize it for you, so pages stay quick.',
        },
        {
          icon: 'file',
          title: 'Backed up every night',
          body: 'Your pages, news and settings are copied every night, encrypted, and kept for 30 days.',
        },
        {
          icon: 'players',
          title: 'No charge per editor',
          body: 'Everyone on the committee can have their own login.',
        },
      ],
    },
    {
      blockType: 'mkSectionHeader',
      eyebrow: '01 · Club colours',
      title: 'Your colours, kept readable.',
      subhead:
        'Pick your club colour and the whole site follows. Text on it switches to stay readable, and your colour stays as you picked it.',
      align: 'left',
    },
    {
      blockType: 'mkLiveDemo',
      demo: 'tokenDial',
      details: [
        {
          title: 'One colour, the whole site',
          body: 'Buttons, links and accents follow the colour you pick. Nothing to restyle by hand.',
        },
        {
          title: 'Readable by design',
          body: 'If text would be hard to read on a colour, it switches to one that reads, so pages meet WCAG AA.',
        },
        {
          title: 'Your photos, your logo',
          body: 'They sit in layouts designed around them, so every page still holds together.',
        },
      ],
    },
    {
      blockType: 'mkSectionHeader',
      eyebrow: '02 · Course guide',
      title: 'Your course, hole by hole.',
      subhead:
        'Every hole with its photo, its par and the yardage from every tee. The pro keeps it up to date, not a developer.',
      align: 'left',
    },
    {
      blockType: 'mkLiveDemo',
      demo: 'courseGuide',
      details: [
        {
          title: 'Every tee, every yardage',
          body: 'Each hole’s photo carries its par and yardages, so visitors see the hole and the numbers together.',
        },
        {
          title: 'Made for visitors',
          body: 'A first-timer can read the course before they arrive, hole by hole.',
        },
        {
          title: 'Kept current by the club',
          body: 'Change a yardage or a hole note and publish. No developer, no wait.',
        },
      ],
    },
    {
      blockType: 'mkSectionHeader',
      eyebrow: '03 · Course status',
      title: 'The course report, first thing.',
      subhead:
        'Post greens, tees and bunkers from the office. It sits on the homepage, where members look before they set off.',
      align: 'left',
    },
    {
      blockType: 'mkLiveDemo',
      demo: 'courseStatus',
      details: [
        {
          title: 'Where members look',
          body: 'The report sits on the homepage, above the fold, every day of the week.',
        },
        {
          title: 'Time-stamped',
          body: 'Members see when it was last updated, so nobody wonders if it’s current.',
        },
        {
          title: 'Whoever’s on duty',
          body: 'Anyone with access can post it. It doesn’t wait for one person.',
        },
      ],
    },
    {
      blockType: 'mkCtaBand',
      title: 'See your club on it.',
      subhead:
        'Book a demo and we’ll walk you through it, or ask for your homepage and we’ll send it over to look at in your own time.',
      primary: { label: 'Book a demo', href: '/book-a-demo' },
      secondary: { label: 'Request your homepage', href: '/request-your-homepage' },
    },
  ],
}

// Bookings, a Coming next preview (Figma "Bookings — Desktop" 184:3614). Every simulation is
// labelled; nothing on it books anything. Figma's Works With strip is deprecated and left out:
// no club links to a provider in production yet (D15).
const bookings: StarterPage = {
  slug: 'bookings',
  title: 'Tee times',
  description:
    'Your new site links to the booking system you use today. Built-in booking, an optional add-on designed around your club, is coming next.',
  layout: [
    {
      blockType: 'mkSectionHeader',
      eyebrow: 'Tee times',
      title: 'Keep the tee sheet\nyou use today.',
      subhead:
        'Your new site links to the booking system you use today. Built-in booking, an optional add-on designed around your club, is coming next.',
      align: 'center',
    },
    { blockType: 'mkBookingDemo', demo: 'teeSheet', showLabel: true },
    {
      blockType: 'mkSectionHeader',
      title: 'Your rules, set once.',
      subhead:
        'Card guarantees, no-show fees and booking windows will be settings your club controls, not requests to us.',
      align: 'left',
    },
    { blockType: 'mkBookingDemo', demo: 'clubSettings' },
    {
      blockType: 'mkSectionHeader',
      title: 'Everything bookable,\nbooked the same way.',
      subhead:
        'Range bays, simulators, the spa. Anything the club hires out by the hour will use the flow members already know.',
      align: 'left',
    },
    { blockType: 'mkBookingDemo', demo: 'facilities' },
    {
      blockType: 'mkCtaBand',
      title: 'Start with the website.',
      subhead:
        'Your site links to your current tee sheet from day one. Built-in booking follows when it’s ready.',
      primary: { label: 'Book a demo', href: '/book-a-demo' },
      secondary: { label: '', href: '/switching' },
    },
  ],
}

// Trust & security (Figma "Trust & security — Desktop" 187:6879). Built, not published until
// the hosting and backup lines can be stated (hand-off §6, Q6, N6). Two lines differ from
// Figma (D18, D19) and the CTA's "Committee summary (PDF)" is left out (removed 21 Oct).
const trust: StarterPage = {
  slug: 'trust',
  title: 'Trust & security',
  description:
    'Where your club’s data is kept, how it’s backed up and how the site meets accessibility standards, in plain English.',
  layout: [
    {
      blockType: 'mkSectionHeader',
      eyebrow: 'Trust & security',
      title: 'Your members’ data,\nlooked after.',
      subhead:
        'Where it’s stored, how it’s backed up and how the site meets accessibility standards. In plain English, for your committee.',
      align: 'left',
    },
    {
      blockType: 'mkFeatureCards',
      style: 'cards',
      cards: [
        {
          icon: 'check',
          title: 'Accessibility',
          body: 'Designed to meet WCAG 2.2 AA. We’re recording a keyboard and screen reader test for every block, and publishing the log.',
          availability: 'live',
          linkLabel: 'Read the statement',
          linkHref: '/accessibility',
        },
        {
          icon: 'lock',
          title: 'Hosting',
          body: 'Ask us for the full list of companies we use, and where each one keeps your club’s data.',
          availability: 'live',
          linkLabel: 'Ask for the list',
          linkHref: `mailto:${BRAND.email}?subject=Where%20our%20data%20is%20kept`,
        },
        {
          icon: 'clock',
          title: 'Backups',
          body: 'Backed up every night, encrypted and kept for 30 days.',
          availability: 'live',
        },
        {
          icon: 'file',
          title: 'Data protection',
          body: 'UK GDPR throughout. We sign a data processing agreement with every club, and send it before you commit.',
          availability: 'live',
          linkLabel: 'Ask for the DPA',
          linkHref: `mailto:${BRAND.email}?subject=Data%20processing%20agreement`,
        },
      ],
    },
    {
      blockType: 'mkCtaBand',
      title: 'Questions from your committee?',
      subhead: 'We’ll walk them through it, or send the paperwork ahead of the meeting.',
      primary: { label: 'Book a demo', href: '/book-a-demo' },
      secondary: { label: '', href: '/switching' },
    },
  ],
}

// Accessibility statement (Figma "Accessibility statement — Desktop" 212:8158). "Designed to
// meet", not "built to" (hand-off §6). The greenkeeper photo isn't added: its licence isn't
// confirmed (N5); add it as a Photo block once it is, without the caption (D20).
const accessibility: StarterPage = {
  slug: 'accessibility',
  title: 'Accessibility statement',
  description:
    'How we make club websites work for everyone, what we test, and what to do if something doesn’t work for you.',
  layout: [
    {
      blockType: 'mkSectionHeader',
      eyebrow: 'Trust & security',
      title: 'Accessibility statement',
      subhead: 'How we make club sites work for everyone, and what to do if something doesn’t.',
      align: 'left',
    },
    { blockType: 'mkReviewed', label: 'reviewed' },
    {
      blockType: 'mkRichText',
      content: rt.doc(
        rt.h2('Our commitment'),
        rt.p(
          'Every club site on the platform is designed to meet WCAG 2.2 AA. We’re testing each block with a keyboard, a screen reader and at 400% zoom, and we publish the results as each test is recorded.',
        ),
        rt.p(
          'If something doesn’t work for you, email ',
          rt.urlLink(BRAND.email, `mailto:${BRAND.email}`),
          ' and we’ll fix it or find another way to get you what you need.',
        ),
        rt.h3('What we test'),
        rt.ul(
          'Keyboard access to every control, with a visible focus ring',
          'Colour contrast of text and controls, including club colours',
          'Screen reader labels on images, buttons and form fields',
          'Motion, which respects reduced-motion settings',
        ),
        rt.quote('We design accessibility into each block from the start.'),
      ),
    },
    {
      blockType: 'mkRichText',
      content: rt.doc(
        rt.h2('Known issues'),
        rt.p(
          'Some older PDFs that clubs bring with them aren’t tagged for screen readers. We flag these when you switch to us, and can supply accessible versions on request.',
        ),
        rt.p('We review this statement every six months and whenever we ship a new block.'),
      ),
    },
    {
      blockType: 'mkCtaBand',
      title: 'Found something that doesn’t work?',
      subhead: 'Tell us. We reply within two working days and fix it or find another way.',
      primary: { label: `Email ${BRAND.email}`, href: `mailto:${BRAND.email}` },
      // Figma's "Back to Trust & security" waits until the Trust page is published (D20).
      secondary: { label: '', href: '/trust' },
    },
  ],
}

// Changelog (Figma "Changelog — Desktop" 187:6499). Built, unpublished, kept out of the nav
// and footer (Q7). The email sign-up is left out: there's no mailing list to send to (D21).
const changelog: StarterPage = {
  slug: 'changelog',
  title: 'Changelog',
  description: 'What’s new on the platform. We only post here once something is live for a club.',
  layout: [
    {
      blockType: 'mkSectionHeader',
      eyebrow: 'Changelog',
      title: 'What’s new.',
      subhead: 'We post here when something ships to a club. Nothing goes up before it’s live.',
      align: 'left',
    },
    {
      blockType: 'mkRoadmap',
      emptyTitle: 'Nothing has shipped to a club yet.',
      emptyBody:
        'The first entry goes up the day the first club goes live. Here’s what’s being built now.',
      cards: [
        {
          title: 'Keeping each club’s site private',
          body: 'Tests that prove one club can never see another club’s content.',
        },
        { title: 'Block library', body: 'Every block, with desktop, tablet and mobile variants.' },
        {
          title: 'Tools for switching to us',
          body: 'Redirects and content import, so clubs move across cleanly.',
        },
      ],
    },
    {
      blockType: 'mkCtaBand',
      title: 'Want this for your club?',
      subhead: 'We post here when something goes live for a club. Nothing before.',
      primary: { label: 'Book a demo', href: '/book-a-demo' },
      secondary: { label: '', href: '/switching' },
    },
  ],
}

// Privacy policy, cookie notice and terms: not designed; text pages on the Accessibility
// template (hand-off §6). The wording is Dan's (N4): the [[…]] placeholder stops them being
// published until it's replaced (src/marketing/collections/MarketingPages.ts).
const legalPage = (slug: string, title: string, description: string): StarterPage => ({
  slug,
  title,
  description,
  layout: [
    { blockType: 'mkSectionHeader', title, align: 'left' },
    { blockType: 'mkReviewed', label: 'updated' },
    {
      blockType: 'mkRichText',
      content: rt.doc(
        rt.p(
          `[[Paste the ${title.toLowerCase()} wording here. This page can’t be published until this line is replaced.]]`,
        ),
      ),
    },
  ],
})

const privacy = legalPage(
  'privacy',
  'Privacy policy',
  'How we collect, use and look after personal information, and the choices you have.',
)
const cookies = legalPage(
  'cookies',
  'Cookie notice',
  'The cookies this website uses, and what each one is for.',
)
const terms = legalPage('terms', 'Terms', 'The terms for using this website and our service.')

export const STARTER_PAGES: StarterPage[] = [
  home,
  howItWorks,
  whoItsFor,
  pricing,
  switching,
  requestHomepage,
  bookADemo,
  bookings,
  trust,
  accessibility,
  changelog,
  privacy,
  cookies,
  terms,
]

/** A starter page as saved: "Last reviewed" dates are the day it's added, until Dan changes
 * them. */
export const starterPageData = (page: StarterPage, today = new Date()) => ({
  title: page.title,
  slug: page.slug,
  meta: { description: page.description },
  layout: page.layout.map((block) =>
    (block as { blockType?: string }).blockType === 'mkReviewed'
      ? { ...(block as object), date: today.toISOString() }
      : block,
  ),
})

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
      data: { _status: 'draft', ...starterPageData(page) } as never,
    })
    added.push(page.title)
  }
  return { added, skipped }
}
