import { expect, test } from './fixtures'

// Every interactive component on the marketing site fits the screen (Dan, 26 Oct): never
// taller than the window below the sticky nav (64px), never wider than the page, and on phones
// kept inside the page margins, never touching the screen's edge.

const site = (path: string) => `http://marketing.localhost:3100${path}`

const PAGES = ['/', '/website-builder', '/switching', '/pricing', '/bookings', '/book-a-demo']

/** The interactive components and live demos. A new one belongs in this list. */
const COMPONENTS = [
  '.mk-morph-sticky',
  '.mk-edit-live',
  '.mk-week',
  '.mk-moves-visual',
  '.mk-flipper',
  '.mk-dial',
  '.mk-guide-demo',
  '.mk-showcase-card',
  '.mk-demo-example .mk-demo',
  '.mk-tee-sim',
  '.mk-settings-demo',
  '.mk-facilities',
  '.mk-calc',
  '.mk-request-form',
].join(', ')

const SCREENS = [
  { name: 'laptop', width: 1280, height: 720 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 375, height: 812 },
  { name: 'large phone', width: 390, height: 844 },
]

for (const screen of SCREENS) {
  test(`every interactive component fits a ${screen.name} screen (${screen.width}×${screen.height})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: screen.width, height: screen.height })
    const phone = screen.width < 768
    for (const path of PAGES) {
      await page.goto(site(path))
      await page.waitForLoadState('networkidle')
      // Let the components size themselves (they measure the window after loading).
      await page.waitForTimeout(300)
      const problems = await page.evaluate(
        ({ selector, phone }) => {
          const edge = phone ? 16 : 0
          const width = document.documentElement.clientWidth
          return [...document.querySelectorAll<HTMLElement>(selector)].flatMap((el) => {
            const box = el.getBoundingClientRect()
            if (box.width === 0 && box.height === 0) return [] // a hidden frame
            const name = el.className.toString().split(' ')[0]
            const issues: string[] = []
            if (box.height > window.innerHeight - 64)
              issues.push(`${name} is ${Math.round(box.height)}px tall`)
            if (box.left < edge - 1 || box.right > width - edge + 1)
              issues.push(`${name} runs from ${Math.round(box.left)} to ${Math.round(box.right)}px`)
            return issues
          })
        },
        { selector: COMPONENTS, phone },
      )
      expect(problems, `${path} at ${screen.width}×${screen.height}`).toEqual([])
    }
  })
}
