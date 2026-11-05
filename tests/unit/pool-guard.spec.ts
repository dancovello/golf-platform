import { EventEmitter } from 'node:events'

import { describe, expect, it, vi } from 'vitest'

import { guardPool, POOL_SETTINGS } from '@/db/poolGuard'

describe('database pool guard (Sentry GOLF-PLATFORM-3)', () => {
  it('without a guard, a dropped idle connection crashes Node (the bug)', () => {
    const pool = new EventEmitter()
    expect(() => pool.emit('error', new Error('Connection terminated unexpectedly'))).toThrow()
  })

  it('with the guard, a dropped idle connection is logged and survived', () => {
    const pool = new EventEmitter()
    const onError = vi.fn()
    expect(guardPool(pool, onError)).toBe(true)
    expect(() => pool.emit('error', new Error('Connection terminated unexpectedly'))).not.toThrow()
    expect(onError).toHaveBeenCalledOnce()
  })

  it('does not add a second listener when called twice', () => {
    const pool = new EventEmitter()
    guardPool(pool, () => {})
    guardPool(pool, () => {})
    expect(pool.listenerCount('error')).toBe(1)
  })

  it('does nothing when there is no pool yet', () => {
    expect(guardPool(undefined)).toBe(false)
  })

  it('lets go of idle connections before Neon would', () => {
    expect(POOL_SETTINGS.idleTimeoutMillis).toBeLessThan(60_000)
  })
})
