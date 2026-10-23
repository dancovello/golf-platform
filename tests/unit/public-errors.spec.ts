import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { formatErrors } from 'payload'
import { describe, expect, it } from 'vitest'

import { publicError } from '@/errors'

// Payload shows an error's message only when the error has a name, taken from the class name,
// which a production build can shorten to nothing (src/errors.ts).
describe('errors people see keep their message', () => {
  it('a publicError is shown with its message, even if its class name is lost', () => {
    const error = publicError('Passwords must be at least 12 characters.', 400)
    expect(error.name).toBe('APIError')
    expect(formatErrors(error)).toEqual({
      errors: [{ message: 'Passwords must be at least 12 characters.' }],
    })
  })

  it('no code creates an APIError directly', () => {
    const files = (dir: string): string[] =>
      readdirSync(dir).flatMap((name) => {
        const path = join(dir, name)
        return statSync(path).isDirectory() ? files(path) : /\.tsx?$/.test(name) ? [path] : []
      })
    const offenders = files('src').filter(
      (path) =>
        path !== join('src', 'errors.ts') && readFileSync(path, 'utf8').includes('new APIError('),
    )
    expect(offenders).toEqual([])
  })
})
