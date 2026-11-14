/**
 * Wording the marketing site must never say (docs/marketing-site/HANDOFF.md §3 and §9, launch
 * gate item 11, launch checklist B2 to B4). Checked in the source by
 * tests/unit/marketing-wording.spec.ts and in saved pages by `pnpm fix-marketing-wording`.
 */
// Wording the 21 Oct evening decision removed (docs/marketing-site/HANDOFF.md §3 and §9, launch
// gate item 11). Setup is a paid one-off fee agreed with each club, the example homepage is shown
// in the demo and never called free, and there is no fixed switching timeline.
export const BANNED = [
  /free homepage/i,
  /rebuilt free/i,
  /rebuild your homepage[^.]*\bfree\b/i,
  /no setup fee/i,
  /four weeks/i,
  /send it straight to you/i,
  /\bweek [1-4]\b/i,
  // The request form and its emails promised a date; none is promised now.
  /promised by/i,
  /on its way/i,
  // Not VAT registered (9 Nov 2026): no VAT wording, no set setup fee, no course selector.
  /\+ VAT|plus VAT|exclude VAT/i,
  /one more course|second course/i,
]
