/**
 * The rule for an email address typed into a public form: the same as Payload's email field
 * (payload/dist/fields/validations.js), so every address a form accepts can also be saved. It
 * also keeps commas, angle brackets, quotes and line breaks out of an email's To and Reply-To
 * (public forms audit, finding 4). Used by the Contact form and the Homepage Request Form.
 */
export const EMAIL_ADDRESS =
  /^(?!.*\.\.)[\w!#$%&'*+/=?^`{|}~-](?:[\w!#$%&'*+/=?^`{|}~.-]*[\w!#$%&'*+/=?^`{|}~-])?@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i
