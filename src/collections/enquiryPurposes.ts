/** What a Contact page message can be about, in the order the form shows them (doc 14). A
 * plain module so the website can use it without loading the CMS. */
export const ENQUIRY_PURPOSES = [
  { label: 'General enquiry', value: 'general' },
  { label: 'Visitor golf & societies', value: 'visitor' },
  { label: 'Membership', value: 'membership' },
  { label: 'Events & weddings', value: 'events' },
  { label: 'Lessons & academy', value: 'lessons' },
  { label: 'Feedback', value: 'feedback' },
] as const

export type EnquiryPurpose = (typeof ENQUIRY_PURPOSES)[number]['value']

export const isEnquiryPurpose = (value: unknown): value is EnquiryPurpose =>
  ENQUIRY_PURPOSES.some((p) => p.value === value)

export const enquiryPurposeLabel = (value: string | null | undefined) =>
  ENQUIRY_PURPOSES.find((p) => p.value === value)?.label ?? 'General enquiry'

/** Purposes that ask for a date and a number of people. */
export const asksForDateAndPeople = (purpose: EnquiryPurpose) =>
  purpose === 'visitor' || purpose === 'events'
