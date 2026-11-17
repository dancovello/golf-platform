import { describe, expect, it } from 'vitest'

import { keepFieldMessages } from '@/errors'

// The admin screen marks a field and says why only if the reply still carries the field's own
// message (QA-08). This runs the hook the way Payload does after a failed save.
const run = (data: unknown, name = 'ValidationError') =>
  keepFieldMessages({
    error: Object.assign(new Error('The following field is invalid: Slug'), { name, data }),
    result: { errors: [{ message: 'The following field is invalid: Slug' }] },
  } as never) as unknown as {
    response: {
      errors: { message: string; data: { errors: { path: string; message: string }[] } }[]
    }
  }

describe('failed saves keep their field messages', () => {
  it('puts the field and the reason back, and says the reason in the pop-up', () => {
    const out = run({
      errors: [
        { path: 'slug', label: 'Slug', message: 'Lower-case letters, numbers and dashes only.' },
      ],
    })
    const reply = out.response.errors[0]!
    expect(reply.data.errors[0]).toMatchObject({ path: 'slug' })
    expect(reply.message).toBe('Slug: Lower-case letters, numbers and dashes only.')
  })

  it('turns the database "already used" error into a sentence on the field', () => {
    const out = run({ errors: [{ path: 'tenant_id, slug', message: 'Value must be unique' }] })
    const reply = out.response.errors[0]!
    expect(reply.data.errors[0]).toMatchObject({
      path: 'slug',
      message: 'Your club already has one with this. Choose a different one.',
    })
    expect(JSON.stringify(reply)).not.toContain('tenant_id')
  })

  it('says a too-long list in plain English', () => {
    const out = run({
      errors: [
        {
          path: 'header.menu',
          label: 'Menu',
          message: 'This field requires no more than 10 Rows.',
        },
      ],
    })
    expect(out.response.errors[0]!.message).toBe('Menu: You can add at most 10 of these.')
  })

  it('leaves other errors alone', () => {
    expect(run(undefined, 'APIError')).toBeUndefined()
    expect(run({ errors: [] })).toBeUndefined()
  })
})
