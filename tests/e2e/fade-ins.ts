import type { Page } from '@playwright/test'

/**
 * The marketing pages fade each section in as it scrolls into view (Reveal.tsx): below the fold
 * it sits at opacity 0 until then. An accessibility scan reads the whole page without scrolling,
 * so it would measure invisible text and report false contrast failures. Call this before a scan
 * to show every section at once, as a visitor would see it once scrolled to. The rule is
 * `!important`, so it holds even if the page hides a section after this runs.
 */
export const showFadedSections = async (page: Page) => {
  await page.addStyleTag({
    content:
      '[data-reveal] { opacity: 1 !important; transform: none !important; transition: none !important; }',
  })
}
