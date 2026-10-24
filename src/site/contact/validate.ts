import { EMAIL_ADDRESS } from '@/email/address'
import {
  asksForDateAndPeople,
  type EnquiryPurpose,
  isEnquiryPurpose,
} from '../../collections/enquiryPurposes'

/**
 * The Contact form's rules, shared by the browser (checks a field when you leave it) and the
 * server (checks everything on send, and is the one that counts). Messages say what to do,
 * not just that something is wrong (Figma "Form Field").
 */
export const MESSAGE_MAX = 1000

export type ContactValues = {
  purpose: EnquiryPurpose
  name: string
  email: string
  phone: string
  membershipType: string
  preferredDate: string
  groupSize: string
  message: string
  newsletter: boolean
}

export type FieldName = Exclude<keyof ContactValues, 'purpose' | 'newsletter'>
export type FieldErrors = Partial<Record<FieldName, string>>

/** Top to bottom, the order the error summary lists them in. */
export const FIELD_ORDER: FieldName[] = [
  'name',
  'email',
  'phone',
  'membershipType',
  'preferredDate',
  'groupSize',
  'message',
]

export type ContactRules = {
  /** The club's membership types; empty means people type their own. */
  membershipTypes: string[]
  /** Today in the UK, as YYYY-MM-DD. */
  today: string
}

export const EMPTY_VALUES: ContactValues = {
  purpose: 'general',
  name: '',
  email: '',
  phone: '',
  membershipType: '',
  preferredDate: '',
  groupSize: '',
  message: '',
  newsletter: false,
}

const EMAIL = EMAIL_ADDRESS
const PHONE = /^\+?[0-9 ()-]{7,20}$/
const DATE = /^\d{4}-\d{2}-\d{2}$/

/** Which fields this purpose shows (the rest are ignored, never saved). */
export const fieldsFor = (purpose: EnquiryPurpose): FieldName[] =>
  FIELD_ORDER.filter((f) =>
    f === 'membershipType'
      ? purpose === 'membership'
      : f === 'preferredDate' || f === 'groupSize'
        ? asksForDateAndPeople(purpose)
        : true,
  )

export const fieldError = (
  field: FieldName,
  v: ContactValues,
  rules: ContactRules,
): string | null => {
  const value = v[field].trim()
  switch (field) {
    case 'name':
      if (!value) return 'Tell us your name'
      return value.length > 100 ? 'Keep your name to 100 characters or fewer' : null
    case 'email':
      if (!value) return 'Enter your email address'
      return EMAIL.test(value) && value.length <= 254
        ? null
        : 'Enter an email address like name@example.com'
    case 'phone':
      return !value || PHONE.test(value)
        ? null
        : 'Enter a phone number using numbers only, like 07700 900123'
    case 'membershipType':
      if (rules.membershipTypes.length > 0) {
        return rules.membershipTypes.includes(value) ? null : 'Choose a membership type'
      }
      if (!value) return 'Tell us which membership you’re interested in'
      return value.length > 60 ? 'Keep this to 60 characters or fewer' : null
    case 'preferredDate':
      if (!value) return null
      if (!DATE.test(value) || Number.isNaN(new Date(`${value}T12:00:00Z`).getTime())) {
        return 'Enter a date like 21/06/2027'
      }
      return value < rules.today ? 'Choose a date from today onwards' : null
    case 'groupSize': {
      if (!value) return null
      const n = Number(value)
      return Number.isInteger(n) && n >= 1 && n <= 500
        ? null
        : 'Enter a number of people between 1 and 500'
    }
    case 'message':
      if (!value) return 'Tell us how we can help'
      return value.length > MESSAGE_MAX ? 'Keep your message to 1,000 characters or fewer' : null
  }
}

export const validateContact = (v: ContactValues, rules: ContactRules): FieldErrors => {
  const errors: FieldErrors = {}
  for (const field of fieldsFor(v.purpose)) {
    const message = fieldError(field, v, rules)
    if (message) errors[field] = message
  }
  return errors
}

/** Reads the posted form. Anything unexpected becomes empty, never an error page. */
export const valuesFromForm = (form: FormData): ContactValues => {
  const text = (name: string) => {
    const value = form.get(name)
    return typeof value === 'string' ? value.slice(0, 2000) : ''
  }
  const purpose = text('purpose')
  return {
    purpose: isEnquiryPurpose(purpose) ? purpose : 'general',
    name: text('name'),
    email: text('email'),
    phone: text('phone'),
    membershipType: text('membershipType'),
    preferredDate: text('preferredDate'),
    groupSize: text('groupSize'),
    message: text('message'),
    newsletter: form.get('newsletter') === 'yes',
  }
}
