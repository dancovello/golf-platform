/**
 * What sits above the golf ball in the homepage intro: the company logo, a short message in the
 * homepage headline style, or nothing. It fades out with the ball. Dan picks on /dev/intro and
 * sends the copied settings; the values below are what the homepage uses.
 */
export type IntroMarkKind = 'logo' | 'message' | 'none'

export type IntroMark = {
  kind: IntroMarkKind
  /** The message, when kind is "message". Line breaks are kept. */
  message: string
}

export const INTRO_MARK_KINDS: { kind: IntroMarkKind; label: string }[] = [
  { kind: 'logo', label: 'Logo' },
  { kind: 'message', label: 'Message' },
  { kind: 'none', label: 'Nothing' },
]

export const DEFAULT_MARK: IntroMark = {
  kind: 'logo',
  message: 'Your club is better\nthan your website.',
}
