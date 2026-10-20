// Plain helpers, also used in the browser (FaqSearch).
export type FaqItem = { question: string; answer: string; topic: string | null }

export const faqID = (question: string) =>
  'faq-' +
  question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
